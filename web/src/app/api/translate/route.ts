import { writeFile, readFile, mkdir, rm } from "fs/promises";
import { randomUUID } from "crypto";
import { execFile } from "child_process";
import path from "path";
import { auth } from "@/lib/auth/auth";
import { db } from "@/drizzle/db";
import { subscription, translationUsage } from "@/drizzle/schema";
import { and, eq, sql } from "drizzle-orm";
import { PLAN_CONFIG } from "@/lib/auth/stripe";
import { headers } from "next/headers";

const CONTAINER_NAME = "manga-translator";
const RESULT_DIR = path.resolve(process.cwd(), "../result");

// 동시 실행 방지 (local 모드는 result/final.png를 고정 경로로 사용)
let translating = false;

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getUserPlanName(subs: { plan: string; status: string | null }[]): keyof typeof PLAN_CONFIG {
  const active = subs.find(
    (s) => s.status === "active" || s.status === "trialing",
  );
  if (!active) return "free";
  const plan = active.plan as keyof typeof PLAN_CONFIG;
  return plan in PLAN_CONFIG ? plan : "free";
}

export async function POST(request: Request) {
  // 인증 확인
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const userId = session.user.id;
  const month = getCurrentMonth();

  // 구독 정보 조회
  const userSubscriptions = await db
    .select({ plan: subscription.plan, status: subscription.status })
    .from(subscription)
    .where(eq(subscription.referenceId, userId));

  const planName = getUserPlanName(userSubscriptions);
  const planConfig = PLAN_CONFIG[planName];
  const pageLimit = planConfig.pages;

  // 이번 달 사용량 조회
  const usageRow = await db.query.translationUsage.findFirst({
    where: and(
      eq(translationUsage.userId, userId),
      eq(translationUsage.month, month),
    ),
  });

  const usedPages = usageRow?.count ?? 0;

  if (usedPages >= pageLimit) {
    return Response.json(
      {
        error: `이번 달 번역 한도(${pageLimit}장)를 초과했습니다. 현재 ${usedPages}장 사용 중입니다.`,
        limitExceeded: true,
        used: usedPages,
        limit: pageLimit,
        plan: planName,
      },
      { status: 403 },
    );
  }

  if (translating) {
    return Response.json(
      { error: "다른 번역이 진행 중입니다. 잠시 후 다시 시도해주세요." },
      { status: 429 },
    );
  }

  const jobId = randomUUID();
  const hostJobDir = path.join(RESULT_DIR, jobId);
  const hostInputFile = path.join(hostJobDir, "input.png");
  const hostConfigFile = path.join(hostJobDir, "config.json");
  // local 모드는 단일 파일 번역 시 result/final.png에 저장
  const hostOutputFile = path.join(RESULT_DIR, "final.png");

  try {
    translating = true;

    const formData = await request.formData();
    const image = formData.get("image") as File;

    if (!image) {
      return Response.json({ error: "image is required" }, { status: 400 });
    }

    const targetLang = (formData.get("target_lang") as string) ?? "KOR";
    const translator = "gemini";

    // 작업 디렉토리 생성 및 파일 저장
    await mkdir(hostJobDir, { recursive: true });
    const buffer = Buffer.from(await image.arrayBuffer());
    await writeFile(hostInputFile, buffer);

    const config = {
      translator: { translator, target_lang: targetLang },
      render: {
        // 감지된 폰트 크기에서 5px를 빼서 렌더링. 예를 들어 라이브러리가 20px로 계산했으면 15px로 렌더링. 말풍선 가장자리에서 짤리는 걸 줄이기 위해 추가한 옵션.
        font_size_offset: -5,
        // offset 때문에 너무 작아지는 걸 방지하는 하한선. 15px 미만으로는 내려가지 않음. 기본값은 이미지 가로+세로 합계 / 200 으로 이미지 크기에 따라 달라지는데, 명시적으로 15로 고정한 것.
        font_size_minimum: 15,
        direction: "v",
      },
    };
    await writeFile(hostConfigFile, JSON.stringify(config));

    // docker exec으로 local 모드 번역 실행
    await dockerExec([
      "python",
      "-m",
      "manga_translator",
      "local",
      "-i",
      `/app/result/${jobId}/input.png`,
      "--config-file",
      `/app/result/${jobId}/config.json`,
      "--overwrite",
    ]);

    const resultBuffer = await readFile(hostOutputFile);

    // 번역 성공 후 사용량 업데이트 (upsert)
    await db
      .insert(translationUsage)
      .values({
        id: randomUUID(),
        userId,
        month,
        count: 1,
      })
      .onConflictDoUpdate({
        target: [translationUsage.userId, translationUsage.month],
        set: { count: sql`${translationUsage.count} + 1` },
      });

    return new Response(resultBuffer, {
      headers: {
        "Content-Type": "image/png",
        "X-Translation-Used": String(usedPages + 1),
        "X-Translation-Limit": String(pageLimit),
        "X-Translation-Plan": planName,
      },
    });
  } catch (err) {
    console.error("[translate] error", err);
    return Response.json({ error: String(err) }, { status: 500 });
  } finally {
    translating = false;
    await rm(hostJobDir, { recursive: true, force: true }).catch(() => {});
  }
}

function dockerExec(cmd: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      "docker",
      ["exec", CONTAINER_NAME, ...cmd],
      { timeout: 5 * 60 * 1000, maxBuffer: 10 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) {
          console.error("[docker exec] stderr:", stderr);
          reject(new Error(stderr || err.message));
        } else {
          resolve(stdout);
        }
      },
    );
  });
}

// 현재 사용자의 이번 달 사용량 조회 API
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const userId = session.user.id;
  const month = getCurrentMonth();

  const [usageRow, userSubscriptions] = await Promise.all([
    db.query.translationUsage.findFirst({
      where: and(
        eq(translationUsage.userId, userId),
        eq(translationUsage.month, month),
      ),
    }),
    db
      .select({ plan: subscription.plan, status: subscription.status })
      .from(subscription)
      .where(eq(subscription.referenceId, userId)),
  ]);

  const planName = getUserPlanName(userSubscriptions);
  const pageLimit = PLAN_CONFIG[planName].pages;
  const usedPages = usageRow?.count ?? 0;

  return Response.json({
    used: usedPages,
    limit: pageLimit,
    plan: planName,
    remaining: Math.max(0, pageLimit - usedPages),
  });
}
