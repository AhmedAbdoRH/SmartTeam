// Canvas-based background removal service
export interface CanvasBgRemovalResult {
  success: boolean;
  imageData?: string; // Base64 encoded image data
  error?: string;
}

/**
 * Convert file to base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Convert image URL to base64 string
 */
async function imageUrlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    throw new Error(`فشل في تحميل الصورة: ${error}`);
  }
}

/**
 * Remove background using Canvas API with improved algorithm
 */
export async function removeBackgroundWithCanvas(
  imageInput: File | string
): Promise<CanvasBgRemovalResult> {
  try {
    // Load image
    const img = new window.Image();
    const dataUrl: string = await new Promise((resolve, reject) => {
      if (imageInput instanceof File) {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageInput);
      } else {
        resolve(imageInput);
      }
    });

    await new Promise((resolve, reject) => {
      img.onload = () => resolve(null);
      img.onerror = reject;
      img.crossOrigin = 'anonymous';
      img.src = dataUrl;
    });

    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('تعذر إنشاء سياق الرسم');

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    // Get image data
    const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Improved background detection algorithm
    const cornerPixels = [
      // Top-left corner
      ...Array.from({ length: Math.min(10, Math.floor(width * 0.1)) }, (_, i) => 
        Array.from({ length: Math.min(10, Math.floor(height * 0.1)) }, (_, j) => 
          (j * width + i) * 4
        )
      ).flat(),
      // Top-right corner
      ...Array.from({ length: Math.min(10, Math.floor(width * 0.1)) }, (_, i) => 
        Array.from({ length: Math.min(10, Math.floor(height * 0.1)) }, (_, j) => 
          (j * width + (width - 1 - i)) * 4
        )
      ).flat(),
      // Bottom-left corner
      ...Array.from({ length: Math.min(10, Math.floor(width * 0.1)) }, (_, i) => 
        Array.from({ length: Math.min(10, Math.floor(height * 0.1)) }, (_, j) => 
          ((height - 1 - j) * width + i) * 4
        )
      ).flat(),
      // Bottom-right corner
      ...Array.from({ length: Math.min(10, Math.floor(width * 0.1)) }, (_, i) => 
        Array.from({ length: Math.min(10, Math.floor(height * 0.1)) }, (_, j) => 
          ((height - 1 - j) * width + (width - 1 - i)) * 4
        )
      ).flat()
    ];

    // Calculate average background color from corners
    let avgR = 0, avgG = 0, avgB = 0;
    for (const idx of cornerPixels) {
      avgR += data[idx];
      avgG += data[idx + 1];
      avgB += data[idx + 2];
    }
    avgR /= cornerPixels.length;
    avgG /= cornerPixels.length;
    avgB /= cornerPixels.length;

    // Calculate standard deviation for threshold
    let variance = 0;
    for (const idx of cornerPixels) {
      const r = data[idx] - avgR;
      const g = data[idx + 1] - avgG;
      const b = data[idx + 2] - avgB;
      variance += r * r + g * g + b * b;
    }
    const stdDev = Math.sqrt(variance / cornerPixels.length);
    const threshold = Math.max(30, stdDev * 2); // Dynamic threshold

    // Process pixels
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Calculate distance from background color
      const distance = Math.sqrt(
        (r - avgR) ** 2 + (g - avgG) ** 2 + (b - avgB) ** 2
      );

      // Make transparent if close to background
      if (distance < threshold) {
        data[i + 3] = 0; // Set alpha to 0 (transparent)
      }
    }

    // Put processed data back
    ctx.putImageData({ data, width, height }, 0, 0);

    // Convert to base64
    const processedDataUrl = canvas.toDataURL('image/png');
    const base64Data = processedDataUrl.split(',')[1];

    return {
      success: true,
      imageData: base64Data
    };

  } catch (error) {
    console.error('Canvas Background Removal Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
    };
  }
}

/**
 * Convert base64 string to File object
 */
export function base64ToFile(base64Data: string, mimeType: string = 'image/png', filename: string = 'processed_image.png'): File {
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });
  
  return new File([blob], filename, { type: mimeType });
}
