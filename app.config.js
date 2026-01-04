// Load environment variables from .env file
require('dotenv').config();

// Import app.json for base config
const appJson = require('./app.json');

module.exports = {
  expo: {
    ...appJson.expo,
    // Environment variables are automatically available via EXPO_PUBLIC_ prefix
    // This extra section ensures they're accessible via Constants.expoConfig.extra
    extra: {
      ...appJson.expo.extra,
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      EXPO_PUBLIC_OPENAI_API_KEY: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
      EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
      EXPO_PUBLIC_ENV: process.env.EXPO_PUBLIC_ENV || 'development',
    },
  },
};

