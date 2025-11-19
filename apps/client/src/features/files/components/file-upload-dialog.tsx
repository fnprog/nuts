import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/core/components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/core/components/ui/dialog-sheet";
import { Card, CardContent } from "@/core/components/ui/card";
import { Progress } from "@/core/components/ui/progress";
import { RiUploadCloudLine, RiFileLine, RiCheckLine, RiCloseLine } from "@remixicon/react";
import { cn } from "@/lib/utils";

interface FileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFilesUploaded?: (fileIds: string[]) => void;
  folderId?: string | null;
}

interface UploadingFile {
  file: File;
  id: string;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

export function FileUploadDialog({ open, onOpenChange, onFilesUploaded, folderId = null }: FileUploadDialogProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadingFile[] = acceptedFiles.map((file) => ({
      file,
      id: crypto.randomUUID(),
      progress: 0,
      status: "pending",
    }));
    setUploadingFiles((prev) => [...prev, ...newFiles]);
    handleUpload(newFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: isUploading,
  });

  const handleUpload = async (files: UploadingFile[]) => {
    setIsUploading(true);
    const uploadedIds: string[] = [];

    for (const fileItem of files) {
      try {
        setUploadingFiles((prev) =>
          prev.map((f) => (f.id === fileItem.id ? { ...f, status: "uploading", progress: 0 } : f))
        );

        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise((resolve) => setTimeout(resolve, 50));
          setUploadingFiles((prev) =>
            prev.map((f) => (f.id === fileItem.id ? { ...f, progress } : f))
          );
        }

        setUploadingFiles((prev) =>
          prev.map((f) => (f.id === fileItem.id ? { ...f, status: "success", progress: 100 } : f))
        );
        uploadedIds.push(fileItem.id);
      } catch (error) {
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id
              ? { ...f, status: "error", error: error instanceof Error ? error.message : "Upload failed" }
              : f
          )
        );
      }
    }

    setIsUploading(false);
    if (onFilesUploaded && uploadedIds.length > 0) {
      onFilesUploaded(uploadedIds);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setUploadingFiles([]);
      onOpenChange(false);
    }
  };

  const handleRemoveFile = (id: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const allComplete = uploadingFiles.length > 0 && uploadingFiles.every((f) => f.status === "success" || f.status === "error");
  const hasErrors = uploadingFiles.some((f) => f.status === "error");

  return (
    <ResponsiveDialog open={open} onOpenChange={handleClose}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Upload Files</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        <div className="space-y-4">
          {uploadingFiles.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div
                  {...getRootProps()}
                  className={cn(
                    "cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors",
                    isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
                    isUploading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <input {...getInputProps()} />
                  <RiUploadCloudLine className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  {isDragActive ? (
                    <p className="text-lg">Drop your files here...</p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-lg">Drag & drop files here, or click to select</p>
                      <p className="text-sm text-muted-foreground">Any file type is supported</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {uploadingFiles.length > 0 && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {uploadingFiles.map((fileItem) => (
                <Card key={fileItem.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <RiFileLine className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{fileItem.file.name}</p>
                            <p className="text-xs text-muted-foreground">{formatBytes(fileItem.file.size)}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {fileItem.status === "success" && (
                              <RiCheckLine className="h-5 w-5 text-green-500" />
                            )}
                            {fileItem.status === "error" && (
                              <RiCloseLine className="h-5 w-5 text-destructive" />
                            )}
                            {fileItem.status === "pending" && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleRemoveFile(fileItem.id)}
                              >
                                <RiCloseLine className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        {(fileItem.status === "uploading" || fileItem.status === "success") && (
                          <Progress value={fileItem.progress} className="h-1" />
                        )}
                        {fileItem.status === "error" && fileItem.error && (
                          <p className="text-xs text-destructive">{fileItem.error}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!isUploading && uploadingFiles.length === 0 && (
            <div className="text-center py-2">
              <p className="text-sm text-muted-foreground">No files selected yet</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            {allComplete ? (
              <Button onClick={handleClose}>
                {hasErrors ? "Close" : "Done"}
              </Button>
            ) : uploadingFiles.length > 0 ? (
              <Button disabled variant="secondary">
                Uploading...
              </Button>
            ) : (
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
