// Google Gemini API service for background removal
const GEMINI_API_KEY = 'AIzaSyCZgsRU99B0qou_U7JggZG1sSy99AoNikw';
const GEMINI_API_URL = '/api/gemini/v1beta/models/gemini-1.5-flash:generateContent';

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text?: string;
        inlineData?: {
          mimeType: string;
          data: string;
        };
      }>;
    };
  }>;
}

export interface BackgroundRemovalResult {
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
      // Remove data:image/...;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
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
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    throw new Error(`فشل في تحميل الصورة: ${error}`);
  }
}

/**
 * Remove background from image using Google Gemini API
 */
export async function removeBackgroundWithGemini(
  imageInput: File | string,
  prompt: string = "Remove the background and make it transparent"
): Promise<BackgroundRemovalResult> {
  try {
    // Validate API key
    if (!validateApiKey(GEMINI_API_KEY)) {
      throw new Error('مفتاح API غير صالح. يرجى التحقق من المفتاح المقدم.');
    }

    // Convert image to base64
    let base64Image: string;
    let mimeType: string;

    if (imageInput instanceof File) {
      // Validate file type
      if (!imageInput.type.startsWith('image/')) {
        throw new Error('نوع الملف غير مدعوم. يرجى اختيار ملف صورة صالح.');
      }
      
      // Check file size (max 20MB for Gemini)
      if (imageInput.size > 20 * 1024 * 1024) {
        throw new Error('حجم الملف كبير جداً. الحد الأقصى المسموح هو 20 ميجابايت.');
      }
      
      base64Image = await fileToBase64(imageInput);
      mimeType = imageInput.type;
    } else {
      base64Image = await imageUrlToBase64(imageInput);
      mimeType = 'image/jpeg'; // Default, will be detected from URL
    }

    // Prepare the request payload according to Gemini API format
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt
            },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Image
              }
            }
          ]
        }
      ]
    };

    // Make API request
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API Error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data: GeminiResponse = await response.json();

    // Extract the processed image from response
    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          // Check for inline data (image response)
          if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
            return {
              success: true,
              imageData: part.inlineData.data
            };
          }
          // Check for text response that might contain base64 image
          if (part.text) {
            // Look for base64 image data in the text response
            const base64Match = part.text.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/);
            if (base64Match) {
              return {
                success: true,
                imageData: base64Match[1]
              };
            }
          }
        }
      }
    }

    // If no image found, log the response for debugging
    console.log('Gemini API Response:', JSON.stringify(data, null, 2));
    
    // For now, return the original image data as a fallback
    // This is a temporary solution until we implement proper image processing
    return {
      success: false,
      error: 'Google Gemini API لا يدعم إزالة الخلفية مباشرة. يرجى استخدام أداة أخرى لإزالة الخلفية.'
    };

  } catch (error) {
    console.error('Gemini API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
    };
  }
}

/**
 * Convert base64 image data to File object
 * Can handle both raw base64 and data URL format
 */
export function base64ToFile(base64Data: string, filename: string = 'processed_image.png'): File {
  // Remove data URL prefix if present
  const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
  
  const byteCharacters = atob(cleanBase64);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'image/png' });
  
  return new File([blob], filename, { type: 'image/png' });
}

/**
 * Create data URL from base64 image data
 */
export function createImageDataUrl(base64Data: string, mimeType: string = 'image/png'): string {
  // Remove data URL prefix if present
  const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
  return `data:${mimeType};base64,${cleanBase64}`;
}

/**
 * Validate API key format
 */
export function validateApiKey(apiKey: string): boolean {
  return apiKey && apiKey.startsWith('AIza') && apiKey.length > 20;
}
