import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';

const translations = {
  en: {
    welcome: {
      reclaim: 'Reclaim your mind.',
      description: 'The AI operating system designed to plan your life and minimize noise.',
      getStarted: 'Get Started →',
    },
    auth: {
      secure: 'Secure your LifeOS',
      subtitle: 'Your responsibilities, safely synced across devices.',
      apple: 'Continue with Apple',
      google: 'Continue with Google',
      email: 'Continue with Email',
      encrypted: 'END-TO-END ENCRYPTED',
      privacy: 'We never sell or share your data',
      signin: 'Sign in to LifeOS',
      assistant: 'Your personal AI assistant awaits.',
      magicLink: "We'll send you a secure magic link. No password required.",
      continue: 'Continue →',
      securePrivate: 'Secure & Private',
      alreadyAccount: 'Already have an account? Log in',
    },
    onboarding: {
      connect: "Let's connect your life.",
      description: 'LifeOS runs locally on your device. Grant access to enable these AI features securely.',
      calendar: 'Calendar Access',
      calendarDesc: 'Identify free slots for habits & deep work.',
      notifications: 'Notifications',
      notificationsDesc: 'Smart nudges at the right moments.',
      microphone: 'Microphone',
      microphoneDesc: 'Quick voice capture & journaling on the go.',
      photos: 'Photos',
      photosDesc: 'Analyze screenshots for your timeline.',
      private: 'PRIVATE BY DESIGN',
      continue: 'Continue',
      skip: 'Skip for now',
      connectWorld: 'Connect your world.',
      calendarNeed: 'LifeOS needs access to your calendars to proactively manage your time and reduce stress.',
      conflict: 'I can identify scheduling conflicts once connected.',
      notConnected: 'Not connected',
      connectButton: 'Connect',
      secure: 'PRIVATE & SECURE. WE NEVER SELL YOUR DATA.',
      reminderIntensity: 'Reminder Intensity',
      reminderDesc: "Tailor how LifeOS interrupts your flow. Choose the interruption level that fits your cognitive load.",
      gentle: 'Gentle Nudge (NORMAL)',
      gentleDesc: 'Standard notifications. Best for daily habits and low-priority tasks.',
      persistent: 'Persistent Focus (STRONG)',
      persistentDesc: 'Repeated alerts and haptic feedback. Perfect for important meetings and deadlines.',
      critical: 'Critical Override (CRITICAL)',
      criticalDesc: 'Breaks through Do Not Disturb. Only for true emergencies or non-negotiables.',
      save: 'Save Preferences ✓',
      widgetSetup: 'Widget Setup',
      widgetStep1: 'Long press anywhere on your home screen to enter jiggle mode.',
      widgetStep2: "Tap the '+' button in the top left corner of the screen.",
      widgetStep3: 'Search for LifeOS and add your widget.',
      done: 'Done ✓',
    },
    home: {
      goodMorning: 'Good morning, {{name}}',
      active: 'LIFEOS ACTIVE',
      energy: '{{percent}}% Energy',
      tasksLeft: '{{count}} Responsibilities',
      inputPlaceholder: 'Ayın 1\'inde kira gönder... Ekin\'in doğum günü 11 Nisan... Yumurta bitti, market listesi yap...',
      type: 'Type',
      send: 'Send',
      voice: 'VOICE',
      scan: 'Scan',
      nextCritical: 'NEXT CRITICAL RESPONSIBILITY',
      startFocus: '▶ Start Focus',
      todayGlance: 'Today at a glance',
    },
    inbox: {
      title: 'Inbox',
      pending: '{{count}} sorumluluk var',
      missed: 'MISSED CRITICAL RESPONSIBILITIES',
      highPriority: 'High Priority',
      snoozed: 'SNOOZED ITEMS',
      upcoming: 'UPCOMING RESPONSIBILITIES',
      dueAt: 'Due {{time}}',
      pausedUntil: 'Paused until {{date}}',
      scheduled: 'Scheduled',
      done: 'Done',
      complete: 'Complete',
      empty: 'Gelen kutusu boş.',
    },
    responsibility: {
      title: 'RESPONSIBILITY',
      checklist: 'Checklist',
      completed: '{{done}}/{{total}} Completed',
      schedule: 'Schedule',
      nextOccurrence: 'NEXT OCCURRENCE',
      edit: 'Edit',
      quickSnooze: 'QUICK SNOOZE',
      markDone: 'Mark as Done',
      couldntDo: "Couldn't do it",
    },
    couldntDo: {
      title: "It happens. What got in the way?",
      subtitle: "Let's find a better time for this responsibility. No pressure.",
      noTime: 'No Time',
      lowEnergy: 'Low Energy',
      forgot: 'Slipped my mind',
      priority: 'Something came up',
      suggestion: "Rest is productive too. Rescheduling this responsibility to Tomorrow, 10:00 AM fits your peak focus hours better.",
      reschedule: 'Reschedule to Tomorrow →',
      archive: 'Archive Responsibility',
    },
    ai: {
      assistant: 'LIFEOS ASSISTANT',
      understood: 'I understood:',
      when: 'WHEN',
      repeat: 'REPEAT',
      priority: 'PRIORITY',
      mode: 'MODE',
      confirm: '✔ Confirm Plan',
      edit: 'Edit Details',
      ask: 'Ask Question',
    },
    settings: {
      title: 'Settings',
      account: 'ACCOUNT',
      email: 'Email',
      language: 'Language',
      notifications: 'NOTIFICATIONS',
      reminderIntensity: 'Reminder Intensity',
      privacy: 'PRIVACY',
      dataControl: 'Data Control',
      manageData: 'Manage your data and privacy settings',
      signOut: 'Sign Out',
    },
  },
  tr: {
    welcome: {
      reclaim: 'Zihnini geri al.',
      description: 'Hayatını planlamak ve gürültüyü minimize etmek için tasarlanmış AI işletim sistemi.',
      getStarted: 'Başla →',
    },
    auth: {
      secure: 'LifeOS\'inizi Güvenceye Alın',
      subtitle: 'Sorumluluklarınız, cihazlar arasında güvenle senkronize edilir.',
      apple: 'Apple ile Devam Et',
      google: 'Google ile Devam Et',
      email: 'E-posta ile Devam Et',
      encrypted: 'UÇTAN UCA ŞİFRELİ',
      privacy: 'Verilerinizi asla satmayız veya paylaşmayız',
      signin: 'LifeOS\'a Giriş Yap',
      assistant: 'Kişisel AI asistanınız bekliyor.',
      magicLink: 'Size güvenli bir sihirli bağlantı göndereceğiz. Şifre gerekmez.',
      continue: 'Devam Et →',
      securePrivate: 'Güvenli ve Özel',
      alreadyAccount: 'Zaten hesabınız var mı? Giriş yapın',
    },
    onboarding: {
      connect: 'Hayatınızı bağlayalım.',
      description: 'LifeOS cihazınızda yerel olarak çalışır. Bu AI özelliklerini güvenle etkinleştirmek için erişim izni verin.',
      calendar: 'Takvim Erişimi',
      calendarDesc: 'Alışkanlıklar ve derin çalışma için boş zamanları belirleyin.',
      notifications: 'Bildirimler',
      notificationsDesc: 'Doğru anlarda akıllı hatırlatmalar.',
      microphone: 'Mikrofon',
      microphoneDesc: 'Hızlı ses kaydı ve günlük tutma.',
      photos: 'Fotoğraflar',
      photosDesc: 'Zaman çizelgeniz için ekran görüntülerini analiz edin.',
      private: 'TASARIM GEREĞİ ÖZEL',
      continue: 'Devam Et',
      skip: 'Şimdilik Atla',
      connectWorld: 'Dünyanızı bağlayın.',
      calendarNeed: 'LifeOS, zamanınızı proaktif olarak yönetmek ve stresi azaltmak için takvimlerinize erişime ihtiyaç duyar.',
      conflict: 'Bağlandıktan sonra zamanlama çakışmalarını belirleyebilirim.',
      notConnected: 'Bağlı değil',
      connectButton: 'Bağlan',
      secure: 'ÖZEL VE GÜVENLİ. VERİLERİNİZİ ASLA SATMAYIZ.',
      reminderIntensity: 'Hatırlatma Yoğunluğu',
      reminderDesc: 'LifeOS\'un akışınızı nasıl böldüğünü özelleştirin. Bilişsel yükünüze uygun kesinti seviyesini seçin.',
      gentle: 'Nazik Hatırlatma (NORMAL)',
      gentleDesc: 'Standart bildirimler. Günlük alışkanlıklar ve düşük öncelikli görevler için en iyisi.',
      persistent: 'Kalıcı Odak (GÜÇLÜ)',
      persistentDesc: 'Tekrarlanan uyarılar ve dokunsal geri bildirim. Önemli toplantılar ve son tarihler için mükemmel.',
      critical: 'Kritik Geçersiz Kılma (KRİTİK)',
      criticalDesc: 'Rahatsız Etmeyin modunu geçer. Yalnızca gerçek acil durumlar veya pazarlık edilemez durumlar için.',
      save: 'Tercihleri Kaydet ✓',
      widgetSetup: 'Widget Kurulumu',
      widgetStep1: 'Jiggle moduna girmek için ana ekranınızda herhangi bir yere uzun basın.',
      widgetStep2: 'Ekranın sol üst köşesindeki \'+\' düğmesine dokunun.',
      widgetStep3: 'LifeOS\'u arayın ve widget\'ınızı ekleyin.',
      done: 'Tamamlandı ✓',
    },
    home: {
      goodMorning: 'Günaydın, {{name}}',
      active: 'LIFEOS AKTİF',
      energy: '%{{percent}} Enerji',
      tasksLeft: '{{count}} Sorumluluk',
      inputPlaceholder: 'Bir antrenman kaydedin, bir e-posta taslağı oluşturun veya bir düşünce yakalayın...',
      type: 'Yaz',
      send: 'Gönder',
      voice: 'SES',
      scan: 'Tara',
      nextCritical: 'SONRAKİ KRİTİK SORUMLULUK',
      startFocus: '▶ Odaklanmaya Başla',
      todayGlance: 'Bugüne bir bakış',
    },
    inbox: {
      title: 'Gelen Kutusu',
      pending: '{{count}} sorumluluk var',
      missed: 'KAÇIRILAN KRİTİK SORUMLULUKLAR',
      highPriority: 'Yüksek Öncelik',
      snoozed: 'ERTELENMİŞ ÖĞELER',
      upcoming: 'YAKLAŞAN SORUMLULUKLAR',
      dueAt: '{{time}} tarihinde',
      pausedUntil: '{{date}} tarihine kadar duraklatıldı',
      scheduled: 'Zamanlanmış',
      done: 'Tamamlandı',
      complete: 'Tamamla',
      empty: 'Gelen kutunuz temiz.',
    },
    responsibility: {
      title: 'SORUMLULUK',
      checklist: 'Kontrol Listesi',
      completed: '{{done}}/{{total}} Tamamlandı',
      schedule: 'Zamanlama',
      nextOccurrence: 'SONRAKİ OLUŞUM',
      edit: 'Düzenle',
      quickSnooze: 'HIZLI ERTELEME',
      markDone: 'Tamamlandı Olarak İşaretle',
      couldntDo: 'Yapamadım',
    },
    couldntDo: {
      title: 'Olur böyle şeyler. Ne engel oldu?',
      subtitle: 'Bu sorumluluk için daha iyi bir zaman bulalım. Baskı yok.',
      noTime: 'Zaman Yok',
      lowEnergy: 'Düşük Enerji',
      forgot: 'Aklımdan çıktı',
      priority: 'Bir şey çıktı',
      suggestion: 'Dinlenmek de üretkendir. Bu sorumluluğu Yarın, 10:00\'a ertelemek, en yüksek odak saatlerinize daha iyi uyar.',
      reschedule: 'Yarına Ertle →',
      archive: 'Sorumluluğu Arşivle',
    },
    ai: {
      assistant: 'LIFEOS ASİSTAN',
      understood: 'Bunu böyle mi anladım?',
      when: 'NE ZAMAN',
      repeat: 'TEKRARLA',
      priority: 'ÖNCELİK',
      mode: 'MOD',
      confirm: '✔ Planı Onayla',
      edit: 'Detayları Düzenle',
      ask: 'Soru Sor',
    },
    settings: {
      title: 'Ayarlar',
      account: 'HESAP',
      email: 'E-posta',
      language: 'Dil',
      notifications: 'BİLDİRİMLER',
      reminderIntensity: 'Hatırlatma Yoğunluğu',
      privacy: 'GİZLİLİK',
      dataControl: 'Veri Kontrolü',
      manageData: 'Verilerinizi ve gizlilik ayarlarınızı yönetin',
      signOut: 'Çıkış Yap',
    },
  },
};

const i18n = new I18n(translations);

i18n.enableFallback = true;
i18n.locale = Localization.getLocales()[0]?.languageTag || 'en';

// Helper function to translate with interpolation
export const t = (key: string, params?: Record<string, string | number>): string => {
  let translation = i18n.t(key, params);
  
  // Handle nested keys (e.g., 'home.goodMorning')
  if (translation === key && key.includes('.')) {
    const parts = key.split('.');
    let current: any = translations[i18n.locale as keyof typeof translations];
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return key;
      }
    }
    translation = typeof current === 'string' ? current : key;
  }
  
  // Replace params
  if (params && translation !== key) {
    Object.entries(params).forEach(([param, value]) => {
      translation = translation.replace(`{{${param}}}`, String(value));
    });
  }
  
  return translation;
};

// Function to set language programmatically
export const setLanguage = (lang: 'en' | 'tr'): void => {
  i18n.locale = lang;
};

export default i18n;
