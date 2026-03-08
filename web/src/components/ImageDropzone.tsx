"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ImageIcon } from "lucide-react";

interface Props {
  onFileSelected: (file: File) => void;
  onLoginRequired?: () => void;
  disabled?: boolean;
}

export function ImageDropzone({ onFileSelected, onLoginRequired, disabled }: Props) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelected(acceptedFiles[0]);
      }
    },
    [onFileSelected],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected: (rejectedFiles) => {
      const error = rejectedFiles[0]?.errors[0];
      if (error?.code === "file-too-large") {
        toast.error("파일이 너무 큽니다. 4.5MB 이하의 파일만 업로드할 수 있습니다.");
      } else if (error?.code === "file-invalid-type") {
        toast.error("이미지 파일만 업로드할 수 있습니다.");
      } else {
        toast.error("업로드할 수 없는 파일입니다.");
      }
    },
    maxFiles: 1,
    maxSize: 1024 * 1024 * 4.5,
    accept: { "image/*": [] },
    disabled: disabled || !!onLoginRequired,
  });

  const rootProps = getRootProps();

  return (
    <Card
      className={cn(
        "border-2 border-dashed transition-colors duration-200 ease-in-out w-full h-64",
        disabled
          ? "border-border cursor-not-allowed opacity-60"
          : onLoginRequired
            ? "border-border hover:border-primary cursor-pointer"
            : isDragActive
              ? "border-primary bg-primary/10 border-solid cursor-pointer"
              : "border-border hover:border-primary cursor-pointer",
      )}
      {...rootProps}
      onClick={onLoginRequired ? onLoginRequired : rootProps.onClick}
    >
      <CardContent className="flex flex-col items-center justify-center h-full w-full gap-y-3">
        <input {...getInputProps()} />
        <ImageIcon className="size-8 text-muted-foreground" />
        <p className="text-center text-muted-foreground">
          이미지를 드래그하거나 클릭하여 선택하세요
        </p>
        <p className="text-xs text-muted-foreground">최대 4.5MB</p>
      </CardContent>
    </Card>
  );
}
