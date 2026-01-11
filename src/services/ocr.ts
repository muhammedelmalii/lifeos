import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

export interface OCRResult {
  text: string;
  confidence: number;
  detectedType?: 'bill' | 'document' | 'receipt' | 'note';
  extractedData?: {
    dueDate?: Date;
    amount?: number;
    vendor?: string;
  };
}

// MVP: Mock OCR service
// In production, integrate with a real OCR service (Google Vision, Tesseract, etc.)
export const extractTextFromImage = async (uri: string): Promise<OCRResult> => {
  // In production, integrate with Google Vision API, Tesseract, or similar
  // For now, use mock implementation with basic detection
  
  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Try to detect if it's a bill based on image metadata or filename
  // In production, you would:
  // 1. Send image to OCR service (Google Vision, Tesseract.js, etc.)
  // 2. Extract text
  // 3. Use AI/NLP to detect bill patterns
  // 4. Extract structured data (dates, amounts, vendor)
  
  // For MVP, return a generic result that will be processed by billProcessor
  // The billProcessor will try to extract bill data from text
  const mockResult: OCRResult = {
    text: '', // Empty - will be filled by actual OCR in production
    confidence: 0.8,
    detectedType: undefined, // Will be detected by billProcessor
    extractedData: undefined, // Will be extracted by billProcessor
  };

  // In production, call actual OCR API:
  // const apiKey = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY;
  // const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     requests: [{
  //       image: { source: { imageUri: uri } },
  //       features: [{ type: 'TEXT_DETECTION' }],
  //     }],
  //   }),
  // });
  // const data = await response.json();
  // mockResult.text = data.responses[0]?.textAnnotations[0]?.description || '';

  return mockResult;
};

export const pickImage = async (): Promise<string | null> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.8,
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  return result.assets[0].uri;
};

export const takePhoto = async (): Promise<string | null> => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    quality: 0.8,
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  return result.assets[0].uri;
};

