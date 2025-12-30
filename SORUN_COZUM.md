# 🔧 Expo Açılmıyor - Çözüm

## Hızlı Çözüm

```bash
# Tüm node process'leri temizle
taskkill /F /IM node.exe

# Cache temizle ve başlat
npx expo start --web --clear
```

## Alternatif Yöntemler

### 1. Web'de Test
```bash
npx expo start --web
```
Tarayıcıda açılır: `http://localhost:8081`

### 2. Expo Go'da Test
```bash
npx expo start
```
QR kodu tara

### 3. Farklı Port
```bash
npx expo start --port 8083
```

## Hata Mesajları

**"Port 8081 is being used"**
→ Farklı port kullan: `--port 8083`

**"Cannot find module"**
→ `npm install` çalıştır

**"Metro bundler error"**
→ `npx expo start --clear` çalıştır

## Test

Web'de açıldığında:
- Welcome screen görünüyor mu?
- Butonlar çalışıyor mu?
- Tasarım doğru mu?
