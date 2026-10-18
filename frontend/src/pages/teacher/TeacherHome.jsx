import React, { useContext, useEffect, useId, useState } from 'react';
import { Link } from 'react-router';
import { RefreshCw, Plus, FileText, AlertCircle, BookOpen, ChevronDown } from 'lucide-react';
import apiClient from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import TeacherPageShell from '../../components/teacher/TeacherPageShell.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import GuideDrawer from '../../components/help/GuideDrawer.jsx';

const score = value => value == null ? 'Henüz ölçülmedi' : `%${value}`;
const date = value => value ? new Date(value).toLocaleString('tr-TR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : 'Belirtilmedi';
const linkStyle = 'inline-flex min-h-11 items-center justify-center gap-1 rounded-lg px-2 py-2 text-sm font-semibold text-teal-800 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-500 dark:text-teal-200';
const primaryStyle = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500';
const secondaryStyle = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-500 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700';

function CompactSection({title, count, action, children}) {
  const [expanded,setExpanded]=useState(false);
  const id=useId();
  return <Card className="min-w-0 p-4 sm:p-5">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="min-w-0 flex-1 text-base font-semibold sm:text-lg">
        <span className="hidden sm:inline">{title}</span>
        <button type="button" aria-expanded={expanded} aria-controls={id} onClick={()=>setExpanded(v=>!v)} className="flex min-h-11 w-full items-center justify-between gap-2 rounded-lg text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-500 sm:hidden">
          <span>{title}{count != null ? ` (${count})` : ''}</span><ChevronDown size={18} className={expanded?'rotate-180':''}/>
        </button>
      </h2>
      <div className="hidden sm:block">{action}</div>
    </div>
    <div id={id} className={`${expanded?'block':'hidden'} sm:block`}>
      {children}<div className="mt-2 sm:hidden">{action}</div>
    </div>
  </Card>;
}


export default function TeacherHome() {
  const {user}=useContext(AuthContext);
  const [classLevel,setClassLevel]=useState('');
  const [days,setDays]=useState('0');
  const [revision,setRevision]=useState(0);
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [guide,setGuide]=useState(false);
  useEffect(()=> {
    let active=true;
    apiClient.get('/teacher/dashboard-summary',{params:{classLevel,days}})
      .then(res=>{if(active)setData(res.data);})
      .catch(err=>{if(active){setData(null);setError(err.response?.data?.message || 'Genel bakış yüklenemedi.');}})
      .finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[classLevel,days,revision]);
  const beginLoad=()=>{setLoading(true);setError('');};
  const refresh=()=>{beginLoad();setRevision(n=>n+1);};
  const stats=data?.stats;
  const students=data?.students || [];
  const followup=students.filter(s=>s.resultCount>0 && s.averageScore<55).sort((a,b)=>a.averageScore-b.averageScore);
  const exams=data?.exams || [];
  const live=exams.filter(e=>e.phase==='live');
  const classQuery=classLevel ? `&classLevel=${encodeURIComponent(classLevel)}` : '';
  const cards=stats ? [
    ['Öğrenciler',stats.totalStudents,`${stats.measuredStudents} öğrenci ölçüldü`,'/teacher/student-progress'],
    ['Sınıf ortalaması',score(stats.classAverage),days==='0'?'Tüm sonuçlar · öğrenci ortalamaları':`Son ${days} günün sonuçları`,'/teacher/reports'],
    ['Devam eden sınavlar',stats.activeExams,`${stats.scheduledExams} sınav planlandı`,'/teacher/exams'],
    ['İnceleme bekleyen sorular',stats.reviewQuestions,'Kendi soru kayıtlarınız','/teacher/questions'],
  ] : [];
  return <>
    <TeacherPageShell title={`Hoş geldiniz, ${user?.name || 'Hocam'}`} subtitle="Sınıfınızın durumu, takip bekleyen öğrenciler ve günlük işleriniz." headerAside={<div className="flex flex-wrap gap-2" aria-label="Hızlı işlemler">
        <Link className={primaryStyle} to={`/teacher/exams?create=1${classQuery}`}><FileText size={18}/>Sınav hazırla</Link>
        <Link className={secondaryStyle} to={`/teacher/questions?create=1${classQuery}`}><Plus size={18}/>Soru ekle</Link>
      </div>}>
      <div className="-mt-2 flex flex-wrap items-center gap-2 text-sm" aria-live="polite">
        <span className="rounded-full bg-teal-100 px-3 py-1 font-semibold text-teal-900 dark:bg-teal-950 dark:text-teal-200">{classLevel || 'Tüm sınıflar'}</span>
        <span className="text-slate-600 dark:text-slate-300">{days==='0'?'Tüm zamanların sonuçları':`Son ${days} günün sonuçları`}</span>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <div className="grid w-full grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:w-auto">
          <label className="flex min-w-0 flex-col gap-1 text-sm font-medium">Sınıf
            <select value={classLevel} onChange={e=>{beginLoad();setClassLevel(e.target.value);}} className="min-h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-transparent p-2 dark:border-slate-600">
              <option value="">Tüm sınıflar</option>
              {(data?.classes || (classLevel?[classLevel]:[])).map(cl=><option key={cl}>{cl}</option>)}
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1 text-sm font-medium">Sonuç dönemi
            <select value={days} onChange={e=>{beginLoad();setDays(e.target.value);}} className="min-h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-transparent p-2 dark:border-slate-600">
              <option value="0">Tüm zamanlar</option><option value="7">Son 7 gün</option><option value="30">Son 30 gün</option>
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-slate-500">{!loading && data ? `Güncellendi: ${date(data.generatedAt)}` : ''}</span>
          <Button variant="secondary" onClick={()=>setGuide(true)} icon={BookOpen}>Kılavuz</Button>
          <Button variant="outline" disabled={loading} onClick={refresh} aria-label="Genel bakışı yenile"><RefreshCw size={16}/></Button>
        </div>
        <p className="w-full text-xs text-slate-500 dark:text-slate-400">Sınıf seçimi tüm özeti; sonuç dönemi ortalamaları ve öğrenci takibini filtreler. Sınav durumları günceldir.</p>
      </div>
      {loading ? <div role="status" className="rounded-2xl bg-slate-100 p-8 text-center dark:bg-slate-800">Genel bakış yükleniyor…</div> : error ? <Card className="p-5"><p role="alert">{error}</p><Button className="mt-3" onClick={refresh}>Yeniden dene</Button></Card> : stats && <>
        <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 xl:grid-cols-4">
          {cards.map(([title,value,detail,path])=><Link key={title} to={path} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 sm:p-5 transition hover:border-teal-400 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-300">{title}</p><p className="mt-2 break-words text-xl sm:text-2xl font-semibold">{value}</p><p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{detail}</p>
          </Link>)}
        </div>
        <Card className="p-4 sm:p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold"><AlertCircle size={20} className="text-teal-600"/>Öncelikli işler</h2>
          <ul className="mt-2 divide-y divide-slate-100 text-sm dark:divide-slate-700">
            {followup.length>0 && <li className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-0.5"><span className="min-w-0 flex-1 basis-48"><span className="mr-2 inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-200">Takip</span>{followup.length} öğrenci için sonuçları gözden geçirin.</span><Link className={linkStyle} to={`/teacher/student-progress?student=${followup[0]._id}`}>Öğrenci takibini aç</Link></li>}
            {live.some(e=>e.missingCount>0) && <li className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-0.5"><span className="min-w-0 flex-1 basis-48"><span className="mr-2 inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-200">Katılım</span>Devam eden sınavlarda katılım bekleniyor.</span><Link className={linkStyle} to={`/teacher/exams?results=${live.find(e=>e.missingCount>0)._id}`}>Katılımı incele</Link></li>}
            {stats.unmeasuredStudents>0 && <li className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-0.5"><span className="min-w-0 flex-1 basis-48"><span className="mr-2 inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-200">Ölçme</span>{stats.unmeasuredStudents} öğrenci için seçilen dönemde sonuç yok.</span><Link className={linkStyle} to={`/teacher/exams?create=1${classQuery}`}>Ölçme hazırla</Link></li>}
            {stats.reviewQuestions>0 && <li className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-0.5"><span className="min-w-0 flex-1 basis-48"><span className="mr-2 inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-200">İnceleme</span>{stats.reviewQuestions} soru inceleme bekliyor.</span><Link className={linkStyle} to="/teacher/questions">Soru bankasını aç</Link></li>}
            {stats.totalStudents===0 && <li>Bu sınıfta bağlı öğrenci bulunmuyor. Öğrenci takibinden sınıf listesini kontrol edin.</li>}
            {!followup.length && !live.some(e=>e.missingCount>0) && !stats.unmeasuredStudents && !stats.reviewQuestions && stats.totalStudents>0 && <li>Şu anda bu ölçütlere göre takip gerektiren bir iş bulunmuyor.</li>}
          </ul>
        </Card>
        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
          <CompactSection title="Sınav durumu" count={exams.length} action={<Link className={linkStyle} to="/teacher/exams">Tüm sınavlar</Link>}>
            {exams.length ? <ul className="mt-4 divide-y divide-slate-200 dark:divide-slate-700">{exams.map(e=><li key={e._id} className="py-4">
              <p className="break-words font-semibold">{e.title}</p><p className="mt-1 text-sm text-slate-500">{e.classLevel} · {e.phase==='live'?'Devam ediyor':'Planlandı'}</p>
              <p className="mt-2 text-sm">{e.eligibleCount ? (e.phase==='scheduled' ? `${e.eligibleCount} öğrenci katılabilir` : `Katılım: ${e.participantCount}/${e.eligibleCount} · ${e.missingCount} öğrenci katılmadı`) : 'Bu sınıfta bağlı öğrenci yok.'}</p>
              <p className="mt-1 text-xs text-slate-500">{e.phase==='live'?'Bitiş':'Başlangıç'}: {date(e.phase==='live'?e.endAt:e.startAt)}</p>
              <Link className={`${linkStyle} mt-3`} to={`/teacher/exams?${e.phase==='live'?'results':'preview'}=${e._id}`}>{e.phase==='live'?'Sonuç ve katılım':'Sınavı görüntüle'}</Link>
            </li>)}</ul> : <p className="mt-4 text-sm text-slate-500">Devam eden veya planlanan sınav yok.</p>}
          </CompactSection>
          <CompactSection title="Öğrenci takibi" count={followup.length} action={<Link className={linkStyle} to="/teacher/student-progress">Tüm öğrenciler</Link>}>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Ortalaması %55 altında olan en fazla 5 öğrenci gösterilir. Bu eşik bir takip önerisidir; sonuç sayısı ve ayrıntılı yanıtlar birlikte değerlendirilmelidir.</p>
            {followup.length ? <ul className="mt-4 divide-y divide-slate-200 dark:divide-slate-700">{followup.slice(0,5).map(s=><li key={s._id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0"><p className="break-words font-medium">{s.name || 'Öğrenci'}</p><p className="text-sm text-slate-500">{s.grade} · {score(s.averageScore)} · {s.resultCount} sonuç</p>{s.resultCount===1 && <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">Tek sonuç · ilk gözlem, ek ölçme gerekli</p>}</div>
              <Link className={linkStyle} to={`/teacher/student-progress?student=${s._id}`}>İlerlemesini aç</Link>
            </li>)}</ul> : <p className="mt-4 text-sm text-slate-500">{stats.measuredStudents ? 'Bu ölçüte göre destek gerektiren öğrenci yok.' : 'Henüz ölçme sonucu bulunmuyor.'}</p>}
          </CompactSection>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-slate-500">Diğer işlemler</span>
          <Link className={linkStyle} to="/teacher/assignments">Ödevler</Link><Link className={linkStyle} to="/teacher/reports">Ayrıntılı raporlar</Link>
        </div>
        <CompactSection title="Son eklediğiniz sorular" count={(data.recentQuestions || []).length} action={<Link className={linkStyle} to="/teacher/questions">Soru bankası · {stats.totalQuestions} soru</Link>}>
          {(data.recentQuestions || []).length ? <ul className="mt-3 divide-y divide-slate-200 dark:divide-slate-700">{data.recentQuestions.map(q=><li key={q._id} className="py-3"><p className="line-clamp-2 break-words text-sm">{q.text}</p><p className="mt-1 text-xs text-slate-500">{q.classLevel} · {q.topic} · {date(q.createdAt)}</p></li>)}</ul> : <p className="mt-4 text-sm text-slate-500">Henüz kendi soru kaydınız bulunmuyor.</p>}
        </CompactSection>
        <p className="text-xs text-slate-500">Başarı özeti bağlı öğrencilerin erişiminizdeki sınav sonuçlarına dayanır. Sonuç dönemi ortalamaları ve öğrenci takibini filtreler; sınav durumu güncel zaman aralığını gösterir. Soru sayıları kendi kayıtlarınızdır.</p>
      </>}
    </TeacherPageShell>
    <GuideDrawer audience="teacher" open={guide} onClose={()=>setGuide(false)}/>
  </>;
}
