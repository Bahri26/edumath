/**
 * Öğretmen / öğrenci hızlı kılavuzu — GuideDrawer ve AudienceLandingPage ortak kaynak.
 * Dil anahtarları: TR | EN (LanguageContext: TR / EN ile eşleşir)
 */
export const QUICK_GUIDE = {
  teacher: {
    TR: {
      title: 'Öğretmen kullanım kılavuzu',
      intro:
        'Paneldeki temel akışları tek yerden hatırlatın. Menüden ilgili sayfaya geçerek adımları uygulayın.',
      blocks: [
        {
          title: 'Soru bankası',
          lines: [
            'Üst filtrelerle branş, sınıf, zorluk ve konu daraltın; metin araması ile hızlıca bulun.',
            'Kendi oluşturduğunuz sorular ile onaylı branş havuzundaki soruları aynı ekranda yönetirsiniz.',
            'Görselli sorularda küçük önizlemeyi genişleterek LaTeX ve şekilleri kontrol edin.',
          ],
          tip: 'Branş onayından sonra konu havuzu filtreleri otomatik olarak branşınıza sabitlenir.',
        },
        {
          title: 'Sınavlar',
          lines: [
            '«Hızlı sınav» ile sınıf, süre ve soru sayısını seçip tek tıkta taslak oluşturun (branş onayı gerekir).',
            '«7-7-7 stüdyo»da kolay / orta / zor dağılımını ince ayarlayıp sınav metnini düzenleyin.',
            'Listede arama ve sınıf filtresi kullanın; öğrenci girişleri sonuçlar sekmesinden izlenir.',
          ],
          tip: 'Tarih ve süre alanlarını doldurmadan yayınlamayı unutmayın.',
        },
        {
          title: 'Konu ve ders yapısı',
          lines: [
            '«Konu & ders yapısı» ile sınıf ve derse göre konu ekleyin; her konuya ders (lesson) bağlayın.',
            'Sürükle benzeri yukarı / aşağı düğmeleriyle konu ve ders sırasını öğrenci «Konu ağacı» görünümüyle hizalayın.',
            'Ders silindiğinde ilgili öğrenci quiz ilerlemesi de temizlenir; silmeden önce onaylayın.',
          ],
        },
        {
          title: 'Öğrenci ilerleme',
          lines: [
            'Sınıf listesinden öğrenci seçin; ders bazlı doğru / yanlış ve XP özetini görün.',
            'URL’de ?student=… ile doğrudan bir öğrencinin paneline link verebilirsiniz.',
          ],
        },
        {
          title: 'Raporlar',
          lines: [
            'Dönem seçerek sınav ortalaması, katılım oranı ve günlük trend grafiğini canlı veriden alın.',
            'İpucu istekleri, öğrencilerin hangi konularda «İpucu al» dediğini gösterir; zayıf nokta analizi için kullanın.',
            '«Yazdır / PDF» ile tarayıcıdan PDF kaydı veya yazdırma yapabilirsiniz.',
          ],
        },
        {
          title: 'Egzersizler ve kalıplar',
          lines: [
            'Egzersiz oluşturucu ile etkileşimli alıştırmalar hazırlayın; şablonlar zaman kazandırır.',
            'İhtiyaç halinde «Kalıp şablonları» sayfasından AI destekli paket üretimini deneyin.',
          ],
        },
        {
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
        'A compact reminder of key flows. Use the side menu to open each area when you are ready.',
      blocks: [
        {
          title: 'Question bank',
          lines: [
            'Filter by branch, grade, difficulty, and topic; use text search for fast lookup.',
            'Manage your own items alongside the approved subject pool in one workspace.',
            'Expand visual previews to check LaTeX and diagrams before assigning.',
          ],
          tip: 'After branch approval, pool filters stay pinned to your teaching field.',
        },
        {
          title: 'Exams',
          lines: [
            'Use «Quick exam» for a fast draft with counts and timing (branch approval required).',
            'Use «7-7-7 studio» to tune easy / medium / hard mix and edit the exam text.',
            'Search and grade filters on the list; student attempts appear under results.',
          ],
          tip: 'Set start time and duration before publishing.',
        },
        {
          title: 'Topics & lessons',
          lines: [
            'Under «Topics & lessons», pick grade and subject, add topics, then attach lessons.',
            'Reorder topics and lessons so the student «Topic tree» matches your teaching sequence.',
            'Deleting a lesson clears related quiz progress; confirm when prompted.',
          ],
        },
        {
          title: 'Student progress',
          lines: [
            'Pick a student from the roster to see per-lesson correct, wrong, and XP.',
            'Deep-link with ?student=id on the progress URL when you need a shareable view.',
          ],
        },
        {
          title: 'Reports',
          lines: [
            'Choose a period for live charts: class average, participation, and daily submission trend.',
            'Hint requests show where learners pressed «Get hint»—useful for remediation planning.',
            '«Print / PDF» opens the browser print dialog to save or print the report block.',
          ],
        },
        {
          title: 'Exercises & patterns',
          lines: [
            'Build interactive drills in the exercise creator; templates speed up authoring.',
            'Optional: open «Pattern templates» for AI-assisted pattern packs when needed.',
          ],
        },
        {
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
      title: 'Öğrenci kullanım kılavuzu',
      intro:
        'Ders çalışma, sınav ve tekrar için kısa yollar. Her bölüm menüdeki gerçek sayfaya karşılık gelir.',
      blocks: [
        {
          title: 'Ana sayfa',
          lines: [
            'Son kaldığın derse hızlı dönüş kartlarını ve günlük hedeflerini buradan takip et.',
            'Özet istatistikler motivasyon içindir; asıl içerik ders ve sınav sayfalarında.',
          ],
        },
        {
          title: 'Sınavlar',
          lines: [
            '«Sınavlar» listesinde aktif sınavları aç; süre sayacını izleyerek tek seferde tamamla.',
            'Teslimden sonra sonuç ve geri bildirim öğretmen ayarına göre görünür.',
          ],
          tip: 'Bağlantı koparsa sayfayı yenilemeden önce sürenin dolmadığından emin ol.',
        },
        {
          title: 'Konu ağacı ve ders quizleri',
          lines: [
            '«Konu ağacı»nda sınıfına uygun konular listelenir; her ders adına tıklayınca quiz açılır.',
            'Quiz bitince XP ve doğru / yanlış sayın ilerleme panelinde öğretmeninle paylaşılır.',
          ],
        },
        {
          title: 'AI antrenman ve pratik',
          lines: [
            'Eksik konular için önerilen alıştırmalar veya AI destekli tekrar alanları varsa buradan gir.',
            'Adım adım çözüm önerilerini not düşerek kendi özetine çevir.',
          ],
        },
        {
          title: 'Ödevler ve takvim',
          lines: [
            '«Ödevler» ve «Takvim» ile teslim tarihlerini planla; yaklaşan görevler ana sayfada öne çıkar.',
          ],
        },
        {
          title: 'Mesajlar ve sınıf',
          lines: [
            '«Mesajlar» ile öğretmen veya sınıf duyurularını takip et; okunmamışlar bildirimle vurgulanır.',
          ],
        },
        {
          title: 'Liderlik ve profil',
          lines: [
            '«Liderlik» tablosunda sınıf içi sıralamayı görebilirsin; rekabet sağlıklı kalsın.',
            'Profil ve ayarlardan şifre, dil ve karanlık mod gibi tercihleri güncelle.',
          ],
        },
      ],
    },
    EN: {
      title: 'Student quick guide',
      intro:
        'Short paths for study, exams, and review. Each block maps to a real page in the menu.',
      blocks: [
        {
          title: 'Home',
          lines: [
            'Jump back to your last lesson from quick cards and scan daily goals.',
            'Summary stats are motivational; lessons and exams hold the real work.',
          ],
        },
        {
          title: 'Exams',
          lines: [
            'Open active exams from «Exams»; watch the timer and submit once you are done.',
            'Scores and feedback appear after submission when your teacher enables them.',
          ],
          tip: 'If the tab freezes, check the timer before refreshing the page.',
        },
        {
          title: 'Topic tree & lesson quizzes',
          lines: [
            '«Topic tree» lists subjects for your level; tap a lesson title to start its quiz.',
            'When you finish, XP and correct / wrong counts sync to your teacher’s progress view.',
          ],
        },
        {
          title: 'AI training & practice',
          lines: [
            'Enter suggested drills or AI coaching areas when they appear for weak topics.',
            'Turn step hints into your own short notes for spaced repetition.',
          ],
        },
        {
          title: 'Assignments & calendar',
          lines: [
            'Use «Assignments» and «Calendar» to plan due dates; upcoming work surfaces on home.',
          ],
        },
        {
          title: 'Messages & class',
          lines: [
            'Check «Messages» for teacher notes or class announcements; unread items stay highlighted.',
          ],
        },
        {
          title: 'Leaderboard & profile',
          lines: [
            '«Leaderboard» shows class rankings if enabled—keep competition friendly.',
            'Profile and settings hold password, language, and theme preferences.',
          ],
        },
      ],
    },
  },
};
