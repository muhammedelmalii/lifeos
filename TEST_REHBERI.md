# 🧪 LifeOS - Tasarım ve İşlevsellik Test Rehberi

## 🚀 Uygulamayı Başlat

```bash
# Development server'ı başlat
npx expo start

# Veya web'de test et
npx expo start --web

# Veya iOS simulator'da
npx expo start --ios

# Veya Android emulator'da
npx expo start --android
```

## 📱 Test Senaryoları

### 1. Authentication (Giriş) Ekranları

#### Login Screen (`app/(auth)/login.tsx`)
- [ ] **Apple Sign In butonu** görünüyor mu?
- [ ] **Google Sign In butonu** görünüyor mu?
- [ ] **Email ile giriş** butonu çalışıyor mu?
- [ ] Tasarım tutarlı mı? (renkler, spacing, typography)
- [ ] Dark theme doğru çalışıyor mu?

#### Email Login Screen (`app/(auth)/email.tsx`)
- [ ] Email input alanı çalışıyor mu?
- [ ] Magic link gönderme butonu çalışıyor mu?
- [ ] Sign up linki çalışıyor mu?
- [ ] Form validation çalışıyor mu?

### 2. Onboarding (İlk Kurulum)

#### Welcome Screen
- [ ] "Get Started" butonu çalışıyor mu?
- [ ] Animasyonlar çalışıyor mu?

#### Permissions Screen
- [ ] Calendar permission butonu çalışıyor mu?
- [ ] Notification permission butonu çalışıyor mu?
- [ ] "Skip" butonu çalışıyor mu?

#### Reminder Style Screen
- [ ] 3 seçenek (Gentle, Persistent, Critical) görünüyor mu?
- [ ] Seçim yapılabiliyor mu?
- [ ] "Continue" butonu çalışıyor mu?

#### Calendar Screen
- [ ] Calendar bağlantı butonu çalışıyor mu?
- [ ] "Skip" butonu çalışıyor mu?

#### Widget Screen
- [ ] Widget setup talimatları görünüyor mu?
- [ ] "Finish" butonu çalışıyor mu?

### 3. Ana Ekranlar (Tabs)

#### Home Screen (`app/(tabs)/home.tsx`)
- [ ] **Command input** çalışıyor mu? (text, voice, photo)
- [ ] **AI understanding sheet** açılıyor mu?
- [ ] **Next critical responsibility** görünüyor mu?
- [ ] **Today at a glance** listesi görünüyor mu?
- [ ] **Swipe actions** çalışıyor mu? (sağa swipe = complete, sola swipe = couldn't do it)
- [ ] **Proactive suggestions** görünüyor mu?
- [ ] Tüm butonlar çalışıyor mu?

#### Inbox Screen (`app/(tabs)/inbox.tsx`)
- [ ] **Missed critical** bölümü görünüyor mu?
- [ ] **Snoozed** bölümü görünüyor mu?
- [ ] **Upcoming** bölümü görünüyor mu?
- [ ] **Swipe actions** çalışıyor mu?
- [ ] **Empty state** doğru görünüyor mu?
- [ ] Her item'a tıklanınca detay sayfası açılıyor mu?

#### Now Mode Screen (`app/(tabs)/now.tsx`)
- [ ] Low-energy tasks görünüyor mu?
- [ ] Empty state doğru mu?
- [ ] Tüm butonlar çalışıyor mu?

#### Briefing Screen (`app/(tabs)/briefing.tsx`)
- [ ] Morning/Evening detection çalışıyor mu?
- [ ] Today's responsibilities listesi görünüyor mu?
- [ ] Critical items görünüyor mu?
- [ ] Completed items görünüyor mu?
- [ ] Missed items görünüyor mu?
- [ ] Reflection messages görünüyor mu?

#### Library Screen (`app/(tabs)/library.tsx`)
- [ ] Lists görünüyor mu?
- [ ] Market lists (large checkboxes) çalışıyor mu?
- [ ] One-hand friendly UI doğru mu?
- [ ] Create list butonu çalışıyor mu?

#### Settings Screen (`app/(tabs)/settings.tsx`)
- [ ] Account section görünüyor mu?
- [ ] Language switcher çalışıyor mu?
- [ ] Reminder intensity görünüyor mu?
- [ ] **Privacy Policy linki** çalışıyor mu?
- [ ] **Terms of Service linki** çalışıyor mu?
- [ ] Sign out butonu çalışıyor mu?

### 4. Detay Ekranları

#### Responsibility Detail (`app/responsibility/[id].tsx`)
- [ ] Tüm bilgiler görünüyor mu?
- [ ] Edit butonu çalışıyor mu?
- [ ] Complete butonu çalışıyor mu?
- [ ] Snooze butonu çalışıyor mu?
- [ ] Delete butonu çalışıyor mu?

#### Couldn't Do It (`app/couldnt-do-it/[id].tsx`)
- [ ] Reschedule formu çalışıyor mu?
- [ ] Date picker çalışıyor mu?
- [ ] Submit butonu çalışıyor mu?

### 5. UI Components

#### Buttons
- [ ] Primary button çalışıyor mu?
- [ ] Secondary button çalışıyor mu?
- [ ] Disabled state doğru mu?
- [ ] Loading state doğru mu?

#### Cards
- [ ] Shadow'lar görünüyor mu?
- [ ] Border radius doğru mu?
- [ ] Padding doğru mu?

#### Inputs
- [ ] Text input çalışıyor mu?
- [ ] Placeholder görünüyor mu?
- [ ] Focus state doğru mu?

#### Empty States
- [ ] Icon görünüyor mu?
- [ ] Title görünüyor mu?
- [ ] Subtitle görünüyor mu?

#### Loading States
- [ ] Loading skeleton görünüyor mu?
- [ ] Activity indicator çalışıyor mu?

### 6. Animasyonlar ve Geçişler

- [ ] Screen transitions smooth mu?
- [ ] Swipe animations çalışıyor mu?
- [ ] Button press animations çalışıyor mu?
- [ ] Loading animations çalışıyor mu?

### 7. Dark Theme

- [ ] Tüm ekranlarda dark theme doğru mu?
- [ ] Text colors okunabilir mi?
- [ ] Background colors doğru mu?
- [ ] Accent colors görünüyor mu?

### 8. Responsive Design

- [ ] Farklı ekran boyutlarında çalışıyor mu?
- [ ] Tablet'te doğru görünüyor mu?
- [ ] Safe area doğru mu?

### 9. Internationalization (i18n)

- [ ] Language switcher çalışıyor mu?
- [ ] Tüm metinler çevrildi mi? (EN/TR)
- [ ] Date/time formatting doğru mu?

### 10. Error Handling

- [ ] Error boundary çalışıyor mu?
- [ ] Network errors doğru gösteriliyor mu?
- [ ] User-friendly error messages var mı?

## 🐛 Bilinen Sorunlar

Test sırasında bulduğun sorunları buraya ekle:

1. [ ] Sorun 1
2. [ ] Sorun 2
3. [ ] Sorun 3

## ✅ Test Sonucu

- [ ] Tüm butonlar çalışıyor
- [ ] Tasarım tutarlı
- [ ] Animasyonlar smooth
- [ ] Dark theme doğru
- [ ] i18n çalışıyor
- [ ] Error handling çalışıyor

## 📝 Notlar

Test sırasında dikkat edilmesi gerekenler:
- Her ekranı test et
- Her butonu test et
- Her animasyonu kontrol et
- Farklı senaryoları test et (empty state, loading state, error state)
