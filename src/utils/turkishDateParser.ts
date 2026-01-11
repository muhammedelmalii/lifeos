/**
 * Turkish Date Parser
 * Parses Turkish date expressions like "11 nisan", "11 Nisan 2024"
 */

const turkishMonths: { [key: string]: number } = {
  'ocak': 0,
  'şubat': 1,
  'mart': 2,
  'nisan': 3,
  'mayıs': 4,
  'haziran': 5,
  'temmuz': 6,
  'ağustos': 7,
  'eylül': 8,
  'ekim': 9,
  'kasım': 10,
  'aralık': 11,
};

const englishMonths: { [key: string]: number } = {
  'january': 0, 'jan': 0,
  'february': 1, 'feb': 1,
  'march': 2, 'mar': 2,
  'april': 3, 'apr': 3,
  'may': 4,
  'june': 5, 'jun': 5,
  'july': 6, 'jul': 6,
  'august': 7, 'aug': 7,
  'september': 8, 'sep': 8, 'sept': 8,
  'october': 9, 'oct': 9,
  'november': 10, 'nov': 10,
  'december': 11, 'dec': 11,
};

/**
 * Parse Turkish date expressions
 * Examples: "11 nisan", "11 Nisan 2024", "11/04", "11.04.2024"
 */
export const parseTurkishDate = (text: string): Date | null => {
  const lowerText = text.toLowerCase().trim();
  const now = new Date();
  const currentYear = now.getFullYear();
  
  // Pattern 1: "11 nisan" or "11 Nisan"
  const monthNamePattern = /(\d{1,2})\s+(ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık|january|february|march|april|may|june|july|august|september|october|november|december)(?:\s+(\d{4}))?/i;
  const monthMatch = text.match(monthNamePattern);
  
  if (monthMatch) {
    const day = parseInt(monthMatch[1], 10);
    const monthName = monthMatch[2].toLowerCase();
    const year = monthMatch[3] ? parseInt(monthMatch[3], 10) : currentYear;
    
    const month = turkishMonths[monthName] ?? englishMonths[monthName];
    if (month !== undefined && day >= 1 && day <= 31) {
      const date = new Date(year, month, day, 10, 0, 0); // Default 10 AM
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }
  
  // Pattern 2: "11/04" or "11.04" (day/month)
  const slashPattern = /(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?/;
  const slashMatch = text.match(slashPattern);
  
  if (slashMatch) {
    const first = parseInt(slashMatch[1], 10);
    const second = parseInt(slashMatch[2], 10);
    const year = slashMatch[3] 
      ? parseInt(slashMatch[3], 10) + (slashMatch[3].length === 2 ? 2000 : 0)
      : currentYear;
    
    // Try both day/month and month/day interpretations
    // Turkish format is usually day/month
    if (first >= 1 && first <= 31 && second >= 1 && second <= 12) {
      const date = new Date(year, second - 1, first, 10, 0, 0);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }
  
  return null;
};

/**
 * Check if text contains a specific date (not relative like "tomorrow")
 */
export const hasSpecificDate = (text: string): boolean => {
  const lowerText = text.toLowerCase();
  
  // Check for month names
  const hasMonthName = /(ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık|january|february|march|april|may|june|july|august|september|october|november|december)/i.test(text);
  
  // Check for date patterns like "11/04" or "11.04"
  const hasDatePattern = /(\d{1,2})[./](\d{1,2})/.test(text);
  
  // Check for "day month" pattern
  const hasDayMonth = /\d{1,2}\s+(ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık)/i.test(text);
  
  return hasMonthName || hasDatePattern || hasDayMonth;
};

