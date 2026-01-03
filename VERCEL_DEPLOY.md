# 🚀 Vercel'de Deploy Etme Rehberi

## Hızlı Başlangıç

### 1. Vercel Hesabı Oluştur

1. [vercel.com](https://vercel.com) adresine git
2. GitHub/GitLab/Bitbucket ile giriş yap
3. Ücretsiz hesap oluştur

### 2. Projeyi GitHub'a Push Et

```bash
# Git repository oluştur (eğer yoksa)
git init
git add .
git commit -m "Initial commit"

# GitHub'da yeni repo oluştur, sonra:
git remote add origin https://github.com/KULLANICI_ADI/lifeos.git
git push -u origin main
```

### 3. Vercel'de Deploy Et

#### Yöntem 1: Vercel Dashboard (Önerilen)

1. [vercel.com/new](https://vercel.com/new) adresine git
2. GitHub repo'yu seç
3. **Import Project** tıkla
4. Ayarlar:
   - **Framework Preset:** Other
   - **Root Directory:** `./` (boş bırak)
   - **Build Command:** `npm run build:web`
   - **Output Directory:** `web-build`
   - **Install Command:** `npm install`

#### Yöntem 2: Vercel CLI

```bash
# Vercel CLI kur
npm i -g vercel

# Deploy et
vercel

# Production deploy
vercel --prod
```

### 4. Environment Variables Ekle

Vercel Dashboard'da **Settings > Environment Variables** bölümüne git ve ekle:

```
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_OPENAI_API_KEY=your-openai-api-key
```

**Önemli:** Her değişken için **Production**, **Preview**, ve **Development** ortamlarını seç.

### 5. Build Ayarları

Vercel otomatik olarak `vercel.json` dosyasını kullanacak. Eğer manuel ayar yapmak istersen:

**Build Command:**
```bash
npm run build:web
```

**Output Directory:**
```
web-build
```

**Install Command:**
```bash
npm install
```

## Önemli Notlar

### Web Sınırlamaları

Bazı native özellikler web'de çalışmaz:
- ❌ Push notifications (web notifications API kullanılabilir)
- ❌ Camera/Photo picker (web API kullanılabilir)
- ❌ Calendar sync (web calendar API kullanılabilir)
- ❌ File system (localStorage kullanılır)

### Çalışan Özellikler

- ✅ Tüm UI/UX
- ✅ Supabase authentication
- ✅ Supabase database
- ✅ GPT-4o AI parsing
- ✅ Zustand state management
- ✅ Responsive design
- ✅ Dark theme

## Custom Domain

1. Vercel Dashboard > Project > Settings > Domains
2. Domain ekle
3. DNS ayarlarını yap

## Preview Deployments

Her commit otomatik olarak preview URL'i oluşturur:
- `lifeos-git-main-kullanici.vercel.app`
- `lifeos-git-feature-branch-kullanici.vercel.app`

## Production Deploy

Main branch'e merge edildiğinde otomatik production deploy olur.

## Troubleshooting

### Build Hatası: "expo export:web not found"

```bash
npm install --save-dev @expo/cli
```

### Build Hatası: "Module not found"

```bash
npm install
npm run build:web
```

### Environment Variables Çalışmıyor

1. Vercel Dashboard'da kontrol et
2. Değişken adlarının `EXPO_PUBLIC_` ile başladığından emin ol
3. Redeploy yap

## Hızlı Test

Deploy sonrası test et:

```bash
# Local'de test et
npm run build:web
npx serve web-build
```

## Sonraki Adımlar

1. ✅ Vercel'de deploy et
2. ✅ Environment variables ekle
3. ✅ Custom domain bağla (opsiyonel)
4. ✅ Analytics ekle (opsiyonel)
5. ✅ Performance monitoring (opsiyonel)

## Destek

Sorun yaşarsan:
- [Vercel Docs](https://vercel.com/docs)
- [Expo Web Docs](https://docs.expo.dev/workflow/web/)

