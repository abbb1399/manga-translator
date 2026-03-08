"use client";

import { useCallback, useState } from "react";
import { ImageDropzone } from "@/components/ImageDropzone";
import { Button } from "@/components/ui/button";
import { LoginDialog } from "@/components/auth/login-dialog";
import { authClient } from "@/lib/auth/auth-client";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";

type TranslateState =
  | { status: "idle" }
  | { status: "translating"; fileName: string; previewUrl: string }
  | { status: "done"; fileName: string; previewUrl: string; resultUrl: string }
  | { status: "error" };

export default function Home() {
  const [state, setState] = useState<TranslateState>({ status: "idle" });
  const [loginOpen, setLoginOpen] = useState(false);
  const { data: session } = authClient.useSession();

  const handleFileSelected = useCallback(async (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setState({ status: "translating", fileName: file.name, previewUrl });

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/translate", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "번역 실패");
      }

      const blob = await res.blob();
      const resultUrl = URL.createObjectURL(blob);

      setState({
        status: "done",
        fileName: file.name,
        previewUrl,
        resultUrl,
      });
      toast.success("번역 완료!");
    } catch (err) {
      URL.revokeObjectURL(previewUrl);
      const message = err instanceof Error ? err.message : "번역 실패";
      toast.error(message);
      setState({ status: "error" });
    }
  }, []);

  const triggerDownload = () => {
    if (state.status !== "done") return;
    const a = document.createElement("a");
    a.href = state.resultUrl;
    a.download = state.fileName.replace(/\.[^.]+$/, "") + "_translated.png";
    a.click();
  };

  const reset = () => {
    if (state.status === "translating" || state.status === "done") {
      URL.revokeObjectURL(state.previewUrl);
    }
    if (state.status === "done") {
      URL.revokeObjectURL(state.resultUrl);
    }
    setState({ status: "idle" });
  };

  const isTranslating = state.status === "translating";

  return (
    <>
      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />

      <div className="my-6 px-4 max-w-md mx-auto space-y-6">
        <ImageDropzone
          onFileSelected={handleFileSelected}
          onLoginRequired={session ? undefined : () => setLoginOpen(true)}
          disabled={isTranslating}
        />

        {state.status === "translating" && (
          <div className="flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={state.previewUrl}
              alt="원본 이미지"
              className="max-h-64 rounded-lg border border-border object-contain"
            />
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span>번역 중...</span>
            </div>
          </div>
        )}

        {state.status === "done" && (
          <div className="flex flex-col items-center gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-2">원본</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={state.previewUrl}
                  alt="원본 이미지"
                  className="max-h-48 rounded-lg border border-border object-contain"
                />
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-2">번역</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={state.resultUrl}
                  alt="번역된 이미지"
                  className="max-h-48 rounded-lg border border-border object-contain"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={triggerDownload}>
                <Download className="size-4" />
                다운로드
              </Button>
              <Button variant="outline" onClick={reset}>
                초기화
              </Button>
            </div>
          </div>
        )}

        {state.status === "error" && (
          <div className="flex justify-center">
            <Button variant="outline" onClick={reset}>
              초기화
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
