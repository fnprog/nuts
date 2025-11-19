import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { type } from "@nuts/validation";
import { RecordsTable } from "@/features/transactions/components/records-table";
import { CalendarView } from "@/features/transactions/components/calendar-view";
import { Spinner } from "@/core/components/ui/spinner";
import { Button } from "@/core/components/ui/button";
import { useState, Suspense } from "react";
import { H2, Small } from "@/core/components/ui/typography";

import { RecordsDialog } from "@/features/transactions/components/add-records-dialog";
import { NeuralRecordsDialog } from "@/features/transactions/components/neural-records-dialog";
import { RulesDialog } from "@/features/transactions/components/rules-dialog";
import { LayoutDashboard, Plus, Sparkles, List, Calendar, BarChart3, ChevronDown, Settings } from "lucide-react";
import { SidebarTrigger } from "@/core/components/ui/sidebar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/core/components/ui/dropdown-menu";
import { ErrorBoundary } from "@/core/components/ui/error-boundary";
import { TableLoader } from "@/core/components/ui/loading";
import { EmptyStateGuide } from "@/core/components/ui/emtpy-state-guide";
import { transactionService } from "@/features/transactions/services/transaction.service";
import { categoryService } from "@/features/categories/services/category.service";
import { accountService } from "@/features/accounts/services/account";

const transactionFilterSchema = type({
  page: "number",
});

export type TransactionSearch = typeof transactionFilterSchema.infer;

export const Route = createFileRoute("/dashboard/records")({
  component: RouteComponent,
  pendingComponent: Spinner,
  validateSearch: (search: Record<string, unknown>) => {
    const result = transactionFilterSchema(search);
    if (result instanceof type.errors) {
      return { page: 1 };
    }
    return result;
  },
  loader: ({ context }) => {
    const queryClient = context.queryClient;
    const defaultParams = { page: 1, q: "", group_by: "date" };

    queryClient.prefetchQuery({
      queryKey: ["transactions", defaultParams],
      queryFn: async () => {
        const result = await transactionService.getTransactions(defaultParams);
        if (result.isErr()) throw result.error;
        return result.value;
      },
    });

    queryClient.prefetchQuery({
      queryKey: ["categories"],
      queryFn: async () => {
        const result = await categoryService.getCategories();
        if (result.isErr()) throw result.error;
        return result.value;
      },
    });

    queryClient.prefetchQuery({
      queryKey: ["accounts"],
      queryFn: async () => {
        const result = await accountService.getAccounts();
        if (result.isErr()) throw result.error;
        return result.value;
      },
    });
  },
  errorComponent: ({ error }) => <div>Error loading transactions: {error.message}</div>,
});

function RouteComponent() {
  const { page } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { hasAccounts } = useRouteContext({ from: "/dashboard" });
  const [currentView, setCurrentView] = useState<"list" | "calendar" | "analytics">("list");

  const updatePage = (newPage: number) => {
    navigate({ search: { page: newPage }, replace: true });
  };

  const ViewSwitcher = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          {currentView === "list" && <List className="h-4 w-4" />}
          {currentView === "calendar" && <Calendar className="h-4 w-4" />}
          {currentView === "analytics" && <BarChart3 className="h-4 w-4" />}
          {currentView === "list" && "List"}
          {currentView === "calendar" && "Calendar"}
          {currentView === "analytics" && "Analytics"}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => setCurrentView("list")}>
          <List className="h-4 w-4 mr-2" />
          List
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setCurrentView("calendar")}>
          <Calendar className="h-4 w-4 mr-2" />
          Calendar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setCurrentView("analytics")}>
          <BarChart3 className="h-4 w-4 mr-2" />
          Analytics
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case "list":
        return (
          <ErrorBoundary>
            <Suspense fallback={<TableLoader />}>
              <RecordsTable
                initialPage={page}
                onPageChange={updatePage}
                hasAccounts={hasAccounts}
              />
            </Suspense>
          </ErrorBoundary>
        );
      case "calendar":
        return (
          <ErrorBoundary>
            <CalendarView
              initialPage={page}
              hasAccounts={hasAccounts}
            />
          </ErrorBoundary>
        );
      case "analytics":
        return (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Analytics view coming soon...
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {!hasAccounts && (
        <EmptyStateGuide
          Icon={LayoutDashboard}
          title="See your Transactions"
          description="Connect your first financial account to track your net worth, spending, and investments all in one place."
          ctaText="Add your first account"
          ctaTarget="/dashboard/accounts"
          ctaSearch={{ openModal: true }}
        />
      )}
      <div className="border-b-bg-nuts-500/20 -mx-4 flex items-center gap-2 border-b px-3 py-1 md:hidden">
        <SidebarTrigger />
        <Small className="font-semibold tracking-tight">Transactions</Small>
      </div>
      <header className="hidden h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear md:flex">
        <div className="flex w-full items-center justify-between gap-2">
          <H2 className="text-2xl">Transactions</H2>
          <div className="flex items-center gap-2">
            <RulesDialog>
              <Button variant="outline" className="hidden items-center gap-2 sm:flex">
                <Settings className="size-4" />
                <span>Rules</span>
              </Button>
            </RulesDialog>
            <ViewSwitcher />
            <RecordsDialog>
              <Button className="hidden items-center gap-2 sm:flex">
                <Plus className="size-4" />
                <span>New</span>
              </Button>
            </RecordsDialog>
            <NeuralRecordsDialog>
              <Button className="hidden items-center gap-2 sm:flex">
                <Sparkles className="size-4" />
                <span>Neural Input</span>
              </Button>
            </NeuralRecordsDialog>
          </div >
        </div >
      </header >

      <div className="flex flex-1">
        <div className="h-full w-full space-y-8 py-2">
          <div className="space-y-8">
            {renderCurrentView()}
          </div>
        </div>
      </div>

      <div className="fixed right-6 bottom-6 z-50 sm:hidden">
        <RecordsDialog>
          <Button size="icon" className="h-14 w-14 rounded-full shadow-lg">
            <Plus className="size-6" />
          </Button>
        </RecordsDialog>
      </div>
    </>
  );
}
