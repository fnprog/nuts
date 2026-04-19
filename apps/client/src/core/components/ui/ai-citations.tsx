import { ChevronDown, ExternalLink, FileText, Globe, Quote } from "lucide-react";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/core/components/ui/collapsible";
import { cn } from "@/lib/utils";

export interface CitationSource {
  id: string;
  title: string;
  url: string;
  domain?: string;
  snippet?: string;
  author?: string;
  publishedAt?: Date;
  type?: "web" | "document" | "paper" | "other";
}

export interface Citation {
  id: string;
  number: number;
  sources: CitationSource[];
  text?: string; // Optional text that was cited
}

export interface AICitationsProps {
  citations: Citation[];
  className?: string;
  defaultExpanded?: boolean;
  showInlineNumbers?: boolean; // Show citation numbers inline in text
  onSourceClick?: (source: CitationSource) => void;
}

const SOURCE_ICONS: Record<NonNullable<CitationSource["type"]>, React.ComponentType<{ className?: string }>> = {
  document: FileText,
  paper: FileText,
  web: Globe,
  other: Globe,
};

function formatDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function formatDate(date: Date): string {
  // Use consistent format to avoid hydration mismatches
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}

interface CitationNumberProps {
  number: number;
  onClick?: () => void;
  className?: string;
  asButton?: boolean; // When false, renders as span (for use inside buttons)
}

function CitationNumber({ number, onClick, className, asButton = true }: CitationNumberProps) {
  const baseClassName = cn(
    "inline-flex size-5 items-center justify-center rounded-full border bg-primary/10 font-mono font-semibold text-primary text-xs transition-colors",
    asButton && onClick && "cursor-pointer hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
    !asButton && "pointer-events-none",
    className
  );

  if (asButton && onClick) {
    return (
      <button aria-label={`Citation ${number}`} className={baseClassName} onClick={onClick} type="button">
        {number}
      </button>
    );
  }

  return (
    <span aria-label={`Citation ${number}`} className={baseClassName}>
      {number}
    </span>
  );
}

interface SourcePreviewProps {
  source: CitationSource;
  citationNumber: number;
  onSourceClick?: (source: CitationSource) => void;
}

function SourcePreview({ source, citationNumber, onSourceClick }: SourcePreviewProps) {
  const domain = source.domain || formatDomain(source.url);
  const IconComponent = SOURCE_ICONS[source.type || "other"] || SOURCE_ICONS.web;

  return (
    <div className="group bg-card hover:bg-accent flex flex-col gap-2 rounded-lg border p-4 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-lg">
            <IconComponent className="text-primary size-4" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-start gap-2">
              <h4 className="line-clamp-2 text-sm leading-snug font-medium">{source.title}</h4>
              <CitationNumber number={citationNumber} />
            </div>
            <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
              <span className="truncate">{domain}</span>
              {source.author && (
                <>
                  <span aria-hidden="true">•</span>
                  <span>{source.author}</span>
                </>
              )}
              {source.publishedAt && (
                <>
                  <span aria-hidden="true">•</span>
                  <time dateTime={source.publishedAt.toISOString()}>{formatDate(source.publishedAt)}</time>
                </>
              )}
            </div>
          </div>
        </div>
        <a
          aria-label={`Open ${source.title} in new tab`}
          className="bg-background text-muted-foreground hover:bg-accent hover:text-foreground focus:ring-ring flex size-8 shrink-0 items-center justify-center rounded-md border transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none"
          href={source.url}
          rel="noopener noreferrer"
          target="_blank"
        >
          <ExternalLink className="size-4" />
        </a>
      </div>
      {source.snippet && (
        <div className="flex gap-2 pl-11">
          <Quote className="text-muted-foreground size-3 shrink-0 translate-y-0.5" />
          <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">{source.snippet}</p>
        </div>
      )}
    </div>
  );
}

interface CitationItemProps {
  citation: Citation;
  onSourceClick?: (source: CitationSource) => void;
}

function CitationItem({ citation, onSourceClick }: CitationItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (citation.sources.length === 0) {
    return null;
  }

  const hasMultipleSources = citation.sources.length > 1;

  return (
    <Collapsible onOpenChange={setIsOpen} open={isOpen}>
      <div className="flex flex-col gap-2">
        {hasMultipleSources ? (
          <CollapsibleTrigger
            className="bg-card hover:bg-accent focus:ring-ring flex items-center justify-between rounded-lg border p-3 text-left transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none"
            type="button"
          >
            <div className="flex items-center gap-3">
              <CitationNumber asButton={false} number={citation.number} />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{citation.sources.length} sources</span>
                {citation.text && <span className="text-muted-foreground text-xs">{citation.text}</span>}
              </div>
            </div>
            <ChevronDown className={cn("text-muted-foreground size-4 shrink-0 transition-transform motion-safe:duration-200", isOpen && "rotate-180")} />
          </CollapsibleTrigger>
        ) : (
          <div className="bg-card flex items-center gap-3 rounded-lg border p-3">
            <CitationNumber number={citation.number} />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Source</span>
              {citation.text && <span className="text-muted-foreground text-xs">{citation.text}</span>}
            </div>
          </div>
        )}

        {hasMultipleSources ? (
          <CollapsibleContent className="overflow-hidden transition-all motion-safe:duration-200 motion-reduce:transition-none">
            <div className="flex flex-col gap-2 pt-2">
              {citation.sources.map((source) => (
                <SourcePreview citationNumber={citation.number} key={source.id} onSourceClick={onSourceClick} source={source} />
              ))}
            </div>
          </CollapsibleContent>
        ) : (
          <SourcePreview citationNumber={citation.number} onSourceClick={onSourceClick} source={citation.sources[0]} />
        )}
      </div>
    </Collapsible>
  );
}

interface InlineCitationProps {
  number: number;
  onClick?: () => void;
}

function InlineCitation({ number, onClick }: InlineCitationProps) {
  return <CitationNumber className="relative -top-0.5 mx-0.5" number={number} onClick={onClick} />;
}

export default function AICitations({ citations, className, defaultExpanded = false, showInlineNumbers = false, onSourceClick }: AICitationsProps) {
  if (!citations || citations.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex w-full flex-col gap-3", className)}>
      <div className="flex items-center gap-2">
        <div className="bg-primary/10 flex size-6 items-center justify-center rounded-lg">
          <Quote className="text-primary size-3.5" />
        </div>
        <h3 className="text-sm font-semibold">Sources & Citations</h3>
        <span className="text-muted-foreground text-xs">({citations.length})</span>
      </div>

      <div className="flex flex-col gap-3">
        {citations.map((citation) => (
          <CitationItem citation={citation} key={citation.id} onSourceClick={onSourceClick} />
        ))}
      </div>
    </div>
  );
}

// Export helper component for inline citations in text
export { InlineCitation, CitationNumber };
