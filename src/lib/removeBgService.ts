// Remove.bg API service for background removal
const REMOVE_BG_API_KEY = 'YOUR_REMOVE_BG_API_KEY'; // You'll need to get this from remove.bg
const REMOVE_BG_API_URL = 'https://api.remove.bg/v1.0/removebg';

export interface RemoveBgResult {
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
 * Remove background using Remove.bg API
 */
export async function removeBackgroundWithRemoveBg(
  imageInput: File | string
): Promise<RemoveBgResult> {
  try {
    // Check if API key is set
    if (!REMOVE_BG_API_KEY || REMOVE_BG_API_KEY === 'YOUR_REMOVE_BG_API_KEY') {
      throw new Error('مفتاح Remove.bg API غير محدد. يرجى الحصول على مفتاح من remove.bg');
    }

    let imageData: string;
    let mimeType: string;

    if (imageInput instanceof File) {
      // Validate file type
      if (!imageInput.type.startsWith('image/')) {
        throw new Error('نوع الملف غير مدعوم. يرجى اختيار ملف صورة صالح.');
      }
      
      // Check file size (max 12MB for Remove.bg)
      if (imageInput.size > 12 * 1024 * 1024) {
        throw new Error('حجم الملف كبير جداً. الحد الأقصى المسموح هو 12 ميجابايت.');
      }
      
      imageData = await fileToBase64(imageInput);
      mimeType = imageInput.type;
    } else {
      imageData = await imageUrlToBase64(imageInput);
      mimeType = 'image/jpeg'; // Default
    }

    // Create form data
    const formData = new FormData();
    formData.append('image_file_b64', imageData);
    formData.append('size', 'auto');

    // Make API request
    const response = await fetch(REMOVE_BG_API_URL, {
      method: 'POST',
      headers: {
        'X-Api-Key': REMOVE_BG_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Remove.bg API Error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    // Get the processed image as blob
    const blob = await response.blob();
    
    // Convert blob to base64
    const base64Image = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    return {
      success: true,
      imageData: base64Image
    };

  } catch (error) {
    console.error('Remove.bg API Error:', error);
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
  // Remove data URL prefix if present
  const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
  
  const byteCharacters = atob(cleanBase64);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });
  
  return new File([blob], filename, { type: mimeType });
}
