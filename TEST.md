# 🧪 Test Rehberi - Mobil Uygulama

## 🚀 Hızlı Başlangıç

### Development Build (Önerilen)

```bash
# 1. EAS CLI kur (eğer yoksa)
npm install -g eas-cli

# 2. EAS'a giriş yap
eas login

# 3. Development build oluştur
npm run build:android
```

**Süre:** 10-20 dakika

**Sonuç:** APK indirilebilir olacak, telefona yükle.

### Local Build (Daha Hızlı)

```bash
# Android Studio gerekli
npx expo prebuild
npx expo run:android
```

**Süre:** 5-10 dakika (ilk build)

## 📱 Test Senaryoları

### ✅ Uygulama Başlatma
1. Uygulamayı aç
2. Splash screen görünüyor mu?
3. Login ekranı açılıyor mu?

### ✅ Authentication
1. Email ile giriş yap
2. Onboarding akışını tamamla
3. İzinleri ver

### ✅ Home Screen
1. Komut gir: "Yarın saat 14:00'te toplantı"
2. AI Understanding Sheet açılıyor mu?
3. Confirm Plan çalışıyor mu?

### ✅ Inbox
1. Sorumluluklar görünüyor mu?
2. Sorumluluğa tıklayınca detay açılıyor mu?
3. Checklist çalışıyor mu?

### ✅ Bildirimler
1. Bildirim izni verildi mi?
2. Zamanlanmış bildirimler çalışıyor mu?

### ✅ Offline Çalışma
1. İnterneti kapat
2. Uygulama çalışıyor mu?
3. Veriler kaydediliyor mu?

## 🐛 Sorun Giderme

### Build hatası?
```bash
npx expo start --clear
rm -rf .expo
```

### APK yüklenmiyor?
- Telefonda "Bilinmeyen kaynaklardan yükleme" izni ver

### Uygulama açılmıyor?
- Metro bundler çalışıyor mu kontrol et
- `npx expo start` ile başlat

## 📝 Detaylı Rehber

Detaylı test rehberi için `MOBIL_TEST_REHBERI.md` dosyasına bak.
