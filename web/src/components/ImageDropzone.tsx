"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ImageIcon } from "lucide-react";

interface Props {
  onFileSelected: (file: File) => void;
  selectedFile: File | null;
}

export function ImageDropzone({ onFileSelected, selectedFile }: Props) {
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
  });

  return (
    <Card
      className={cn(
        "border-2 border-dashed transition-colors duration-200 ease-in-out w-full h-64 cursor-pointer",
        isDragActive
          ? "border-primary bg-primary/10 border-solid"
          : "border-border hover:border-primary",
      )}
      {...getRootProps()}
    >
      <CardContent className="flex flex-col items-center justify-center h-full w-full gap-y-3">
        <input {...getInputProps()} />
        <ImageIcon className="size-8 text-muted-foreground" />
        {selectedFile ? (
          <p className="text-sm text-muted-foreground">{selectedFile.name}</p>
        ) : (
          <>
            <p className="text-center text-muted-foreground">
              이미지를 드래그하거나 클릭하여 선택하세요
            </p>
            <p className="text-xs text-muted-foreground">최대 4.5MB</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
