# EduMath — WCAG 2.1 Erişilebilirlik Kontrol Listesi

Hedef seviye: **[WCAG 2.1 Level AA](https://www.w3.org/WAI/WCAG21/quickref/)** (uluslararası kamu ve kurumsal ihalelerde yaygın standart).

**Mevcut tahmini uyum:** ~**%55–60 AA** (kısmi A, AA için sistematik denetim gerekli).

---

## Özet

| Prensip | Durum | Puan (/10) |
|---------|-------|------------|
| 1. Algılanabilir (Perceivable) | 🟡 | 6,0 |
| 2. İşletilebilir (Operable) | 🟡 | 6,5 |
| 3. Anlaşılabilir (Understandable) | 🟢 | 7,5 |
| 4. Sağlam (Robust) | 🟢 | 7,0 |
| **Ortalama** | | **~6,8 / 10** |

---

## Otomatik tarama (ilk adım)

### Lighthouse (Chrome DevTools)

1. [https://edumath-client.onrender.com/](https://edumath-client.onrender.com/) açın
2. F12 → Lighthouse → Accessibility + Best Practices
3. Hedef: **Accessibility ≥ 90**

### axe DevTools (browser extension)

Kritik sayfalar:

- `/` (landing)
- Login modal
- `/student/study-hub`
- `/teacher/questions`
- `/admin/users`

### Komut satırı (yerel build)

```powershell
cd c:\Projects\edumath-main\frontend
npm run build
npx @axe-core/cli dist/index.html
```

### ESLint jsx-a11y (opsiyonel ekleme)

```powershell
npm install -D eslint-plugin-jsx-a11y
# eslint.config.js içine plugin jsx-a11y kuralları
```

---

## Kodda mevcut iyi uygulamalar

| Özellik | Dosya / alan |
|---------|----------------|
| Modal focus trap | `useFocusTrap.js`, `ConfirmModal.jsx` |
| `aria-modal`, `aria-labelledby` | `ConfirmModal.jsx` |
| Form alanı etiketleri | `FormField.jsx`, `Input.jsx`, `Select.jsx` |
| `aria-hidden` dekoratif ikonlar | `SkillTreeBuilder.jsx`, `Navbar.jsx` |
| Dil değiştirme (i18n) | `LanguageContext`, `messages.js` |
| Boş durum mesajları | `EmptyState.jsx`, `AdminTableEmpty` |
| Klavye: Tab döngüsü modallarda | `useFocusTrap` |

---

## WCAG kriterleri — sayfa bazlı checklist

Durum: ✅ Uygun | 🟡 Kısmi | ⬜ Kontrol edilmedi | ❌ Bilinen sorun

### Genel (tüm uygulama)

| Kriter | Seviye | Durum | Not / aksiyon |
|--------|--------|-------|---------------|
| 1.1.1 Non-text Content | A | 🟡 | Soru görsellerinde `alt` metni audit |
| 1.3.1 Info and Relationships | A | 🟡 | Tablo başlıkları admin sayfalarında |
| 1.4.3 Contrast (Minimum) | AA | ⬜ | Tailwind slate/indigo paleti — axe ile ölç |
| 1.4.4 Resize Text | AA | 🟡 | `rem` tabanlı; 200% zoom test |
| 1.4.10 Reflow | AA | 🟡 | Admin tablolar yatay kaydırma + `AdminScrollHint` |
| 2.1.1 Keyboard | A | 🟡 | Modallar iyi; dropdown/menüler test |
| 2.1.2 No Keyboard Trap | A | ✅ | Focus trap cleanup var |
| 2.4.1 Bypass Blocks | A | ⬜ | “Skip to main content” linki yok — **ekleyin** |
| 2.4.2 Page Titled | A | 🟡 | React route başlıkları (`document.title`) |
| 2.4.3 Focus Order | A | 🟡 | Modal açılış focus — `useFocusTrap` |
| 2.4.4 Link Purpose | A | 🟡 | “Buraya tıklayın” tarzı metinlerden kaçının |
| 2.4.7 Focus Visible | AA | ⬜ | `:focus-visible` ring tüm interaktif öğelerde |
| 3.1.1 Language of Page | A | 🟡 | `<html lang="tr">` / dinamik `en` |
| 3.2.2 On Input | A | 🟡 | Form auto-submit yok — iyi |
| 3.3.1 Error Identification | A | 🟡 | Toast + form hataları i18n |
| 3.3.2 Labels or Instructions | A | 🟢 | `FormField` pattern |
| 4.1.2 Name, Role, Value | A | 🟡 | Custom button/div onClick audit |

---

### Landing + Navbar

| Sayfa | Kontrol | Durum | Aksiyon |
|-------|---------|-------|---------|
| `/` | Hero kontrast | ⬜ | Lighthouse |
| `/` | Chatbox klavye | 🟡 | Tab ile input + gönder |
| Navbar | Mobil menü `aria-expanded` | ⬜ | `Navbar.jsx` kontrol |
| Login modal | Focus trap + Esc kapatma | 🟡 | Esc handler ekle (yoksa) |
| Login modal | Hata duyurusu `role="alert"` | ⬜ | |

---

### Öğrenci

| Sayfa | Kontrol | Durum | Aksiyon |
|-------|---------|-------|---------|
| Study Hub | Filtre select label | 🟢 | `aria-label` / visible label |
| Study Hub | Egzersiz kartları | 🟡 | Kart → link veya button rolü |
| Exercise Player | Zamanlayıcı | 🟡 | `aria-live="polite"` süre için |
| Exercise Player | Soru görseli alt | ⬜ | `alt={question.title}` |
| Weak Topics | Buton isimleri | 🟢 | Konu adı buton metninde |
| Calendar | Takvim klavye | ⬜ | |

---

### Öğretmen

| Sayfa | Kontrol | Durum | Aksiyon |
|-------|---------|-------|---------|
| Question Bank | Tablo mobil | 🟡 | Kart görünümü veya scroll hint |
| Question Bank | Modal “Gelişmiş” | 🟡 | Focus trap doğrula |
| Question Form | Kaynak banner okunabilir | 🟢 | AI/Uzman etiket |
| Skill Tree | Yukarı/aşağı `aria-label` | ✅ | |
| Exams | Sınav sil `aria-label` | 🟡 | TR sabit — i18n |
| Student Progress | Büyük tablo | 🟡 | `AdminScrollHint` benzeri |

---

### Admin

| Sayfa | Kontrol | Durum | Aksiyon |
|-------|---------|-------|---------|
| Users | Mobil kart | ✅ | |
| Users | Tablo `<th scope>` | ⬜ | |
| Activity | Tarih format i18n | ✅ | |
| Reset requests | Onay modal | ✅ | ConfirmModal |

---

## Hızlı kazanımlar (1–2 gün, +15–20 puan)

### 1. Skip link (2.4.1)

`App.jsx` veya `DashboardLayout.jsx` en üste:

```jsx
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-2 focus:bg-white">
  {t.skipToContent}
</a>
<main id="main-content" tabIndex={-1}>...</main>
```

`messages.js`: `skipToContent: 'Ana içeriğe atla'` / `'Skip to main content'`

### 2. `<html lang>` dinamik

`LanguageContext` içinde:

```js
document.documentElement.lang = locale === 'en' ? 'en' : 'tr';
```

### 3. Focus visible (2.4.7)

Global CSS (tailwind `@layer base`):

```css
:focus-visible {
  outline: 2px solid theme('colors.indigo.500');
  outline-offset: 2px;
}
```

### 4. Soru görselleri alt metni (1.1.1)

Exercise player ve soru önizlemede:

```jsx
<img src={url} alt={question.imageAlt || question.title || t.questionImage} />
```

### 5. Canlı bölge — timer (4.1.3)

```jsx
<span aria-live="polite" aria-atomic="true">{formattedTime}</span>
```

---

## Manuel test senaryoları

| # | Senaryo | Beklenen |
|---|---------|----------|
| 1 | Sadece Tab ile login → Study Hub → egzersiz aç | Tüm adımlar klavye ile |
| 2 | Ekran okuyucu (NVDA/VoiceOver) login modal | Rol ve etiket okunur |
| 3 | %200 browser zoom | Yatay scroll minimum |
| 4 | Dark mode kontrast | Metin/arka plan AA (4.5:1 normal metin) |
| 5 | Renk körlüğü simülasyonu | Durum sadece renkle verilmesin (ikon + metin) |

---

## Kontrast kontrolü (1.4.3 AA)

Minimum oranlar:

- Normal metin: **4.5:1**
- Büyük metin (18pt+): **3:1**
- UI bileşenleri / grafik: **3:1**

Şüpheli Tailwind çiftleri (axe ile doğrulayın):

- `text-slate-400` on `bg-slate-900` (dark)
- `text-indigo-400` on white
- Disabled button states

Araç: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

## i18n ve erişilebilirlik

WCAG 3.1.2 **Language of Parts**: İngilizce UI’da kalan TR stringler hem i18n hem a11y sorunu.

**Öncelikli dosyalar (TR sabit string):**

- `TeacherExerciseCreator.jsx`
- `QuestionBank.jsx` (kısmi tamamlandı)
- `ExamsPage.jsx` / `TeacherExamsPage.jsx`
- `AdminLayout`, `AdminLogin`, `AdminDashboard`

---

## CI entegrasyonu (öneri)

`.github/workflows/ci.yml` frontend job’a:

```yaml
- run: npm run build
- run: npx playwright test e2e/a11y-smoke.spec.js
```

Örnek Playwright a11y testi:

```js
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('landing has no critical a11y violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(v => v.impact === 'critical')).toEqual([]);
});
```

Paket: `@axe-core/playwright`

---

## 90 günlük a11y yol haritası

| Sprint | İş | Hedef |
|--------|-----|-------|
| 1 | Skip link + html lang + focus-visible | 65% AA |
| 2 | Image alt + aria-live timer | 70% AA |
| 3 | Navbar/mobile menu ARIA | 75% AA |
| 4 | Kontrast düzeltmeleri (axe raporu) | 80% AA |
| 6 | Tam i18n (teacher/admin) | 85% AA |
| 8 | Playwright a11y CI | Sürekli regresyon |

İlgili: [PRE-DEPLOY.md](./PRE-DEPLOY.md), [deploy-checklist.md](./deploy-checklist.md)
