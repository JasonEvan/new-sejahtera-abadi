"use client";

import { useEffect, useRef, useState, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

function WaitingApprovalContent({ requestId }: { requestId: string | null }) {
  const router = useRouter();
  const [status, setStatus] = useState<
    "pending" | "approved" | "declined" | "expired" | "unavailable"
  >(requestId && /^[1-9]\d{0,9}$/.test(requestId) ? "pending" : "unavailable");
  const [isChecking, setIsChecking] = useState(false);
  const inFlight = useRef(false);
  const finished = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const checkStatus = useCallback(async () => {
    if (!requestId || finished.current || inFlight.current) return;

    inFlight.current = true;
    setIsChecking(true);
    try {
      const response = await fetch(`/api/auth/login-request/${requestId}`, {
        method: "POST",
        cache: "no-store",
      });
      if (!mounted.current) return;
      const nextStatus =
        response.status === 404
          ? "unavailable"
          : response.ok
            ? (await response.json()).status
            : null;

      if (!mounted.current) return;
      if (
        nextStatus === "approved" ||
        nextStatus === "declined" ||
        nextStatus === "expired" ||
        nextStatus === "unavailable"
      ) {
        finished.current = true;
        setStatus(nextStatus);
        if (nextStatus === "approved") {
          toast.success("Login disetujui oleh owner!");
          router.replace("/");
          router.refresh();
        }
      }
    } catch (error) {
      console.error("Status check error:", error);
    } finally {
      inFlight.current = false;
      if (mounted.current) setIsChecking(false);
    }
  }, [requestId, router]);

  useEffect(() => {
    if (!requestId || status !== "pending") return;

    const interval = setInterval(checkStatus, 5000);

    return () => clearInterval(interval);
  }, [checkStatus, requestId, status]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-background to-muted/50 p-4">
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="rounded-3xl border bg-card p-8 shadow-xl shadow-primary/5 ring-1 ring-border/50 text-center">
          {status === "pending" && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                  <div className="relative rounded-full bg-primary/10 p-6">
                    <ShieldAlert className="h-12 w-12 text-primary" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight">
                  Menunggu Persetujuan
                </h1>
                <p className="text-muted-foreground text-sm">
                  Login dari device baru terdeteksi. Permintaan telah dikirim ke
                  owner perusahaan untuk disetujui.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-primary font-medium bg-primary/5 py-3 px-4 rounded-xl">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Memeriksa status secara real-time...</span>
              </div>
              <Button
                variant="outline"
                className="w-full rounded-xl border-primary/20 hover:bg-primary/5 group transition-all"
                onClick={checkStatus}
                disabled={isChecking}
              >
                {isChecking ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ShieldAlert className="h-4 w-4 mr-2 text-primary group-hover:scale-110 transition-transform" />
                )}
                Cek Status Sekarang
              </Button>
              <div className="pt-4 border-t border-dashed">
                <p className="text-xs text-muted-foreground">
                  Halaman ini akan otomatis dialihkan setelah disetujui.
                </p>
                <p className="mt-2 text-xs font-medium text-orange-600 dark:text-orange-400">
                  ⚠️ Mohon jangan tutup halaman atau browser ini sampai Owner
                  menyetujui permintaan login Anda.
                </p>
              </div>
            </div>
          )}

          {status === "approved" && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-500/10 p-6">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-green-600">
                  Login Disetujui!
                </h1>
                <p className="text-muted-foreground text-sm">
                  Permintaan login Anda telah disetujui oleh owner.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 text-green-600 font-medium bg-green-500/10 py-3 px-4 rounded-xl">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Mengalihkan ke aplikasi...</span>
              </div>
            </div>
          )}

          {status === "declined" && (
            <div className="space-y-6 animate-in zoom-in duration-300">
              <div className="flex justify-center">
                <div className="rounded-full bg-red-500/10 p-6">
                  <XCircle className="h-12 w-12 text-red-500" />
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-red-600">
                  Login Ditolak
                </h1>
                <p className="text-muted-foreground text-sm">
                  Maaf, owner telah menolak permintaan login dari device ini.
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full rounded-xl"
                onClick={() => router.replace("/login")}
              >
                Kembali ke Login
              </Button>
            </div>
          )}

          {(status === "expired" || status === "unavailable") && (
            <div className="space-y-6 animate-in zoom-in duration-300">
              <div className="flex justify-center">
                <div className="rounded-full bg-orange-500/10 p-6">
                  <ShieldAlert className="h-12 w-12 text-orange-500" />
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-orange-600">
                  {status === "expired"
                    ? "Permintaan Kadaluarsa"
                    : "Permintaan Tidak Tersedia"}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {status === "expired"
                    ? "Permintaan login Anda telah kadaluarsa (melewati 1 jam)."
                    : "Permintaan login ini tidak dapat dilanjutkan. Silakan masuk kembali."}
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full rounded-xl"
                onClick={() => router.replace("/login")}
              >
                Coba Login Lagi
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WaitingApprovalFromQuery() {
  const requestId = useSearchParams().get("id");
  return <WaitingApprovalContent key={requestId} requestId={requestId} />;
}

export default function WaitingApprovalPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <WaitingApprovalFromQuery />
    </Suspense>
  );
}
