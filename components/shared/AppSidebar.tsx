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
  useSidebar,
} from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { User } from "@/modules/user/user.types";
import { sidebarItems, SidebarItem, SidebarChildItem } from "@/lib/menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  const { isMobile } = useSidebar();

  const filteredChildren = item.children?.filter((child) => {
    // If it has sub-children, it's visible if at least one sub-child is visible
    if (child.children && child.children.length > 0) {
      return child.children.some((sub) => {
        if (!sub.permission) return true;
        if (Array.isArray(sub.permission)) {
          return sub.permission.some((p) => userPermissions.includes(p));
        }
        return userPermissions.includes(sub.permission as string);
      });
    }

    if (!child.permission) return true;
    if (Array.isArray(child.permission)) {
      return child.permission.some((p) => userPermissions.includes(p));
    }
    return userPermissions.includes(child.permission as string);
  });

  if (filteredChildren?.length === 0) return null;

  const hasSubGroups = filteredChildren?.some((child) => child.children);

  return (
    <Collapsible className="group/collapsible">
      <SidebarGroup className="p-0 px-2 py-1">
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger className="transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <item.icon />
            <span className="ml-2 text-[1rem]">{item.title}</span>
            <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            {hasSubGroups ? (
              <ul className="mt-1 space-y-0.5 border-l border-sidebar-border ml-5.5 pl-3">
                {filteredChildren?.map((child) =>
                  child.children ? (
                    isMobile ? (
                      <Collapsible key={child.title} className="group/nested">
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton className="flex w-full items-center justify-between">
                              <span>{child.title}</span>
                              <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]/nested:rotate-180 opacity-50" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                        </SidebarMenuItem>
                        <CollapsibleContent>
                          <ul className="mt-0.5 space-y-0.5 border-l border-sidebar-border ml-3 pl-3">
                            {child.children?.map((sub) => (
                              <SidebarMenuItem key={sub.title}>
                                <SidebarMenuButton
                                  onClick={() => router.push(sub.url!)}
                                  className="text-xs"
                                >
                                  {sub.title}
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            ))}
                          </ul>
                        </CollapsibleContent>
                      </Collapsible>
                    ) : (
                      <SidebarMenuItem key={child.title}>
                        <Popover>
                          <PopoverTrigger
                            render={
                              <SidebarMenuButton className="flex w-full items-center justify-between">
                                <span>{child.title}</span>
                                <ChevronDown className="h-3 w-3 opacity-50" />
                              </SidebarMenuButton>
                            }
                          />
                          <PopoverContent
                            side="right"
                            align="start"
                            className="w-48 shadow-lg"
                          >
                            <div className="flex flex-col gap-0.5">
                              <div className="mb-1 px-2 py-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                {child.title}
                              </div>
                              {child.children?.map((sub) => (
                                <button
                                  key={sub.title}
                                  onClick={() => router.push(sub.url!)}
                                  className="flex w-full items-center rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                >
                                  {sub.title}
                                </button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </SidebarMenuItem>
                    )
                  ) : (
                    <SidebarMenuItem key={child.title}>
                      <SidebarMenuButton
                        onClick={() => router.push(child.url!)}
                      >
                        <span>{child.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ),
                )}
              </ul>
            ) : (
              <ul className="mt-1 space-y-0.5 border-l border-sidebar-border ml-5.5 pl-3">
                {filteredChildren?.map((child) => (
                  <SidebarMenuItem key={child.title}>
                    <SidebarMenuButton onClick={() => router.push(child.url!)}>
                      <span>{child.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </ul>
            )}
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
                  // If child has its own children, check them
                  if (child.children && child.children.length > 0) {
                    return child.children.some((sub) => {
                      if (!sub.permission) return true;
                      if (Array.isArray(sub.permission)) {
                        return sub.permission.some(
                          (p) => user.permissions?.includes(p) ?? false,
                        );
                      }
                      return (
                        user.permissions?.includes(sub.permission as string) ??
                        false
                      );
                    });
                  }

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
