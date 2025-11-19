export interface ThumbnailOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
}

export async function generateThumbnail(
  file: File,
  options: ThumbnailOptions
): Promise<Blob | null> {
  if (!file.type.startsWith("image/")) {
    return null;
  }

  if (file.type === "image/svg+xml") {
    return null;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      try {
        URL.revokeObjectURL(objectUrl);

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          resolve(null);
          return;
        }

        let { width, height } = img;
        const aspectRatio = width / height;

        if (width > options.maxWidth) {
          width = options.maxWidth;
          height = width / aspectRatio;
        }

        if (height > options.maxHeight) {
          height = options.maxHeight;
          width = height * aspectRatio;
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            resolve(blob);
          },
          "image/jpeg",
          options.quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image for thumbnail generation"));
    };

    img.src = objectUrl;
  });
}

export function shouldGenerateThumbnail(mimeType: string): boolean {
  return (
    mimeType.startsWith("image/") &&
    mimeType !== "image/svg+xml" &&
    mimeType !== "image/gif"
  );
}
