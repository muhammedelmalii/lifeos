# 🤖 AI & Otomasyon Rehberi - LifeOS

## ✅ Tamamlanan Özellikler

### 1. OpenAI Entegrasyonu
- ✅ `parseCommandWithAI()` fonksiyonu OpenAI API'ye bağlandı
- ✅ GPT-4o-mini model kullanılıyor
- ✅ Akıllı komut parsing (doğal dil işleme)
- ✅ Fallback mekanizması (API yoksa rule-based)

### 2. AI Analiz Servisi
- ✅ Pattern recognition (zaman, enerji, tamamlama)
- ✅ Conflict detection (çakışan görevler)
- ✅ Energy matching (enerji seviyesi eşleştirme)
- ✅ Productivity insights (üretkenlik analizi)
- ✅ Work-life balance analysis

### 3. Otomasyon Servisi
- ✅ Background analysis (30 dakikada bir)
- ✅ Auto-reschedule conflicts (otomatik çakışma çözümü)
- ✅ Energy-based suggestions (enerji bazlı öneriler)
- ✅ Proactive suggestions (proaktif öneriler)

## 🚀 Nasıl Çalışıyor?

### 1. Komut Parsing (AI ile)

**Kullanım:**
```typescript
const parsed = await parseCommandWithAI("Yarın saat 14:00'te doktor randevusu", 'text');
```

**AI Ne Yapıyor:**
- Doğal dili analiz ediyor
- Tarih/saat çıkarıyor
- Enerji seviyesi belirliyor
- Öncelik/urgency algılıyor
- Tekrarlayan pattern'leri tespit ediyor

**Örnekler:**
- "Her pazartesi sabah 9'da toplantı" → Recurring, weekly
- "Acil! Bugün ödemem gerekiyor" → Critical, today
- "Düşük enerjiyle yapabileceğim bir şey" → Low energy

### 2. Otomatik Analiz

**Ne Zaman Çalışıyor:**
- Uygulama açıldığında
- Her 30 dakikada bir (background)
- Manuel tetiklenebilir

**Ne Analiz Ediyor:**
- ⏰ Zaman pattern'leri (en verimli saatler)
- ⚡ Enerji dağılımı
- 🔄 Çakışmalar
- ✅ Tamamlama oranları
- ⚖️ İş-hayat dengesi

### 3. Otomatik İşlemler

**Auto-Reschedule:**
- Çakışan görevleri otomatik yeniden planlar
- Critical olmayan görevleri önceliklendirir
- Enerji seviyesine göre zaman önerir

**Smart Suggestions:**
- Enerji uyumsuzluğu varsa önerir
- Back-to-back görevler için mola önerir
- Batch processing önerir (benzer görevleri grupla)

## 📋 Kurulum

### 1. OpenAI API Key Ekle

`.env` dosyasına ekle:
```env
EXPO_PUBLIC_OPENAI_API_KEY=sk-your-api-key-here
```

### 2. API Key Alma

1. https://platform.openai.com adresine git
2. API Keys bölümünden yeni key oluştur
3. Key'i `.env` dosyasına ekle

### 3. Test Et

```bash
# Expo server'ı yeniden başlat
npx expo start --clear
```

## 🎯 Kullanım Senaryoları

### Senaryo 1: Akıllı Komut Parsing

**Kullanıcı:** "Yarın öğleden sonra 3'te müşteriyle görüşme, önemli"

**AI Anlıyor:**
- Tarih: Yarın, 15:00
- Öncelik: Critical (önemli)
- Enerji: Medium (görüşme)
- Otomatik reminder ayarlanıyor

### Senaryo 2: Otomatik Çakışma Çözümü

**Durum:** 2 görev aynı saatte

**AI Yapıyor:**
- Çakışmayı tespit ediyor
- Critical olmayan görevi otomatik erteliyor
- Kullanıcıya bildirim gönderiyor

### Senaryo 3: Enerji Bazlı Öneriler

**Durum:** Gece 23:00, yüksek enerji gerektiren görev var

**AI Öneriyor:**
- "Bu görev yüksek enerji gerektiriyor, sabah 9'a ertelenebilir"
- Kullanıcı onaylarsa otomatik erteliyor

## 🔧 Özelleştirme

### Analiz Sıklığını Değiştir

`app/_layout.tsx`:
```typescript
// Her 15 dakikada bir analiz et
automationService.start(15);
```

### AI Model

**Şu an kullanılan:** `gpt-4o` (en güncel ve güçlü model)

**Alternatif modeller:**
- `gpt-4o` - En güncel, çok güçlü (varsayılan)
- `gpt-4-turbo` - Hızlı ve güçlü
- `gpt-4o-mini` - Daha hızlı ve ucuz

Model değiştirmek için `src/services/aiParser.ts`:
```typescript
model: 'gpt-4o', // Şu an kullanılan
```

### Analiz Kapsamını Genişlet

`src/services/aiAnalysis.ts` dosyasına yeni analiz fonksiyonları ekleyebilirsiniz.

## 💰 Maliyet

**GPT-4o (Şu an kullanılan):**
- Input: ~$2.50 / 1M tokens
- Output: ~$10.00 / 1M tokens
- Ortalama komut: ~500 tokens
- **Maliyet: ~$0.00125 per komut**

**Aylık Tahmin (1000 komut/gün):**
- 30,000 komut/ay
- ~$37.50/ay

**Alternatif (GPT-4o-mini):**
- Input: ~$0.15 / 1M tokens
- Output: ~$0.60 / 1M tokens
- **Maliyet: ~$0.0003 per komut**
- ~$9/ay (1000 komut/gün)

## 🎨 Gelecek Özellikler

- [ ] Voice command analysis (sesli komut analizi)
- [ ] Image-based task extraction (görselden görev çıkarma)
- [ ] Predictive scheduling (tahmine dayalı planlama)
- [ ] Habit detection (alışkanlık tespiti)
- [ ] Smart notifications (akıllı bildirimler)
- [ ] Weekly reports (haftalık raporlar)

## 🐛 Sorun Giderme

### AI Parsing Çalışmıyor

1. API key kontrolü:
   ```typescript
   console.log(process.env.EXPO_PUBLIC_OPENAI_API_KEY);
   ```

2. Fallback çalışıyor mu kontrol et:
   - API key yoksa rule-based parser kullanılır
   - Console'da "AI parsing failed" mesajı görünür

### Otomasyon Çalışmıyor

1. `app/_layout.tsx`'de `automationService.start()` çağrıldı mı?
2. Console'da hata var mı kontrol et
3. Permissions kontrol et (background tasks)

## 📚 API Referansı

### `parseCommandWithAI(text, createdFrom)`
AI ile komut parse et.

### `analyzeResponsibilities(responsibilities)`
Görevleri analiz et, öneriler üret.

### `suggestReschedule(responsibility, allResponsibilities)`
Akıllı yeniden planlama öner.

### `automationService.start(intervalMinutes)`
Otomasyon servisini başlat.

### `automationService.getLastAnalysis()`
Son analiz sonuçlarını al.

