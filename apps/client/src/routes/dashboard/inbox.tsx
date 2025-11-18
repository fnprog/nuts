import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card";
import { H2, P } from "@/core/components/ui/typography";
import { Inbox } from "lucide-react";

export const Route = createFileRoute("/dashboard/inbox")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="space-y-6">
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear">
        <div className="flex w-full items-center justify-between gap-2">
          <H2>Inbox</H2>
        </div>
      </header>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Inbox className="h-6 w-6" />
            <CardTitle>Transactions to Process</CardTitle>
          </div>
          <CardDescription>Review and categorize pending transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12">
            <Inbox className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <P variant="muted">No pending transactions to process</P>
            <P variant="muted" className="text-sm">
              Transactions that need categorization will appear here
            </P>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
