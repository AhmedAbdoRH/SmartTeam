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

    // Professional background detection using multiple sampling strategies
    const edgeSize = Math.min(50, Math.floor(Math.min(width, height) * 0.2));
    const centerSize = Math.min(20, Math.floor(Math.min(width, height) * 0.1));
    
    // Sample background pixels from multiple locations
    const backgroundSamples = [
      // Corners (most reliable for background)
      ...Array.from({ length: edgeSize }, (_, i) => 
        Array.from({ length: edgeSize }, (_, j) => (j * width + i) * 4)
      ).flat(),
      ...Array.from({ length: edgeSize }, (_, i) => 
        Array.from({ length: edgeSize }, (_, j) => (j * width + (width - 1 - i)) * 4)
      ).flat(),
      ...Array.from({ length: edgeSize }, (_, i) => 
        Array.from({ length: edgeSize }, (_, j) => ((height - 1 - j) * width + i) * 4)
      ).flat(),
      ...Array.from({ length: edgeSize }, (_, i) => 
        Array.from({ length: edgeSize }, (_, j) => ((height - 1 - j) * width + (width - 1 - i)) * 4)
      ).flat(),
      
      // Edges (for border detection)
      ...Array.from({ length: Math.floor(width * 0.1) }, (_, i) => i * 4),
      ...Array.from({ length: Math.floor(width * 0.1) }, (_, i) => ((height - 1) * width + i) * 4),
      ...Array.from({ length: Math.floor(height * 0.1) }, (_, j) => (j * width) * 4),
      ...Array.from({ length: Math.floor(height * 0.1) }, (_, j) => (j * width + (width - 1)) * 4),
      
      // Center area (to avoid subject)
      ...Array.from({ length: centerSize }, (_, i) => 
        Array.from({ length: centerSize }, (_, j) => {
          const centerX = Math.floor(width / 2) - Math.floor(centerSize / 2) + i;
          const centerY = Math.floor(height / 2) - Math.floor(centerSize / 2) + j;
          return (centerY * width + centerX) * 4;
        })
      ).flat()
    ];

    // Calculate weighted average background color (corners have higher weight)
    let totalWeight = 0;
    let weightedR = 0, weightedG = 0, weightedB = 0;
    
    // Weight corners more heavily (they're most likely to be background)
    const cornerWeight = 3;
    const edgeWeight = 2;
    const centerWeight = 1;
    
    for (let i = 0; i < backgroundSamples.length; i++) {
      const idx = backgroundSamples[i];
      let weight = centerWeight;
      
      // Determine weight based on position
      const x = (idx / 4) % width;
      const y = Math.floor((idx / 4) / width);
      
      if (x < edgeSize || x >= width - edgeSize || y < edgeSize || y >= height - edgeSize) {
        weight = cornerWeight;
      } else if (x < edgeSize * 2 || x >= width - edgeSize * 2 || y < edgeSize * 2 || y >= height - edgeSize * 2) {
        weight = edgeWeight;
      }
      
      weightedR += data[idx] * weight;
      weightedG += data[idx + 1] * weight;
      weightedB += data[idx + 2] * weight;
      totalWeight += weight;
    }
    
    const avgR = weightedR / totalWeight;
    const avgG = weightedG / totalWeight;
    const avgB = weightedB / totalWeight;

    // Calculate adaptive threshold based on color variance
    let variance = 0;
    let validSamples = 0;
    
    for (const idx of backgroundSamples) {
      const r = data[idx] - avgR;
      const g = data[idx + 1] - avgG;
      const b = data[idx + 2] - avgB;
      const distance = Math.sqrt(r * r + g * g + b * b);
      
      // Only include samples that are reasonably close to average
      if (distance < 50) {
        variance += distance * distance;
        validSamples++;
      }
    }
    
    const stdDev = validSamples > 0 ? Math.sqrt(variance / validSamples) : 20;
    
    // Adaptive threshold based on image characteristics
    const baseThreshold = Math.max(15, Math.min(80, stdDev * 2.2));
    const imageComplexity = Math.min(width, height) / 100; // Larger images can handle higher thresholds
    const threshold = baseThreshold * (1 + imageComplexity * 0.1);

    // Professional pixel processing with edge detection and feathering
    const processedData = new Uint8ClampedArray(data);
    
    // First pass: identify background pixels
    const backgroundMask = new Array(data.length / 4).fill(false);
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const alpha = data[i + 3];

      // Skip already transparent pixels
      if (alpha === 0) continue;

      // Calculate color distance using perceptual color difference
      const deltaR = r - avgR;
      const deltaG = g - avgG;
      const deltaB = b - avgB;
      
      // Use weighted color difference (more sensitive to green)
      const distance = Math.sqrt(
        deltaR * deltaR * 0.3 + 
        deltaG * deltaG * 0.59 + 
        deltaB * deltaB * 0.11
      );

      // Mark as background if close to background color
      if (distance < threshold) {
        backgroundMask[i / 4] = true;
      }
    }
    
    // Second pass: apply feathering and edge smoothing
    for (let i = 0; i < data.length; i += 4) {
      const pixelIndex = i / 4;
      const x = pixelIndex % width;
      const y = Math.floor(pixelIndex / width);
      
      if (backgroundMask[pixelIndex]) {
        // Check neighboring pixels for edge detection
        let edgeStrength = 0;
        let neighborCount = 0;
        
        // Check 8 surrounding pixels
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const neighborIndex = (ny * width + nx) * 4;
              const neighborPixelIndex = neighborIndex / 4;
              
              if (!backgroundMask[neighborPixelIndex]) {
                edgeStrength++;
              }
              neighborCount++;
            }
          }
        }
        
        // Apply feathering based on edge strength
        if (edgeStrength > 0) {
          const featherAmount = edgeStrength / neighborCount;
          processedData[i + 3] = Math.floor(255 * (1 - featherAmount * 0.8));
        } else {
          processedData[i + 3] = 0; // Full transparency
        }
      }
    }
    
    // Copy processed data back
    for (let i = 0; i < data.length; i++) {
      data[i] = processedData[i];
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
