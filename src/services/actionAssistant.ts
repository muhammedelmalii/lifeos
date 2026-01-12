/**
 * Action-Oriented Assistant Service
 * LifeOS'un farkı: Chat cevap vermek için değil, aksiyon üretmek için var
 */

export interface ActionResponse {
  message: string; // Kısa, net cevap
  actions: ActionButton[]; // Aksiyon butonları
  autoActions?: AutoAction[]; // Otomatik yapılacaklar
  parsedActions?: {
    type: 'create' | 'update' | 'list' | 'schedule' | 'note';
    data: any;
  };
  detectedType?: 'bill' | 'refrigerator' | 'note' | 'screenshot' | 'other';
  extractedData?: {
    items?: string[];
    content?: string;
    tags?: string[];
    category?: string;
    dueDate?: Date;
    amount?: number;
    vendor?: string;
  };
}

export interface ActionButton {
  id: string;
  label: string;
  type: 'confirm' | 'suggest' | 'alternative';
  action: () => Promise<void> | void;
  icon?: string;
}

export interface AutoAction {
  type: 'create' | 'update' | 'delete' | 'schedule';
  data: any;
  execute: () => Promise<void>;
}

export interface ParsedVoiceInput {
  parts: VoicePart[];
  summary: string;
}

export interface VoicePart {
  type: 'task' | 'shopping' | 'schedule' | 'note' | 'query' | 'context';
  content: string;
  parsed: any; // ParsedCommand veya benzeri
}

/**
 * Generate action-oriented response for chat input
 */
export const generateActionResponse = async (
  userInput: string,
  context?: {
    currentSchedule?: any[];
    currentLists?: any[];
    currentTasks?: any[];
  }
): Promise<ActionResponse> => {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  
  if (!apiKey) {
    // Fallback to simple response
    return {
      message: 'Anladım. Ne yapmak istersiniz?',
      actions: [],
    };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Sen LifeOS'un aksiyon odaklı asistanısın. ÖNEMLİ: Chat cevap vermek için değil, aksiyon üretmek için var.

KURALLAR:
1. Kısa, net cevaplar ver (maksimum 2 cümle)
2. Asla "Şunu da yapayım mı?" gibi 5 soru sorma
3. Tek cevap + tek onay prensibi
4. Kullanıcının durumunu anla ve aksiyon öner

ÖRNEKLER:

Kullanıcı: "Bugün çok yoğunum"
Sen: "Anladım. Bugün 14:00–18:00 dolu görünüyorsun. Sadece 10 dakikalık bir şey mi yapalım?"
Butonlar: ["✔️ Evet", "⏰ Akşama al", "❌ Bugün pas"]

Kullanıcı: "Ekmek bitmiş"
Sen: "Ekmek market listesine eklendi ✅"
Butonlar: [] (otomatik yapıldı)

Kullanıcı: "Bu faturayı ödemem lazım"
Sen: "Fatura analiz edildi. Son ödeme tarihinden 2 gün önce hatırlatayım mı?"
Butonlar: ["✔️ Evet", "📅 Farklı tarih"]

Kullanıcı: "Haftaya spor yapmam lazım"
Sen: "Haftaya spor planını oluşturayım mı? En uygun zamanları bulabilirim."
Butonlar: ["✔️ Planla", "⏰ Daha sonra"]

JSON formatında dön:
{
  "message": "Kısa cevap (maksimum 2 cümle)",
  "actions": [
    {
      "id": "action_1",
      "label": "Buton metni",
      "type": "confirm|suggest|alternative",
      "icon": "emoji veya boş"
    }
  ],
  "parsedActions": {
    "type": "create|update|list|schedule",
    "data": {...}
  }
}

Türkçe cevap ver.`,
          },
          {
            role: 'user',
            content: userInput,
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return {
      message: result.message,
      actions: result.actions || [],
      parsedActions: result.parsedActions,
    };
  } catch (error) {
    console.error('Action response generation failed:', error);
    return {
      message: 'Anladım. Ne yapmak istersiniz?',
      actions: [],
    };
  }
};

/**
 * Parse long voice input into parts
 * "Bugün nöbet var, spor yapamam ama yarın mutlaka yapmak istiyorum, ayrıca ekmek de bitmiş olabilir"
 * → [
 *   { type: 'context', content: 'Bugün nöbet var' },
 *   { type: 'schedule', content: 'spor yapamam ama yarın mutlaka yapmak istiyorum' },
 *   { type: 'shopping', content: 'ekmek de bitmiş olabilir' }
 * ]
 */
export const parseLongVoiceInput = async (
  voiceText: string
): Promise<ParsedVoiceInput> => {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  
  if (!apiKey) {
    return {
      parts: [{ type: 'context', content: voiceText, parsed: null }],
      summary: voiceText,
    };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Kullanıcının uzun konuşmasını parçalara ayır ve her parçayı kategorize et.

Kategoriler:
- task: Görev/responsibility
- shopping: Alışveriş listesi
- schedule: Planlama/zamanlama
- note: Not
- query: Sorgu
- context: Bağlam/bilgi

Örnek:
"Bugün nöbet var, spor yapamam ama yarın mutlaka yapmak istiyorum, ayrıca ekmek de bitmiş olabilir"

→ [
  { type: 'context', content: 'Bugün nöbet var' },
  { type: 'schedule', content: 'spor yapamam ama yarın mutlaka yapmak istiyorum', parsed: { title: 'Spor', schedule: { datetime: 'yarın' } } },
  { type: 'shopping', content: 'ekmek de bitmiş olabilir', parsed: { listActions: [{ listName: 'Shopping List', items: ['ekmek'] }] } }
]

Her parça için parsed objesi oluştur (ParsedCommand formatında).

JSON dön:
{
  "parts": [...],
  "summary": "Tek cümle özet"
}`,
          },
          {
            role: 'user',
            content: voiceText,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error('Voice parsing failed:', error);
    return {
      parts: [{ type: 'context', content: voiceText, parsed: null }],
      summary: voiceText,
    };
  }
};

/**
 * Analyze photo and generate action-oriented response
 */
export const analyzePhotoForActions = async (
  imageUri: string,
  ocrText?: string
): Promise<ActionResponse> => {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  
  if (!apiKey) {
    return {
      message: 'Fotoğraf analiz ediliyor...',
      actions: [],
    };
  }

  try {
    // Convert image to base64 for API
    // Note: In production, use vision API properly
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Fotoğrafı analiz et ve aksiyon öner.

Fotoğraf tipleri:
1. Fatura/belge → Fatura bilgilerini çıkar, ödeme hatırlatıcısı öner
2. Buzdolabı → Eksik ürünleri tespit et, alışveriş listesi öner
3. Not kağıdı → Notu çıkar, not olarak kaydet veya göreve dönüştür
4. Ekran görüntüsü (vardiya/takvim) → Tarihleri çıkar, plan revize et
5. Diğer → Genel analiz yap

OCR metni: ${ocrText || 'Yok'}

JSON dön:
{
  "message": "Kısa analiz ve öneri",
  "actions": [...],
  "detectedType": "bill|refrigerator|note|screenshot|other",
  "extractedData": {...}
}`,
          },
          {
            role: 'user',
            content: ocrText || 'Bu fotoğrafı analiz et ve aksiyon öner.',
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error('Photo analysis failed:', error);
    return {
      message: 'Fotoğraf analiz edilemedi. Lütfen daha net bir görüntü gönderin.',
      actions: [],
    };
  }
};
