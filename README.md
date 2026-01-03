# LifeOS - Life Operating System

A premium mobile app for managing responsibilities (not tasks) with AI-powered assistance.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac) or Android Emulator (optional)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   
   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   EXPO_PUBLIC_OPENAI_API_KEY=your-openai-api-key
   ```

3. **Run the app:**
   ```bash
   npm start
   ```
   
   Then press:
   - `w` for web browser
   - `a` for Android emulator
   - `i` for iOS simulator
   - Scan QR code with Expo Go app on your device

## 📱 Features

- **AI-Powered Command Parsing** - Natural language to structured responsibilities
- **Smart Scheduling** - Automatic time and energy management
- **Proactive Help** - Context-aware suggestions
- **Wellness Insights** - Work-life balance tracking
- **Offline-First** - Works without internet connection
- **Supabase Integration** - Cloud sync when online

## 🛠️ Development

### Commands

- `npm start` - Start Expo dev server
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run web` - Run on web
- `npm run build:web` - Build for web (Vercel)
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run tests

### Project Structure

```
/app                    # Expo Router screens
  /(auth)               # Authentication screens
  /(onboarding)           # Onboarding flow
  /(tabs)              # Main app tabs
  /responsibility      # Responsibility detail screens
  /couldnt-do-it       # Reschedule flow

/src
  /components          # Reusable UI components
  /services            # Business logic & API
  /store               # Zustand state management
  /theme               # Design system
  /types               # TypeScript types
  /utils               # Utility functions
  /i18n                # Internationalization

/database              # Supabase schema
```

## 🔧 Tech Stack

- **React Native + Expo** (TypeScript)
- **Expo Router** for navigation
- **Zustand** for state management
- **React Query** for async/server state
- **Supabase** for backend (Auth + Postgres)
- **OpenAI GPT-4o** for AI parsing
- **Expo Notifications** for local notifications
- **Expo Calendar** for calendar integration

## 📦 Deployment

### Web (Vercel)

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy automatically

See `vercel.json` for configuration.

### Mobile (EAS Build)

1. Install EAS CLI: `npm install -g eas-cli`
2. Login: `eas login`
3. Build: `eas build --platform android --profile preview`

## 📄 Legal

- [Privacy Policy](./privacy-policy.md)
- [Terms of Service](./terms-of-service.md)

## 📝 License

Private - All rights reserved
