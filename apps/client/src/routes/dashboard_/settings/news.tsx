import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { Skeleton } from "@/core/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { useGitHubReleasesQuery } from "@/features/preferences/services/releases.queries";
import { H3, P, Small } from "@/core/components/ui/typography";

export const Route = createFileRoute("/dashboard_/settings/news")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: updates, isLoading, error } = useGitHubReleasesQuery();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>What's New</CardTitle>
            <CardDescription>Latest updates and improvements to the platform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>What's New</CardTitle>
            <CardDescription>Latest updates and improvements to the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 rounded-md bg-orange-50 p-4 text-orange-600">
              <AlertCircle className="h-4 w-4" />
              <Small>Unable to fetch latest release notes. Please check your connection or try again later.</Small>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>What's New</CardTitle>
          <CardDescription>
            Latest updates and improvements from the{" "}
            <a href="https://github.com/Fantasy-programming/nuts/releases" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Fantasy-programming/nuts
            </a>{" "}
            repository
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {updates && updates.length > 0 ? (
            updates.map((update, index) => (
              <div
                key={`${update.version}-${index}`}
                className="before:bg-muted relative pb-6 pl-4 before:absolute before:top-2 before:left-0 before:h-[calc(100%-12px)] before:w-[2px] last:pb-0 last:before:hidden"
              >
                <div className="bg-primary absolute top-2 left-0 h-2 w-2 -translate-x-[3px] rounded-full" />
                <div className="flex items-center gap-2">
                  <Small className="font-semibold">v{update.version}</Small>
                  <Small variant="muted">{update.date}</Small>
                  <Badge variant={update.type === "feature" ? "default" : update.type === "improvement" ? "secondary" : "destructive"}>{update.type}</Badge>
                </div>
                <H3 className="mt-2 font-medium">{update.title}</H3>
                <Small variant="muted" className="mt-1">
                  {update.description}
                </Small>
              </div>
            ))
          ) : (
            <div className="py-8 text-center">
              <P variant="muted">No release information available at this time.</P>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
