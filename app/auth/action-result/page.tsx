"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function ActionResultContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");

  const config = {
    approved: {
      title: "Berhasil Disetujui",
      description:
        "Permintaan login telah disetujui. User sekarang dapat mengakses dashboard.",
      icon: <CheckCircle2 className="h-16 w-16 text-green-500" />,
      color: "text-green-600",
      bgColor: "bg-green-500/10",
    },
    approved_remember: {
      title: "Berhasil Disetujui & Device Diingat",
      description:
        "Permintaan login disetujui dan device ini dipercayai untuk login selanjutnya.",
      icon: <CheckCircle2 className="h-16 w-16 text-emerald-500" />,
      color: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
    },
    declined: {
      title: "Berhasil Ditolak",
      description:
        "Permintaan login telah ditolak. User tidak akan bisa masuk ke sistem.",
      icon: <XCircle className="h-16 w-16 text-red-500" />,
      color: "text-red-600",
      bgColor: "bg-red-500/10",
    },
    expired: {
      title: "Link Kadaluarsa",
      description:
        "Maaf, permintaan login ini sudah kadaluarsa (melewati batas 1 jam).",
      icon: <Clock className="h-16 w-16 text-orange-500" />,
      color: "text-orange-600",
      bgColor: "bg-orange-500/10",
    },
    invalid_token: {
      title: "Link Tidak Valid",
      description:
        "Link yang Anda gunakan tidak valid atau sudah pernah digunakan sebelumnya.",
      icon: <AlertCircle className="h-16 w-16 text-muted-foreground" />,
      color: "text-muted-foreground",
      bgColor: "bg-muted/10",
    },
  }[status as string] || {
    title: "Terjadi Kesalahan",
    description: "Status permintaan tidak diketahui.",
    icon: <AlertCircle className="h-16 w-16 text-muted-foreground" />,
    color: "text-muted-foreground",
    bgColor: "bg-muted/10",
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-background to-muted/50 p-4">
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="rounded-2xl bg-primary/10 p-4 ring-1 ring-primary/20">
            <ShieldCheck className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Sejahtera Abadi</h1>
        </div>

        <div className="rounded-3xl border bg-card p-10 shadow-xl shadow-primary/5 ring-1 ring-border/50 text-center space-y-6">
          <div className="flex justify-center">
            <div className={`rounded-full ${config.bgColor} p-6`}>
              {config.icon}
            </div>
          </div>

          <div className="space-y-2">
            <h2 className={`text-2xl font-bold tracking-tight ${config.color}`}>
              {config.title}
            </h2>
            <p className="text-muted-foreground text-sm">
              {config.description}
            </p>
          </div>

          <div className="pt-4">
            <Button
              className="w-full rounded-xl h-12"
              onClick={() => window.close()}
            >
              Tutup Halaman
            </Button>
            <p className="mt-4 text-xs text-muted-foreground">
              Anda dapat menutup tab ini sekarang.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ActionResultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ActionResultContent />
    </Suspense>
  );
}

function Loader2({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
