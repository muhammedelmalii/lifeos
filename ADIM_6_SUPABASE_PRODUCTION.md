# 🗄️ Adım 6: Supabase Production Setup

## Yapılacaklar

### 6.1 Supabase Production Projesi Oluştur

1. **Supabase'e Git:**
   - https://supabase.com adresine git
   - Giriş yap veya hesap oluştur

2. **Yeni Proje Oluştur:**
   - "New Project" butonuna tıkla
   - **Organization:** Mevcut organization'ı seç veya yeni oluştur
   - **Name:** `lifeos-production` (veya istediğin isim)
   - **Database Password:** Güçlü bir şifre oluştur (kaydet!)
   - **Region:** En yakın region'ı seç
   - **Pricing Plan:** Free tier ile başla (sonra upgrade edebilirsin)

3. **Proje Oluşturuldu:**
   - Proje oluşturulması 1-2 dakika sürebilir
   - Hazır olduğunda dashboard'a yönlendirileceksin

### 6.2 Database Schema Çalıştır

1. **SQL Editor'ü Aç:**
   - Sol menüden "SQL Editor" seç
   - "New query" butonuna tıkla

2. **Schema Dosyasını Çalıştır:**
   - `database/schema.sql` dosyasını aç
   - İçeriğini kopyala
   - SQL Editor'e yapıştır
   - "Run" butonuna tıkla (veya Ctrl+Enter)

3. **Kontrol Et:**
   - Sol menüden "Table Editor" seç
   - Şu tabloların oluşturulduğunu kontrol et:
     - ✅ `responsibilities`
     - ✅ `lists`
     - ✅ `settings`

### 6.3 Authentication Providers Ayarla

1. **Email Provider:**
   - Sol menüden "Authentication" > "Providers" seç
   - "Email" provider'ı bul
   - ✅ "Enable Email provider" aktif et
   - "Confirm email" seçeneğini istersen kapat (development için)

2. **Google Provider (Opsiyonel):**
   - "Google" provider'ı bul
   - ✅ "Enable Google provider" aktif et
   - Google OAuth credentials ekle:
     - **Detaylı rehber için:** `GOOGLE_OAUTH_SETUP.md` dosyasına bak
     - Google Cloud Console'da OAuth 2.0 Client ID oluştur
     - **Web Application** Client ID ve Client Secret'i ekle (Supabase için)
     - Redirect URL: `https://your-project.supabase.co/auth/v1/callback`

3. **Apple Provider (Opsiyonel - iOS için):**
   - "Apple" provider'ı bul
   - ✅ "Enable Apple provider" aktif et
   - Apple Developer hesabından credentials ekle
   - Redirect URL: `lifeos://auth/callback`

### 6.4 Redirect URLs Ayarla

1. **Authentication > URL Configuration:**
   - "Site URL": `lifeos://`
   - "Redirect URLs" ekle:
     - `lifeos://auth/callback`
     - `exp://localhost:8081` (development için)

### 6.5 API Keys Al

1. **Settings > API:**
   - "Project URL" - Bu production Supabase URL'in
   - "anon public" key - Bu production anon key'in

2. **Keys'i Kopyala:**
   - Production URL: `https://xxxxx.supabase.co`
   - Production Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 6.6 EAS Secrets Ekle

Terminal'de çalıştır:
```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value your_production_supabase_url
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value your_production_anon_key
```

### 6.7 Local .env Dosyası (Development için)

Proje kök dizininde `.env` dosyası oluştur:
```env
# Supabase Production Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-production-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key

# OpenAI Configuration (Optional)
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key

# Environment
EXPO_PUBLIC_ENV=production
```

**ÖNEMLİ:** `.env` dosyasını asla Git'e commit etme!

## ✅ Tamamlandığında

- [ ] Supabase production projesi oluşturuldu
- [ ] Database schema çalıştırıldı
- [ ] Authentication providers ayarlandı
- [ ] Redirect URLs ayarlandı
- [ ] API keys alındı
- [ ] EAS Secrets eklendi
- [ ] Local .env dosyası oluşturuldu (development için)

## 📝 Notlar

- **Free Tier Limits:**
  - 500 MB database
  - 2 GB bandwidth
  - 50,000 monthly active users
  - 2 projects

- **Production için Öneriler:**
  - Database backup'ları aktif et
  - Monitoring ve alerts ayarla
  - Rate limiting ayarla
  - RLS (Row Level Security) policies kontrol et

**Sonraki Adım:** Adım 7 - Production Build Hazırlığı

