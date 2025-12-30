# 📱 Expo Go'da Açılmıyor - Çözüm

## Sorun

`expo-dev-client` paketi Expo Go ile uyumlu değil. Bu yüzden Expo Go'da açılmıyor.

## Çözüm 1: Expo Go Modunda Başlat (Önerilen)

```bash
npx expo start --go
```

Bu komut Expo Go ile uyumlu modda başlatır.

## Çözüm 2: Web'de Test Et

```bash
npx expo start --web
```

Tarayıcıda test edebilirsin.

## Çözüm 3: Development Build Yap

Eğer `expo-dev-client` özelliklerini kullanmak istiyorsan:

```bash
# iOS
npx expo run:ios

# Android  
npx expo run:android
```

## Hızlı Test

1. Terminal'de: `npx expo start --go`
2. QR kodu tara
3. Expo Go'da açılır

## Not

`expo-dev-client` production build için gerekli. Test için `--go` flag'i kullan.
