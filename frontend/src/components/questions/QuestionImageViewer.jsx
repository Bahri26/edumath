import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn, ZoomOut, Maximize, RotateCcw } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

const control='inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-500 disabled:opacity-40';
export default function QuestionImageViewer({src,alt,onClose}) {
  const panel=useRef(null), area=useRef(null), drag=useRef(null);
  const id=useId();
  const [viewportWidth,setViewportWidth]=useState(0);
  const [size,setSize]=useState(null),[scale,setScale]=useState(1),[failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0);
  useFocusTrap(panel,true);
  useEffect(()=>{
    const node=area.current;
    if(!node || typeof ResizeObserver==='undefined')return;
    const observer=new ResizeObserver(entries=>setViewportWidth(entries[0].contentRect.width));
    observer.observe(node); return()=>observer.disconnect();
  },[]);
  const fit=()=>{
    if(!size||!area.current)return;
    setScale(Math.max(0.05,Math.min((area.current.clientWidth-24)/size.width,(area.current.clientHeight-24)/size.height,1)));
    area.current.scrollTo?.(0,0);
  };
  const zoom=multiplier=>setScale(value=>Math.max(0.05,Math.min(8,value*multiplier)));
  useEffect(()=>{
    const previous=document.body.style.overflow;
    document.body.style.overflow='hidden';
    const key=e=>{
      if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();onClose();}
    };
    document.addEventListener('keydown',key,true);
    return()=>{document.body.style.overflow=previous;document.removeEventListener('keydown',key,true);};
  },[onClose]);
  return createPortal(<div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 p-2 sm:p-4" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}>
    <section ref={panel} role="dialog" aria-modal="true" aria-labelledby={id} tabIndex={-1} className="flex max-h-[calc(100dvh-1rem)] w-full min-w-0 max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)]">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b p-3 sm:px-5"><h2 id={id} className="min-w-0 truncate font-semibold text-slate-900">Soru görseli — büyütülmüş görünüm</h2><button className={control} aria-label="Görseli kapat" onClick={onClose}><X size={20}/></button></header>
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b p-2 sm:px-5" aria-label="Görsel yakınlaştırma kontrolleri">
        <button className={control} disabled={!size||failed||scale>=8} onClick={()=>zoom(1.25)} aria-label="Yakınlaştır"><ZoomIn size={18}/></button>
        <button className={control} disabled={!size||failed||scale<=0.05} onClick={()=>zoom(0.8)} aria-label="Uzaklaştır"><ZoomOut size={18}/></button>
        <output aria-live="polite" className="min-w-14 text-center text-sm text-slate-700">%{Math.round(scale*100)}</output>
        <button className={control} disabled={!size||failed} onClick={fit}><Maximize size={16}/>Ekrana sığdır</button>
        <button className={control} disabled={!size||failed} onClick={()=>setScale(1)}><RotateCcw size={16}/>Özgün boyut</button>
      </div>
      <div ref={area} data-testid="image-pan-area" tabIndex={0} role="region" aria-label="Büyütülmüş görsel alanı" className="relative h-[65dvh] min-h-40 min-w-0 overflow-auto overscroll-contain bg-slate-100" style={{touchAction:'none',cursor:'grab'}}
        onPointerDown={e=>{if(e.button!==0||failed)return;drag.current={x:e.clientX,y:e.clientY,left:e.currentTarget.scrollLeft,top:e.currentTarget.scrollTop};e.currentTarget.setPointerCapture?.(e.pointerId);}}
        onPointerMove={e=>{if(!drag.current)return;e.currentTarget.scrollLeft=drag.current.left-(e.clientX-drag.current.x);e.currentTarget.scrollTop=drag.current.top-(e.clientY-drag.current.y);}}
        onPointerUp={e=>{drag.current=null;if(e.currentTarget.hasPointerCapture?.(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}}
        onPointerCancel={()=>{drag.current=null;}}>
        {failed ? <div role="alert" className="p-6 text-slate-800"><p>Görsel yüklenemedi.</p><button className={`${control} mt-3`} onClick={()=>{setFailed(false);setSize(null);setAttempt(n=>n+1);}}>Yeniden dene</button></div> : <>
          {!size&&<p role="status" className="p-5 text-slate-700">Görsel yükleniyor…</p>}
          <div className="grid place-items-center p-3" style={{width:size?Math.max(size.width*scale+24,viewportWidth):'100%',minHeight:'100%',height:size?size.height*scale+24:undefined}}>
            <img key={attempt} src={src} alt={alt} draggable={false} className="block max-w-none select-none bg-white" style={{width:size?size.width*scale:undefined,height:size?size.height*scale:undefined,visibility:size?'visible':'hidden'}} onError={()=>setFailed(true)}
              onLoad={e=>{const next={width:e.currentTarget.naturalWidth,height:e.currentTarget.naturalHeight};setSize(next);setScale(Math.max(0.05,Math.min((area.current.clientWidth-24)/next.width,(area.current.clientHeight-24)/next.height,1)));}}/>
          </div>
        </>}
      </div>
      <p className="shrink-0 border-t px-4 py-2 text-xs text-slate-600">Yakınlaştırdıktan sonra görseli fareyle veya parmağınızla sürükleyebilirsiniz. Escape ile kapatın.</p>
    </section>
  </div>,document.body);
}
