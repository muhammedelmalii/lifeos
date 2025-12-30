# 🚀 LifeOS - Çalıştırma Talimatları

## ✅ Tüm Hatalar Düzeltildi!

TypeScript hataları düzeltildi, uygulama çalışır durumda.

## 📱 Telefonda Test Etmek İçin

### 1. Expo Go İndirin
- **Android:** [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- **iOS:** [App Store](https://apps.apple.com/app/expo-go/id982107779)

### 2. Projeyi Başlatın
```bash
npx expo start
```

### 3. QR Kodu Tarayın
- Terminal'de QR kod görünecek
- Expo Go uygulamasını açın
- "Scan QR code" seçeneğini seçin
- QR kodu tarayın

### 4. Uygulama Açılacak! 🎉

---

## 🌐 Web'de Test (Hızlı)

```bash
npx expo start
# Terminal'de 'w' tuşuna basın
```

Tarayıcıda localhost:8081 açılacak.

---

## 📦 APK Build (Gerçek Uygulama)

```bash
# 1. EAS CLI'yi yükle
npm install -g eas-cli

# 2. EAS'a giriş yap
eas login

# 3. APK build oluştur
eas build --profile preview --platform android
```

Build tamamlandığında:
- Terminal'de link görünecek
- Veya https://expo.dev adresinden indirin
- Telefonunuza yükleyin

---

## ⚠️ Önemli Notlar

- **Her zaman `npx expo start` kullanın** (eski `expo start` değil)
- **Port sorunu varsa:** Farklı port kullanın: `npx expo start --port 8083`
- **Cache sorunu varsa:** `npx expo start --clear`

---

## 🐛 Sorun Giderme

### QR kod görünmüyor:
```bash
npx expo start --tunnel
```

### Bağlantı hatası:
- Telefon ve bilgisayar aynı WiFi'de olmalı
- Firewall'u kontrol edin

### Build hatası:
- `eas.json` dosyası hazır ✅
- EAS CLI güncel mi kontrol edin: `npm install -g eas-cli@latest`

---

## ✅ Çalışan Özellikler

- ✅ Tüm ekranlar (Welcome, Login, Onboarding, Home, Inbox, vb.)
- ✅ Navigation (tüm ekranlar arası geçişler)
- ✅ Component sistemi (Button, Card, Chip, Icon, Badge, vb.)
- ✅ i18n (Türkçe/İngilizce)
- ✅ State management (Zustand)
- ✅ Local storage (AsyncStorage)

---

## 🎯 Test Senaryoları

1. **Giriş Yap:** Login ekranından herhangi bir seçenekle giriş yap
2. **Onboarding:** Kurulum akışını tamamla
3. **Sorumluluk Oluştur:** Home ekranında "Call dentist tomorrow at 2 PM" yaz
4. **AI Onay:** AI Understanding Sheet'te "Confirm Plan" tıkla
5. **Inbox:** Gelen Kutusu'nda sorumluluğu gör
6. **Detay:** Sorumluluğa tıkla, checklist'i kullan
7. **Snooze:** Hızlı erteleme butonlarını dene
8. **Couldn't Do It:** "Couldn't do it" akışını test et

---

## 📚 Daha Fazla Bilgi

- `HIZLI_TEST.md` - Hızlı test rehberi
- `BUILD_APK.md` - APK build rehberi
- `SORUN_COZUM.md` - Sorun giderme rehberi

