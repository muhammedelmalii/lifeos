# 🧪 LifeOS - Test Yöntemleri

Expo Go kullanmadan uygulamayı test etmenin birkaç yolu var:

## 1. 🌐 Web Versiyonu (En Kolay)

Web tarayıcısında test edin:

```bash
npm start
# Sonra 'w' tuşuna basın
# VEYA
npm run web
```

**Avantajlar:**
- ✅ Hızlı ve kolay
- ✅ Telefon/emulator gerekmez
- ✅ Hemen test edebilirsiniz

**Dezavantajlar:**
- ⚠️ Bazı native özellikler çalışmayabilir (kamera, bildirimler, vb.)

## 2. 📱 Android Studio Emulator

### Kurulum:
1. [Android Studio](https://developer.android.com/studio) indirin ve kurun
2. Android SDK'yı yükleyin
3. AVD Manager'dan bir emulator oluşturun

### Çalıştırma:
```bash
# Emulator'ü başlatın (Android Studio'dan)
# Sonra:
npm run android
# VEYA
npm start
# Sonra 'a' tuşuna basın
```

**Avantajlar:**
- ✅ Gerçek Android ortamı
- ✅ Tüm native özellikler çalışır
- ✅ Debugging kolay

## 3. 🍎 iOS Simulator (Sadece Mac)

### Kurulum:
1. Xcode'u App Store'dan indirin
2. Xcode Command Line Tools'u yükleyin

### Çalıştırma:
```bash
npm run ios
# VEYA
npm start
# Sonra 'i' tuşuna basın
```

**Avantajlar:**
- ✅ Gerçek iOS ortamı
- ✅ Tüm native özellikler çalışır

## 4. 📦 Development Build (APK/IPA)

Kendi build'inizi oluşturun:

```bash
# Android APK oluştur
npx expo prebuild
npx expo run:android

# iOS için (Mac gerekli)
npx expo prebuild
npx expo run:ios
```

## 5. 🎯 Expo Snack (Online Editor)

Kodu [snack.expo.dev](https://snack.expo.dev) üzerinde test edin:

1. Kodu Snack'e yapıştırın
2. Tarayıcıda veya Expo Go'da açın

## 6. 🔍 React Native Debugger

Debugging için:

```bash
# React Native Debugger'ı indirin
# https://github.com/jhen0409/react-native-debugger

# Uygulamayı başlatın
npm start

# Debugger'ı açın ve bağlayın
```

## 🚀 Önerilen: Web Versiyonu

En hızlı test için:

```bash
npm run web
```

Bu komut:
- Metro bundler'ı başlatır
- Web tarayıcısında otomatik açar
- Hot reload çalışır
- Çoğu özelliği test edebilirsiniz

## ⚠️ Web'de Çalışmayan Özellikler

- 📷 Kamera/Fotoğraf çekme
- 🎤 Mikrofon (bazı tarayıcılarda çalışabilir)
- 📅 Takvim erişimi
- 🔔 Push bildirimleri
- 📱 Haptic feedback

## ✅ Web'de Çalışan Özellikler

- ✅ Tüm ekranlar ve navigasyon
- ✅ Sorumluluk oluşturma
- ✅ AI Understanding Sheet
- ✅ Inbox organizasyonu
- ✅ Checklist yönetimi
- ✅ Store ve state yönetimi
- ✅ Yerel veri saklama (localStorage)

## 🎯 Hızlı Başlangıç

```bash
# 1. Web versiyonunu başlat
npm run web

# 2. Tarayıcıda otomatik açılacak
# 3. Test edin!
```

## 📝 Notlar

- Web versiyonu development için idealdir
- Production için native build gerekir
- Android Studio emulator en gerçekçi test ortamıdır

