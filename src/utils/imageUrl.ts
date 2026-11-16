/** Presets de ancho para Supabase Image Transformations (`/render/image/public/...`). */
export type ImageSizePreset =
  | "thumb"
  | "list"
  | "card"
  | "deck"
  | "note"
  | "full";

const PRESET: Record<
  Exclude<ImageSizePreset, "full">,
  { width: number; quality: number }
> = {
  thumb: { width: 128, quality: 72 },
  list: { width: 360, quality: 75 },
  card: { width: 520, quality: 78 },
  deck: { width: 640, quality: 82 },
  note: { width: 960, quality: 76 },
};
let transformsUsable: boolean | null = null;
let transformFailCount = 0;
const TRANSFORM_FAIL_LIMIT = 3;

export function noteImageTransformFailure() {
  if (transformsUsable === false) return;
  transformFailCount += 1;
  if (transformFailCount >= TRANSFORM_FAIL_LIMIT) {
    transformsUsable = false;
  }
}

const SUPABASE_OBJECT_PATH = /^\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/;

/** No transformar blobs, data URLs ni assets empaquetados por Vite. */
function isTransformableUrl(url: string): boolean {
  if (!url) return false;
  if (
    url.startsWith("blob:") ||
    url.startsWith("data:") ||
    url.startsWith("/")
  ) {
    return false;
  }
  try {
    const { pathname } = new URL(url);
    return SUPABASE_OBJECT_PATH.test(pathname);
  } catch {
    return false;
  }
}

/**
 * Devuelve URL de imagen redimensionada en Supabase cuando aplica.
 * Si el proyecto no tiene transforms, el navegador sigue usando la URL original
 * al fallar — en la práctica conviene tener Image Transformations activas.
 */
export function optimizeImageUrl(
  url: string,
  preset: ImageSizePreset = "card",
): string {
  if (!url || preset === "full" || !isTransformableUrl(url)) return url;
  if (transformsUsable === false) return url;
  const { width, quality } = PRESET[preset];

  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(SUPABASE_OBJECT_PATH);
    if (!match) return url;

    const [, bucket, objectPath] = match;
    parsed.pathname = `/storage/v1/render/image/public/${bucket}/${objectPath}`;
    parsed.search = "";
    parsed.searchParams.set("width", String(width));
    parsed.searchParams.set("quality", String(quality));
    parsed.searchParams.set("resize", "contain");
    return parsed.toString();
  } catch {
    return url;
  }
}
