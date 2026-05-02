"use client";

import { Suspense, useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { toast } from "sonner";
import { ShieldCheck, Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios";
import { useFingerprint } from "@/hooks/useFingerprint";
import { getDeviceLabel } from "@/utils/deviceLabel";

const loginSchema = z.object({
  email: z.email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginContent() {
  const router = useRouter();
  const [isNavigating, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [showPassword, setShowPassword] = useState(false);
  const fingerprint = useFingerprint();

  useEffect(() => {
    // 1. Check for pending request cookie (if user is waiting for approval)
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(";").shift();
    };

    const pendingId = getCookie("pending_request_id");
    if (pendingId) {
      router.push(`/login/waiting-approval?id=${pendingId}`);
      return;
    }

    // 2. Check if already authenticated (has active session)
    const checkAuth = async () => {
      try {
        const { data } = await api.get("/auth/me");
        if (data.authenticated) {
          router.push("/");
        }
      } catch (error) {
        // Not authenticated, stay on login page
      }
    };
    checkAuth();
  }, [router]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { mutate: login, isPending: isLoading } = useMutation({
    mutationFn: async (values: LoginFormValues) => {
      const { data } = await api.post("/auth/login", {
        ...values,
        deviceFingerprint: fingerprint,
        deviceLabel: getDeviceLabel(),
      });
      return data;
    },
    onSuccess: (data) => {
      if (data.status === "pending") {
        toast.info(
          "Login dari device baru terdeteksi. Menunggu persetujuan owner...",
        );
        if (fingerprint)
          sessionStorage.setItem("temp_fingerprint", fingerprint);
        startTransition(() => {
          router.push(`/login/waiting-approval?id=${data.requestId}`);
        });
        return;
      }
      toast.success("Login berhasil! Selamat datang kembali.");
      startTransition(() => {
        router.push("/");
        router.refresh();
      });
    },
  });

  const onSubmit = (values: LoginFormValues) => {
    login(values);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-background to-muted/50 p-4">
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="rounded-2xl bg-primary/10 p-4 ring-1 ring-primary/20">
            <ShieldCheck className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Sejahtera Abadi</h1>
          <p className="text-muted-foreground">
            Silakan masuk untuk mengelola data perusahaan
          </p>
        </div>

        <div className="rounded-3xl border bg-card p-8 shadow-xl shadow-primary/5 ring-1 ring-border/50">
          {error === "invalid_token" && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium p-3 rounded-xl mb-6 text-center animate-in fade-in slide-in-from-top-2 duration-300">
              Link persetujuan tidak valid, sudah kadaluarsa, atau sudah
              digunakan.
            </div>
          )}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  placeholder="name@company.com"
                  type="email"
                  className="pl-10 h-12 rounded-xl transition-all focus:ring-2 focus:ring-primary/20"
                  disabled={isLoading || isNavigating}
                  {...form.register("email")}
                />
              </div>
              {form.formState.errors.email && (
                <p className="text-xs font-medium text-destructive mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="pl-10 pr-10 h-12 rounded-xl transition-all focus:ring-2 focus:ring-primary/20"
                  disabled={isLoading || isNavigating}
                  {...form.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-xs font-medium text-destructive mt-1">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              disabled={isLoading || isNavigating || !fingerprint}
            >
              {isLoading || isNavigating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isNavigating ? "Mengalihkan..." : "Memproses..."}
                </>
              ) : (
                "Masuk"
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Sejahtera Abadi. All rights
          reserved.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
