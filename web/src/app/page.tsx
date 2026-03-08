"use client";

import { useState } from "react";
import { ImageDropzone } from "@/components/ImageDropzone";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    // TODO: 번역 기능 연동
  };

  return (
    <div className="my-6 px-4 max-w-md mx-auto">
      <ImageDropzone onFileSelected={handleFileSelected} selectedFile={selectedFile} />
    </div>
  );
}
