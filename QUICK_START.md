# LifeOS Quick Start

## 🚀 Get Running in 5 Minutes

```bash
# 1. Install dependencies
npm install

# 2. Start the app
npm start

# 3. Press 'i' for iOS or 'a' for Android
# Or scan QR code with Expo Go app
```

## 📱 First Use

1. **Login**: Use any of the login options (all are mock for MVP)
2. **Onboarding**: Complete the setup flow
   - Grant permissions (optional)
   - Connect calendars (optional)
   - Choose reminder style
   - Skip widget setup
3. **Create Responsibility**: 
   - Go to Home tab
   - Type: "Call dentist tomorrow at 2 PM"
   - Confirm in the AI sheet
4. **View in Inbox**: Check the Inbox tab to see your responsibility

## 🎯 Key Features to Test

- ✅ **Text Command**: "Buy groceries tomorrow at 5 PM"
- ✅ **Voice Command**: Tap voice button (mock transcript)
- ✅ **Photo Command**: Tap scan button, select image (mock OCR)
- ✅ **Responsibility Detail**: Tap any responsibility to see details
- ✅ **Checklist**: Add items and check them off
- ✅ **Snooze**: Use quick snooze buttons
- ✅ **Couldn't Do It**: Tap "Couldn't do it" to reschedule

## 🐛 Common Issues

**Metro bundler won't start:**
```bash
npm start -- --reset-cache
```

**TypeScript errors:**
```bash
npm run lint
```

**Missing modules:**
```bash
rm -rf node_modules && npm install
```

## 📚 More Info

- See `README.md` for full documentation
- See `SETUP.md` for detailed setup
- See `MVP_CHECKLIST.md` for feature status

