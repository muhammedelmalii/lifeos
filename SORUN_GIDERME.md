# 🔧 LifeOS - Sorun Giderme Rehberi

## Yaygın Hatalar ve Çözümleri

### 1. "Cannot find module" veya "Module not found" Hatası

**Çözüm:**
```bash
# Cache'i temizle ve yeniden yükle
rm -rf node_modules
rm -rf .expo
npm install
npm start -- --reset-cache
```

### 2. TypeScript Hataları

**Çözüm:**
```bash
# TypeScript kontrolü
npx tsc --noEmit

# Linter kontrolü
npm run lint
```

### 3. Metro Bundler Başlamıyor

**Çözüm:**
```bash
# Cache'i temizle
npm start -- --reset-cache

# Veya
npx expo start --clear
```

### 4. "Unable to resolve module" Hatası

**Çözüm:**
```bash
# Watchman'ı temizle (Mac/Linux)
watchman watch-del-all

# Metro bundler'ı yeniden başlat
npm start -- --reset-cache
```

### 5. Expo Go'da Uygulama Açılmıyor

**Çözüm:**
- Expo Go uygulamasını güncelleyin
- QR kodu tekrar tarayın
- Aynı WiFi ağında olduğunuzdan emin olun
- Tunnel modunu deneyin: `npm start -- --tunnel`

### 6. Android/iOS Simulator Hataları

**Android:**
```bash
# Android emulator'ü başlat
npm run android

# Veya
npx expo start --android
```

**iOS (Mac gerekli):**
```bash
# iOS simulator'ü başlat
npm run ios

# Veya
npx expo start --ios
```

### 7. Path Alias (@/*) Hataları

**Çözüm:**
- `babel.config.js` dosyasını kontrol edin
- `tsconfig.json` path mapping'leri kontrol edin
- Metro bundler'ı yeniden başlatın

### 8. Store/State Hataları

**Çözüm:**
- AsyncStorage izinlerini kontrol edin
- Store'ların doğru import edildiğinden emin olun
- Console'da hata mesajlarını kontrol edin

## Adım Adım Debug

### 1. Temiz Kurulum
```bash
# Tüm cache'leri temizle
rm -rf node_modules
rm -rf .expo
rm -rf .expo-shared
npm cache clean --force

# Yeniden yükle
npm install
npm start -- --reset-cache
```

### 2. Log Kontrolü
```bash
# Detaylı log ile başlat
npx expo start --clear --verbose
```

### 3. TypeScript Kontrolü
```bash
# Type hatalarını kontrol et
npx tsc --noEmit
```

### 4. Linter Kontrolü
```bash
# Kod kalitesi kontrolü
npm run lint
```

## Hata Mesajı Gönderme

Eğer hata devam ederse, lütfen şu bilgileri paylaşın:

1. **Hata mesajı** (tam metin)
2. **Komut** (npm start, npm run android, vs.)
3. **Platform** (iOS, Android, Web)
4. **Node versiyonu**: `node --version`
5. **npm versiyonu**: `npm --version`
6. **Expo versiyonu**: `npx expo --version`

## Hızlı Çözümler

### Her Şeyi Sıfırla
```bash
rm -rf node_modules .expo .expo-shared
npm install
npm start -- --reset-cache
```

### Expo CLI Güncelle
```bash
npm install -g expo-cli@latest
npx expo install --fix
```

### Platform Spesifik
```bash
# iOS için
cd ios && pod install && cd ..

# Android için
cd android && ./gradlew clean && cd ..
```

## Yardım

Hala sorun yaşıyorsanız:
1. Terminal çıktısını kontrol edin
2. Console loglarını inceleyin
3. Expo dokümantasyonuna bakın: https://docs.expo.dev

