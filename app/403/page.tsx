import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground px-4">
      <div className="flex flex-col items-center max-w-md text-center">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6 animate-pulse">
          <ShieldAlert className="w-10 h-10 text-destructive" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">403 - Forbidden</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Sorry, you do not have permission to access this page. Please contact your administrator if you think this is a mistake.
        </p>
        <div className="flex gap-4">
          <Button asChild variant="default" size="lg">
            <Link href="/">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
