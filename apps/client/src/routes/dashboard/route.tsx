import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useCallback, Suspense, memo } from "react";
import * as React from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { usePluginStore } from "@/features/plugins/store";
import { renderIcon } from "@/core/components/ui/icon-picker/index.helper";
import { cn } from "@/lib/utils";
import { useTheme } from "@/features/preferences/hooks/use-theme";
import { useShallow } from "zustand/react/shallow";
import { useTranslation } from "react-i18next";
import { isOnboardingRequired, getOnboardingEntryPoint } from "@/features/onboarding/services/onboarding";
import { ChatSidebar } from "@/features/ai/components/chat-sidebar";
import { syncService, type SyncState } from "@/core/sync/sync";
import { Popover, PopoverContent, PopoverTrigger } from "@/core/components/ui/popover";
import { Button } from "@/core/components/ui/button";
import {
  RiSettingsLine,
  RiBankCard2Line,
  RiBankCard2Fill,
  RiStackLine,
  RiStackFill,
  RiArrowDownSLine,
  RiSunLine,
  RiMoonLine,
  RiLogoutBoxLine,
  type RemixiconComponentType,
  RiDashboardLine,
  RiDashboardFill,
  RiInboxLine,
  RiInboxFill,
  RiWalletLine,
  RiWalletFill,
  RiPuzzleLine,
  RiPuzzleFill,
  RiQuestionLine,
  RiQuestionFill,
  RiBellLine,
  RiFolderLine,
  RiFolderFill,
  RiWifiLine,
  RiWifiOffLine,
  RiRefreshLine,
  RiCheckLine,
  RiErrorWarningLine,
  RiTimeLine,
} from "@remixicon/react";
import LogoWTXT from "@/core/components/icons/NUTSNEW";
import { Avatar, AvatarFallback, AvatarImage } from "@/core/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarGroupContent,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from "@/core/components/ui/sidebar";
import type { FileRoutesByTo } from "@/routeTree.gen";
import { Theme } from "@/features/preferences/contexts/theme.context";
import { Spinner } from "@/core/components/ui/spinner";
import { useLogout } from "@/features/auth/services/auth.mutations";
import { getAllAccounts } from "@/features/accounts/services/account.queries";
import { ErrorBoundary, ComponentErrorFallback } from "@/core/components/ui/error-boundary";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/core/components/ui/dialog";
import { useUnreadNotifications } from "@/features/notifications/services/notification.queries";
import { Badge } from "@/core/components/ui/badge";

export type ValidRoutes = keyof FileRoutesByTo;

type navStuff = {
  title: string;
  url: ValidRoutes;
  icon: RemixiconComponentType;
  activeIcon: RemixiconComponentType;
};

const navMain: navStuff[] = [
  {
    title: "navigation.dashboard",
    url: "/dashboard/home",
    icon: RiDashboardLine,
    activeIcon: RiDashboardFill,
  },
  {
    title: "navigation.inbox",
    url: "/dashboard/inbox",
    icon: RiInboxLine,
    activeIcon: RiInboxFill,
  },
  {
    title: "navigation.accounts",
    url: "/dashboard/accounts",
    icon: RiStackLine,
    activeIcon: RiStackFill,
  },
  {
    title: "navigation.transactions",
    url: "/dashboard/records",
    icon: RiBankCard2Line,
    activeIcon: RiBankCard2Fill,
  },
  {
    title: "navigation.budgets",
    url: "/dashboard/budgets",
    icon: RiWalletLine,
    activeIcon: RiWalletFill,
  },
  {
    title: "navigation.files",
    url: "/dashboard/files",
    icon: RiFolderLine,
    activeIcon: RiFolderFill,
  },
  // {
  //   title: "navigation.analytics",
  //   url: "/dashboard/analytics",
  //   icon: RiBarChartBoxLine,
  //   activeIcon: RiBarChartBoxFill,
  // }
];

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async ({ context }) => {
    const queryClient = context.queryClient;

    if (context.auth.isAuthenticated) {
      try {
        const user = useAuthStore.getState().user;

        if (user && isOnboardingRequired(user) && !context.auth.isAnonymous) {
          const entryPoint = getOnboardingEntryPoint(user);
          throw redirect({
            to: entryPoint,
          });
        }
      } catch (redirectError) {
        if (redirectError && typeof redirectError === "object" && "type" in redirectError) {
          throw redirectError;
        }
        console.error("Failed to check onboarding status:", redirectError);
      }
    }


    const accounts = await queryClient.fetchQuery(getAllAccounts())

    return {
      hasAccounts: accounts.length > 0,
    };
  },
  component: DashboardWrapper,
});

function DashboardWrapper() {
  const navigate = useNavigate();
  const [isPluginNavOpen, setIsPluginNavOpen] = React.useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = React.useState(false);
  const [isChatSidebarOpen, setIsChatSidebarOpen] = React.useState(false);

  useHotkeys(
    "g+d",
    () => {
      navigate({ to: "/dashboard/home" });
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = 'Navigated to Dashboard';
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 1000);
    },
    { description: "Navigate to Dashboard (g+d)" }
  );

  useHotkeys(
    "g+c",
    () => {
      navigate({ to: "/dashboard/accounts" });
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.className = 'sr-only';
      announcement.textContent = 'Navigated to Accounts';
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 1000);
    },
    { description: "Navigate to Accounts (g+c)" }
  );

  useHotkeys(
    "g+t",
    () => {
      navigate({ to: "/dashboard/records" });
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.className = 'sr-only';
      announcement.textContent = 'Navigated to Transactions';
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 1000);
    },
    { description: "Navigate to Transactions (g+t)" }
  );

  useHotkeys(
    "g+a",
    () => {
      navigate({ to: "/dashboard/analytics" });
    },
    []
  );

  useHotkeys(
    "g+s",
    () => {
      navigate({ to: "/dashboard/settings/profile" });
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.className = 'sr-only';
      announcement.textContent = 'Navigated to Settings';
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 1000);
    },
    { description: "Navigate to Settings (g+s)" }
  );

  useHotkeys('escape', () => {
    const mainContent = document.getElementById('main-content');
    mainContent?.focus();
  }, { description: "Focus main content (Escape)" });

  useHotkeys('?', () => {
    setIsHelpModalOpen(true);
  }, { description: "Show keyboard shortcuts (?)" });

  useHotkeys('ctrl+b, meta+b', (e) => {
    e.preventDefault();
    setIsChatSidebarOpen(prev => !prev);
  }, { description: "Toggle AI Chat (Ctrl+B)" });

  return (
    <SidebarProvider open={isPluginNavOpen}>
      <div className="sr-only" id="keyboard-shortcuts" aria-label="Available keyboard shortcuts">
        <h2>Keyboard Shortcuts</h2>
        <ul>
          <li>g+d: Navigate to Dashboard</li>
          <li>g+c: Navigate to Accounts</li>
          <li>g+t: Navigate to Transactions</li>
          <li>g+a: Navigate to Analytics</li>
          <li>g+s: Navigate to Settings</li>
          <li>Escape: Focus main content</li>
        </ul>
      </div>

      <Sidebar
        collapsible="icon"
        className="overflow-hidden [*>]:data-[sidebar=sidebar]:flex-row"
        role="navigation"
        aria-label="Main navigation"
      >
        <Sidebar
          collapsible="none"
          className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
        >
          <SideBarHeader />
          <SidebarContent className="-mt-2">
            <SideBarMainLinks />
            <SideBarPluginsLinks
              isPluginNavOpen={isPluginNavOpen}
              setIsPluginNavOpen={setIsPluginNavOpen}
            />
          </SidebarContent>
          <SidebarFooter>
            <SideBarSyncStatusButton />
            <SideBarNotificationsButton />
            <SideBarHelpButton
              isHelpModalOpen={isHelpModalOpen}
              setIsHelpModalOpen={setIsHelpModalOpen}
            />
            <ErrorBoundary fallback={ComponentErrorFallback}>
              <Suspense fallback={<Spinner />}>
                <SideBarFooterMenu />
              </Suspense>
            </ErrorBoundary>
          </SidebarFooter>
        </Sidebar>

        <SecondarySidebar isOpen={isPluginNavOpen} />
      </Sidebar>

      <SidebarInset className="overflow-hidden px-4 md:px-6 py-2 md:py-4">
        <ErrorBoundary>
          <main
            id="main-content"
            tabIndex={-1}
            className="focus:outline-none"
            role="main"
            aria-label="Main content"
          >
            <Outlet />
          </main>
        </ErrorBoundary>
      </SidebarInset>
      <ChatSidebar
        open={isChatSidebarOpen}
        onOpenChange={setIsChatSidebarOpen}
      />
    </SidebarProvider>
  );
}


const SideBarFooterMenu = memo(() => {
  const navigate = useNavigate();
  const isAnonymous = useAuthStore((state) => state.isAnonymous);
  const user = useAuthStore((state) => state.user);

  const logout = useLogout();
  const { theme, setTheme } = useTheme();
  const { isMobile } = useSidebar();
  const { t } = useTranslation();

  const onLogout = useCallback(async () => {
    await logout.mutateAsync();
    navigate({ to: "/login", replace: true });
  }, [logout, navigate]);

  const onSignIn = useCallback(() => {
    navigate({ to: "/login", search: { redirect: "/dashboard/home" } });
  }, [navigate]);

  if (isAnonymous || !user) {
    return (
      <SidebarMenuItem className="items-center flex justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="size-full! p-0! justify-center items-center">
              <Avatar className="">
                <AvatarFallback>G</AvatarFallback>
              </Avatar>
              {/* <div className="ms-1 grid flex-1 items-center text-left text-sm leading-tight"> */}
              {/*   <span className="truncate font-medium">Guest</span> */}
              {/*   <span className="text-muted-foreground text-xs">Anonymous</span> */}
              {/* </div> */}
              {/* <div className="bg-sidebar-accent/50 flex size-8 items-center justify-center rounded-lg in-[[data-slot=dropdown-menu-trigger]:hover]:bg-transparent"> */}
              {/*   <RiArrowDownSLine className="size-5 opacity-40" size={20} /> */}
              {/* </div> */}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="end"
            sideOffset={4}
            side={isMobile ? "bottom" : "right"}
            forceMount
          >
            <DropdownMenuItem asChild>
              <Link to="/dashboard/settings" className="gap-3 px-1">
                <RiSettingsLine size={16} className="text-muted-foreground/70" aria-hidden="true" />
                {t("settings.accountSettings")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-3 px-1 ps-2">
                <RiSunLine size={16} className="text-muted-foreground/70" aria-hidden="true" />
                {t("settings.theme")}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as Theme)}>
                  <DropdownMenuRadioItem value="light">
                    <RiSunLine size={16} className="text-muted-foreground/70" aria-hidden="true" />
                    {t("settings.light")}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark">
                    <RiMoonLine size={16} className="text-muted-foreground/70" aria-hidden="true" />
                    {t("settings.dark")}
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem className="gap-3 px-1 ps-2" onClick={onSignIn}>
              <RiLogoutBoxLine size={16} className="text-muted-foreground/70" aria-hidden="true" />
              Sign In
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenu className="group-data-[collapsible=icon]:items-center">
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <Avatar className="transition-[width,height] duration-200 ease-in-out in-data-[state=expanded]:size-6">
                <AvatarImage src={user.avatar_url} alt={user.name} />
                <AvatarFallback>
                  {user.name?.split(" ").map(n => n[0]).join("").toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="ms-1 grid flex-1 items-center text-left text-sm leading-tight">
                <span className="truncate font-medium">{user?.name}</span>
              </div>
              <div className="bg-sidebar-accent/50 flex size-8 items-center justify-center rounded-lg in-[[data-slot=dropdown-menu-trigger]:hover]:bg-transparent">
                <RiArrowDownSLine className="size-5 opacity-40" size={20} />
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="end"
            sideOffset={4}
            side={isMobile ? "bottom" : "right"}
            forceMount
          >
            <DropdownMenuItem asChild>
              <Link to="/dashboard/settings" className="gap-3 px-1">
                <RiSettingsLine size={16} className="text-muted-foreground/70" aria-hidden="true" />
                {t("settings.accountSettings")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-3 px-1 ps-2">
                <RiSunLine size={16} className="text-muted-foreground/70" aria-hidden="true" />
                {t("settings.theme")}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as Theme)}>
                  <DropdownMenuRadioItem value="light">
                    <RiSunLine size={16} className="text-muted-foreground/70" aria-hidden="true" />
                    {t("settings.light")}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark">
                    <RiMoonLine size={16} className="text-muted-foreground/70" aria-hidden="true" />
                    {t("settings.dark")}
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem className="gap-3 px-1 ps-2" onClick={() => onLogout()}>
              <RiLogoutBoxLine size={16} className="text-muted-foreground/70" aria-hidden="true" />
              {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
});

const SideBarHeader = memo(() => {
  return (
    <SidebarHeader className="mb-4 h-fit justify-center mt-4">
      <div className="flex w-full items-center rounded-lg px-2 justify-center">
        <LogoWTXT frontFill="var(--color-background)" fill="color-mix(in oklab, var(--color-muted-foreground) 100%, transparent)" className=" size-8" />
      </div>
    </SidebarHeader>
  );
});

const SideBarMainLinks = memo(() => {
  const { t } = useTranslation();

  return (
    <SidebarGroup>
      <SidebarGroupContent className="px-0">
        <SidebarMenu className="items-center gap-3">
          {navMain.map((item) => (
            <SidebarMenuItem key={item.title} className="w-full">
              <SidebarMenuButton
                asChild
                tooltip={t(item.title)}
                className="duration-200 will-change-transform active:scale-95 active:translate-y-0.5 group/menu-button font-medium gap-3 h-9 rounded-md text-[#757575] hover:text-secondary-900/45 hover:bg-neutral-200/40 [&>svg]:size-full focus:outline-none   " >
                <Link
                  to={item.url}
                  activeProps={{ className: "bg-sidebar-accent shadow-sm hover:bg-sidebar-accent" }}
                  tabIndex={0}
                  role="menuitem"
                  aria-label={`Navigate to ${t(item.title)}`}
                >{({ isActive }: { isActive: boolean }) => (
                  <>
                    {isActive ? (
                      <item.activeIcon
                        size={16}
                        aria-hidden="true"
                        className="text-secondary-900/80 dark:text-secondary-50"
                      />
                    ) : (
                      <item.icon
                        size={16}
                        aria-hidden="true"
                        className="text-muted-foreground/60"
                      />
                    )}

                    {/* <span className={isActive ? `text-sidebar-accent-foreground` : ""}> */}
                    {/*   {t(item.title)} */}
                    {/* </span> */}
                  </>
                )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
});

const SideBarPluginsLinks = memo(({ isPluginNavOpen, setIsPluginNavOpen }: { isPluginNavOpen: boolean, setIsPluginNavOpen: (open: boolean) => void }) => {
  const plugins = usePluginStore(useShallow((state) => state.pluginConfigs.filter((config) => config.enabled)));

  if (plugins.length === 0) {
    return null;
  }

  const togglePluginNav = () => {
    setIsPluginNavOpen(!isPluginNavOpen);
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent className="px-0">
        <SidebarMenu className="items-center gap-3">
          <SidebarMenuItem className="w-full">
            <SidebarMenuButton
              onClick={togglePluginNav}
              tooltip="Plugins"
              className={cn(
                "duration-200 will-change-transform active:scale-95 active:translate-y-0.5 group/menu-button font-medium gap-3 h-9 rounded-md text-[#757575] hover:text-secondary-900/45 hover:bg-neutral-200/40 [&>svg]:size-full focus:outline-none",
                isPluginNavOpen && "bg-sidebar-accent shadow-sm"
              )}
            >
              {isPluginNavOpen ? (
                <RiPuzzleFill
                  size={16}
                  aria-hidden="true"
                  className="text-secondary-900/80 dark:text-secondary-50"
                />
              ) : (
                <RiPuzzleLine
                  size={16}
                  aria-hidden="true"
                  className="text-muted-foreground/60"
                />
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
});

const SideBarSyncStatusButton = memo(() => {
  const [syncState, setSyncState] = React.useState<SyncState>(syncService.getSyncState());
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = syncService.subscribe(setSyncState);
    return unsubscribe;
  }, []);

  const getStatusIcon = () => {
    if (!syncState.isOnline) {
      return <RiWifiOffLine size={16} aria-hidden="true" className="text-muted-foreground/60" />;
    }

    switch (syncState.status) {
      case "synced":
        return <RiCheckLine size={16} aria-hidden="true" className="text-green-500" />;
      case "syncing":
        return <RiRefreshLine size={16} aria-hidden="true" className="text-blue-500 animate-spin" />;
      case "error":
        return <RiErrorWarningLine size={16} aria-hidden="true" className="text-red-500" />;
      case "conflict":
        return <RiErrorWarningLine size={16} aria-hidden="true" className="text-yellow-500" />;
      default:
        return <RiWifiLine size={16} aria-hidden="true" className="text-muted-foreground/60" />;
    }
  };

  const getStatusText = () => {
    if (!syncState.isOnline) return "Offline";
    switch (syncState.status) {
      case "synced": return "Synced";
      case "syncing": return "Syncing...";
      case "error": return "Sync Error";
      case "conflict": return "Conflicts";
      default: return "Unknown";
    }
  };

  const handleManualSync = async () => {
    const result = await syncService.forceSync();
    if (result.isErr()) {
      console.error("Manual sync failed:", result.error);
    }
  };

  const conflicts = syncService.getConflicts();

  return (
    <SidebarGroup>
      <SidebarGroupContent className="px-0">
        <SidebarMenu className="items-center gap-3">
          <SidebarMenuItem className="w-full relative">
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <SidebarMenuButton
                  tooltip="Sync Status"
                  className="duration-200 will-change-transform active:scale-95 active:translate-y-0.5 group/menu-button font-medium gap-3 h-9 rounded-md text-[#757575] hover:text-secondary-900/45 hover:bg-neutral-200/40 [&>svg]:size-full focus:outline-none"
                >
                  {getStatusIcon()}
                </SidebarMenuButton>
              </PopoverTrigger>
              <PopoverContent side="right" align="end" className="w-80 p-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Sync Status</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {syncState.isOnline ? (
                          <RiWifiLine size={16} className="text-green-500" />
                        ) : (
                          <RiWifiOffLine size={16} className="text-gray-500" />
                        )}
                        <span className="text-sm">{syncState.isOnline ? "Online" : "Offline"}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {getStatusIcon()}
                        <span className="text-sm font-medium">{getStatusText()}</span>
                      </div>

                      {syncState.pendingOperations > 0 && (
                        <div className="flex items-center gap-2">
                          <RiTimeLine size={16} className="text-orange-500" />
                          <span className="text-sm">{syncState.pendingOperations} pending operations</span>
                        </div>
                      )}

                      {syncState.lastSyncAt && (
                        <div className="text-xs text-muted-foreground">
                          Last sync: {syncState.lastSyncAt.toLocaleString()}
                        </div>
                      )}

                      {syncState.error && (
                        <div className="rounded bg-red-50 dark:bg-red-950 p-2 text-xs text-red-600 dark:text-red-400">
                          {syncState.error}
                        </div>
                      )}

                      {conflicts.length > 0 && (
                        <div className="rounded bg-yellow-50 dark:bg-yellow-950 p-2 text-xs text-yellow-600 dark:text-yellow-400">
                          {conflicts.length} sync conflicts need resolution
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <Button
                      size="sm"
                      onClick={handleManualSync}
                      disabled={!syncState.isOnline || syncState.status === "syncing"}
                      className="w-full"
                    >
                      {syncState.status === "syncing" ? (
                        <>
                          <RiRefreshLine className="mr-2 h-4 w-4 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <RiRefreshLine className="mr-2 h-4 w-4" />
                          Sync Now
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            {syncState.pendingOperations > 0 && (
              <Badge
                variant="secondary"
                className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-[10px] font-semibold flex items-center justify-center rounded-full"
              >
                {syncState.pendingOperations > 10 ? "10+" : syncState.pendingOperations}
              </Badge>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
});

const SideBarNotificationsButton = memo(() => {
  const navigate = useNavigate();
  const { data: unreadNotifications } = useUnreadNotifications();
  const unreadCount = unreadNotifications?.length || 0;

  const handleClick = () => {
    navigate({ to: "/dashboard/notifications" });
  };

  return (
    <SidebarGroup >
      <SidebarGroupContent className="px-0">
        <SidebarMenu className="items-center gap-3">
          <SidebarMenuItem className="w-full relative">
            <SidebarMenuButton
              onClick={handleClick}
              tooltip="Notifications"
              className="duration-200 will-change-transform active:scale-95 active:translate-y-0.5 group/menu-button font-medium gap-3 h-9 rounded-md text-[#757575] hover:text-secondary-900/45 hover:bg-neutral-200/40 [&>svg]:size-full focus:outline-none"
            >
              <RiBellLine
                size={16}
                aria-hidden="true"
                className="text-muted-foreground/60"
              />
            </SidebarMenuButton>
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-[10px] font-semibold flex items-center justify-center rounded-full"
              >
                {unreadCount > 10 ? "10+" : unreadCount}
              </Badge>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
});

const SideBarHelpButton = memo(({ isHelpModalOpen, setIsHelpModalOpen }: { isHelpModalOpen: boolean, setIsHelpModalOpen: (open: boolean) => void }) => {

  const shortcuts = [
    { keys: "g + d", description: "Navigate to Dashboard" },
    { keys: "g + c", description: "Navigate to Accounts" },
    { keys: "g + t", description: "Navigate to Transactions" },
    { keys: "g + a", description: "Navigate to Analytics" },
    { keys: "g + s", description: "Navigate to Settings" },
    { keys: "Ctrl + B", description: "Toggle AI Chat" },
    { keys: "?", description: "Show keyboard shortcuts" },
    { keys: "Escape", description: "Focus main content" },
  ];

  return (
    <SidebarGroup >
      <SidebarGroupContent className="px-0">
        <SidebarMenu className="items-center gap-3">
          <SidebarMenuItem className="w-full">
            <Dialog open={isHelpModalOpen} onOpenChange={setIsHelpModalOpen}>
              <DialogTrigger asChild>
                <SidebarMenuButton
                  tooltip="Help & Shortcuts"
                  className={cn(
                    "duration-200 will-change-transform active:scale-95 active:translate-y-0.5 group/menu-button font-medium gap-3 h-9 rounded-md text-[#757575] hover:text-secondary-900/45 hover:bg-neutral-200/40 [&>svg]:size-full focus:outline-none",
                    isHelpModalOpen && "bg-sidebar-accent shadow-sm"
                  )}
                >
                  {isHelpModalOpen ? (
                    <RiQuestionFill
                      size={16}
                      aria-hidden="true"
                      className="text-secondary-900/80 dark:text-secondary-50"
                    />
                  ) : (
                    <RiQuestionLine
                      size={16}
                      aria-hidden="true"
                      className="text-muted-foreground/60"
                    />
                  )}
                </SidebarMenuButton>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Keyboard Shortcuts</DialogTitle>
                  <DialogDescription>Quick navigation shortcuts to help you move around faster</DialogDescription>
                </DialogHeader>
                <div className="space-y-2 mt-4">
                  {shortcuts.map((shortcut, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                      <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded">{shortcut.keys}</kbd>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
});

const SecondarySidebar = memo(({ isOpen }: { isOpen: boolean }) => {
  const plugins = usePluginStore(useShallow((state) => state.pluginConfigs.filter((config) => config.enabled)));

  if (!isOpen || plugins.length === 0) {
    return null;
  }

  return (
    <Sidebar collapsible="none" className="hidden flex-1 md:flex border-r">
      <SidebarHeader className="gap-3.5 border-b p-4">
        <div className="flex w-full items-center justify-between">
          <div className="text-foreground text-base font-medium">
            Plugins
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="px-0">
          <SidebarGroupContent>
            {plugins.map((plugin) => {
              return plugin.routeConfigs.map((route) => {
                return (
                  <div key={route.label} className="border-b last:border-b-0">
                    <Link
                      to={"/dashboard/$"}
                      params={{
                        _splat: route.path,
                      }}
                      className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-3 p-4 font-medium"
                      activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
                    >
                      {renderIcon(route.iconName, {
                        size: 16,
                        className: "text-muted-foreground/60",
                      })}
                      <span>{route.label}</span>
                    </Link>
                    {route?.subroutes && route.subroutes.length > 0 && (
                      <div className="flex flex-col bg-muted/20">
                        {route.subroutes.map((subroute) => (
                          <Link
                            key={subroute.label}
                            to={"/dashboard/$"}
                            params={{
                              _splat: subroute.path,
                            }}
                            className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-2 border-t p-4 pl-12 text-sm"
                            activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground font-medium" }}
                          >
                            <span>{subroute.label}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              });
            })}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
});
