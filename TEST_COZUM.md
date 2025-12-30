# 🧪 Test Çözümü - Web'de Test Et

## Sorun
Expo Go'da açılmıyor (expo-dev-client uyumsuzluğu + network sorunları).

## Çözüm: Web'de Test Et

```bash
npx expo start --web
```

**Avantajlar:**
- ✅ Hızlı başlar
- ✅ Network sorunu yok
- ✅ Tasarım ve butonları test edebilirsin
- ✅ Tüm ekranları görebilirsin

**Sınırlamalar:**
- ❌ Bazı native özellikler çalışmaz (camera, notifications)
- ❌ Swipe gestures sınırlı

## Test Edilecekler (Web'de)

1. ✅ Tüm ekranlar görünüyor mu?
2. ✅ Tüm butonlar çalışıyor mu?
3. ✅ Tasarım tutarlı mı?
4. ✅ Dark theme doğru mu?
5. ✅ Animasyonlar smooth mu?
6. ✅ Formlar çalışıyor mu?

## Mobil Test İçin

Mobil test için production build yap:
```bash
eas build --platform android --profile preview
```

## Hızlı Başlangıç

Web'de başlattım. Tarayıcıda otomatik açılacak:
`http://localhost:8081`

