import { createFileRoute } from "@tanstack/react-router";
import { RulesManagement } from "@/features/rules/components/rules-management";
import { H1, P } from "@/core/components/ui/typography";

export const Route = createFileRoute("/dashboard_/settings/rules")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <H1 className="font-bold text-gray-900">Transaction Rules</H1>
        <P className="mt-1 text-gray-600">Automatically categorize and organize your transactions based on custom rules</P>
      </div>
      <RulesManagement />
    </div>
  );
}
