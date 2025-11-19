import { useState } from "react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/core/components/ui/dialog-sheet";
import { Button } from "@/core/components/ui/button";
import {
  RiCloseLine,
  RiDownloadLine,
  RiFileLine,
  RiFileTextLine,
  RiImageLine,
  RiVideoLine,
  RiMusicLine,
  RiFileZipLine,
  RiFilePdfLine,
  RiFileWordLine,
  RiFileExcelLine,
  RiFilePptLine,
  RiFileCodeLine,
} from "@remixicon/react";
import { cn } from "@/lib/utils";

interface FilePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: {
    id: string;
    name: string;
    mimeType: string;
    size: number;
    createdAt: string;
    thumbnailPath?: string;
  } | null;
}

export function FilePreviewDialog({ open, onOpenChange, file }: FilePreviewDialogProps) {
  const [imageError, setImageError] = useState(false);

  if (!file) return null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return RiImageLine;
    if (mimeType.startsWith("video/")) return RiVideoLine;
    if (mimeType.startsWith("audio/")) return RiMusicLine;
    if (mimeType === "application/pdf") return RiFilePdfLine;
    if (mimeType.includes("word") || mimeType.includes("document")) return RiFileWordLine;
    if (mimeType.includes("sheet") || mimeType.includes("excel")) return RiFileExcelLine;
    if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return RiFilePptLine;
    if (mimeType.includes("zip") || mimeType.includes("compressed")) return RiFileZipLine;
    if (mimeType.startsWith("text/")) return RiFileTextLine;
    if (
      mimeType.includes("javascript") ||
      mimeType.includes("json") ||
      mimeType.includes("xml") ||
      mimeType.includes("html")
    )
      return RiFileCodeLine;
    return RiFileLine;
  };

  const isImage = file.mimeType.startsWith("image/");
  const isVideo = file.mimeType.startsWith("video/");
  const isAudio = file.mimeType.startsWith("audio/");
  const isText = file.mimeType.startsWith("text/");
  const isPDF = file.mimeType === "application/pdf";

  const FileIcon = getFileIcon(file.mimeType);

  const handleDownload = () => {
    console.log("Download file:", file.id);
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <ResponsiveDialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between gap-4">
            <ResponsiveDialogTitle className="flex items-center gap-3 flex-1 min-w-0">
              <FileIcon className="h-6 w-6 flex-shrink-0" />
              <span className="truncate">{file.name}</span>
            </ResponsiveDialogTitle>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <RiDownloadLine className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
          </div>
        </ResponsiveDialogHeader>

        <div className="flex-1 overflow-auto">
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-8 flex items-center justify-center min-h-[400px]">
              {isImage && !imageError ? (
                <img
                  src={file.thumbnailPath || `/api/files/${file.id}/preview`}
                  alt={file.name}
                  className="max-w-full max-h-[500px] object-contain rounded"
                  onError={() => setImageError(true)}
                />
              ) : isVideo ? (
                <video
                  src={`/api/files/${file.id}/preview`}
                  controls
                  className="max-w-full max-h-[500px] rounded"
                >
                  Your browser does not support the video tag.
                </video>
              ) : isAudio ? (
                <div className="w-full max-w-md">
                  <audio src={`/api/files/${file.id}/preview`} controls className="w-full">
                    Your browser does not support the audio tag.
                  </audio>
                </div>
              ) : isPDF ? (
                <iframe
                  src={`/api/files/${file.id}/preview`}
                  className="w-full h-[500px] rounded"
                  title={file.name}
                />
              ) : (
                <div className="text-center space-y-4">
                  <FileIcon className="h-24 w-24 mx-auto text-muted-foreground/50" />
                  <div>
                    <p className="text-lg font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">Preview not available</p>
                  </div>
                  <Button onClick={handleDownload}>
                    <RiDownloadLine className="h-4 w-4 mr-2" />
                    Download to view
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">File size</span>
                <span className="font-medium">{formatBytes(file.size)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium">{file.mimeType}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">{formatDate(file.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
