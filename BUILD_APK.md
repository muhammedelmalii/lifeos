# 📦 APK Build Rehberi - LifeOS

## Adım 1: EAS CLI Kurulumu

```bash
npm install -g eas-cli
```

## Adım 2: EAS'a Giriş

```bash
eas login
```

Eğer hesabınız yoksa:
- https://expo.dev adresinden ücretsiz hesap oluşturun
- Sonra `eas login` komutunu çalıştırın

## Adım 3: EAS Projesi Başlat (İlk kez)

```bash
eas build:configure
```

Bu komut `eas.json` dosyasını güncelleyecek.

## Adım 4: Development APK Build

```bash
eas build --profile development --platform android
```

Bu komut:
- ✅ Cloud'da build oluşturur (10-15 dakika)
- ✅ APK dosyası üretir
- ✅ EAS dashboard'da görünür

## Adım 5: APK'yı İndir ve Yükle

1. Build tamamlandığında terminal'de link görünecek
2. Veya https://expo.dev adresinden projenize gidin
3. "Builds" sekmesinden APK'yı indirin
4. Telefonunuza yükleyin (USB veya email ile)

## Alternatif: Preview APK (Daha Hızlı)

```bash
eas build --profile preview --platform android
```

Preview build daha hızlıdır ama development client içermez.

## ⚡ Hızlı Komutlar

```bash
# Development build
eas build --profile development --platform android

# Preview build (daha hızlı)
eas build --profile preview --platform android

# Build durumunu kontrol et
eas build:list

# Son build'i indir
eas build:download
```

## 🔧 Sorun Gıderme

### "eas: command not found"
```bash
npm install -g eas-cli@latest
```

### "Project not found"
```bash
eas build:configure
```

### Build çok uzun sürüyor
- Preview profile kullanın (daha hızlı)
- Veya Expo Go kullanın (anında)

