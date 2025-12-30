# Tunnel Kurulum Rehberi

## Sorun
Expo'nun otomatik tunnel'ı zaman aşımına uğruyor.

## Çözüm 1: Manuel ngrok

1. ngrok'u indirin: https://ngrok.com/download
2. ngrok'u PATH'e ekleyin
3. Terminal'de:
   ```bash
   ngrok http 8082
   ```
4. ngrok'un verdiği URL'yi kopyalayın (örn: https://xxxx.ngrok.io)
5. Expo'yu normal modda başlatın:
   ```bash
   npx expo start --port 8082
   ```
6. Telefonunuzda Expo Go'da manuel olarak URL'yi girin

## Çözüm 2: EAS Build (Development Build)

Development build oluşturup telefona yükleyin:
```bash
npx eas build --profile development --platform android
```

## Çözüm 3: Firewall Kontrolü

Windows Firewall veya antivirus ngrok'u engelliyor olabilir:
- Windows Defender Firewall'da ngrok'a izin verin
- Antivirus'te ngrok'u whitelist'e ekleyin

## Çözüm 4: Aynı Wi-Fi (En Kolay)

Tunnel gerekmez, aynı Wi-Fi ağında normal mod yeterli:
```bash
npx expo start --port 8082
```

