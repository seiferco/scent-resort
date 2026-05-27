const MAX_DIMENSION = 2000;
const QUALITY = 0.8;
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB after compression

/**
 * Compress an image file by resizing (max 2000px) and re-encoding as JPEG at 80% quality.
 * If the file is already small enough and within dimension limits, returns it as-is.
 */
export async function compressImage(file: File): Promise<File> {
  // Skip non-image files
  if (!file.type.startsWith('image/')) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // If already small enough and within dimensions, skip compression
      if (file.size <= MAX_FILE_SIZE && img.width <= MAX_DIMENSION && img.height <= MAX_DIMENSION) {
        resolve(file);
        return;
      }

      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file); // Fallback to original
            return;
          }
          const compressed = new File([blob], file.name.replace(/\.\w+$/, '.jpg'), {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressed);
        },
        'image/jpeg',
        QUALITY,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // Fallback to original on error
    };

    img.src = url;
  });
}
