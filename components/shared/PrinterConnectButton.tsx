"use client";

import { useEffect, useState } from "react";
import {
  Printer,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Usb,
  Cable,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { usePrinterStore } from "@/lib/printer-store";
import { toast } from "sonner";

export function PrinterConnectButton() {
  const [open, setOpen] = useState(false);
  const {
    isConnected,
    connectionType,
    deviceName,
    baudRate,
    isConnecting,
    error,
    setBaudRate,
    connectSerial,
    connectUsb,
    disconnect,
    testPrint,
    checkAutoConnect,
  } = usePrinterStore();

  useEffect(() => {
    checkAutoConnect();
  }, [checkAutoConnect]);

  const handleConnectSerial = async () => {
    const success = await connectSerial();
    if (success) {
      toast.success("Printer LX-310 terhubung via Web Serial");
    } else if (usePrinterStore.getState().error) {
      toast.error(usePrinterStore.getState().error);
    }
  };

  const handleConnectUsb = async () => {
    const success = await connectUsb();
    if (success) {
      toast.success("Printer LX-310 terhubung via Web USB");
    } else if (usePrinterStore.getState().error) {
      toast.error(usePrinterStore.getState().error);
    }
  };

  const handleTestPrint = async () => {
    const success = await testPrint();
    if (success) {
      toast.success("Halaman tes berhasil dikirim ke printer");
    } else {
      toast.error(
        usePrinterStore.getState().error || "Gagal melakukan tes cetak",
      );
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    toast.info("Printer terputus");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="relative gap-2 border-border font-medium shadow-xs transition-colors hover:bg-accent cursor-pointer"
          />
        }
      >
        <Printer className="h-4 w-4" />
        <span className="hidden sm:inline">
          {isConnected ? "LX-310 Terhubung" : "Hubungkan Printer"}
        </span>
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            isConnected
              ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse"
              : "bg-muted-foreground/50"
          }`}
        />
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-primary" />
              <div>
                <h4 className="text-sm font-semibold leading-none">
                  Printer LX-310
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Direct Continuous Form
                </p>
              </div>
            </div>
            {isConnected ? (
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                Terhubung
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                <XCircle className="h-3 w-3" />
                Terputus
              </span>
            )}
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">
              {error}
            </div>
          )}

          {isConnected ? (
            <div className="space-y-3">
              <div className="rounded-lg border bg-muted/30 p-2.5 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium capitalize text-foreground">
                    Direct {connectionType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Perangkat:</span>
                  <span className="font-medium truncate max-w-37.5 text-foreground">
                    {deviceName || "Epson LX-310"}
                  </span>
                </div>
                {connectionType === "serial" && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Baud Rate:</span>
                    <span className="font-medium text-foreground">
                      {baudRate} bps
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestPrint}
                  className="flex-1 text-xs"
                >
                  Tes Cetak
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDisconnect}
                  className="flex-1 text-xs"
                >
                  Putuskan
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Serial Baud Rate (LX-310 standard: 9600)
                </label>
                <select
                  value={baudRate}
                  onChange={(e) => setBaudRate(Number(e.target.value))}
                  className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
                >
                  <option value={4800}>4800 bps</option>
                  <option value={9600}>9600 bps (Default LX-310)</option>
                  <option value={19200}>19200 bps</option>
                  <option value={38400}>38400 bps</option>
                  <option value={115200}>115200 bps</option>
                </select>
              </div>

              <div className="space-y-2 pt-1">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleConnectSerial}
                  disabled={isConnecting}
                  className="w-full gap-2 text-xs"
                >
                  {isConnecting ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Cable className="h-3.5 w-3.5" />
                  )}
                  Hubungkan Web Serial API
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleConnectUsb}
                  disabled={isConnecting}
                  className="w-full gap-2 text-xs"
                >
                  {isConnecting ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Usb className="h-3.5 w-3.5" />
                  )}
                  Hubungkan Web USB API
                </Button>
              </div>

              <p className="text-[11px] text-muted-foreground pt-1 leading-normal">
                * <strong>Rekomendasi Koneksi USB</strong>: Meskipun printer
                terhubung dengan kabel USB, pilih{" "}
                <strong>&quot;Hubungkan Web Serial API&quot;</strong> agar
                browser dapat mengakses port USB printer tanpa terblokir oleh
                driver OS (CUPS/Windows Spooler).
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
