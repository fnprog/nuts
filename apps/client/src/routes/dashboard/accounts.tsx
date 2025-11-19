import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import { DraggableAccountGroups } from "@/features/accounts/components/account";
import { AccountsLoading } from "@/features/accounts/components/account.loading";
import { AddAccountModal } from "@/features/accounts/components/account.create-modal";
import { NetWorthCard } from "@/features/accounts/components/account.net-worth";
import { SummaryCard } from "@/features/accounts/components/account.summary-card";
import { Button } from "@/core/components/ui/button";
import { H1, P, Small } from "@/core/components/ui/typography";
import { LayoutDashboard, Plus } from "lucide-react";
import { groupAccountsByType } from "@/features/accounts/components/account.utils";
import { SidebarTrigger } from "@/core/components/ui/sidebar";
import { getAllAccountsWithTrends } from "@/features/accounts/services/account.queries";
import { EmptyStateGuide } from "@/core/components/ui/emtpy-state-guide";
import { ErrorBoundary } from "@/core/components/ui/error-boundary";
import { useCreateAccount, useUpdateAccount, useDeleteAccount } from "@/features/accounts/services/account.mutations";

export const Route = createFileRoute("/dashboard/accounts")({
  component: RouteComponent,
  pendingComponent: AccountsLoading,
  loader: ({ context }) => {
    const queryClient = context.queryClient;

    if (!queryClient.getQueryData(["accounts", "trends"])) {
      queryClient.prefetchQuery(getAllAccountsWithTrends());
    }
  },
});

const DUMMY_ACCOUNTS = [
  {
    id: "dummy-1",
    name: "Chase Checking",
    type: "checking" as const,
    balance: 12500.50,
    created_at: new Date("2024-01-15"),
    updated_at: new Date(),
    user_id: "dummy",
    currency: "USD",
    meta: { institution_name: "Chase" },
    trend_data: [
      { date: new Date("2024-01-01"), balance: 10000 },
      { date: new Date("2024-02-01"), balance: 10500 },
      { date: new Date("2024-03-01"), balance: 11000 },
      { date: new Date("2024-04-01"), balance: 11500 },
      { date: new Date("2024-05-01"), balance: 12000 },
      { date: new Date("2024-06-01"), balance: 12500.50 },
    ],
  },
  {
    id: "dummy-2",
    name: "Savings Account",
    type: "savings" as const,
    balance: 35000.00,
    created_at: new Date("2024-01-10"),
    updated_at: new Date(),
    user_id: "dummy",
    currency: "USD",
    meta: {},
    trend_data: [
      { date: new Date("2024-01-01"), balance: 30000 },
      { date: new Date("2024-02-01"), balance: 31000 },
      { date: new Date("2024-03-01"), balance: 32000 },
      { date: new Date("2024-04-01"), balance: 33000 },
      { date: new Date("2024-05-01"), balance: 34000 },
      { date: new Date("2024-06-01"), balance: 35000 },
    ],
  },
  {
    id: "dummy-3",
    name: "Credit Card",
    type: "credit" as const,
    balance: 4849.50,
    created_at: new Date("2024-02-01"),
    updated_at: new Date(),
    user_id: "dummy",
    currency: "USD",
    meta: { institution_name: "American Express" },
    trend_data: [
      { date: new Date("2024-02-01"), balance: 5000 },
      { date: new Date("2024-03-01"), balance: 5200 },
      { date: new Date("2024-04-01"), balance: 4900 },
      { date: new Date("2024-05-01"), balance: 5100 },
      { date: new Date("2024-06-01"), balance: 4849.50 },
    ],
  },
];

function RouteComponent() {
  const queryClient = useQueryClient();

  const { hasAccounts } = useRouteContext({ from: "/dashboard" });
  const { data: realData } = useSuspenseQuery({
    ...getAllAccountsWithTrends(),
    enabled: hasAccounts === true,
  });

  const data = hasAccounts ? realData : DUMMY_ACCOUNTS;
  const cashTotal = data.reduce((sum, account) => sum + account.balance, 0);
  const grouppedAccounts = groupAccountsByType(data);

  const onCloseModal = () => {
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
  };

  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();

  const onCreate = (values: any) => {
    createAccount.mutate(values);
  };

  const onUpdate = (id: string, values: any) => {
    updateAccount.mutate({ id, account: values });
  };

  const onDelete = (id: string) => {
    deleteAccount.mutate(id);
  };

  return (
    <>
      {!hasAccounts && (
        <EmptyStateGuide Icon={LayoutDashboard} title="Here you can view account details" description="Add an account with the button below to get started">
          <AddAccountModal onAddAccount={onCreate} onClose={onCloseModal}>
            <Button className="mt-4 hidden md:inline-flex">Add Account</Button>
          </AddAccountModal>
        </EmptyStateGuide>
      )}
      <div className="border-b-bg-nuts-500/20 -mx-4 flex items-center gap-2 border-b px-3 py-1 md:hidden">
        <SidebarTrigger />
        <Small className="font-semibold tracking-tight">Accounts</Small>
      </div>
      <header className="hidden h-22 shrink-0 items-center gap-2 transition-[width,height] ease-linear md:flex">
        <div className="flex w-full items-center justify-between gap-2">
          <div>
            <H1 className="hidden md:block">Accounts</H1>
            <P className="mt-1 text-[#757575]">Manage your financial accounts and track your balances</P>
          </div>
          <AddAccountModal onAddAccount={onCreate} onClose={onCloseModal}>
            <Button className="hidden md:inline-flex">
              <Plus className="mr-1 h-4 w-4" />
              New
            </Button>
          </AddAccountModal>
        </div>
      </header>
      <div className="flex flex-1">
        <div className="h-full w-full space-y-8  py-2">
          <ErrorBoundary>
            <NetWorthCard cashTotal={cashTotal} hasAccounts={hasAccounts} />
          </ErrorBoundary>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ErrorBoundary>
                <DraggableAccountGroups
                  initialAccounts={grouppedAccounts}
                  period={"1 month change"}
                  onEdit={onUpdate}
                  onDelete={onDelete}
                />
              </ErrorBoundary>
            </div>
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <ErrorBoundary>
                  <SummaryCard accounts={data} />
                </ErrorBoundary>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile FAB */}
      <div className="fixed right-6 bottom-6 z-50 sm:hidden">
        <AddAccountModal onAddAccount={onCreate}>
          <Button size="icon" className="h-14 w-14 rounded-full shadow-lg">
            <Plus className="size-6" />
          </Button>
        </AddAccountModal>
      </div>
    </>
  );
}
