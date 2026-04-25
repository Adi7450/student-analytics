"use client";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useQueryClient } from "@tanstack/react-query";
import { uploadCsv } from "@/lib/api";

interface Props {
  onUploadStart:   () => void;
  onUploadSuccess: (rows: number) => void;
  onUploadError:   () => void;
}

export function CsvUpload({ onUploadStart, onUploadSuccess, onUploadError }: Props) {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setError(null);
    onUploadStart();
    try {
      const res = await uploadCsv(file);
      // Invalidate all cached queries so pages refetch with new data
      await qc.invalidateQueries();
      onUploadSuccess(res.rows);
    } catch (e: any) {
      const msg = e?.response?.data?.detail || "Upload failed";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
      onUploadError();
    }
  }, [qc, onUploadStart, onUploadSuccess, onUploadError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { "text/csv": [".csv"] }, maxFiles: 1,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        style={{
          border: `1px dashed ${isDragActive ? "var(--accent-amber)" : "var(--bg-border)"}`,
          borderRadius: 8, padding: "0.75rem",
          background: isDragActive ? "rgba(251,191,36,0.05)" : "transparent",
          cursor: "pointer", textAlign: "center", transition: "all 0.15s ease",
        }}
      >
        <input {...getInputProps()} />
        <div style={{ fontSize: 18, marginBottom: 4 }}>⊕</div>
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
          {isDragActive ? "Drop CSV here" : "Drop CSV or click"}
        </div>
      </div>
      {error && (
        <div style={{ marginTop: 6, fontSize: 10, color: "#fb7185", fontFamily: "IBM Plex Mono, monospace", lineHeight: 1.4 }}>
          ✕ {error}
        </div>
      )}
    </div>
  );
}
