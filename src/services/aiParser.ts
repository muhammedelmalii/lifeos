import { Responsibility, EnergyLevel, ReminderStyle, Schedule, CreatedFrom } from '@/types';
import { addDays, addHours, setHours, setMinutes, startOfDay } from 'date-fns';

export interface ParsedCommand {
  title: string;
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
            content: `You are an AI assistant that parses natural language commands into structured responsibility data.
Parse the user's command and return a JSON object with:
- title: Main task/responsibility title
- description: Optional detailed description
- category: One of: 'work', 'shopping', 'health', 'finance', 'home', 'social', 'learning', 'personal', 'market', 'grocery', 'errands', 'appointments', 'meetings', 'exercise', 'meals', 'bills', 'maintenance', 'travel', 'family', 'hobbies'. Be smart about categorizing based on context.
- schedule: Object with type ('one-time' or 'recurring'), datetime (ISO string), timezone, and optional rrule
- energyRequired: 'low', 'medium', or 'high'
- reminderStyle: 'gentle', 'persistent', or 'critical'
- recurring: Optional RRULE string if recurring
- listActions: Optional array of {listName, items[]}. Automatically create list actions for:
  * Shopping items → listName: "Shopping List" or "Market List" or "Grocery List"
  * Multiple items mentioned → extract all items into a list
  * Market/grocery related → automatically add to shopping list
  * Work tasks → "Work Tasks" list
  * Home items → "Home Improvement" list

Be smart about:
- Understanding context and intent
- Extracting dates/times (support relative: "tomorrow", "in 2 hours", "next Monday", "next week")
- Detecting urgency and importance
- Identifying recurring patterns
- Understanding energy requirements from context
- Auto-categorizing: "buy milk" → category: 'shopping', listActions: [{listName: "Shopping List", items: ["milk"]}]
- Auto-categorizing: "meeting with John" → category: 'work' or 'social' based on context
- Auto-categorizing: "doctor appointment" → category: 'health'
- Extracting multiple items: "buy milk, bread, eggs" → listActions with all items
- Understanding Turkish and English commands
- Query detection: "show shopping list" → isQuery: true, queryType: 'list', queryListName: "Shopping List"
- Query detection: "what's today" → isQuery: true, queryType: 'show'
- Query detection: "market listesini göster" → isQuery: true, queryType: 'list', queryListName: "Market List"
- Query detection: "show shopping items" → isQuery: true, queryType: 'filter', queryCategory: 'shopping'
- Query detection: "bugünkü işleri göster" → isQuery: true, queryType: 'show'

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
      parsed.schedule.datetime = new Date(parsed.schedule.datetime);
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

