# 🚀 LifeOS - Production Deployment Checklist

## ⚠️ KRİTİK EKSİKLER (Canlıya Almadan Önce Mutlaka Yapılmalı)

### 1. 🔐 Environment Variables & Secrets

#### ❌ Eksik: `.env.example` dosyası
**Yapılacaklar:**
- [ ] `.env.example` dosyası oluştur
- [ ] Production `.env` dosyası oluştur (asla Git'e commit etme!)
- [ ] EAS Secrets kullan (production için)

**Oluştur: `.env.example`**
```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration (Optional)
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key

# Environment
EXPO_PUBLIC_ENV=production
```

**EAS Secrets Setup:**
```bash
# EAS secrets ayarla
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value your_production_url
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value your_production_key
eas secret:create --scope project --name EXPO_PUBLIC_OPENAI_API_KEY --value your_production_key
```

### 2. 🛡️ Error Tracking & Monitoring

#### ❌ Eksik: Error tracking sistemi
**Yapılacaklar:**
- [ ] Sentry veya benzeri error tracking ekle
- [ ] Global error boundary ekle
- [ ] Crash reporting aktif et

**Kurulum:**
```bash
npm install @sentry/react-native
npx expo install expo-dev-client
```

**Eklenmesi gereken:**
- `src/utils/errorBoundary.tsx` - Global error boundary
- `src/services/errorTracking.ts` - Error tracking service
- `app/_layout.tsx` - Error boundary wrapper

### 3. 📊 Analytics (Opsiyonel ama Önerilen)

#### ❌ Eksik: Analytics sistemi
**Yapılacaklar:**
- [ ] Expo Analytics veya Firebase Analytics ekle
- [ ] Kullanıcı davranışlarını takip et
- [ ] Performance metrikleri topla

### 4. 🏗️ App Configuration

#### ⚠️ Eksik: Production app.json ayarları
**Yapılacaklar:**
- [ ] `app.json` - EAS project ID güncelle (`your-project-id` → gerçek ID)
- [ ] App icon ekle (1024x1024)
- [ ] Splash screen image ekle
- [ ] Android adaptive icon ekle
- [ ] iOS app icon set ekle

**app.json güncellemeleri:**
```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#1a1a1a"
    },
    "ios": {
      "icon": "./assets/ios-icon.png",
      "bundleIdentifier": "com.lifeos.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#1a1a1a"
      },
      "package": "com.lifeos.app"
    },
    "extra": {
      "eas": {
        "projectId": "gerçek-project-id-buraya"
      }
    }
  }
}
```

### 5. 🔒 Security & Privacy

#### ❌ Eksik: Privacy Policy ve Terms of Service
**Yapılacaklar:**
- [ ] Privacy Policy oluştur (GDPR uyumlu)
- [ ] Terms of Service oluştur
- [ ] Settings ekranına Privacy Policy linki ekle
- [ ] Settings ekranına Terms of Service linki ekle

**Eklenmesi gereken:**
- `privacy-policy.md` veya web URL
- `terms-of-service.md` veya web URL
- `app/(tabs)/settings.tsx` - Linkler ekle

### 6. 🗄️ Database & Backend

#### ⚠️ Kontrol Edilmesi Gerekenler:
- [ ] Supabase production projesi oluşturuldu mu?
- [ ] Database schema production'da çalıştırıldı mı?
- [ ] RLS (Row Level Security) policies aktif mi?
- [ ] Authentication providers ayarlandı mı?
- [ ] Production API keys güvenli mi?

**Supabase Checklist:**
```sql
-- 1. Schema'yı çalıştır
-- database/schema.sql dosyasını Supabase SQL Editor'de çalıştır

-- 2. RLS Policies kontrol et
-- Tüm tablolarda RLS aktif olmalı

-- 3. Auth Providers ayarla
-- Supabase Dashboard > Authentication > Providers
-- - Email: Aktif
-- - Google: Aktif (OAuth credentials gerekli)
-- - Apple: Aktif (OAuth credentials gerekli)
```

### 7. 🧪 Testing & Quality Assurance

#### ❌ Eksik: Production test senaryoları
**Yapılacaklar:**
- [ ] End-to-end test senaryoları
- [ ] Offline mode testleri
- [ ] API error handling testleri
- [ ] Performance testleri
- [ ] Memory leak testleri

**Test Checklist:**
- [ ] Login/Logout flow
- [ ] Responsibility oluşturma/güncelleme/silme
- [ ] List oluşturma/güncelleme/silme
- [ ] Offline mode (internet yokken)
- [ ] Sync (internet geri geldiğinde)
- [ ] Error handling (API hataları)
- [ ] Notifications
- [ ] AI parsing
- [ ] Automation services

### 8. 📱 App Store Submission

#### ❌ Eksik: App Store metadata
**Yapılacaklar:**
- [ ] App Store screenshots (iPhone/iPad)
- [ ] Play Store screenshots (Android)
- [ ] App description (EN/TR)
- [ ] Keywords
- [ ] Privacy policy URL
- [ ] Support URL
- [ ] App Store categories

**iOS App Store:**
- [ ] 6.5" iPhone screenshots (1284x2778)
- [ ] 5.5" iPhone screenshots (1242x2208)
- [ ] iPad Pro screenshots (2048x2732)
- [ ] App preview video (opsiyonel)

**Google Play Store:**
- [ ] Phone screenshots (1080x1920)
- [ ] Tablet screenshots (1200x1920)
- [ ] Feature graphic (1024x500)
- [ ] App icon (512x512)

### 9. 🚀 Build & Deployment

#### ⚠️ Eksik: Production build configuration
**Yapılacaklar:**
- [ ] EAS Build yapılandırması kontrol et
- [ ] Production build test et
- [ ] Code signing certificates
- [ ] App Store Connect API key
- [ ] Google Play service account

**EAS Build:**
```bash
# 1. EAS CLI kurulumu
npm install -g eas-cli

# 2. EAS login
eas login

# 3. EAS project oluştur
eas build:configure

# 4. Production build
eas build --platform ios --profile production
eas build --platform android --profile production

# 5. Submit to stores
eas submit --platform ios
eas submit --platform android
```

### 10. 🔄 Offline Sync & Error Handling

#### ⚠️ İyileştirilmesi Gerekenler:
- [ ] Sync queue mekanizması (başarısız işlemleri sakla)
- [ ] Network error handling iyileştir
- [ ] Retry mekanizması ekle
- [ ] Conflict resolution (local vs server)

**Eklenmesi gereken:**
- `src/services/sync.ts` - Sync queue service
- Network status monitoring
- Retry logic

### 11. 📝 Documentation

#### ⚠️ Eksik: Production dokümantasyonu
**Yapılacaklar:**
- [ ] Deployment guide
- [ ] Environment setup guide
- [ ] Troubleshooting guide
- [ ] API documentation
- [ ] User guide

### 12. 🎨 Assets & Branding

#### ❌ Eksik: Production assets
**Yapılacaklar:**
- [ ] App icon (1024x1024 PNG)
- [ ] Splash screen (1242x2436 PNG)
- [ ] Adaptive icon (Android)
- [ ] App Store screenshots
- [ ] Play Store screenshots
- [ ] Feature graphic (Play Store)

### 13. 🔐 API Keys Security

#### ⚠️ ÖNEMLİ: API keys güvenliği
**Yapılacaklar:**
- [ ] Production API keys asla kod içinde olmamalı
- [ ] EAS Secrets kullan
- [ ] `.env` dosyası `.gitignore`'da olmalı
- [ ] Development ve production keys ayrı olmalı

### 14. ⚡ Performance Optimization

#### ⚠️ Kontrol Edilmesi Gerekenler:
- [ ] Bundle size optimization
- [ ] Image optimization
- [ ] Lazy loading
- [ ] Memory management
- [ ] Battery usage optimization

### 15. 🌍 Localization

#### ✅ Tamamlandı:
- [x] EN/TR dil desteği
- [x] Language switcher

#### ⚠️ Kontrol:
- [ ] Tüm metinler çevrildi mi?
- [ ] Date/time formatting locale-aware mi?

## 📋 Hızlı Deployment Adımları

### 1. Environment Setup (5 dakika)
```bash
# .env.example oluştur
cp .env_SETUP.md .env.example

# Production .env oluştur (asla commit etme!)
# EAS Secrets ayarla
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value your_url
```

### 2. Supabase Production Setup (10 dakika)
1. Supabase.com'da production projesi oluştur
2. SQL Editor'de `database/schema.sql` çalıştır
3. Auth providers ayarla
4. Production URL ve keys'i EAS Secrets'a ekle

### 3. Error Tracking (10 dakika)
```bash
npm install @sentry/react-native
# Sentry setup
```

### 4. App Configuration (5 dakika)
- `app.json` - project ID güncelle
- Icon ve splash screen ekle

### 5. Build & Test (30 dakika)
```bash
# Preview build
eas build --platform ios --profile preview
eas build --platform android --profile preview

# Test et
# Production build
eas build --platform ios --profile production
eas build --platform android --profile production
```

### 6. Submit to Stores (1 saat)
```bash
# App Store
eas submit --platform ios

# Play Store
eas submit --platform android
```

## 🎯 Öncelik Sırası

### 🔴 YÜKSEK ÖNCELİK (Canlıya Almadan Önce Mutlaka)
1. ✅ Environment variables (.env.example, EAS Secrets)
2. ✅ Error tracking (Sentry)
3. ✅ App configuration (app.json, icons)
4. ✅ Supabase production setup
5. ✅ Privacy Policy & Terms of Service

### 🟡 ORTA ÖNCELİK (İlk hafta içinde)
6. ⚠️ Offline sync improvements
7. ⚠️ Analytics
8. ⚠️ App Store metadata
9. ⚠️ Testing

### 🟢 DÜŞÜK ÖNCELİK (Sonraki iterasyonlarda)
10. ⚠️ Performance optimizations
11. ⚠️ Additional features
12. ⚠️ Advanced analytics

## 📞 Destek

Sorun yaşarsanız:
1. `SON_ASAMA_CHECKLIST.md` dosyasına bakın
2. `SORUN_GIDERME.md` dosyasına bakın
3. Expo docs: https://docs.expo.dev
4. Supabase docs: https://supabase.com/docs

## ✅ Final Checklist

Canlıya almadan önce şunları kontrol et:
- [ ] Tüm environment variables ayarlandı
- [ ] Error tracking aktif
- [ ] Production build başarılı
- [ ] Test senaryoları geçti
- [ ] Privacy Policy ve Terms hazır
- [ ] App Store metadata hazır
- [ ] Supabase production hazır
- [ ] API keys güvenli
- [ ] Icons ve assets hazır
- [ ] Documentation tamamlandı

**Hepsi tamamlandığında canlıya alabilirsiniz!** 🚀

