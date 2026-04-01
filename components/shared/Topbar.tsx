import { LogOut } from "lucide-react";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { SidebarTrigger } from "../ui/sidebar";
import { ThemeToggle } from "./ThemeToggle";

export default function Topbar() {
  return (
    <header className="flex h-14 items-center gap-2 border-b border-border bg-background px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-6" />
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <Button className="text-destructive" variant="ghost">
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  );
}
