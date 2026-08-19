/**
 * Converts a base64 string to a buffer
 */
export function base64ToBuffer(base64: string): Buffer {
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
}

/**
 * Compresses an image using sharp
 */
export async function compressImage(
  base64: string,
  maxWidth: number = 1280,
  quality: number = 80
): Promise<string> {
  try {
    const sharp = (await import('sharp')).default;
    const buffer = base64ToBuffer(base64);
    
    const compressed = await sharp(buffer)
      .resize(maxWidth, null, { withoutEnlargement: true })
      .jpeg({ quality })
      .toBuffer();
    
    return compressed.toString('base64');
  } catch (error) {
    console.error('Error compressing image:', error);
    return base64;
  }
}

/**
 * Delays execution for a specified time
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Formats a timestamp for logging
 */
export function formatTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Truncates text to a maximum length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}
