import { writeFile, readFile, mkdir, rm } from "fs/promises";
import { randomUUID } from "crypto";
import { execFile } from "child_process";
import path from "path";

const CONTAINER_NAME = "manga-translator";
const RESULT_DIR = path.resolve(process.cwd(), "../result");

// 동시 실행 방지 (local 모드는 result/final.png를 고정 경로로 사용)
let translating = false;

export async function POST(request: Request) {
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

    const translator = (formData.get("translator") as string) ?? "openai";
    const targetLang = (formData.get("target_lang") as string) ?? "KOR";

    // 작업 디렉토리 생성 및 파일 저장
    await mkdir(hostJobDir, { recursive: true });
    const buffer = Buffer.from(await image.arrayBuffer());
    await writeFile(hostInputFile, buffer);

    const config = {
      translator: { translator, target_lang: targetLang },
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

    return new Response(resultBuffer, {
      headers: { "Content-Type": "image/png" },
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
