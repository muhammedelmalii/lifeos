# 🔐 Google OAuth Setup Rehberi

## LifeOS için Gerekli Client ID'ler

LifeOS hem iOS hem Android'de çalıştığı için **her platform için ayrı Client ID** oluşturmanız gerekiyor.

## Adım Adım Kurulum

### 1. Google Cloud Console'a Git

1. https://console.cloud.google.com adresine git
2. Giriş yap veya hesap oluştur
3. Yeni proje oluştur veya mevcut projeyi seç:
   - Proje adı: **LifeOS** (veya istediğin isim)

### 2. OAuth Consent Screen Ayarla

1. Sol menüden **"APIs & Services"** > **"OAuth consent screen"** seç
2. **User Type:** External (veya Internal - eğer Google Workspace kullanıyorsan)
3. **App information:**
   - App name: **LifeOS**
   - User support email: (email adresin)
   - Developer contact information: (email adresin)
4. **Scopes:** 
   - `email`
   - `profile`
   - `openid`
5. **Test users:** (External seçtiysen) Test için email ekle
6. **Save and Continue**

### 3. Client ID Oluştur

#### 3.1 Web Application (Supabase için)

1. **"APIs & Services"** > **"Credentials"** seç
2. **"+ CREATE CREDENTIALS"** > **"OAuth client ID"** seç
3. **Application type:** **Web application** seç
4. **Name:** `LifeOS Web Client`
5. **Authorized redirect URIs** ekle:
   ```
   https://your-supabase-project.supabase.co/auth/v1/callback
   ```
   (Supabase project URL'in ile değiştir)
6. **Create** butonuna tıkla
7. **Client ID** ve **Client Secret**'i kopyala ve kaydet

#### 3.2 iOS Application

1. **"+ CREATE CREDENTIALS"** > **"OAuth client ID"** seç
2. **Application type:** **iOS** seç
3. **Name:** `LifeOS iOS`
4. **Bundle ID:** `com.lifeos.app` (app.json'daki bundleIdentifier ile aynı olmalı)
5. **Create** butonuna tıkla
6. **Client ID**'yi kopyala ve kaydet

#### 3.3 Android Application

1. **"+ CREATE CREDENTIALS"** > **"OAuth client ID"** seç
2. **Application type:** **Android** seç
3. **Name:** `LifeOS Android`
4. **Package name:** `com.lifeos.app` (app.json'daki package ile aynı olmalı)
5. **SHA-1 certificate fingerprint:** (EAS build yapıldıktan sonra alabilirsin)
   - Şimdilik boş bırakabilirsin, sonra ekleyebilirsin
6. **Create** butonuna tıkla
7. **Client ID**'yi kopyala ve kaydet

### 4. Supabase'e Client ID ve Secret Ekle

1. **Supabase Dashboard** > **Authentication** > **Providers** > **Google**
2. **Enable Google provider** aktif et
3. **Client ID (for OAuth):** Web Application Client ID'yi yapıştır
4. **Client Secret (for OAuth):** Web Application Client Secret'i yapıştır
5. **Save**

### 5. EAS Secrets (Opsiyonel - Native için)

Eğer native Google Sign-In kullanacaksan (Expo Auth Session yerine):

```bash
# iOS için
eas secret:create --scope project --name GOOGLE_IOS_CLIENT_ID --value your_ios_client_id

# Android için
eas secret:create --scope project --name GOOGLE_ANDROID_CLIENT_ID --value your_android_client_id
```

## ✅ Kontrol Listesi

- [ ] Google Cloud Console'da proje oluşturuldu
- [ ] OAuth consent screen ayarlandı
- [ ] Web Application Client ID oluşturuldu
- [ ] iOS Client ID oluşturuldu
- [ ] Android Client ID oluşturuldu
- [ ] Supabase'e Web Client ID ve Secret eklendi
- [ ] Client ID'ler kaydedildi (güvenli bir yerde)

## 📝 Notlar

### SHA-1 Certificate Fingerprint (Android)

Android Client ID için SHA-1 fingerprint gerekli. EAS build yapıldıktan sonra alabilirsin:

```bash
# EAS build yapıldıktan sonra
eas credentials

# Veya manuel olarak
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

### Redirect URIs

**Supabase için:**
- Format: `https://your-project.supabase.co/auth/v1/callback`
- Supabase project URL'in ile değiştir

**Native Apps için:**
- iOS: `lifeos://auth/callback`
- Android: `lifeos://auth/callback`

## 🔒 Güvenlik

- **Client Secret'i asla Git'e commit etme!**
- **Client ID'leri EAS Secrets'da sakla**
- **Production ve Development için ayrı Client ID'ler kullan**

## 🚀 Sonraki Adım

Google OAuth setup tamamlandıktan sonra:
1. Supabase'de Google provider'ı aktif et
2. Test et (login ekranından Google ile giriş yap)
3. Apple OAuth setup yap (iOS için - opsiyonel)

**Rehber:** `ADIM_6_SUPABASE_PRODUCTION.md` dosyasına geri dön

