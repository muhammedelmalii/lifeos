import { Responsibility, EnergyLevel, ReminderStyle, Schedule, CreatedFrom } from '@/types';
import { addDays, addHours, setHours, setMinutes, startOfDay } from 'date-fns';

export interface ParsedCommand {
  title?: string; // Optional - can be empty for list-only commands
  description?: string;
  category?: string;
  schedule?: Schedule;
  energyRequired?: EnergyLevel;
  reminderStyle?: ReminderStyle;
  recurring?: string;
  listActions?: Array<{ listName: string; items: string[] }>;
  // Query commands
  isQuery?: boolean;
  queryType?: 'list' | 'show' | 'filter';
  queryCategory?: string;
  queryListName?: string;
  // Auto-execution flags
  autoExecute?: boolean; // If true, execute directly without showing confirmation sheet
  actionType?: 'create' | 'list' | 'query' | 'update' | 'delete' | 'note'; // Type of action to perform
}

// Rule-based parser for MVP
export const parseCommand = async (
  text: string,
  createdFrom: CreatedFrom
): Promise<ParsedCommand> => {
  const lowerText = text.toLowerCase().trim();

  // Extract title (first sentence or main phrase)
  const titleMatch = lowerText.match(/^(?:remind me to |call |schedule |book |pay |buy |review |complete )?(.+?)(?: (?:tomorrow|today|next week|at \d|in \d)|$)/i);
  let title = titleMatch ? titleMatch[1].trim() : text.trim();
  
  // Clean up title
  title = title.replace(/^(to |that |about )/i, '').trim();
  if (!title) {
    title = text.trim();
  }

  // Extract date/time
  let schedule: Schedule | undefined;
  const now = new Date();
  
  // Tomorrow patterns
  if (lowerText.includes('tomorrow')) {
    const timeMatch = lowerText.match(/tomorrow(?: at | )(\d{1,2})(?::(\d{2}))?(?:\s*(am|pm))?/i);
    const tomorrow = addDays(startOfDay(now), 1);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const period = timeMatch[3]?.toLowerCase();
      
      if (period === 'pm' && hours !== 12) hours += 12;
      if (period === 'am' && hours === 12) hours = 0;
      
      tomorrow.setHours(hours, minutes, 0, 0);
    } else {
      tomorrow.setHours(10, 0, 0, 0); // Default 10 AM
    }
    schedule = {
      type: 'one-time',
      datetime: tomorrow,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }
  // Today patterns
  else if (lowerText.includes('today')) {
    const timeMatch = lowerText.match(/today(?: at | )(\d{1,2})(?::(\d{2}))?(?:\s*(am|pm))?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const period = timeMatch[3]?.toLowerCase();
      
      if (period === 'pm' && hours !== 12) hours += 12;
      if (period === 'am' && hours === 12) hours = 0;
      
      const today = new Date();
      today.setHours(hours, minutes, 0, 0);
      if (today < now) {
        today.setDate(today.getDate() + 1);
      }
      schedule = {
        type: 'one-time',
        datetime: today,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    }
  }
  // "In X hours/minutes"
  else {
    const inMatch = lowerText.match(/in (\d+)\s*(hour|minute|h|m)/i);
    if (inMatch) {
      const amount = parseInt(inMatch[1], 10);
      const unit = inMatch[2].toLowerCase();
      const future = unit.startsWith('h')
        ? addHours(now, amount)
        : new Date(now.getTime() + amount * 60000);
      schedule = {
        type: 'one-time',
        datetime: future,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    }
    // "At X:XX"
    else {
      const atMatch = lowerText.match(/at (\d{1,2})(?::(\d{2}))?(?:\s*(am|pm))?/i);
      if (atMatch) {
        let hours = parseInt(atMatch[1], 10);
        const minutes = atMatch[2] ? parseInt(atMatch[2], 10) : 0;
        const period = atMatch[3]?.toLowerCase();
        
        if (period === 'pm' && hours !== 12) hours += 12;
        if (period === 'am' && hours === 12) hours = 0;
        
        const scheduled = new Date();
        scheduled.setHours(hours, minutes, 0, 0);
        if (scheduled < now) {
          scheduled.setDate(scheduled.getDate() + 1);
        }
        schedule = {
          type: 'one-time',
          datetime: scheduled,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
      }
    }
  }

  // Default to tomorrow 10 AM if no schedule found
  if (!schedule) {
    const tomorrow = addDays(startOfDay(now), 1);
    tomorrow.setHours(10, 0, 0, 0);
    schedule = {
      type: 'one-time',
      datetime: tomorrow,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  // Extract recurring patterns
  let recurring: string | undefined;
  if (lowerText.includes('daily') || lowerText.includes('every day')) {
    recurring = 'FREQ=DAILY;INTERVAL=1';
  } else if (lowerText.includes('weekly') || lowerText.includes('every week')) {
    recurring = 'FREQ=WEEKLY;INTERVAL=1';
  } else if (lowerText.includes('monthly') || lowerText.includes('every month')) {
    recurring = 'FREQ=MONTHLY;INTERVAL=1';
  }
  if (recurring && schedule) {
    schedule.type = 'recurring';
    schedule.rrule = recurring;
  }

  // Extract energy level
  let energyRequired: EnergyLevel = 'medium';
  if (lowerText.includes('low energy') || lowerText.includes('quick') || lowerText.includes('easy')) {
    energyRequired = 'low';
  } else if (lowerText.includes('high energy') || lowerText.includes('intense') || lowerText.includes('deep work')) {
    energyRequired = 'high';
  }

  // Extract reminder style
  let reminderStyle: ReminderStyle = 'gentle';
  if (lowerText.includes('critical') || lowerText.includes('urgent') || lowerText.includes('important')) {
    reminderStyle = 'critical';
  } else if (lowerText.includes('persistent') || lowerText.includes('remind me')) {
    reminderStyle = 'persistent';
  }

  // Extract list actions (basic)
  const listActions: Array<{ listName: string; items: string[] }> = [];
  const listMatch = lowerText.match(/(?:add |to )(.+?)(?: list| shopping)/i);
  if (listMatch) {
    const listName = listMatch[1].trim();
    const items = [title];
    listActions.push({ listName, items });
  }

  return {
    title: title.charAt(0).toUpperCase() + title.slice(1),
    schedule,
    energyRequired,
    reminderStyle,
    recurring,
    listActions,
  };
};

// OpenAI adapter with intelligent parsing
export const parseCommandWithAI = async (
  text: string,
  createdFrom: CreatedFrom
): Promise<ParsedCommand> => {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  
  if (!apiKey) {
    // Fallback to rule-based
    return parseCommand(text, createdFrom);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a personal AI assistant that understands natural language commands and executes them automatically.
Parse the user's command and return a JSON object with:
- title: Main task/responsibility title (ONLY if it's a task/responsibility, not a simple shopping item)
- description: Optional detailed description
- category: One of: 'work', 'shopping', 'health', 'finance', 'home', 'social', 'learning', 'personal', 'market', 'grocery', 'errands', 'appointments', 'meetings', 'exercise', 'meals', 'bills', 'maintenance', 'travel', 'family', 'hobbies'. Be smart about categorizing based on context.
- schedule: Object with type ('one-time' or 'recurring'), datetime (ISO string), timezone, and optional rrule (ONLY if it's a scheduled task)
- energyRequired: 'low', 'medium', or 'high'
- reminderStyle: 'gentle', 'persistent', or 'critical'
- recurring: Optional RRULE string if recurring
- isQuery: true if this is a query/listing command
- queryType: 'list' | 'show' | 'filter' (if isQuery is true)
- queryCategory: Category to filter by (if querying by category)
- queryListName: List name to query (if querying a specific list)
- listActions: Optional array of {listName, items[]}. CRITICAL: For simple shopping commands like "ekmek al", "buy bread", "süt al", ONLY create listActions, DO NOT create a responsibility (set title to empty string or null).
- autoExecute: true for simple commands that should be executed immediately without confirmation (shopping lists, simple queries, etc.)
- actionType: 'create' | 'list' | 'query' | 'update' | 'delete' | 'note' - The type of action to perform

IMPORTANT RULES - ACT AS A PERSONAL ASSISTANT:

SHOPPING COMMANDS:
1. "ekmek bitmiş" / "ekmek bitti" / "ekmek yok" / "bread is finished" → 
   - autoExecute: true, actionType: 'list'
   - listActions: [{listName: "Shopping List", items: ["ekmek"]}]
   - title: null

2. Simple shopping (e.g., "ekmek al", "buy bread", "süt al", "milk al") → 
   - autoExecute: true, actionType: 'list'
   - ONLY listActions, NO responsibility (title: null)
   - Execute immediately

3. Multiple items (e.g., "ekmek, süt, yumurta al", "ekmek bitmiş süt de yok") → 
   - autoExecute: true, actionType: 'list'
   - Extract ALL items: ["ekmek", "süt", "yumurta"]
   - Execute immediately

4. Shopping with schedule (e.g., "tomorrow buy bread") → 
   - autoExecute: false, actionType: 'create'
   - BOTH listActions AND responsibility

5. Shopping items → listName: "Shopping List" or "Market List" or "Grocery List" (use "Shopping List" as default)

QUERY COMMANDS:
6. "alışveriş listesi" / "alışveriş listesini göster" / "show shopping list" → 
   - autoExecute: true, actionType: 'query', isQuery: true
   - queryType: 'list', queryListName: "Shopping List"

7. "bugünkü işleri göster" / "show today's tasks" → 
   - autoExecute: true, actionType: 'query', isQuery: true
   - queryType: 'show'

RECURRING TASKS:
8. "her gün ingilizce çalışmalıyım" / "her gün spor yapmak istiyorum" / "haftada 3 gün spor" / "haftada 2 kez yoga" → 
   - actionType: 'create', autoExecute: false
   - schedule: {type: 'recurring', rrule: 'FREQ=DAILY'} or detect weekly pattern
   - category: 'learning' or 'exercise' based on context
   - energyRequired: 'high' for exercise, 'medium' for learning
   - reminderStyle: 'persistent' (for habits)
   - IMPORTANT: For "haftada X gün" patterns, set schedule.type: 'recurring' and include frequency info

9. Simple task creation (e.g., "call John tomorrow") → 
   - autoExecute: false, actionType: 'create'
   - Needs confirmation

NOTES:
10. "not al: ..." / "not: ..." / "note: ..." → 
    - actionType: 'note', autoExecute: true
    - Save as note, not responsibility

BILLS/PAYMENTS:
11. Bill/fatura related commands will be handled separately via OCR processing

Be smart about:
- Understanding context and intent
- Extracting dates/times (support relative: "tomorrow", "in 2 hours", "next Monday", "next week")
- Detecting urgency and importance
- Identifying recurring patterns
- Understanding energy requirements from context
- Simple shopping: "ekmek al" → autoExecute: true, actionType: 'list', title: null, listActions: [{listName: "Shopping List", items: ["ekmek"]}]
- Simple shopping: "buy milk, bread" → autoExecute: true, actionType: 'list', title: null, listActions: [{listName: "Shopping List", items: ["milk", "bread"]}]
- Scheduled shopping: "tomorrow buy bread" → autoExecute: false, actionType: 'create', title: "Buy bread", schedule: tomorrow, listActions: [{listName: "Shopping List", items: ["bread"]}]
- Query: "show shopping list" → autoExecute: true, actionType: 'query', isQuery: true, queryType: 'list', queryListName: "Shopping List"
- Query: "alışveriş listesi" → autoExecute: true, actionType: 'query', isQuery: true, queryType: 'list', queryListName: "Shopping List"
- Query: "alışveriş listesini göster" → autoExecute: true, actionType: 'query', isQuery: true, queryType: 'list', queryListName: "Shopping List"
- Query: "bugünkü işleri göster" → autoExecute: true, actionType: 'query', isQuery: true, queryType: 'show'
- Auto-categorizing: "meeting with John" → category: 'work' or 'social' based on context
- Auto-categorizing: "doctor appointment" → category: 'health'
- Understanding Turkish and English commands

Return ONLY valid JSON, no markdown formatting.`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const parsed = JSON.parse(data.choices[0].message.content);

    // Convert ISO datetime string to Date object
    if (parsed.schedule?.datetime) {
      const dateObj = new Date(parsed.schedule.datetime);
      const now = new Date();
      
      // Validate the date
      if (isNaN(dateObj.getTime())) {
        // Invalid date, set to default (tomorrow at 10 AM)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(10, 0, 0, 0);
        parsed.schedule.datetime = tomorrow;
      } else {
        // Ensure date is in the future
        if (dateObj < now) {
          // Move to tomorrow at same time, or tomorrow 10 AM if time is in the past
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(dateObj.getHours(), dateObj.getMinutes(), 0, 0);
          if (tomorrow < now) {
            tomorrow.setHours(10, 0, 0, 0);
          }
          parsed.schedule.datetime = tomorrow;
        } else {
          parsed.schedule.datetime = dateObj;
        }
      }
    }

    // Ensure timezone is set
    if (parsed.schedule && !parsed.schedule.timezone) {
      parsed.schedule.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }

    return parsed as ParsedCommand;
  } catch (error) {
    console.error('AI parsing failed, falling back to rule-based:', error);
    return parseCommand(text, createdFrom);
  }
};

