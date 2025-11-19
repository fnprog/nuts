import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { H2, P } from "@/core/components/ui/typography";
import {
  RiFolderLine,
  RiFolderFill,
  RiFileLine,
  RiUploadCloudLine,
  RiAddLine,
  RiSearchLine,
  RiGridLine,
  RiListCheck,
  RiArrowLeftLine,
  RiMoreLine,
  RiDeleteBinLine,
  RiEditLine,
  RiFolderTransferLine,
} from "@remixicon/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { FileUploadDialog } from "@/features/files/components/file-upload-dialog";
import { CreateFolderDialog } from "@/features/files/components/create-folder-dialog";
import { FilePreviewDialog } from "@/features/files/components/file-preview-dialog";
import { RenameDialog } from "@/features/files/components/rename-dialog";
import { DeleteConfirmDialog } from "@/features/files/components/delete-confirm-dialog";

export const Route = createFileRoute("/dashboard/files")({
  component: RouteComponent,
});

type ViewMode = "grid" | "list";

interface FileSystemItem {
  id: string;
  name: string;
  type: "file" | "folder";
  size?: number;
  mimeType?: string;
  createdAt: string;
  updatedAt: string;
}

function RouteComponent() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [items, setItems] = useState<FileSystemItem[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileSystemItem | null>(null);
  const [renameItem, setRenameItem] = useState<FileSystemItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<FileSystemItem | null>(null);

  const handleNavigateToFolder = (folderName: string) => {
    setCurrentPath([...currentPath, folderName]);
  };

  const handleNavigateBack = () => {
    if (currentPath.length > 0) {
      setCurrentPath(currentPath.slice(0, -1));
    }
  };

  const handleCreateFolder = () => {
    setCreateFolderDialogOpen(true);
  };

  const handleUploadFiles = () => {
    setUploadDialogOpen(true);
  };

  const handleFolderCreated = (folderName: string) => {
    const newFolder: FileSystemItem = {
      id: crypto.randomUUID(),
      name: folderName,
      type: "folder",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setItems([...items, newFolder]);
  };

  const handleFilesUploaded = (fileIds: string[]) => {
    console.log("Files uploaded:", fileIds);
  };

  const handleRename = (item: FileSystemItem, newName: string) => {
    setItems(items.map((i) => (i.id === item.id ? { ...i, name: newName, updatedAt: new Date().toISOString() } : i)));
  };

  const handleDelete = (item: FileSystemItem) => {
    setItems(items.filter((i) => i.id !== item.id));
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear">
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <H2>Files</H2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCreateFolder}>
              <RiAddLine className="h-4 w-4 mr-1" />
              New Folder
            </Button>
            <Button size="sm" onClick={handleUploadFiles}>
              <RiUploadCloudLine className="h-4 w-4 mr-1" />
              Upload
            </Button>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RiFolderFill className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>File Manager</CardTitle>
                <CardDescription>Store and organize your files locally</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon-sm"
                onClick={() => setViewMode("grid")}
              >
                <RiGridLine className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon-sm"
                onClick={() => setViewMode("list")}
              >
                <RiListCheck className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {currentPath.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleNavigateBack}>
                <RiArrowLeftLine className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            <div className="flex-1 relative">
              <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files and folders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {currentPath.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RiFolderLine className="h-4 w-4" />
              <span>/</span>
              {currentPath.map((folder, index) => (
                <span key={index}>
                  {folder}
                  {index < currentPath.length - 1 && " / "}
                </span>
              ))}
            </div>
          )}

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <RiFolderLine className="h-20 w-20 text-muted-foreground/30 mb-4" />
              <P variant="muted" className="mb-2">
                No files or folders yet
              </P>
              <P variant="muted" className="text-sm mb-6">
                Upload files or create folders to get started
              </P>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCreateFolder}>
                  <RiAddLine className="h-4 w-4 mr-1" />
                  Create Folder
                </Button>
                <Button onClick={handleUploadFiles}>
                  <RiUploadCloudLine className="h-4 w-4 mr-1" />
                  Upload Files
                </Button>
              </div>
            </div>
          ) : (
            <div
              className={cn(
                viewMode === "grid"
                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                  : "space-y-2"
              )}
            >
              {items.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "group relative rounded-lg border p-4 hover:bg-accent cursor-pointer transition-colors",
                    viewMode === "list" && "flex items-center justify-between"
                  )}
                  onClick={() => {
                    if (item.type === "folder") {
                      handleNavigateToFolder(item.name);
                    } else {
                      setPreviewFile(item);
                    }
                  }}
                >
                  <div className={cn("flex items-center gap-3", viewMode === "grid" && "flex-col")}>
                    {item.type === "folder" ? (
                      <RiFolderFill className="h-8 w-8 text-primary" />
                    ) : (
                      <RiFileLine className="h-8 w-8 text-muted-foreground" />
                    )}
                    <div className={cn("flex-1", viewMode === "grid" && "text-center")}>
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      {viewMode === "list" && (
                        <p className="text-xs text-muted-foreground">
                          {item.type === "folder" ? "Folder" : formatBytes(item.size || 0)} •{" "}
                          {formatDate(item.updatedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className={cn(
                          "absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity",
                          viewMode === "list" && "relative top-0 right-0 opacity-100"
                        )}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <RiMoreLine className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenameItem(item);
                        }}
                      >
                        <RiEditLine className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteItem(item);
                        }}
                      >
                        <RiDeleteBinLine className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <FileUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onFilesUploaded={handleFilesUploaded}
      />

      <CreateFolderDialog
        open={createFolderDialogOpen}
        onOpenChange={setCreateFolderDialogOpen}
        onFolderCreated={handleFolderCreated}
      />

      <FilePreviewDialog
        open={previewFile !== null}
        onOpenChange={(open) => !open && setPreviewFile(null)}
        file={
          previewFile && previewFile.type === "file"
            ? {
                id: previewFile.id,
                name: previewFile.name,
                mimeType: previewFile.mimeType || "application/octet-stream",
                size: previewFile.size || 0,
                createdAt: previewFile.createdAt,
              }
            : null
        }
      />

      <RenameDialog
        open={renameItem !== null}
        onOpenChange={(open) => !open && setRenameItem(null)}
        onRename={(newName) => renameItem && handleRename(renameItem, newName)}
        currentName={renameItem?.name || ""}
        itemType={renameItem?.type || "file"}
      />

      <DeleteConfirmDialog
        open={deleteItem !== null}
        onOpenChange={(open) => !open && setDeleteItem(null)}
        onConfirm={() => deleteItem && handleDelete(deleteItem)}
        itemName={deleteItem?.name || ""}
        itemType={deleteItem?.type || "file"}
      />
    </div>
  );
}
