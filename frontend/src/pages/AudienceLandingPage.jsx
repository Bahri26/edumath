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

const audienceContent = {
  tr: {
    student: {
      badge: 'Ogrenci Akisi',
      title: 'Ogrenciler icin net, seviyeye gore ilerleyen matematik yolu',
      intro: 'Sinif duzeyi, konu sirasi ve ogrenme hizi birlikte ele alinmis bir calisma akisi.',
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
    },
    teacher: {
      badge: 'Ogretmen Akisi',
      title: 'Ogretmenler icin soru, sinav ve ogrenci takibi odakli kontrol paneli',
      intro: 'Icerik uretimi ve olcme-degerlendirme surecini tek panelde toplayan ogretmen odakli akis.',
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
    },
    research: {
      badge: 'Akademik Arastirma',
      title: 'Yuksek lisans ve doktora duzeyi matematik icin ayri bir calisma katmani',
      intro: 'Ders katalogundan ayri duran; makale, seminer, proof workshop ve tez uretkenligini merkeze alan bir arastirma akisi.',
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
    },
    teacher: {
      badge: 'Teacher Flow',
      title: 'A control panel for teachers focused on questions, exams, and student tracking',
      intro: 'A teacher-facing workflow that brings content production and assessment together in one place.',
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
    },
    research: {
      badge: 'Academic Research',
      title: 'A separate workspace for graduate and doctoral mathematics',
      intro: 'A research flow separated from the lesson catalog, centered on papers, seminars, proof work, and thesis productivity.',
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
    const pageTitle = lang === 'tr'
      ? `Edumath | ${content.title}`
      : `Edumath | ${content.title}`;

    document.title = pageTitle;
    document.documentElement.lang = lang;
  }, [content.title, lang]);

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
      </main>

      <Footer t={t} />
      <Chatbox assistantType="math_expert" />
    </div>
  );
};

export default AudienceLandingPage;