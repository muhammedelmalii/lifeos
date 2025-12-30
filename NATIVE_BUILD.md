# 📱 Native App Build - Hızlı Başlangıç

## 🚀 En Hızlı Yol: Development Build

### 1. EAS CLI Kurulumu

```bash
npm install -g eas-cli
eas login
```

### 2. Build Yapılandırması

```bash
eas build:configure
```

Bu komut `eas.json` dosyasını oluşturur.

### 3. Android APK Oluştur

```bash
# Development build (önerilen - daha hızlı)
eas build --profile development --platform android

# Veya preview build (APK formatında)
eas build --profile preview --platform android
```

### 4. Build İndir ve Yükle

Build tamamlandıktan sonra:
1. EAS dashboard'dan APK'yı indir
2. Android cihazına yükle (USB veya dosya paylaşımı ile)
3. Uygulamayı aç ve test et

## 🔧 Alternatif: Lokal Build (Daha Hızlı)

### Android Lokal Build

```bash
# Android Studio gerekli
npx expo run:android
```

Bu komut:
- Native modülleri derler
- APK oluşturur
- Emulator'e veya bağlı cihaza yükler

### iOS Lokal Build (Mac gerekli)

```bash
# Xcode gerekli
npx expo run:ios
```

## 📋 Ön Gereksinimler

### Android
- Android Studio
- Android SDK
- Java JDK

### iOS (Mac gerekli)
- Xcode
- CocoaPods
- iOS Simulator

## 🎯 Test Senaryoları

Native app build'de test edilecekler:

1. **Authentication**: Login ekranları çalışıyor mu?
2. **Onboarding**: Tüm adımlar geçiliyor mu?
3. **Home Screen**: Input, voice, photo butonları çalışıyor mu?
4. **Navigation**: Tüm ekranlar arası geçişler çalışıyor mu?
5. **Store'lar**: Veriler kaydediliyor mu?
6. **Notifications**: Bildirimler zamanlanıyor mu?

## 🐛 Sorun Giderme

**Build başarısız oluyor:**
```bash
# Cache temizle
rm -rf node_modules
npm install
eas build --profile development --platform android --clear-cache
```

**APK yüklenmiyor:**
- Android cihazda "Bilinmeyen kaynaklardan yükleme" iznini aç
- USB debugging açık olmalı

**Metro bundler hatası:**
```bash
npm start -- --reset-cache
```

## ✅ Build Başarılı Olduktan Sonra

1. APK'yı cihaza yükle
2. Uygulamayı aç
3. Tüm özellikleri test et
4. Hataları console'da kontrol et

