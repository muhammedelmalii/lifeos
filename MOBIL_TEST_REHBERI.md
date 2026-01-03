# 📱 Mobil Test Rehberi

## Seçenek 1: Development Build (Önerilen)

### Android APK Oluştur

```bash
# EAS CLI kur (eğer yoksa)
npm install -g eas-cli

# EAS'a giriş yap
eas login

# Development build oluştur
eas build --platform android --profile development
```

**Süre:** 10-20 dakika

**Sonuç:** APK indirilebilir olacak, telefona yükle.

### APK'yı Telefona Yükle

1. Build tamamlandığında terminal'de link görünecek
2. Link'e tıkla ve APK'yı indir
3. Telefonda "Bilinmeyen kaynaklardan yükleme" izni ver
4. APK'yı yükle
5. Uygulamayı aç

## Seçenek 2: Local Build (Daha Hızlı)

### Gereksinimler

- Android Studio kurulu
- Android SDK kurulu
- USB Debugging aktif (telefonda)

### Build

```bash
# Prebuild (native kodları oluştur)
npx expo prebuild

# Android build
npx expo run:android
```

**Süre:** 5-10 dakika (ilk build)

**Sonuç:** APK otomatik oluşturulur ve telefona yüklenir.

## Seçenek 3: Expo Go (Sınırlı)

`expo-dev-client` kullandığımız için Expo Go çalışmayabilir. Ama deneyebilirsin:

```bash
# Expo Go modunda başlat
npx expo start --go
```

## 🧪 Test Senaryoları

### 1. Uygulama Açılıyor mu?
- ✅ Splash screen görünüyor mu?
- ✅ Login ekranı açılıyor mu?

### 2. Authentication
- ✅ Email ile giriş yap
- ✅ Google ile giriş yap (eğer yapılandırıldıysa)

### 3. Onboarding
- ✅ Onboarding akışını tamamla
- ✅ İzinleri ver

### 4. Home Screen
- ✅ Komut gir: "Yarın saat 14:00'te toplantı"
- ✅ AI Understanding Sheet açılıyor mu?
- ✅ Confirm Plan çalışıyor mu?

### 5. Inbox
- ✅ Sorumluluklar görünüyor mu?
- ✅ Sorumluluğa tıklayınca detay açılıyor mu?
- ✅ Checklist çalışıyor mu?

### 6. Bildirimler
- ✅ Bildirim izni verildi mi?
- ✅ Zamanlanmış bildirimler çalışıyor mu?

### 7. Offline Çalışma
- ✅ İnterneti kapat
- ✅ Uygulama çalışıyor mu?
- ✅ Veriler kaydediliyor mu?

## 🐛 Sorun Giderme

### Build hatası?
```bash
# Cache temizle
npx expo start --clear
rm -rf .expo
```

### APK yüklenmiyor?
- Telefonda "Bilinmeyen kaynaklardan yükleme" izni ver
- USB Debugging aktif mi kontrol et

### Uygulama açılmıyor?
- Metro bundler çalışıyor mu kontrol et
- `npx expo start` ile başlat

## 📝 Notlar

- Development build'de hot reload çalışır
- Her değişiklikte yeniden build gerekmez
- Production build için `eas build --platform android --profile production` kullan

