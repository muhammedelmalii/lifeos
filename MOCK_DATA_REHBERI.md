# 📊 Mock Data Rehberi

## ✅ Mock Data Eklendi!

Tüm sayfaları test etmek için mock data eklendi. Uygulama ilk açıldığında otomatik olarak mock data ile doldurulacak.

## 📦 Eklenen Mock Data

### 1. Responsibilities (7 adet)
- ✅ **Critical - Şimdi olan:** Team Standup Meeting (bugün, 2 saat sonra)
- ✅ **Upcoming - Yarın:** Dentist Appointment (yarın, 14:00)
- ✅ **Missed - Kaçırılan:** Grocery Shopping (1 saat önce)
- ✅ **Snoozed - Ertelenen:** Review Q4 Budget (yarına ertelendi)
- ✅ **Upcoming - Gelecek hafta:** Project Presentation (kritik)
- ✅ **Upcoming - Bugün akşam:** Gym Session (bugün 18:00, tekrarlayan)
- ✅ **Completed - Tamamlanan:** Morning Meditation (bugün sabah tamamlandı)

### 2. Lists (4 adet)
- ✅ **Grocery List** (Market) - 5 öğe
- ✅ **Home Improvement** (Home) - 3 öğe
- ✅ **Work Tasks** (Work) - 3 öğe
- ✅ **Weekend Plans** (Custom) - 3 öğe

### 3. User
- ✅ **Mock User:** Alex (alex@lifeos.app)

## 🎯 Test Edilecek Sayfalar

### Home Screen (`app/(tabs)/home.tsx`)
- ✅ Next Critical Responsibility görünmeli
- ✅ Today at a Glance listesi dolu olmalı
- ✅ Status row'da task count görünmeli

### Inbox Screen (`app/(tabs)/inbox.tsx`)
- ✅ **Missed Critical** bölümü: Grocery Shopping görünmeli
- ✅ **Snoozed** bölümü: Review Q4 Budget görünmeli
- ✅ **Upcoming** bölümü: Diğer sorumluluklar görünmeli

### Responsibility Detail (`app/responsibility/[id].tsx`)
- ✅ Herhangi bir sorumluluğa tıklayınca detay açılmalı
- ✅ Checklist öğeleri görünmeli
- ✅ Schedule bilgisi görünmeli
- ✅ Snooze butonları çalışmalı

### Settings Screen (`app/(tabs)/settings.tsx`)
- ✅ User bilgisi görünmeli
- ✅ Reminder style seçimi görünmeli

### Plan Screen (`app/(tabs)/plan.tsx`)
- ✅ Placeholder ekran (henüz implement edilmedi)

### Library Screen (`app/(tabs)/library.tsx`)
- ✅ Placeholder ekran (henüz implement edilmedi)

## 🔄 Mock Data Nasıl Çalışıyor?

1. **İlk Açılış:** Eğer AsyncStorage'da veri yoksa, mock data otomatik yüklenir
2. **Storage'a Kayıt:** Mock data AsyncStorage'a kaydedilir
3. **Sonraki Açılışlar:** Storage'dan veri okunur (mock data değil)

## 🗑️ Mock Data'yı Temizlemek İçin

Eğer mock data'yı temizlemek isterseniz:

```bash
# AsyncStorage'ı temizle (React Native Debugger veya uygulamayı sil/yeniden yükle)
```

Veya uygulamayı silip yeniden yükleyin.

## 📝 Mock Data Dosyası

Mock data `src/data/mockData.ts` dosyasında tanımlı. İsterseniz bu dosyayı düzenleyerek:
- Daha fazla sorumluluk ekleyebilirsiniz
- Farklı durumlar test edebilirsiniz
- List öğelerini değiştirebilirsiniz

## ✅ Test Checklist

- [ ] Home ekranında Next Critical görünüyor mu?
- [ ] Home ekranında Today at a Glance listesi dolu mu?
- [ ] Inbox'ta Missed, Snoozed, Upcoming bölümleri dolu mu?
- [ ] Sorumluluk detayına tıklayınca açılıyor mu?
- [ ] Checklist öğeleri görünüyor mu?
- [ ] Snooze butonları çalışıyor mu?
- [ ] "Couldn't do it" akışı çalışıyor mu?
- [ ] Settings ekranında user bilgisi görünüyor mu?

## 🎉 Sonuç

Artık tüm sayfalar mock data ile dolu! Uygulamayı açtığınızda:
- Home ekranında sorumluluklar görünecek
- Inbox'ta farklı kategorilerde sorumluluklar olacak
- Her sayfa test edilebilir durumda

