# 📱 Development Build - Android

## GPT-4o Kontrolü ✅

- Model: `gpt-4o` ✅
- API: Doğru yapılandırılmış ✅
- Fallback: Rule-based parser ✅
- Kullanım: Home ekranında aktif ✅

## Development Build Yap

### Android (Önerilen)

```bash
# Preview build (test için)
eas build --platform android --profile preview

# Veya local build (daha hızlı)
npx expo run:android
```

### iOS (Mac gerekli)

```bash
npx expo run:ios
```

## Build Süresi

- **EAS Build:** 10-20 dakika (cloud'da)
- **Local Build:** 5-10 dakika (kendi bilgisayarında)

## Build Sonrası

1. APK indir (EAS build)
2. Telefona yükle
3. Test et

## Not

`.env` dosyası yoksa API key olmadan çalışır (rule-based parser kullanır).

