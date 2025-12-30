# LifeOS - Çalıştırma Talimatları

## 🚀 Hızlı Başlangıç

### 1. Bağımlılıkları Yükle
```bash
npm install
```

### 2. Uygulamayı Başlat
```bash
npm start
```

### 3. Platform Seç
- **iOS için**: `i` tuşuna bas
- **Android için**: `a` tuşuna bas
- **Telefonda**: QR kodu Expo Go uygulaması ile tara

## 📱 İlk Kullanım

1. **Giriş Yap**: Herhangi bir giriş seçeneğini kullan (MVP için mock)
2. **Onboarding**: Kurulum akışını tamamla
   - İzinleri ver (opsiyonel)
   - Takvimleri bağla (opsiyonel)
   - Hatırlatma stilini seç
   - Widget kurulumunu atla
3. **Sorumluluk Oluştur**:
   - Ana ekrana git
   - "Call dentist tomorrow at 2 PM" yaz
   - AI onay sayfasında onayla
4. **Gelen Kutusunda Gör**: Gelen Kutusu sekmesinde sorumluluğunu gör

## 🎯 Test Edilecek Özellikler

- ✅ **Metin Komutu**: "Buy groceries tomorrow at 5 PM"
- ✅ **Ses Komutu**: Ses butonuna bas (mock transcript)
- ✅ **Fotoğraf Komutu**: Tarama butonuna bas, resim seç (mock OCR)
- ✅ **Sorumluluk Detayı**: Herhangi bir sorumluluğa tıkla
- ✅ **Kontrol Listesi**: Öğeleri ekle ve işaretle
- ✅ **Ertleme**: Hızlı ertleme butonlarını kullan
- ✅ **Yapamadım**: "Couldn't do it" butonuna bas ve yeniden planla

## 🐛 Sorun Giderme

**Metro bundler başlamıyor:**
```bash
npm start -- --reset-cache
```

**TypeScript hataları:**
```bash
npm run lint
```

**Eksik modüller:**
```bash
rm -rf node_modules
npm install
```

**Android/iOS hatası:**
- Expo Go uygulamasını telefonuna yükle
- QR kodu tara
- Veya emulator/simulator kullan

## ✅ Çalışan Özellikler

- ✅ Tüm ekranlar ve navigasyon
- ✅ Sorumluluk oluşturma ve yönetimi
- ✅ AI komut ayrıştırma
- ✅ Bildirim zamanlama
- ✅ Yerel veri saklama
- ✅ Gelen kutusu organizasyonu

## 📚 Daha Fazla Bilgi

- `README.md` - Tam dokümantasyon
- `SETUP.md` - Detaylı kurulum
- `QUICK_START.md` - Hızlı başlangıç (İngilizce)

