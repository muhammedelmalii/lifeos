# 📱 Local Build - Android

## Hızlı Çözüm

EAS build yerine local build yap (daha hızlı ve sorunsuz):

```bash
npx expo run:android
```

## Gereksinimler

1. **Android Studio** kurulu olmalı
2. **Android SDK** kurulu olmalı
3. **Android Emulator** veya **USB Debugging** aktif telefon

## Adımlar

### 1. Android Studio Kontrolü

Android Studio kurulu mu kontrol et:
```bash
# Android SDK path kontrolü
echo $ANDROID_HOME
```

### 2. Local Build

```bash
npx expo run:android
```

Bu komut:
- ✅ Daha hızlı (5-10 dakika)
- ✅ Local'de build eder
- ✅ APK oluşturur
- ✅ Emulator'da otomatik açar

### 3. APK Bulma

Build sonrası APK:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

## Alternatif: EAS Build (Cloud)

Eğer local build çalışmazsa, EAS build için:
1. Expo dashboard'dan credentials oluştur
2. Sonra `eas build` çalıştır

## Öneri

Local build daha hızlı ve test için yeterli. Deneyelim!

