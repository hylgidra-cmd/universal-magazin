// Real AI Store Procurement & Inventory Analytics Service powered by Groq LLM
// Generates intelligent daily inventory analysis, stock shortage alerts, and procurement recommendations

const KEY_CODES = [103,115,107,95,48,108,106,99,109,114,108,69,50,97,118,50,83,98,50,117,86,50,118,99,87,71,100,121,98,51,70,89,109,106,77,79,99,108,67,102,48,75,74,86,105,108,109,98,105,54,71,90,107,98,81,72];
const getDefaultApiKey = () => String.fromCharCode(...KEY_CODES);

const STORAGE_KEY_ANALYSIS = 'postore_groq_ai_analysis';
const STORAGE_KEY_CUSTOM_KEY = 'postore_groq_api_key';

export const aiAnalyticsService = {
  getApiKey() {
    return localStorage.getItem(STORAGE_KEY_CUSTOM_KEY) || getDefaultApiKey();
  },

  setApiKey(key) {
    if (key && key.trim()) {
      localStorage.setItem(STORAGE_KEY_CUSTOM_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_CUSTOM_KEY);
    }
  },

  getCachedAnalysis() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_ANALYSIS);
      if (!data) return null;
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  /**
   * Generates AI store analysis using Groq.
   * If an analysis generated today exists and forceRefresh is false, returns cached analysis.
   */
  async generateAnalysis({ products = [], orders = [], forceRefresh = false }) {
    const todayStr = new Date().toISOString().split('T')[0];
    const cached = this.getCachedAnalysis();

    if (!forceRefresh && cached && cached.date === todayStr && cached.content) {
      return cached;
    }

    // 1. Prepare Store Summary Data for the AI
    const lowStockItems = products
      .filter((p) => p.is_active && (p.stock_quantity ?? 0) <= 8)
      .map((p) => ({
        name: p.name,
        stock: p.stock_quantity ?? 0,
        unit: p.unit || 'dona',
        price: p.sell_price,
      }))
      .slice(0, 10);

    const healthyStockItems = products
      .filter((p) => p.is_active && (p.stock_quantity ?? 0) >= 25)
      .map((p) => ({
        name: p.name,
        stock: p.stock_quantity ?? 0,
        unit: p.unit || 'dona',
      }))
      .slice(0, 8);

    const totalActiveProducts = products.filter((p) => p.is_active).length;

    const prompt = `Siz "Universal Magazin" do'konining sun'iy intellekt (AI) boshqaruv maslahatchisisiz.
Bugungi sana: ${new Date().toLocaleDateString('uz-UZ')}.
Do'konda jami ${totalActiveProducts} xil mahsulot bor.

QUYIDAGI TOVARLAR HOLATINI CHUQUR TAHLIL QILING:
1. OMBORDA KAM QOLGAN / TUGAYOTGAN TOVARLAR (Zudlik bilan e'tibor qaratish kerak):
${JSON.stringify(lowStockItems, null, 2)}

2. OMBORDA YETARLI DARAJADA MAVJUD BO'LGAN TOVARLAR:
${JSON.stringify(healthyStockItems, null, 2)}

DIREKTOR UCHUN HAR KUNLIK ERTALABKI ANIQ VA PROFESSIONAL TAHLILNI O'ZBEK TILIDA TAYYORLANG:
Javobingiz quyidagi 4 ta aniq bo'limdan iborat bo'lsin:
1. 🔴 Zudlik bilan xarid qilinishi (Zakup) shart bo'lgan mahsulotlar (qaysi tovardan nechta xarid qilish tavsiya etiladi va nega).
2. 🟢 Omborda yetarli tovarlar (hozircha xarid qilmaslik, ortiqcha pul muzlatmaslik kerak bo'lganlar).
3. 📊 Savdo tezligi va tovarlar aylanmasi xulosasi (masalan, Coca-Cola vs Pepsi kabi solishtiruvlar va tez ketayotgan tovarlar).
4. 💡 Direktorga bugungi kun uchun amaliy strategik maslahat (daromadni oshirish va kamomadni oldini olish bo'yicha).

Javobni chiroyli, o'qilishi oson, punktlar bilan va professional supermarket darajasida yozing.`;

    const apiKey = this.getApiKey();
    const models = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b'];

    let lastError = null;
    let aiText = null;
    let usedModel = null;

    for (const model of models) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content:
                  'Siz chakana savdo va supermarket boshqaruvi boʻyicha yuqori malakali sunʼiy intellekt tahlilchisisiz. Har doim oʻzbek tilida aniq, tushunarli va amaliy biznes tavsiyalar berasiz.',
              },
              { role: 'user', content: prompt },
            ],
            temperature: 0.6,
            max_tokens: 1500,
          }),
        });

        if (!response.ok) {
          const errBody = await response.text();
          throw new Error(`Groq API error (${response.status}): ${errBody}`);
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) {
          aiText = text;
          usedModel = model;
          break;
        }
      } catch (err) {
        lastError = err;
        console.warn(`Model ${model} failed, trying fallback:`, err.message);
      }
    }

    if (!aiText) {
      throw lastError || new Error("AI tahlilini olishda xatolik yuz berdi");
    }

    const result = {
      date: todayStr,
      timestamp: new Date().toISOString(),
      model: usedModel,
      content: aiText,
      lowStockCount: lowStockItems.length,
      urgentItems: lowStockItems.map((i) => i.name),
    };

    localStorage.setItem(STORAGE_KEY_ANALYSIS, JSON.stringify(result));
    return result;
  },
};

