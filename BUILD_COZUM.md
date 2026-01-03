# 🔧 Build Sorunu Çözümü

## Sorun
Keystore oluşturma non-interactive modda desteklenmiyor.

## Çözüm

### 1. Credentials Setup (Manuel)

Terminal'de çalıştır:
```bash
eas credentials
```

Seçenekler:
1. **Android** seç
2. **Set up new credentials** seç
3. **Generate a new Keystore** seç
4. Keystore oluşturulacak

### 2. Sonra Build Yap

```bash
eas build --platform android --profile preview
```

## Alternatif: Local Build (Daha Hızlı)

EAS build yerine local build yap:

```bash
# Android Studio gerekli
npx expo run:android
```

Bu komut:
- Daha hızlı (5-10 dakika)
- Local'de build eder
- APK oluşturur

## Hızlı Test İçin

Local build önerilir:
```bash
npx expo run:android
```

