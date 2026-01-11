/**
 * Bill Processing Service
 * Processes bill images (OCR) and creates payment reminders
 */

import { extractTextFromImage, OCRResult } from './ocr';
import { useResponsibilitiesStore } from '@/store/responsibilities';
import { Responsibility, EnergyLevel, ReminderStyle } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { addDays } from 'date-fns';
import { scheduleResponsibilityNotifications } from './notifications';
import { createCalendarEvent } from './calendar';

export interface BillData {
  dueDate: Date;
  amount: number;
  vendor: string;
  billType?: 'utility' | 'credit' | 'internet' | 'phone' | 'rent' | 'insurance' | 'other';
}

/**
 * Process bill image and extract payment information
 */
export const processBillImage = async (imageUri: string): Promise<BillData | null> => {
  try {
    const ocrResult: OCRResult = await extractTextFromImage(imageUri);
    
    if (ocrResult.detectedType !== 'bill' || !ocrResult.extractedData) {
      // Try to extract manually from text
      return extractBillDataFromText(ocrResult.text);
    }

    const { dueDate, amount, vendor } = ocrResult.extractedData;
    
    if (!dueDate || !amount) {
      return extractBillDataFromText(ocrResult.text);
    }

    return {
      dueDate: new Date(dueDate),
      amount,
      vendor: vendor || 'Unknown Vendor',
      billType: detectBillType(ocrResult.text, vendor),
    };
  } catch (error) {
    console.error('Error processing bill image:', error);
    return null;
  }
};

/**
 * Extract bill data from OCR text using regex patterns
 */
const extractBillDataFromText = (text: string): BillData | null => {
  const lowerText = text.toLowerCase();

  // Extract due date patterns (Turkish and English)
  const dueDatePatterns = [
    /son ödeme tarihi[:\s]+(\d{1,2})[./](\d{1,2})[./](\d{4})/i,
    /due date[:\s]+(\d{1,2})[./](\d{1,2})[./](\d{4})/i,
    /ödeme tarihi[:\s]+(\d{1,2})[./](\d{1,2})[./](\d{4})/i,
    /vade[:\s]+(\d{1,2})[./](\d{1,2})[./](\d{4})/i,
    /(\d{1,2})[./](\d{1,2})[./](\d{4})/,
  ];

  let dueDate: Date | null = null;
  for (const pattern of dueDatePatterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1; // JS months are 0-indexed
        const year = parseInt(match[3], 10);
        dueDate = new Date(year, month, day);
        if (!isNaN(dueDate.getTime())) {
          break;
        }
      } catch (e) {
        // Try next pattern
      }
    }
  }

  // Extract amount patterns
  const amountPatterns = [
    /tutar[:\s]+([\d,]+\.?\d*)\s*(?:tl|₺)/i,
    /amount[:\s]+([\d,]+\.?\d*)/i,
    /toplam[:\s]+([\d,]+\.?\d*)\s*(?:tl|₺)/i,
    /(?:tl|₺)\s*([\d,]+\.?\d*)/i,
    /([\d,]+\.?\d*)\s*(?:tl|₺)/i,
  ];

  let amount: number | null = null;
  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        const amountStr = match[1].replace(/,/g, '');
        amount = parseFloat(amountStr);
        if (!isNaN(amount)) {
          break;
        }
      } catch (e) {
        // Try next pattern
      }
    }
  }

  // Extract vendor name (usually at the top of bill)
  const vendorPatterns = [
    /^([A-Z\s&]+)/m, // All caps at start
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/, // Title case
  ];

  let vendor = 'Unknown Vendor';
  for (const pattern of vendorPatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].length > 3) {
      vendor = match[1].trim();
      break;
    }
  }

  if (!dueDate || !amount) {
    return null;
  }

  return {
    dueDate,
    amount,
    vendor,
    billType: detectBillType(text, vendor),
  };
};

/**
 * Detect bill type from text or vendor name
 */
const detectBillType = (text: string, vendor: string): BillData['billType'] => {
  const lowerText = text.toLowerCase();
  const lowerVendor = vendor.toLowerCase();

  if (lowerText.includes('elektrik') || lowerText.includes('electric') || lowerVendor.includes('electric')) {
    return 'utility';
  }
  if (lowerText.includes('su') || lowerText.includes('water')) {
    return 'utility';
  }
  if (lowerText.includes('doğalgaz') || lowerText.includes('gas')) {
    return 'utility';
  }
  if (lowerText.includes('kredi kartı') || lowerText.includes('credit card')) {
    return 'credit';
  }
  if (lowerText.includes('internet') || lowerVendor.includes('internet')) {
    return 'internet';
  }
  if (lowerText.includes('telefon') || lowerText.includes('phone') || lowerText.includes('mobile')) {
    return 'phone';
  }
  if (lowerText.includes('kira') || lowerText.includes('rent')) {
    return 'rent';
  }
  if (lowerText.includes('sigorta') || lowerText.includes('insurance')) {
    return 'insurance';
  }

  return 'other';
};

/**
 * Create payment reminder from bill data
 */
export const createPaymentReminder = async (billData: BillData): Promise<string> => {
  const { addResponsibility } = useResponsibilitiesStore.getState();

  // Schedule reminder 2 days before due date
  const reminderDate = addDays(billData.dueDate, -2);
  const now = new Date();
  
  // If reminder date is in the past, set it to tomorrow
  const finalReminderDate = reminderDate < now ? addDays(now, 1) : reminderDate;

  const responsibility: Responsibility = {
    id: uuidv4(),
    title: `${billData.vendor} Faturası Ödeme`,
    description: `Tutar: ${billData.amount.toFixed(2)} TL\nSon Ödeme: ${format(billData.dueDate, 'dd/MM/yyyy')}`,
    category: 'bills',
    energyRequired: 'low' as EnergyLevel,
    schedule: {
      type: 'one-time',
      datetime: finalReminderDate,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    reminderStyle: 'critical' as ReminderStyle, // Bills are critical
    escalationRules: [
      { offsetMinutes: 0, channel: 'notification', strength: 'critical' },
      { offsetMinutes: 1440, channel: 'notification', strength: 'persistent' }, // 24 hours later
    ],
    status: 'active',
    checklist: [],
    createdFrom: 'photo',
    metadata: {
      billAmount: billData.amount,
      billDueDate: billData.dueDate.toISOString(),
      billVendor: billData.vendor,
      billType: billData.billType,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Create calendar event
  try {
    const calendarEventId = await createCalendarEvent(responsibility);
    if (calendarEventId) {
      responsibility.calendarEventId = calendarEventId;
    }
  } catch (error) {
    console.error('Failed to create calendar event for bill:', error);
  }

  await addResponsibility(responsibility);
  await scheduleResponsibilityNotifications(responsibility);

  return responsibility.id;
};

