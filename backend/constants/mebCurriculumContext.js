/**
 * Resmi MEB müfredat giriş noktaları — üretilen sorulara kazanım/öğrenme alanı satırı yazdırırken referans olarak kullanılır.
 * (Metin doğrudan siteden çekilmez; Gemini + isteğe bağlı Google araması bağlam olarak kullanılır.)
 */

const MEB_PRIMARY_CURRICULUM_URL =
  process.env.MEB_CURRICULUM_URL || 'https://mufredat.meb.gov.tr/ProgramDetay.aspx?PID=961';

/** Öğretim programı matematik bağlamı — kısa, prompt içi blok */
function buildMebPromptBlock({ subject = 'Matematik', topic = '', classLevel = '' }) {
  return `
ZORUNLU CERCEVE — MEVCUT MUFREDAT VE GUVENILIR KAYNAK:
- ${subject} dersi Turkiye Milli Egitim Bakanligi ogretim programiyla uyumlu olmali (ogrenme alanlari, bilissel surecler, matematiksel beceriler).
- Resmi program sayfalari ornek: ${MEB_PRIMARY_CURRICULUM_URL}
- Soru metni ve celdiriciler akademik olarak tutarli, sinif (${classLevel}) duzeyine uygun; fazla akademik jargondan kacin ama matematik dilini koru.

KONU: ${topic}
Her soruda "mebReference" alanine MEB Matematik Ogretim Programi (guncellenmis surum) ile uyumlu, kisa bir referans yaz (orneğin öğrenme alanı/kazanım türünü düş yapıcı metin olarak ifade et; numarayi bilmiyorsan genel alan belirt).

Guvenilir dis kaynak gerektiginde: tanimlar/yasalar için Google arama zemini kullanildiginda ozellikle egitim, MEB veya akademik uyumlu sayfalari tercih et; dogrulanamaz iddia yazma.
`.trim();
}

module.exports = {
  MEB_PRIMARY_CURRICULUM_URL,
  buildMebPromptBlock,
};
