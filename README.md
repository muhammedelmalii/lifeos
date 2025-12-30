# LifeOS - Life Operating System

A premium mobile app for managing responsibilities (not tasks) with AI-powered assistance.

## Tech Stack

- **React Native + Expo** (TypeScript)
- **Expo Router** for navigation
- **Zustand** for state management
- **React Query** (TanStack Query) for async/server state
- **Supabase** for backend (Auth + Postgres)
- **Expo Notifications** for local notifications
- **Expo Calendar** for calendar integration

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm/yarn
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac) or Android Emulator
- Supabase account (for production)

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key_optional
   ```

3. **Run the app:**
   ```bash
   npm start
   ```
   
   Then press:
   - `i` for iOS simulator
   - `a` for Android emulator
   - Scan QR code with Expo Go app on your device

### Development Commands

- `npm start` - Start Expo dev server
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run tests

## Architecture

### Project Structure

```
/app                    # Expo Router screens
  /(auth)               # Authentication screens
  /(onboarding)        # Onboarding flow
  /(tabs)              # Main app tabs
  /responsibility      # Responsibility detail screens
  /couldnt-do-it       # Reschedule flow

/src
  /components          # Reusable UI components
    /ui                # Base UI kit (Button, Card, etc.)
  /features            # Feature-specific components
  /services            # Business logic services
    - notifications.ts  # Notification scheduling
    - calendar.ts       # Calendar integration
    - aiParser.ts       # Command parsing
    - ocr.ts            # Image text extraction
    - voice.ts          # Voice recognition
  /store               # Zustand stores
    - auth.ts
    - responsibilities.ts
    - lists.ts
  /utils               # Utility functions
    - date.ts
    - rrule.ts
  /types               # TypeScript types
  /theme               # Design system (colors, typography, spacing)
```

### Domain Model

**Responsibility** (not "task"):
- `id`, `title`, `description`, `category`
- `energyRequired`: low/medium/high
- `schedule`: one-time or recurring (with RRULE)
- `reminderStyle`: gentle/persistent/critical
- `escalationRules`: array of reminder offsets
- `status`: active/completed/missed/snoozed/archived
- `checklist`: array of sub-items
- `createdFrom`: text/voice/photo

**List**:
- `id`, `name`, `type` (market/home/work/custom)
- `items`: array of ListItem

### State Management

- **Zustand** for client state (responsibilities, lists, auth)
- **React Query** for server state (when Supabase is connected)
- **AsyncStorage** for local persistence

### Reminder Engine

The reminder engine schedules local notifications based on:
- Responsibility schedule datetime
- Reminder style (gentle/persistent/critical)
- Escalation rules (multiple reminders at different offsets)

Notifications are scheduled when a responsibility is created/updated and cancelled when completed/archived.

### AI Command Parser

Hybrid approach:
1. **Rule-based parsing** (MVP): Extracts date/time, recurring patterns, energy level, reminder style from natural language
2. **OpenAI adapter** (optional): Can be enabled with API key for more sophisticated parsing

Returns structured `ParsedCommand` with:
- Title, description
- Schedule (datetime, timezone, RRULE)
- Energy level, reminder style
- List actions

## Features (MVP)

✅ **Authentication**
- Apple/Google sign-in (placeholders)
- Email magic link (placeholder)

✅ **Onboarding**
- Welcome → Permissions → Calendar → Reminder Style → Widget

✅ **Home Command Center**
- Text/voice/photo input
- AI understanding confirmation sheet
- Next critical responsibility card

✅ **Responsibility Management**
- Create from command → confirmation → stored
- Detail screen with checklist, schedule, snooze
- "Couldn't do it" flow with reschedule

✅ **Inbox**
- Missed critical responsibilities
- Snoozed items
- Upcoming responsibilities

✅ **Notifications**
- Local notification scheduling
- Escalation rules
- Critical reminder patterns

✅ **Calendar Integration**
- Permission requests
- Event creation (placeholder)

✅ **Voice & Photo**
- Voice input (placeholder STT)
- Photo capture with OCR (mock)

## What Works (MVP Checklist)

- ✅ Project structure and navigation
- ✅ Theme system and UI components
- ✅ Authentication flow (mock)
- ✅ Onboarding screens
- ✅ Responsibility creation from text/voice/photo
- ✅ AI command parsing (rule-based)
- ✅ Responsibility detail screen
- ✅ Checklist management
- ✅ Snooze functionality
- ✅ "Couldn't do it" reschedule flow
- ✅ Inbox with grouped responsibilities
- ✅ Local notification scheduling
- ✅ Zustand store with AsyncStorage persistence
- ✅ Settings screen

## What's Placeholder/Mock

- **Authentication**: Uses mock user, not real Supabase auth
- **Voice Recognition**: Returns mock transcript (needs real STT service)
- **OCR**: Returns mock extracted text (needs real OCR service)
- **Calendar Events**: Creates events but may need platform-specific setup
- **OpenAI Parser**: Falls back to rule-based if no API key

## Next Steps (Post-MVP)

1. **Integrate real services:**
   - Supabase Auth (Apple/Google/Email magic link)
   - Real speech-to-text (Google Speech-to-Text or similar)
   - Real OCR (Google Vision API or Tesseract)
   - OpenAI API for command parsing

2. **Additional features:**
   - Now Mode (quick wins)
   - Critical Reminder full-screen pattern
   - Daily Briefing (morning/evening)
   - Lists with Market Mode
   - Calendar sync

3. **Polish:**
   - Error handling improvements
   - Loading states
   - Offline support
   - Data sync across devices

## Testing

Run tests:
```bash
npm test
```

Current test coverage:
- Reminder engine scheduling logic
- Command parser (rule-based)

## Environment Variables

See `.env.example` for required variables.

## License

Private - All rights reserved

