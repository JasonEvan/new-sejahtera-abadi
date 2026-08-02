"use client";

import { LogOut } from "lucide-react";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { SidebarTrigger } from "../ui/sidebar";
import { PrinterConnectButton } from "./PrinterConnectButton";
import { ThemeToggle } from "./ThemeToggle";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function Topbar() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      toast.success("Berhasil logout");
      router.push("/login");
    } catch {
      toast.error("Gagal logout");
    }
  };

  return (
    <header className="flex h-14 items-center gap-2 border-b border-border bg-background px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-6" />
      <div className="ml-auto flex items-center gap-2">
        <PrinterConnectButton />
        <ThemeToggle />
        <Button
          className="text-destructive cursor-pointer"
          variant="ghost"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  );
}
