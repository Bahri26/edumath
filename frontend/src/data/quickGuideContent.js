/**
 * Öğretmen / öğrenci hızlı kılavuzu — GuideDrawer ve AudienceLandingPage ortak kaynak.
 * Dil anahtarları: TR | EN (LanguageContext: TR / EN ile eşleşir)
 *
 * Her blok: id, path (panel rotası), matchPrefixes (opsiyonel), title, lines, tip?
 */
export const QUICK_GUIDE = {
  teacher: {
    TR: {
      title: 'Öğretmen kılavuzu',
      intro:
        'Paneldeki temel akışları tek yerden hatırlatın. İlgili karttan sayfaya gidebilir veya tam kılavuzu açabilirsiniz.',
      fullGuidePath: '/teachers',
      blocks: [
        {
          id: 'questions',
          path: '/teacher/questions',
          title: 'Soru bankası',
          lines: [
            'Üst filtrelerle branş, sınıf, zorluk ve konu daraltın; metin araması ile hızlıca bulun.',
            'Kendi oluşturduğunuz sorular ile onaylı branş havuzundaki soruları aynı ekranda yönetirsiniz.',
            'Görselli sorularda küçük önizlemeyi genişleterek LaTeX ve şekilleri kontrol edin.',
          ],
          tip: 'Branş onayından sonra konu havuzu filtreleri otomatik olarak branşınıza sabitlenir.',
        },
        {
          id: 'exams',
          path: '/teacher/exams',
          title: 'Sınavlar',
          lines: [
            '«Hızlı sınav» ile sınıf, süre ve soru sayısını seçip tek tıkta taslak oluşturun (branş onayı gerekir).',
            '«7-7-7 stüdyo»da kolay / orta / zor dağılımını ince ayarlayıp sınav metnini düzenleyin.',
            'Listede arama ve sınıf filtresi kullanın; öğrenci girişleri sonuçlar sekmesinden izlenir.',
          ],
          tip: 'Tarih ve süre alanlarını doldurmadan yayınlamayı unutmayın.',
        },
        {
          id: 'skill-tree',
          path: '/teacher/skill-tree',
          title: 'Konu ve ders yapısı',
          lines: [
            '«Konu & ders yapısı» ile sınıf ve derse göre konu ekleyin; her konuya ders (lesson) bağlayın.',
            'Yukarı / aşağı düğmeleriyle konu ve ders sırasını öğrenci konu ağacı ile hizalayın.',
            'Ders silindiğinde ilgili öğrenci quiz ilerlemesi de temizlenir; silmeden önce onaylayın.',
          ],
        },
        {
          id: 'student-progress',
          path: '/teacher/student-progress',
          title: 'Öğrenci ilerleme',
          lines: [
            'Sınıf listesinden öğrenci seçin; ders bazlı doğru / yanlış ve XP özetini görün.',
            'URL’de ?student=… ile doğrudan bir öğrencinin paneline link verebilirsiniz.',
          ],
        },
        {
          id: 'reports',
          path: '/teacher/reports',
          title: 'Raporlar',
          lines: [
            'Dönem seçerek sınav ortalaması, katılım oranı ve günlük trend grafiğini canlı veriden alın.',
            'İpucu istekleri, öğrencilerin hangi konularda «İpucu al» dediğini gösterir.',
            '«Yazdır / PDF» ile tarayıcıdan PDF kaydı veya yazdırma yapabilirsiniz.',
          ],
        },
        {
          id: 'exercises',
          path: '/teacher/exercises',
          matchPrefixes: ['/teacher/exercises', '/teacher/pattern-builder'],
          title: 'Egzersizler ve kalıplar',
          lines: [
            'Egzersiz oluşturucu ile etkileşimli alıştırmalar hazırlayın; şablonlar zaman kazandırır.',
            'İhtiyaç halinde «Kalıp şablonları» sayfasından AI destekli paket üretimini deneyin.',
          ],
        },
        {
          id: 'account',
          path: '/teacher/settings',
          matchPrefixes: ['/teacher/settings', '/teacher/profile', '/teacher/surveys'],
          title: 'Anketler ve hesap',
          lines: [
            'Profil menüsünden «Anketler» ile ortak anket arayüzüne geçin.',
            'Profil ve ayarlardan şifre, dil ve görünüm tercihlerinizi güncelleyin.',
          ],
        },
      ],
    },
    EN: {
      title: 'Teacher quick guide',
      intro:
        'A compact reminder of key flows. Jump to a page from each card, or open the full guide.',
      fullGuidePath: '/teachers',
      blocks: [
        {
          id: 'questions',
          path: '/teacher/questions',
          title: 'Question bank',
          lines: [
            'Filter by branch, grade, difficulty, and topic; use text search for fast lookup.',
            'Manage your own items alongside the approved subject pool in one workspace.',
            'Expand visual previews to check LaTeX and diagrams before assigning.',
          ],
          tip: 'After branch approval, pool filters stay pinned to your teaching field.',
        },
        {
          id: 'exams',
          path: '/teacher/exams',
          title: 'Exams',
          lines: [
            'Use «Quick exam» for a fast draft with counts and timing (branch approval required).',
            'Use «7-7-7 studio» to tune easy / medium / hard mix and edit the exam text.',
            'Search and grade filters on the list; student attempts appear under results.',
          ],
          tip: 'Set start time and duration before publishing.',
        },
        {
          id: 'skill-tree',
          path: '/teacher/skill-tree',
          title: 'Topics & lessons',
          lines: [
            'Under «Topics & lessons», pick grade and subject, add topics, then attach lessons.',
            'Reorder topics and lessons so the student topic tree matches your sequence.',
            'Deleting a lesson clears related quiz progress; confirm when prompted.',
          ],
        },
        {
          id: 'student-progress',
          path: '/teacher/student-progress',
          title: 'Student progress',
          lines: [
            'Pick a student from the roster to see per-lesson correct, wrong, and XP.',
            'Deep-link with ?student=id on the progress URL when you need a shareable view.',
          ],
        },
        {
          id: 'reports',
          path: '/teacher/reports',
          title: 'Reports',
          lines: [
            'Choose a period for live charts: class average, participation, and daily trend.',
            'Hint requests show where learners pressed «Get hint».',
            '«Print / PDF» opens the browser print dialog.',
          ],
        },
        {
          id: 'exercises',
          path: '/teacher/exercises',
          matchPrefixes: ['/teacher/exercises', '/teacher/pattern-builder'],
          title: 'Exercises & patterns',
          lines: [
            'Build interactive drills in the exercise creator; templates speed up authoring.',
            'Optional: open «Pattern templates» for AI-assisted pattern packs when needed.',
          ],
        },
        {
          id: 'account',
          path: '/teacher/settings',
          matchPrefixes: ['/teacher/settings', '/teacher/profile', '/teacher/surveys'],
          title: 'Surveys & account',
          lines: [
            'Open «Surveys» from the profile menu for the shared survey experience.',
            'Profile and settings hold password, language, and theme preferences.',
          ],
        },
      ],
    },
  },
  student: {
    TR: {
      title: 'Öğrenci kılavuzu',
      intro:
        'Ders, sınav ve tekrar için kısa yollar. Bu sayfayla ilgili kartlar üstte; karttan ilgili sayfaya gidebilirsin.',
      fullGuidePath: '/students',
      blocks: [
        {
          id: 'home',
          path: '/student/home',
          title: 'Ana sayfa',
          lines: [
            '«Şimdi yap» ile bir sonraki göreve tek tıkla geç.',
            'Seri, günlük XP ve haftalık hedef burada; asıl çalışma ders ve sınav sayfalarında.',
          ],
        },
        {
          id: 'quizzes',
          path: '/student/quizzes',
          title: 'Sınavlar',
          lines: [
            '«Sınavlar» listesinde aktif sınavları aç; süre sayacını izleyerek tek seferde tamamla.',
            'Teslimden sonra sonuç ve geri bildirim öğretmen ayarına göre görünür.',
          ],
          tip: 'Bağlantı koparsa sayfayı yenilemeden önce sürenin dolmadığından emin ol.',
        },
        {
          id: 'courses',
          path: '/student/courses',
          title: 'Dersler ve konu ağacı',
          lines: [
            '«Derslerim»de sınıfına uygun konular listelenir; derse tıklayınca quiz açılır.',
            'Quiz bitince XP ve doğru / yanlış sayın öğretmeninin ilerleme panelinde görünür.',
          ],
        },
        {
          id: 'exercises',
          path: '/student/exercises',
          title: 'Çalışma merkezi',
          lines: [
            'Eksik konular için önerilen alıştırmalara çalışma merkezinden gir.',
            'Adım adım çözüm önerilerini not düşerek kendi özetine çevir.',
          ],
        },
        {
          id: 'assignments',
          path: '/student/assignments',
          matchPrefixes: ['/student/assignments', '/student/calendar'],
          title: 'Ödevler ve takvim',
          lines: [
            '«Ödevler» ve «Takvim» ile teslim tarihlerini planla; yaklaşan görevler ana sayfada öne çıkar.',
          ],
        },
        {
          id: 'messages',
          path: '/student/messages',
          title: 'Mesajlar',
          lines: [
            '«Mesajlar» ile öğretmen veya sınıf duyurularını takip et; okunmamışlar bildirimle vurgulanır.',
          ],
        },
        {
          id: 'account',
          path: '/student/settings',
          matchPrefixes: ['/student/settings', '/student/profile'],
          title: 'Profil ve ayarlar',
          lines: [
            'Profil ve ayarlardan şifre, dil ve karanlık mod gibi tercihleri güncelle.',
          ],
        },
      ],
    },
    EN: {
      title: 'Student quick guide',
      intro:
        'Short paths for study, exams, and review. Cards for this page float to the top; jump there from each card.',
      fullGuidePath: '/students',
      blocks: [
        {
          id: 'home',
          path: '/student/home',
          title: 'Home',
          lines: [
            'Use «Do this next» to jump into your next task in one click.',
            'Streak and XP live here; lessons and exams hold the real work.',
          ],
        },
        {
          id: 'quizzes',
          path: '/student/quizzes',
          title: 'Exams',
          lines: [
            'Open active exams from «Exams»; watch the timer and submit once you are done.',
            'Scores and feedback appear after submission when your teacher enables them.',
          ],
          tip: 'If the tab freezes, check the timer before refreshing the page.',
        },
        {
          id: 'courses',
          path: '/student/courses',
          title: 'Courses & topic tree',
          lines: [
            '«My courses» lists subjects for your level; tap a lesson to start its quiz.',
            'When you finish, XP and correct / wrong counts sync to your teacher’s progress view.',
          ],
        },
        {
          id: 'exercises',
          path: '/student/exercises',
          title: 'Study hub',
          lines: [
            'Open suggested drills for weak topics from the study hub.',
            'Turn step hints into your own short notes for spaced repetition.',
          ],
        },
        {
          id: 'assignments',
          path: '/student/assignments',
          matchPrefixes: ['/student/assignments', '/student/calendar'],
          title: 'Assignments & calendar',
          lines: [
            'Use «Assignments» and «Calendar» to plan due dates; upcoming work surfaces on home.',
          ],
        },
        {
          id: 'messages',
          path: '/student/messages',
          title: 'Messages',
          lines: [
            'Check «Messages» for teacher notes or class announcements; unread items stay highlighted.',
          ],
        },
        {
          id: 'account',
          path: '/student/settings',
          matchPrefixes: ['/student/settings', '/student/profile'],
          title: 'Profile & settings',
          lines: [
            'Profile and settings hold password, language, and theme preferences.',
          ],
        },
      ],
    },
  },
};

/** Pathname ile eşleşen blokları üste alır; aktif id’yi döner. */
export function orderGuideBlocks(blocks = [], pathname = '') {
  const path = String(pathname || '');
  const scored = blocks.map((block, index) => {
    const prefixes = Array.isArray(block.matchPrefixes) && block.matchPrefixes.length
      ? block.matchPrefixes
      : [block.path].filter(Boolean);
    const active = prefixes.some((p) => path === p || path.startsWith(`${p}/`));
    return { block, index, active };
  });
  scored.sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    return a.index - b.index;
  });
  const ordered = scored.map((s) => ({ ...s.block, _active: s.active }));
  const activeId = scored.find((s) => s.active)?.block?.id || null;
  return { ordered, activeId };
}
