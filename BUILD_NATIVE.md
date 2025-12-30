# 📱 Native App Build Rehberi

## Development Build (Önerilen)

Development build, Expo Go yerine kendi native uygulamanızı oluşturur ve tüm native modülleri destekler.

### 1. EAS CLI Kurulumu

```bash
npm install -g eas-cli
eas login
```

### 2. EAS Build Yapılandırması

```bash
eas build:configure
```

### 3. Android Development Build

```bash
# Android APK oluştur
eas build --profile development --platform android

# Veya lokal build (daha hızlı)
eas build --profile development --platform android --local
```

### 4. iOS Development Build (Mac gerekli)

```bash
# iOS build
eas build --profile development --platform ios

# Veya lokal build
eas build --profile development --platform ios --local
```

## Production Build

### Android APK/AAB

```bash
eas build --profile production --platform android
```

### iOS IPA

```bash
eas build --profile production --platform ios
```

## Lokal Build (Daha Hızlı)

### Android

```bash
# Android Studio gerekli
npx expo run:android
```

### iOS (Mac gerekli)

```bash
# Xcode gerekli
npx expo run:ios
```

## Hızlı Test İçin

En hızlı yol: Development build oluştur ve cihaza yükle.

```bash
# 1. EAS CLI kur
npm install -g eas-cli

# 2. Login ol
eas login

# 3. Build yapılandır
eas build:configure

# 4. Android development build
eas build --profile development --platform android
```

Build tamamlandıktan sonra:
- APK dosyasını indir
- Android cihazına yükle
- Uygulamayı aç ve test et

