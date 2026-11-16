export type ImageCompressOptions = {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  mimeType?: "image/jpeg" | "image/webp";
};

export const IMAGE_COMPRESS_PRESETS = {
  avatar: {
    maxWidth: 512,
    maxHeight: 512,
    quality: 0.8,
    mimeType: "image/jpeg",
  },
  flashcard: {
    maxWidth: 900,
    maxHeight: 900,
    quality: 0.8,
    mimeType: "image/webp",
  },
  note: {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.8,
    mimeType: "image/jpeg",
  },
} as const satisfies Record<string, ImageCompressOptions>;

export type ImageCompressPreset = keyof typeof IMAGE_COMPRESS_PRESETS;

function fileBaseName(name: string): string {
  const base = name.replace(/\.[^.]+$/, "").trim();
  return base || "image";
}

/**
 * Redimensiona y comprime en el navegador (Canvas) antes de subir a Storage.
 * Intenta WebP y JPEG y se queda con el más liviano.
 * GIF animados se devuelven sin cambios.
 */
export async function compressImageFile(
  file: File,
  options: ImageCompressOptions,
): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.type === "image/gif") return file;

  const preferredMime = options.mimeType ?? "image/jpeg";

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  const scale = Math.min(
    1,
    options.maxWidth / bitmap.width,
    options.maxHeight / bitmap.height,
  );
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const toBlob = (mime: string, quality: number) =>
    new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, mime, quality);
    });

  const preferred = await toBlob(preferredMime, options.quality);
  const jpeg =
    preferredMime === "image/jpeg"
      ? preferred
      : await toBlob("image/jpeg", options.quality);

  const candidates = [preferred, jpeg].filter((b): b is Blob => !!b);
  if (candidates.length === 0) return file;

  const best = candidates.reduce((a, b) => (b.size < a.size ? b : a));
  const mimeType = best.type || "image/jpeg";
  const ext = mimeType === "image/webp" ? "webp" : "jpg";
  return new File([best], `${fileBaseName(file.name)}.${ext}`, {
    type: mimeType,
  });
}

export function dataUrlToFile(dataUrl: string, name = "note-image.jpg"): File {
  const [header, base64] = dataUrl.split(",");
  if (!base64) throw new Error("Data URL inválida");
  const mime = header?.match(/data:([^;]+)/)?.[1] ?? "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], name, { type: mime });
}
