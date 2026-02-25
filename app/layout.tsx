import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import QueryProvider from "@/components/providers/QueryProvider";
import { Toaster } from "sonner";
import DialogProvider from "@/components/providers/DialogProvider";
import AlertDialogProvider from "@/components/providers/AlertDialogProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sejahtera Abadi",
  description: "Aplikasi untuk mengelola data perusahaan Sejahtera Abadi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <TooltipProvider>{children}</TooltipProvider>
          <DialogProvider />
          <AlertDialogProvider />
        </QueryProvider>
        <Toaster />
      </body>
    </html>
  );
}
