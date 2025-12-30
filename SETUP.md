# LifeOS Setup Guide

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials (optional for MVP)
   ```

3. **Start the app:**
   ```bash
   npm start
   ```

## First Run Checklist

- [ ] Install dependencies (`npm install`)
- [ ] Create `.env` file (copy from `.env.example`)
- [ ] Run `npm start` and open in Expo Go or simulator
- [ ] Complete onboarding flow
- [ ] Test creating a responsibility from Home screen
- [ ] Test voice input (mock)
- [ ] Test photo input (mock OCR)
- [ ] Verify notifications are scheduled
- [ ] Check Inbox shows responsibilities

## Troubleshooting

### Metro bundler issues
```bash
npm start -- --reset-cache
```

### TypeScript errors
```bash
npm run lint
```

### Missing dependencies
```bash
rm -rf node_modules
npm install
```

## Platform-Specific Setup

### iOS
- Requires Xcode and iOS Simulator
- Run: `npm run ios`

### Android
- Requires Android Studio and emulator
- Run: `npm run android`

## Environment Variables

For MVP, these are optional:
- `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `EXPO_PUBLIC_OPENAI_API_KEY` - OpenAI API key (for AI parsing)

The app works without these using mock/placeholder implementations.

