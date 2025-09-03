// Free background removal service using public APIs
export interface FreeBgRemovalResult {
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
 * Remove background using free API service
 */
export async function removeBackgroundWithFreeAPI(
  imageInput: File | string
): Promise<FreeBgRemovalResult> {
  try {
    let imageData: string;

    if (imageInput instanceof File) {
      // Validate file type
      if (!imageInput.type.startsWith('image/')) {
        throw new Error('نوع الملف غير مدعوم. يرجى اختيار ملف صورة صالح.');
      }
      
      // Check file size (max 5MB for free service)
      if (imageInput.size > 5 * 1024 * 1024) {
        throw new Error('حجم الملف كبير جداً. الحد الأقصى المسموح هو 5 ميجابايت.');
      }
      
      imageData = await fileToBase64(imageInput);
    } else {
      imageData = await imageUrlToBase64(imageInput);
    }

    // Use Canvas-based background removal directly (free and reliable)
    console.log('Using Canvas-based background removal...');
    return await removeBackgroundWithCanvas(imageInput);

  } catch (error) {
    console.error('Free Background Removal Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
    };
  }
}

/**
 * Canvas-based background removal as fallback
 */
async function removeBackgroundWithCanvas(imageInput: File | string): Promise<FreeBgRemovalResult> {
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

    // Enhanced background detection using corners and edges
    const cornerSize = Math.min(30, Math.floor(Math.min(width, height) * 0.15));
    const corners = [
      // Top-left corner
      ...Array.from({ length: cornerSize }, (_, i) => 
        Array.from({ length: cornerSize }, (_, j) => (j * width + i) * 4)
      ).flat(),
      // Top-right corner
      ...Array.from({ length: cornerSize }, (_, i) => 
        Array.from({ length: cornerSize }, (_, j) => (j * width + (width - 1 - i)) * 4)
      ).flat(),
      // Bottom-left corner
      ...Array.from({ length: cornerSize }, (_, i) => 
        Array.from({ length: cornerSize }, (_, j) => ((height - 1 - j) * width + i) * 4)
      ).flat(),
      // Bottom-right corner
      ...Array.from({ length: cornerSize }, (_, i) => 
        Array.from({ length: cornerSize }, (_, j) => ((height - 1 - j) * width + (width - 1 - i)) * 4)
      ).flat(),
      // Top edge
      ...Array.from({ length: width }, (_, i) => i * 4),
      // Bottom edge
      ...Array.from({ length: width }, (_, i) => ((height - 1) * width + i) * 4),
      // Left edge
      ...Array.from({ length: height }, (_, j) => (j * width) * 4),
      // Right edge
      ...Array.from({ length: height }, (_, j) => (j * width + (width - 1)) * 4)
    ];

    // Calculate average background color
    let avgR = 0, avgG = 0, avgB = 0;
    for (const idx of corners) {
      avgR += data[idx];
      avgG += data[idx + 1];
      avgB += data[idx + 2];
    }
    avgR /= corners.length;
    avgG /= corners.length;
    avgB /= corners.length;

    // Calculate threshold with better algorithm
    let variance = 0;
    for (const idx of corners) {
      const r = data[idx] - avgR;
      const g = data[idx + 1] - avgG;
      const b = data[idx + 2] - avgB;
      variance += r * r + g * g + b * b;
    }
    const stdDev = Math.sqrt(variance / corners.length);
    const threshold = Math.max(20, Math.min(60, stdDev * 2.5)); // More intelligent threshold

    // Process pixels with improved algorithm
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const alpha = data[i + 3];

      // Skip already transparent pixels
      if (alpha === 0) continue;

      // Calculate color distance
      const distance = Math.sqrt(
        (r - avgR) ** 2 + (g - avgG) ** 2 + (b - avgB) ** 2
      );

      // Make transparent if close to background color
      if (distance < threshold) {
        data[i + 3] = 0; // Make transparent
      } else if (distance < threshold * 1.5) {
        // Partial transparency for smoother edges
        data[i + 3] = Math.floor(alpha * 0.3);
      }
    }

    // Put processed data back
    const imageData = new ImageData(data, width, height);
    ctx.putImageData(imageData, 0, 0);

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
