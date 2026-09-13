import { logger } from '../../utils/logger';

export interface ColumnMappingResult {
  mapping: Record<string, string>; // canonicalField -> originalColumnHeader
  confidence: number;
  provider: 'gemini' | 'heuristic_multilingual';
  sampleRowCountAnalyzed: number;
}

export class GeminiService {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  }

  /**
   * Intelligently maps arbitrary Google Sheet column headers to COD Flow canonical fields.
   * Strict constraint: Analyzes at most 10 rows to minimize Gemini API token consumption.
   */
  async mapSheetColumns(
    headers: string[],
    sampleRows: any[] = []
  ): Promise<ColumnMappingResult> {
    // ENFORCE: At most 10 sample rows to minimize API token cost
    const trimmedRows = (sampleRows || []).slice(0, 10);
    const rowCount = trimmedRows.length;

    logger.info(`Mapping sheet columns with ${rowCount} sample rows (max 10 rows cap enforced)`, {
      headers,
      rowCount,
    });

    // Check if Gemini API verification is toggled on in .env
    const isGeminiEnabled =
      process.env.ENABLE_GEMINI_SHEETS_AI !== 'false' &&
      process.env.ENABLE_GEMINI_SHEETS_AI !== '0';

    // If Gemini AI is enabled and Gemini API Key is available, use Gemini 1.5 Flash
    if (isGeminiEnabled && this.apiKey) {
      try {
        const geminiResult = await this.callGeminiModel(headers, trimmedRows);
        if (geminiResult && Object.keys(geminiResult).length > 0) {
          return {
            mapping: geminiResult,
            confidence: 0.95,
            provider: 'gemini',
            sampleRowCountAnalyzed: rowCount,
          };
        }
      } catch (err: any) {
        logger.warn(`Gemini column mapping failed, falling back to multilingual heuristic: ${err.message}`);
      }
    } else if (!isGeminiEnabled) {
      logger.info('Gemini Sheets AI verification is disabled via ENABLE_GEMINI_SHEETS_AI=false in .env. Using local multi-vocabulary matcher.');
    }

    // High-fidelity multilingual heuristic fallback (Arabic, French, English)
    const heuristicMapping = this.mapUsingMultilingualHeuristics(headers, trimmedRows);
    return {
      mapping: heuristicMapping,
      confidence: 0.88,
      provider: 'heuristic_multilingual',
      sampleRowCountAnalyzed: rowCount,
    };
  }

  private async callGeminiModel(
    headers: string[],
    sampleRows: any[]
  ): Promise<Record<string, string>> {
    const prompt = `
You are an expert e-commerce data engineer specializing in Cash-On-Delivery (COD) orders across North Africa and the Middle East (Morocco, GCC, etc.).
Given the following Google Sheet column headers and a maximum of 10 sample data rows, map the sheet's headers to our standard canonical fields.

Canonical fields to map:
- customerName (Customer full name, buyer name)
- customerPhone (Customer phone number, mobile, whatsapp, tel)
- city (Destination city or town)
- shippingAddress (Delivery street, address, location, district)
- codAmount (Total cash on delivery amount to collect, price, total)
- productName (Product name, title, item)
- quantity (Item quantity or count)
- notes (Customer instructions, delivery notes, remarks)
- orderId (Order reference or ID, if present)

Headers:
${JSON.stringify(headers, null, 2)}

Sample Rows (up to 10 rows):
${JSON.stringify(sampleRows, null, 2)}

Instructions:
1. Return ONLY a valid JSON object where keys are the canonical field names above, and values are the exact matching header string from the input Headers array.
2. The headers and sample values may be in French (Nom, Téléphone, Ville, Adresse, Prix), Arabic (الاسم, الهاتف, المدينة, العنوان, المبلغ, المنتج, الكمية), Darija, or English.
3. If a field cannot be matched, do not include it.
4. Do NOT include markdown code blocks or explanatory text, just raw JSON.
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    const data: any = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) return {};

    const cleanJson = candidateText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  }

  /**
   * Multilingual fallback matcher covering Arabic, French, and English vocabulary
   */
  private mapUsingMultilingualHeuristics(
    headers: string[],
    sampleRows: any[]
  ): Record<string, string> {
    const dictionary: Record<string, string[]> = {
      customerName: [
        'nom', 'client', 'nom complet', 'nom client', 'destinataire', 'nom et prenom', 'customer', 'customer name',
        'name', 'full name', 'buyer', 'الاسم', 'اسم العميل', 'اسم الزبون', 'المشتري', 'المستلم', 'الاسم الكامل'
      ],
      customerPhone: [
        'telephone', 'tel', 'phone', 'gsm', 'mobile', 'portable', 'numero', 'phone number', 'whatsapp', 'contact',
        'الهاتف', 'رقم الهاتف', 'الجوال', 'نمرة', 'موبايل', 'واتساب'
      ],
      city: [
        'ville', 'city', 'destination', 'localite', 'region', 'commune', 'gouvernorat', 'المدينة', 'الولاية', 'المحافظة', 'البلدية'
      ],
      shippingAddress: [
        'adresse', 'address', 'shipping address', 'rue', 'quartier', 'delivery address', 'location',
        'العنوان', 'عنوان التوصيل', 'مكان الاستلام', 'الحي', 'الشارع'
      ],
      codAmount: [
        'prix', 'price', 'total', 'montant', 'cod', 'total price', 'amount', 'prix total', 'somme', 'a payer',
        'المبلغ', 'السعر', 'ثمن', 'مجموع', 'الدفع عند الاستلام', 'المبلغ الاجمالي'
      ],
      productName: [
        'produit', 'product', 'article', 'designation', 'item', 'product name', 'pack', 'offre',
        'المنتج', 'السلعة', 'اسم المنتج', 'البضاعة', 'العرض'
      ],
      quantity: [
        'quantite', 'qte', 'quantity', 'qty', 'nombre', 'count', 'الكمية', 'العدد', 'كمية'
      ],
      notes: [
        'note', 'notes', 'remarque', 'comment', 'instructions', 'observations', 'message',
        'ملاحظات', 'ملاحظة', 'تفاصيل', 'تعليمات'
      ],
      orderId: [
        'id', 'order id', 'reference', 'ref', 'code', 'numero commande', 'order #', 'رقم الطلب', 'المعرف', 'كود'
      ],
    };

    const mapping: Record<string, string> = {};
    const usedHeaders = new Set<string>();

    // Pass 1: Direct Header matching
    for (const [canonicalKey, synonyms] of Object.entries(dictionary)) {
      for (const header of headers) {
        if (usedHeaders.has(header)) continue;
        const normalizedHeader = header.toLowerCase().trim().replace(/[_\s-]+/g, ' ');

        const matched = synonyms.some(synonym => {
          const normSyn = synonym.toLowerCase().trim();
          return normalizedHeader === normSyn || normalizedHeader.includes(normSyn) || normSyn.includes(normalizedHeader);
        });

        if (matched) {
          mapping[canonicalKey] = header;
          usedHeaders.add(header);
          break;
        }
      }
    }

    // Pass 2: Data inspection on sample rows (max 10) for any missing critical columns
    if (!mapping.customerPhone && sampleRows.length > 0) {
      for (const header of headers) {
        if (usedHeaders.has(header)) continue;
        const isPhoneLike = sampleRows.some(row => {
          const val = String(row[header] || '').replace(/[\s+-]/g, '');
          return /^0[567][0-9]{8}$/.test(val) || /^(212|966|971|20)[0-9]{8,11}$/.test(val);
        });
        if (isPhoneLike) {
          mapping.customerPhone = header;
          usedHeaders.add(header);
          break;
        }
      }
    }

    return mapping;
  }
}
