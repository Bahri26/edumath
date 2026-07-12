/**
 * Öğeyi yazdır / PDF kaydet (tarayıcı print diyaloğu).
 * TeacherReports ile aynı görünürlük deseni.
 */
export function printElementById(elementId, { title } = {}) {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  const prevTitle = document.title;
  if (title) document.title = title;

  const style = document.createElement('style');
  style.setAttribute('data-matova-print', '1');
  style.textContent = `
    @media print {
      body * { visibility: hidden !important; }
      #${elementId}, #${elementId} * { visibility: visible !important; }
      #${elementId} {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        background: white !important;
        color: black !important;
        box-shadow: none !important;
        border: none !important;
      }
      .no-print { display: none !important; }
    }
  `;
  document.head.appendChild(style);
  window.print();
  document.head.removeChild(style);
  if (title) document.title = prevTitle;
}
