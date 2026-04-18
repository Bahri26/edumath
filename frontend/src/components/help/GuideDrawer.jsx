import React from 'react';
import { X, BookOpen, CheckCircle2 } from 'lucide-react';

const contentByAudience = {
  teacher: {
    title: 'Ogretmen Hizli Kılavuz',
    items: [
      'Soru Bankasi ekranindan sorulari filtreleyin, gorselli sorulari genisleterek kontrol edin.',
      'Sinav Yonetimi tarafinda 7-7-7 studio veya Hizli Sinav ile sinav olusturun.',
      'Ogrenci ilerlemesini dashboard ozetlerinden ve sinav katilimlarindan takip edin.',
      'Brans onayi geldiyse havuz filtreleri otomatik olarak alaniniza sabitlenir.',
    ],
  },
  student: {
    title: 'Ogrenci Hizli Kılavuz',
    items: [
      'Ana sayfadan son kaldigin derse don ve gunluk hedeflerini kontrol et.',
      'Sinavlar ekraninda aktif sinavlari baslat, sureyi takip ederek tamamla.',
      'Sinav sonrasi AI antrenman alaninda eksik konularina ozel alistirma coz.',
      'Yaklasan gorevler ve ilerleme paneli ile gunluk calismayi duzenli tut.',
    ],
  },
};

export default function GuideDrawer({ audience = 'student', open, onClose }) {
  const content = contentByAudience[audience] || contentByAudience.student;

  return (
    <div className={`fixed inset-0 z-[160] transition ${open ? 'pointer-events-auto' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div className={`absolute inset-0 bg-slate-900/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
      <aside className={`absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 shadow-2xl transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300">
              <BookOpen size={18} />
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">{content.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Bu panel, ilgili roldeki en kritik akislari sayfa degistirmeden hatirlatir.</p>
          {content.items.map((item) => (
            <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
              <CheckCircle2 size={18} className="mt-0.5 text-emerald-600" />
              <p className="text-sm text-slate-700 dark:text-slate-200">{item}</p>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}