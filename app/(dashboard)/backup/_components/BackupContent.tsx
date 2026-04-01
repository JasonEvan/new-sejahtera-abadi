"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/axios";
import { alertDialogs } from "@/lib/alert-dialogs";
import { Download, RefreshCcw, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

export default function BackupContent() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleDownloadAllData() {
    setIsDownloading(true);

    try {
      const response = await fetch("/api/backup/download", {
        method: "GET",
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(errorPayload?.error || "Gagal mengunduh backup");
      }

      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") || "";
      const matchedFileName = disposition.match(/filename="?([^\"]+)"?/i)?.[1];
      const filename = matchedFileName || "backup.sql";

      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(downloadUrl);

      toast.success("Backup berhasil diunduh", { position: "bottom-right" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Download gagal";
      toast.error(message, { position: "bottom-right" });
    } finally {
      setIsDownloading(false);
    }
  }

  async function handleRestoreAllData() {
    if (!file) {
      toast.error("Pilih file .sql terlebih dahulu", {
        position: "bottom-right",
      });
      return;
    }

    setIsRestoring(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      await api.post("/backup/restore", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Restore data berhasil", { position: "bottom-right" });
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Restore data gagal";
      toast.error(message, { position: "bottom-right" });
    } finally {
      setIsRestoring(false);
    }
  }

  async function handleDeleteAllData() {
    alertDialogs.open({
      title: "Hapus Semua Data",
      description:
        "Apakah Anda yakin ingin menghapus semua data? Tindakan ini tidak dapat dibatalkan.",
      icon: Trash2,
      confirmText: "Hapus Semua",
      onConfirm: async () => {
        setIsDeleting(true);

        try {
          await api.delete("/backup/truncate");
          toast.success("Semua data berhasil dihapus", {
            position: "bottom-right",
          });
        } catch (error: unknown) {
          const message =
            (error as { response?: { data?: { error?: string } } })?.response
              ?.data?.error || "Hapus data gagal";
          toast.error(message, { position: "bottom-right" });
        } finally {
          setIsDeleting(false);
        }
      },
    });
  }

  return (
    <div className="space-y-4">
      <section className="rounded-lg border p-4 space-y-3">
        <h2 className="text-lg font-semibold">Download All Data</h2>
        <p className="text-sm text-muted-foreground">
          Download semua data database ke file .sql menggunakan streaming.
        </p>
        <Button
          type="button"
          onClick={handleDownloadAllData}
          disabled={isDownloading}
          className="cursor-pointer"
        >
          <Download />
          {isDownloading ? "Downloading..." : "Download SQL"}
        </Button>
      </section>

      <section className="rounded-lg border p-4 space-y-3">
        <h2 className="text-lg font-semibold">Restore Data</h2>
        <p className="text-sm text-muted-foreground">
          Upload file .sql untuk restore seluruh data. Sistem akan truncate
          semua tabel sebelum restore.
        </p>
        <Input
          ref={fileInputRef}
          type="file"
          accept=".sql"
          onChange={(event) => {
            const selectedFile = event.target.files?.[0] || null;
            setFile(selectedFile);
          }}
        />
        <Button
          type="button"
          onClick={handleRestoreAllData}
          disabled={isRestoring}
          className="cursor-pointer"
        >
          <RefreshCcw />
          {isRestoring ? "Restoring..." : "Restore SQL"}
        </Button>
      </section>

      <section className="rounded-lg border p-4 space-y-3">
        <h2 className="text-lg font-semibold">Delete All Data</h2>
        <p className="text-sm text-muted-foreground">
          Hapus semua data dengan truncate table dan reset identity id.
        </p>
        <Button
          type="button"
          variant="destructive"
          onClick={handleDeleteAllData}
          disabled={isDeleting}
          className="cursor-pointer"
        >
          <Trash2 />
          {isDeleting ? "Deleting..." : "Delete All Data"}
        </Button>
      </section>
    </div>
  );
}
