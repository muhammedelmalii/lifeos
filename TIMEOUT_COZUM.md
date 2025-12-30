# ⏱️ Timeout Sorunu Çözümü

## Sorun
Telefon bilgisayara bağlanamıyor: `exp://192.168.1.13:8081` timeout veriyor.

## Çözümler

### 1. Tunnel Modu (Önerilen)
```bash
npx expo start --tunnel --go
```
Bu komut ngrok tunnel kullanır, firewall sorunlarını aşar.

### 2. Aynı Wi-Fi Kontrolü
- Telefon ve bilgisayar aynı Wi-Fi ağında olmalı
- Farklı ağlardaysan tunnel kullan

### 3. Firewall Ayarları
Windows Firewall'da port 8081'i aç:
- Windows Defender Firewall > Advanced Settings
- Inbound Rules > New Rule
- Port > TCP > 8081 > Allow

### 4. Manuel IP Bağlantısı
Terminal'de IP adresini gör:
```
Metro waiting on exp://192.168.1.13:8081
```

Expo Go'da:
1. "Enter URL manually" seç
2. `exp://192.168.1.13:8081` yapıştır

## Hızlı Test

Tunnel modunda başlattım. Şimdi:
1. Terminal'de yeni QR kod görünecek
2. QR kodu tara
3. Tunnel üzerinden bağlanacak (daha yavaş ama çalışır)

## Alternatif: Web'de Test

```bash
npx expo start --web
```
Tarayıcıda test edebilirsin, network sorunu olmaz.

