const DEFAULT_IMAGE_ASPECT_RATIO = 3 / 4;

export function resolveImageAspectRatio(width: number | null | undefined, height: number | null | undefined, fallback = DEFAULT_IMAGE_ASPECT_RATIO): number {
    if (width == null || height == null || width <= 0 || height <= 0) {
        return fallback;
    }

    return width / height;
}
