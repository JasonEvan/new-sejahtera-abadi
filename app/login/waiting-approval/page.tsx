"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useFingerprint } from "@/hooks/useFingerprint";
import { getDeviceLabel } from "@/utils/deviceLabel";
import {
  Loader2,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function WaitingApprovalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get("id");
  const [status, setStatus] = useState<
    "pending" | "approved" | "declined" | "expired"
  >("pending");
  const [showTrustPrompt, setShowTrustPrompt] = useState(false);
  const [isTrusting, setIsTrusting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const fingerprint = useFingerprint();

  const checkStatus = async () => {
    if (!requestId || status !== "pending") return;

    setIsChecking(true);
    try {
      const { data } = await api.get(`/auth/login-request/${requestId}`);
      if (data.status !== "pending") {
        setStatus(data.status);

        if (data.status === "approved") {
          setShowTrustPrompt(true);
        }
      }
    } catch (error) {
      console.error("Status check error:", error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (!requestId || status !== "pending") return;

    const interval = setInterval(checkStatus, 5000);

    return () => clearInterval(interval);
  }, [requestId, status]);

  const handleTrustDevice = async (trust: boolean) => {
    if (trust) {
      setIsTrusting(true);
      try {
        await api.post("/auth/trust-device", {
          deviceFingerprint: fingerprint,
          deviceLabel: getDeviceLabel(),
        });
        toast.success("Device ini sekarang dipercayai.");
      } catch (error) {
        toast.error("Gagal mempercayai device.");
      } finally {
        setIsTrusting(false);
      }
    }

    document.cookie =
      "pending_request_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/");
    router.refresh();
  };

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

          {status === "approved" && showTrustPrompt && (
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
                  Permintaan login Anda telah diterima oleh owner.
                </p>
              </div>

              <div className="bg-muted/50 p-6 rounded-2xl border border-border/50 space-y-4">
                <div className="flex items-center gap-3 text-left">
                  <div className="bg-background p-2 rounded-lg">
                    <Monitor className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      Percayai device ini?
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Jika dipercayai, Anda tidak perlu lagi meminta persetujuan
                      saat login dari browser ini.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl"
                    onClick={() => handleTrustDevice(false)}
                    disabled={isTrusting}
                  >
                    Tidak
                  </Button>
                  <Button
                    className="flex-1 rounded-xl bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20"
                    onClick={() => handleTrustDevice(true)}
                    disabled={isTrusting}
                  >
                    {isTrusting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Ya, Percayai"
                    )}
                  </Button>
                </div>
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
                onClick={() => {
                  document.cookie =
                    "pending_request_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                  router.push("/login");
                }}
              >
                Kembali ke Login
              </Button>
            </div>
          )}

          {status === "expired" && (
            <div className="space-y-6 animate-in zoom-in duration-300">
              <div className="flex justify-center">
                <div className="rounded-full bg-orange-500/10 p-6">
                  <ShieldAlert className="h-12 w-12 text-orange-500" />
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-orange-600">
                  Permintaan Kadaluarsa
                </h1>
                <p className="text-muted-foreground text-sm">
                  Permintaan login Anda telah kadaluarsa (melewati 1 jam).
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full rounded-xl"
                onClick={() => {
                  document.cookie =
                    "pending_request_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                  router.push("/login");
                }}
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

export default function WaitingApprovalPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <WaitingApprovalContent />
    </Suspense>
  );
}
