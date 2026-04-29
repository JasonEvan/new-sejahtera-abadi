"use client";

import { ChevronDown } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { User } from "@/modules/user/user.types";
import { sidebarItems, SidebarItem } from "@/lib/menu";

function SidebarSingleItem({ item }: { item: SidebarItem }) {
  const router = useRouter();
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={() => router.push(item.url as string)}
        className="pl-4 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      >
        <item.icon />
        <span className="text-[1rem]">{item.title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function SidebarCollapsibleItem({
  item,
  userPermissions,
}: {
  item: SidebarItem;
  userPermissions: string[];
}) {
  const router = useRouter();

  const filteredChildren = item.children?.filter((child) => {
    if (!child.permission) return true;
    if (Array.isArray(child.permission)) {
      return child.permission.some((p) => userPermissions.includes(p));
    }
    return userPermissions.includes(child.permission as string);
  });

  if (filteredChildren?.length === 0) return null;

  return (
    <Collapsible className="group/collapsible">
      <SidebarGroup>
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger className="transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <item.icon />
            <span className="ml-2 text-[1rem]">{item.title}</span>
            <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            <ul className="mt-1 space-y-0.5 border-l border-sidebar-border ml-5.5 pl-3">
              {filteredChildren?.map((child) => (
                <SidebarMenuItem key={child.title}>
                  <SidebarMenuButton onClick={() => router.push(child.url)}>
                    <span>{child.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </ul>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

export default function AppSidebar({ user }: { user: User }) {
  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3 mb-1">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
            P
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground">
              {user.email || "POS System"}
            </span>
            <span className="text-xs text-muted-foreground">
              {user.role?.toUpperCase() || "ADMIN"}
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {sidebarItems
            .filter((item) => {
              // If item has children, it's visible if at least one child is visible
              if (item.children && item.children.length > 0) {
                return item.children.some((child) => {
                  if (!child.permission) return true;
                  if (Array.isArray(child.permission)) {
                    return child.permission.some(
                      (p) => user.permissions?.includes(p) ?? false,
                    );
                  }
                  return (
                    user.permissions?.includes(child.permission as string) ??
                    false
                  );
                });
              }

              // If item has no children, check its own permission
              if (!item.permission) return true;
              if (Array.isArray(item.permission)) {
                return item.permission.some(
                  (p) => user.permissions?.includes(p) ?? false,
                );
              }
              return (
                user.permissions?.includes(item.permission as string) ?? false
              );
            })
            .map((item) =>
              item.children ? (
                <SidebarCollapsibleItem
                  key={item.title}
                  item={item}
                  userPermissions={user.permissions || []}
                />
              ) : (
                <SidebarSingleItem key={item.title} item={item} />
              ),
            )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border px-4 py-3">
        <span className="text-xs text-muted-foreground">© 2026 Jason Evan</span>
      </SidebarFooter>
    </Sidebar>
  );
}
