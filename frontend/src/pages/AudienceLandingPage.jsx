import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, GraduationCap, LineChart, Microscope, Sparkles, Users } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import LoginModal from '../components/modals/LoginModal';
import Chatbox from '../components/ui/Chatbox';
import FadeIn from '../components/ui/FadeIn';
import { AuthContext } from '../context/AuthContext';
import { translations } from '../data/translations';

const upsertMeta = (selector, attribute, value) => {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement('meta');
    const [attrName, attrValue] = selector
      .replace('meta[', '')
      .replace(']', '')
      .split('=');

    element.setAttribute(attrName, attrValue.replace(/"/g, ''));
    document.head.appendChild(element);
  }

  element.setAttribute(attribute, value);
};

const updateCanonical = (href) => {
  let link = document.head.querySelector('link[rel="canonical"]');

  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }

  link.setAttribute('href', href);
};

const upsertJsonLd = (data) => {
  let script = document.head.querySelector('script[data-edumath-jsonld="audience"]');

  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-edumath-jsonld', 'audience');
    document.head.appendChild(script);
  }

  script.textContent = JSON.stringify(data);
};

const audienceContent = {
  tr: {
    student: {
      badge: 'Ogrenci Akisi',
      title: 'Ogrenciler icin net, seviyeye gore ilerleyen matematik yolu',
      intro: 'Sinif duzeyi, konu sirasi ve ogrenme hizi birlikte ele alinmis bir calisma akisi.',
      seoDescription: 'Edumath ogrenci kullanim kilavuzu ile ders akisi, odev takibi, sinav sureci ve seviyeye gore ilerleme yapisini inceleyin.',
      primaryCta: 'Ogrenci paneline gir',
      secondaryCta: 'Ana sayfaya don',
      heroIcon: GraduationCap,
      highlights: ['Sinif bazli ilerleme', 'Konu odakli calisma duzeni', 'Yapay zeka destekli yonlendirme'],
      sections: {
        aboutTitle: 'Bu akis kimin icin?',
        aboutText: 'Ilkokuldan lise son sinifa kadar matematikte duzenli ilerlemek isteyen ogrenciler icin tasarlandi.',
        curriculumTitle: 'Nasil calisir?',
        curriculumText: 'Mufredat, konu akisi ve tekrar yapisi ayni ekranda yonetilir. Ogrenci hangi seviyede ise oradan ilerler.',
        coursesTitle: 'Neler kazanir?',
        coursesText: 'Duzenli calisma ritmi, hedef odakli icerik secimi ve yalnizca ihtiyac duyulan konulara odaklanma.',
        contactTitle: 'Okul ve bireysel kullanim icin',
        contactText: 'Ogrenci hesaplari, ders takibi ve ilerleme gorunumu ile gunluk kullanim icin hazirdir.',
      },
      featureCards: [
        { title: 'Seviyeye Gore Ders Rotasi', desc: 'Sinif ve konu filtresi ile sadece ihtiyac duyulan derslere odaklanin.', icon: LineChart },
        { title: 'Odev ve Sinav Takibi', desc: 'Gelen gorevleri, tekrar planini ve sinav akisini tek yerden izleyin.', icon: CheckCircle2 },
        { title: 'Kalici Ogrenme Rutini', desc: 'Kisa ama duzenli tekrar bloklari ile ilerleme kaybi yasamayin.', icon: Sparkles },
      ],
      guide: {
        title: 'Ogrenci Kullanim Kilavuzu',
        intro: 'Platformu ilk kez kullanan bir ogrenci icin en hizli baslangic akisi asagidaki gibidir.',
        steps: [
          {
            title: 'Hesaba giris yap ve ana sayfayi ac',
            desc: 'Giris sonrasinda ogrenci panelindeki ana sayfadan guncel ders, odev ve sinav akisini gor.',
          },
          {
            title: 'Sinif ve ders seviyeni kontrol et',
            desc: 'Sana uygun konu listesinin acilmasi icin dogru sinif seviyesi ve ders akisini sec.',
          },
          {
            title: 'Derslerini ve odevlerini sirayla tamamla',
            desc: 'Ilk olarak bekleyen odevleri bitir, sonra ders iceriklerine ve tekrar bloklarina gec.',
          },
          {
            title: 'Sinavlardan sonra eksik konulari isaretle',
            desc: 'Sinav sonucu sonrasi zorlandigin konu basliklarini not et ve ayni gun icinde kisa tekrar yap.',
          },
          {
            title: 'Takvim ve ilerleme ekranini haftalik kontrol et',
            desc: 'Haftanin sonunda tamamlanan dersleri, bekleyen gorevleri ve bir sonraki hedefleri gozden gecir.',
          },
        ],
        tips: [
          'Her gun kisa ama duzenli tekrar yapisi daha verimli calisir.',
          'Sadece ihtiyac duydugun konulara odaklanmak ilerleme hizini artirir.',
          'Sinav sonrasi ayni gun icinde yapilan tekrar kaliciligi guclendirir.',
        ],
      },
    },
    teacher: {
      badge: 'Ogretmen Akisi',
      title: 'Ogretmenler icin soru, sinav ve ogrenci takibi odakli kontrol paneli',
      intro: 'Icerik uretimi ve olcme-degerlendirme surecini tek panelde toplayan ogretmen odakli akis.',
      seoDescription: 'Edumath ogretmen kullanim kilavuzu ile soru bankasi, sinav olusturma, ogrenci takibi ve raporlama akislarini inceleyin.',
      primaryCta: 'Ogretmen paneline gir',
      secondaryCta: 'Ana sayfaya don',
      heroIcon: Users,
      highlights: ['Soru bankasi yonetimi', 'Sinav ve egzersiz olusturma', 'Ogrenci ilerleme takibi'],
      sections: {
        aboutTitle: 'Bu akis neyi cozer?',
        aboutText: 'Ogretmenin soru secme, sinav kurma ve ogrenci performansini izleme surecini hizlandirir.',
        curriculumTitle: 'Nasil calisir?',
        curriculumText: 'Ders hedefleri, sinif seviyesi ve konu uyumu uzerinden icerik secilir; sinav ve egzersiz akislari buna gore kurulir.',
        coursesTitle: 'Neler var?',
        coursesText: 'Soru havuzu, sinav filtreleme, kazanima gore planlama ve raporlama ekranlari.',
        contactTitle: 'Kurum kullanimi icin uygun',
        contactText: 'Ogretmen ekiplerinin ayni icerik altyapisini paylasabilecegi, sinif bazli kullanim icin uygun duzen.',
      },
      featureCards: [
        { title: 'Hizli Soru Secimi', desc: 'Ders, sinif ve zorluk seviyesine gore soru havuzunu daraltin.', icon: CheckCircle2 },
        { title: 'Sinav Akisi', desc: 'Secilen sorularla hizli sinav kurgusu olusturun ve tekrar kullanin.', icon: LineChart },
        { title: 'Ogrenci Gozlemi', desc: 'Ilerleme, eksik konu ve performans egilimlerini tek yerden izleyin.', icon: Users },
      ],
      guide: {
        title: 'Ogretmen Kullanim Kilavuzu',
        intro: 'Platformu ders yonetimi icin kullanan bir ogretmenin temel akisi asagidaki adimlarla ilerler.',
        steps: [
          {
            title: 'Once soru bankasini filtrele',
            desc: 'Ders, sinif seviyesi, konu ve zorluk alanlarini secerek gereksiz kayitlari disarida birak.',
          },
          {
            title: 'Sinav veya egzersiz akisini olustur',
            desc: 'Secilen sorulari bir sinav ya da egzersiz setine donustur ve amacina gore kaydet.',
          },
          {
            title: 'Kazanima gore dagilimi kontrol et',
            desc: 'Hazirlanan icerigin konu ve kazanima gore dengeli olup olmadigini son kez incele.',
          },
          {
            title: 'Ogrenci ilerleme ekranindan sonuc takip et',
            desc: 'Uygulama sonrasi zorlanilan konulari ve sinif genelindeki egilimleri ogrenci takip ekranindan izle.',
          },
          {
            title: 'Raporlara gore bir sonraki icerigi planla',
            desc: 'Elde edilen sonuclara gore yeni egzersiz, tekrar veya sinav yapisini belirle.',
          },
        ],
        tips: [
          'Sinav olusturmadan once soru havuzunu daraltmak sureyi ciddi bicimde azaltir.',
          'Sinif degistiginde konu ve soru havuzunu yeniden yuklemek daha dogru sonuc verir.',
          'Rapor ekranini yalnizca sonuc icin degil bir sonraki planlama icin kullan.',
        ],
      },
    },
    research: {
      badge: 'Akademik Arastirma',
      title: 'Yuksek lisans ve doktora duzeyi matematik icin ayri bir calisma katmani',
      intro: 'Ders katalogundan ayri duran; makale, seminer, proof workshop ve tez uretkenligini merkeze alan bir arastirma akisi.',
      seoDescription: 'Edumath akademik arastirma alani; paper review, proof workshop, tez uretkenligi ve seminer odakli matematik calisma akislarini sunar.',
      primaryCta: 'Arastirma akisina gir',
      secondaryCta: 'Ana sayfaya don',
      heroIcon: Microscope,
      highlights: ['Makale ve preprint inceleme', 'Seminer ve okuma gruplari', 'Tez ve yayin uretkenligi'],
      sections: {
        aboutTitle: 'Bu akis kimin icin?',
        aboutText: 'Lisansustu ogrenciler, doktora arastirmacilari ve ileri matematikte uretim odakli calisanlar icin tasarlandi.',
        curriculumTitle: 'Nasil kullanilir?',
        curriculumText: 'Problem tanimi, literatur tarama, proof roadmap ve acik problem takibi ayni calisma duzeni icinde ilerler.',
        coursesTitle: 'Neleri destekler?',
        coursesText: 'Paper reading, tez akisi, lemma planlama, karsi ornek tarama ve uzmanlasma rotalari.',
        contactTitle: 'Danismanlik ve demo akisi',
        contactText: 'Arastirma gruplari veya kurum bazli kullanim senaryolari icin ayrica uyarlanabilir.',
      },
      featureCards: [
        { title: 'Paper Review Workspace', desc: 'Makale ozetleri, onkosul listeleri ve kavram haritalari icin yapilandirilmis alan.', icon: Microscope },
        { title: 'Proof Workshop', desc: 'Ispat taslaklari, lemma onerileri ve karsi ornek odakli calisma bloklari.', icon: Sparkles },
        { title: 'Arastirma Yol Haritasi', desc: 'Tez konusundan yayin akisina uzanan ilerleme cizgisi.', icon: LineChart },
      ],
    },
  },
  en: {
    student: {
      badge: 'Student Flow',
      title: 'A clear mathematics journey for students organized by level',
      intro: 'A study flow where grade level, topic order, and learning pace are handled together.',
      seoDescription: 'Review the Edumath student usage guide covering lesson flow, assignments, exams, and level-based learning structure.',
      primaryCta: 'Open student panel',
      secondaryCta: 'Back to homepage',
      heroIcon: GraduationCap,
      highlights: ['Level-based progression', 'Topic-centered study flow', 'AI-supported guidance'],
      sections: {
        aboutTitle: 'Who is this for?',
        aboutText: 'Built for students from primary school through high school who need a stable math progression path.',
        curriculumTitle: 'How does it work?',
        curriculumText: 'Curriculum, topic order, and revision rhythm are managed together so the student continues from the right level.',
        coursesTitle: 'What do students gain?',
        coursesText: 'A reliable study routine, targeted content selection, and focus on the topics that matter most.',
        contactTitle: 'Ready for school and individual use',
        contactText: 'Student accounts, lesson tracking, and progress visibility are already structured for regular use.',
      },
      featureCards: [
        { title: 'Level-Based Lesson Route', desc: 'Focus only on the lessons that fit the student through class and topic filters.', icon: LineChart },
        { title: 'Assignment and Exam Tracking', desc: 'Follow incoming work, revision flow, and exams in one place.', icon: CheckCircle2 },
        { title: 'Sustained Study Routine', desc: 'Keep progress stable with short but consistent revision blocks.', icon: Sparkles },
      ],
      guide: {
        title: 'Student Usage Guide',
        intro: 'This is the fastest starting flow for a student using the platform for the first time.',
        steps: [
          {
            title: 'Sign in and open the home panel',
            desc: 'After login, start from the student home page to see current lessons, assignments, and exam flow.',
          },
          {
            title: 'Confirm your class level and lesson path',
            desc: 'Choose the correct grade level so the right topic list and lesson sequence open for you.',
          },
          {
            title: 'Complete lessons and assignments in order',
            desc: 'Finish pending assignments first, then continue with lesson content and revision blocks.',
          },
          {
            title: 'Mark weak topics after exams',
            desc: 'After each exam, note the topics where you struggled and repeat them on the same day.',
          },
          {
            title: 'Review calendar and progress weekly',
            desc: 'At the end of each week, check completed lessons, pending work, and the next study targets.',
          },
        ],
        tips: [
          'Short, consistent revision blocks are more effective than irregular long sessions.',
          'Focusing only on the topics you need speeds up your progress.',
          'Same-day review after an exam improves retention.',
        ],
      },
    },
    teacher: {
      badge: 'Teacher Flow',
      title: 'A control panel for teachers focused on questions, exams, and student tracking',
      intro: 'A teacher-facing workflow that brings content production and assessment together in one place.',
      seoDescription: 'Review the Edumath teacher usage guide for question bank filtering, exam creation, student tracking, and reporting workflows.',
      primaryCta: 'Open teacher panel',
      secondaryCta: 'Back to homepage',
      heroIcon: Users,
      highlights: ['Question bank management', 'Exam and exercise creation', 'Student progress tracking'],
      sections: {
        aboutTitle: 'What does this solve?',
        aboutText: 'It shortens the cycle of selecting questions, building exams, and observing student performance.',
        curriculumTitle: 'How does it work?',
        curriculumText: 'Content is selected by class level, learning outcome, and topic fit, then carried into exam and exercise flows.',
        coursesTitle: 'What is included?',
        coursesText: 'Question pools, exam filtering, outcome-based planning, and reporting screens.',
        contactTitle: 'Suitable for institutions',
        contactText: 'Structured for class-based use and for teams of teachers sharing the same content foundation.',
      },
      featureCards: [
        { title: 'Fast Question Selection', desc: 'Narrow the pool by lesson, class level, and difficulty.', icon: CheckCircle2 },
        { title: 'Exam Workflow', desc: 'Build reusable exam structures quickly from selected questions.', icon: LineChart },
        { title: 'Student Observation', desc: 'Watch progress, missing topics, and performance patterns from one place.', icon: Users },
      ],
      guide: {
        title: 'Teacher Usage Guide',
        intro: 'The core workflow for a teacher using the platform for lesson and assessment management is shown below.',
        steps: [
          {
            title: 'Start by filtering the question bank',
            desc: 'Use lesson, class level, topic, and difficulty filters to exclude irrelevant records early.',
          },
          {
            title: 'Create an exam or exercise flow',
            desc: 'Turn the selected questions into an exam or exercise set and save it according to your teaching goal.',
          },
          {
            title: 'Check outcome coverage',
            desc: 'Review whether the content distribution stays balanced across topics and learning outcomes.',
          },
          {
            title: 'Track results through student progress',
            desc: 'After applying the activity, inspect difficult topics and class-level patterns through the student progress view.',
          },
          {
            title: 'Plan the next content round from reports',
            desc: 'Use the results to decide the next exercise, revision, or exam structure.',
          },
        ],
        tips: [
          'Narrowing the question pool before exam creation saves significant time.',
          'When the class changes, reload topic and question filters for cleaner results.',
          'Use reports not only to observe results but also to shape the next plan.',
        ],
      },
    },
    research: {
      badge: 'Academic Research',
      title: 'A separate workspace for graduate and doctoral mathematics',
      intro: 'A research flow separated from the lesson catalog, centered on papers, seminars, proof work, and thesis productivity.',
      seoDescription: 'Edumath research space offers mathematics workflows for paper review, proof workshops, thesis productivity, and seminar-centered study.',
      primaryCta: 'Open research flow',
      secondaryCta: 'Back to homepage',
      heroIcon: Microscope,
      highlights: ['Paper and preprint review', 'Seminars and reading groups', 'Thesis and publication productivity'],
      sections: {
        aboutTitle: 'Who is this for?',
        aboutText: 'Designed for graduate students, doctoral researchers, and advanced mathematics users working toward research output.',
        curriculumTitle: 'How is it used?',
        curriculumText: 'Problem framing, literature scanning, proof roadmap planning, and open-problem tracking stay in the same working flow.',
        coursesTitle: 'What does it support?',
        coursesText: 'Paper reading, thesis flow, lemma planning, counterexample scanning, and specialization routes.',
        contactTitle: 'Consulting and demo flow',
        contactText: 'It can be adapted further for research groups and institution-level use cases.',
      },
      featureCards: [
        { title: 'Paper Review Workspace', desc: 'A structured area for summaries, prerequisite maps, and concept graphs.', icon: Microscope },
        { title: 'Proof Workshop', desc: 'Focused blocks for proof drafts, lemma suggestions, and counterexample exploration.', icon: Sparkles },
        { title: 'Research Roadmap', desc: 'A progression line from thesis direction to publication workflow.', icon: LineChart },
      ],
    },
  },
};

const AudienceLandingPage = ({ audience }) => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [lang, setLang] = useState('tr');
  const [theme, setTheme] = useState('light');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const t = translations[lang] || translations.tr;
  const content = audienceContent[lang]?.[audience] || audienceContent.tr.student;
  const HeroIcon = content.heroIcon;
  const canonicalPath = audience === 'student' ? '/students' : audience === 'teacher' ? '/teachers' : '/research';

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const routeForAudience = () => {
    if (audience === 'student') {
      navigate('/student/home');
      return;
    }

    if (audience === 'teacher') {
      navigate('/teacher/overview');
      return;
    }

    if (user?.role === 'teacher' || user?.role === 'admin') {
      navigate('/teacher/overview');
      return;
    }

    if (user?.role === 'student') {
      navigate('/student/home');
      return;
    }

    setIsLoginModalOpen(true);
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const pageTitle = `Edumath | ${content.title}`;
    const canonicalUrl = `${window.location.origin}${canonicalPath}`;

    document.title = pageTitle;
    document.documentElement.lang = lang;

    upsertMeta('meta[name="description"]', 'content', content.seoDescription);
    upsertMeta('meta[property="og:title"]', 'content', pageTitle);
    upsertMeta('meta[property="og:description"]', 'content', content.seoDescription);
    upsertMeta('meta[property="og:url"]', 'content', canonicalUrl);
    upsertMeta('meta[property="og:locale"]', 'content', lang === 'tr' ? 'tr_TR' : 'en_US');
    upsertMeta('meta[name="twitter:title"]', 'content', pageTitle);
    upsertMeta('meta[name="twitter:description"]', 'content', content.seoDescription);
    updateCanonical(canonicalUrl);
    upsertJsonLd({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: pageTitle,
      description: content.seoDescription,
      url: canonicalUrl,
      about: audience,
      inLanguage: lang,
    });
  }, [audience, canonicalPath, content.seoDescription, content.title, lang]);

  const handleLoginSuccess = (userRole) => {
    setIsLoginModalOpen(false);

    if (userRole === 'teacher' || userRole === 'admin') {
      navigate('/teacher/overview');
      return;
    }

    navigate('/student/home');
  };

  const sections = [
    { id: 'about', title: content.sections.aboutTitle, text: content.sections.aboutText },
    { id: 'curriculum', title: content.sections.curriculumTitle, text: content.sections.curriculumText },
    { id: 'courses', title: content.sections.coursesTitle, text: content.sections.coursesText },
    { id: 'contact', title: content.sections.contactTitle, text: content.sections.contactText },
  ];
  const hasGuide = Boolean(content.guide);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <Navbar
        lang={lang}
        setLang={setLang}
        theme={theme}
        toggleTheme={toggleTheme}
        t={t}
        onLoginClick={() => setIsLoginModalOpen(true)}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        t={t}
        onLoginSuccess={handleLoginSuccess}
      />

      <main className="flex-grow">
        <section id="home" className="relative overflow-hidden px-4 pb-20 pt-32 sm:px-6 lg:px-8">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.16),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.14),_transparent_30%)]" />
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <FadeIn delay={50}>
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-indigo-700 dark:border-indigo-900 dark:bg-gray-900/80 dark:text-indigo-300">
                  <HeroIcon size={16} />
                  {content.badge}
                </div>
                <h1 className="mt-6 max-w-4xl text-4xl font-black leading-tight text-gray-900 dark:text-white md:text-6xl">
                  {content.title}
                </h1>
                <p className="mt-6 max-w-3xl text-lg leading-8 text-gray-600 dark:text-gray-300 md:text-xl">
                  {content.intro}
                </p>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <button
                    type="button"
                    onClick={routeForAudience}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-7 py-4 text-base font-bold text-white shadow-xl shadow-indigo-200/60 transition hover:bg-indigo-700"
                  >
                    {content.primaryCta}
                    <ArrowRight size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-7 py-4 text-base font-bold text-gray-700 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
                  >
                    {content.secondaryCta}
                  </button>
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={180} direction="up">
              <div className="rounded-[2rem] border border-gray-200 bg-white/90 p-8 shadow-2xl shadow-gray-200/60 dark:border-gray-800 dark:bg-gray-900/90 dark:shadow-none">
                <p className="text-sm font-black uppercase tracking-[0.24em] text-indigo-600 dark:text-indigo-400">
                  {lang === 'tr' ? 'One Cikan Basliklar' : 'Key Highlights'}
                </p>
                <div className="mt-6 space-y-4">
                  {content.highlights.map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-2xl bg-gray-50 px-4 py-4 dark:bg-gray-800/80">
                      <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-500" size={20} />
                      <p className="text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        <section className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
            {content.featureCards.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <FadeIn key={feature.title} delay={120 + index * 100} direction="up">
                  <div className="rounded-[1.75rem] border border-gray-200 bg-white p-6 shadow-lg shadow-gray-200/40 dark:border-gray-800 dark:bg-gray-900 dark:shadow-none">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">
                      <Icon size={20} />
                    </div>
                    <h2 className="mt-5 text-xl font-black text-gray-900 dark:text-white">{feature.title}</h2>
                    <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">{feature.desc}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2">
            {sections.map((section, index) => (
              <FadeIn key={section.id} delay={120 + index * 80} direction="up">
                <article id={section.id} className="rounded-[2rem] border border-gray-200 bg-white p-7 shadow-lg shadow-gray-200/40 dark:border-gray-800 dark:bg-gray-900 dark:shadow-none">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-indigo-600 dark:text-indigo-400">
                    {section.id}
                  </p>
                  <h3 className="mt-4 text-2xl font-black text-gray-900 dark:text-white">{section.title}</h3>
                  <p className="mt-4 text-base leading-8 text-gray-600 dark:text-gray-300">{section.text}</p>
                </article>
              </FadeIn>
            ))}
          </div>
        </section>

        {hasGuide && (
          <section className="px-4 pb-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl rounded-[2rem] border border-indigo-200 bg-indigo-50/70 p-8 md:p-10 dark:border-indigo-900/60 dark:bg-indigo-950/20">
              <FadeIn delay={80}>
                <div className="max-w-3xl">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-indigo-700 dark:text-indigo-300">
                    {lang === 'tr' ? 'Kullanim Kilavuzu' : 'Usage Guide'}
                  </p>
                  <h2 className="mt-4 text-3xl font-black text-gray-900 dark:text-white md:text-4xl">
                    {content.guide.title}
                  </h2>
                  <p className="mt-4 text-base leading-8 text-gray-700 dark:text-gray-300">
                    {content.guide.intro}
                  </p>
                </div>
              </FadeIn>

              <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-4">
                  {content.guide.steps.map((step, index) => (
                    <FadeIn key={step.title} delay={120 + index * 70} direction="up">
                      <div className="rounded-[1.5rem] border border-white/70 bg-white/90 p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900/90">
                        <div className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-600 text-sm font-black text-white">
                          {index + 1}
                        </div>
                        <h3 className="mt-4 text-xl font-black text-gray-900 dark:text-white">{step.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-gray-600 dark:text-gray-300">{step.desc}</p>
                      </div>
                    </FadeIn>
                  ))}
                </div>

                <FadeIn delay={180} direction="up">
                  <aside className="rounded-[1.5rem] border border-white/70 bg-white/90 p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/90">
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-400">
                      {lang === 'tr' ? 'Hizli Ipuclari' : 'Quick Tips'}
                    </p>
                    <div className="mt-5 space-y-4">
                      {content.guide.tips.map((tip) => (
                        <div key={tip} className="flex items-start gap-3 rounded-2xl bg-gray-50 px-4 py-4 dark:bg-gray-800/80">
                          <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-500" size={18} />
                          <p className="text-sm font-medium leading-7 text-gray-700 dark:text-gray-200">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </aside>
                </FadeIn>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer t={t} />
      <Chatbox assistantType="math_expert" />
    </div>
  );
};

export default AudienceLandingPage;