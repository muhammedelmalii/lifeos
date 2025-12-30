# 🌐 Web Versiyonu - Test Rehberi

## ✅ Paketler Yüklendi

Web desteği için gerekli paketler yüklendi:
- `react-native-web@~0.19.10`
- `react-dom@18.2.0`

## 🚀 Web Versiyonunu Başlatma

```bash
npm run web
```

Bu komut:
1. Metro bundler'ı başlatır
2. Web sunucusunu başlatır
3. Tarayıcıda otomatik açar (genellikle `http://localhost:8081`)

## 📱 Web'de Test Edilebilen Özellikler

### ✅ Çalışan Özellikler:
- Tüm ekranlar ve navigasyon
- Authentication akışı
- Onboarding ekranları
- Home Command Center
- Text input ile sorumluluk oluşturma
- AI Understanding Sheet
- Inbox organizasyonu
- Sorumluluk detay ekranı
- Checklist yönetimi
- Store ve state yönetimi
- Yerel veri saklama (localStorage)

### ⚠️ Web'de Çalışmayan Özellikler:
- 📷 Kamera/Fotoğraf çekme (input type="file" ile çalışabilir)
- 🎤 Mikrofon (bazı tarayıcılarda çalışabilir)
- 📅 Takvim erişimi
- 🔔 Push bildirimleri
- 📱 Haptic feedback
- 📸 Expo ImagePicker

## 🎯 Test Senaryoları

### 1. Authentication
- Login ekranını açın
- Herhangi bir giriş seçeneğine tıklayın (mock)

### 2. Onboarding
- Welcome ekranı
- Permissions ekranı
- Calendar connection
- Reminder style seçimi
- Widget setup

### 3. Sorumluluk Oluşturma
- Home ekranında text input'a yazın: "Call dentist tomorrow at 2 PM"
- Enter'a basın veya submit edin
- AI Understanding Sheet açılmalı
- "Confirm Plan" butonuna tıklayın
- Inbox'ta görünmeli

### 4. Inbox
- Inbox sekmesine gidin
- Oluşturduğunuz sorumlulukları görün
- "Done" butonuna tıklayın

### 5. Sorumluluk Detayı
- Bir sorumluluğa tıklayın
- Checklist öğelerini işaretleyin
- Snooze butonlarını deneyin
- "Couldn't do it" akışını test edin

## 🐛 Sorun Giderme

### Web sayfası açılmıyor:
```bash
# Metro bundler'ı durdurun (Ctrl+C)
# Cache'i temizleyin
npm start -- --reset-cache --web
```

### Hata mesajları:
- Console'u açın (F12)
- Hata mesajlarını kontrol edin
- Terminal çıktısını kontrol edin

### Port zaten kullanılıyor:
```bash
# Farklı port kullan
npx expo start --web --port 8082
```

## 💡 İpuçları

1. **Hot Reload**: Kod değişikliklerinde otomatik yenilenir
2. **Developer Tools**: F12 ile React DevTools kullanabilirsiniz
3. **Console Logs**: Tarayıcı console'unda logları görebilirsiniz
4. **Network Tab**: API çağrılarını görebilirsiniz

## 🎉 Hazır!

Web versiyonu başlatıldı. Tarayıcıda test edebilirsiniz!

