import React, {useState} from 'react';
import {FileText,ImageOff} from 'lucide-react';
import {resolveAssetUrl} from '../../services/api';
import {withLocalPatternSource} from '../../utils/localPatternSource';

function ThumbnailImage({src}) {
  const [loaded,setLoaded]=useState(false),[failed,setFailed]=useState(false);
  return <div className="relative flex h-44 items-center justify-center bg-white p-3">
    {!loaded && !failed && <span role="status" className="absolute inset-3 animate-pulse rounded-lg bg-slate-100"><span className="sr-only">Görsel yükleniyor</span></span>}
    {failed ? <span className="flex flex-col items-center gap-2 text-xs text-slate-500"><ImageOff size={28}/>Görsel açılamadı</span> : <img src={src} alt="Soru görselinin küçük önizlemesi" loading="eager" decoding="async" onLoad={()=>setLoaded(true)} onError={()=>setFailed(true)} className="relative h-full w-full object-contain"/>}
  </div>;
}
export default function QuestionThumbnail({question}) {
  const src=resolveAssetUrl(withLocalPatternSource(question)?.image || '');
  return src ? <ThumbnailImage key={src} src={src}/> : <div className="flex h-44 flex-col items-center justify-center gap-3 bg-slate-50 text-slate-400 dark:bg-slate-900"><FileText size={36} strokeWidth={1.25}/><span className="text-xs font-medium">Metin sorusu</span></div>;
}
