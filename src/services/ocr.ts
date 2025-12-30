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
  // Mock implementation - in production, call actual OCR API
  // For MVP, return mock data based on image analysis
  
  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Mock detection logic
  const mockResult: OCRResult = {
    text: 'Utility Bill\nDue Date: Oct 24, 2023\nAmount: $125.50',
    confidence: 0.98,
    detectedType: 'bill',
    extractedData: {
      dueDate: new Date('2023-10-24'),
      amount: 125.50,
      vendor: 'Utility Company',
    },
  };

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

