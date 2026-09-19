import React, {useEffect,useRef,useState} from 'react';
import {getDocument,GlobalWorkerOptions} from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
GlobalWorkerOptions.workerSrc=workerUrl;
const URL='/assets/SITE_MASTERPLAN.pdf';
export default function MasterPlan(){
  const [page,setPage]=useState(null),[zoom,setZoom]=useState(1),[fit,setFit]=useState(.4),[full,setFull]=useState(false),[error,setError]=useState(false),[rendering,setRendering]=useState(true);
  const canvas=useRef(null),viewport=useRef(null),panel=useRef(null),drag=useRef(null),renderTask=useRef(null),fullButton=useRef(null);
  useEffect(()=>{
    const loading=getDocument(URL);let alive=true;
    loading.promise.then(doc=>doc.getPage(1)).then(p=>{if(alive)setPage(p);}).catch(()=>{if(alive)setError(true);});
    return()=>{alive=false;loading.destroy();};
  },[]);
  useEffect(()=>{
    const el=viewport.current;
    const resize=new ResizeObserver(()=>{if(page)setFit(Math.min((el.clientWidth-40)/page.view[2],(el.clientHeight-40)/page.view[3]));});
    resize.observe(el);return()=>resize.disconnect();
  },[page,full]);
  useEffect(()=>{
    if(!page)return;
    let alive=true;
    const previous=renderTask.current;
    previous?.cancel();
    async function render(){
      if(previous)await previous.promise.catch(()=>{});
      if(!alive)return;
      const view=page.getViewport({scale:fit*zoom});
      const ratio=Math.min(window.devicePixelRatio||1,2,4096/Math.max(view.width,view.height));
      const buffer=document.createElement('canvas');buffer.width=Math.floor(view.width*ratio);buffer.height=Math.floor(view.height*ratio);
      setRendering(true);
      const task=page.render({canvasContext:buffer.getContext('2d'),viewport:view,transform:[ratio,0,0,ratio,0,0]});renderTask.current=task;
      try{await task.promise;if(alive){const c=canvas.current;c.width=buffer.width;c.height=buffer.height;c.style.width=`${view.width}px`;c.style.height=`${view.height}px`;c.getContext('2d').drawImage(buffer,0,0);setRendering(false);}}catch(e){if(alive && e.name!=='RenderingCancelledException')setError(true);}
    }
    render();return()=>{alive=false;renderTask.current?.cancel();};
  },[page,zoom,fit]);
  useEffect(()=>{
    if(!full)return;
    const previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';document.body.classList.add('plan-expanded');
    const previousFocus=document.activeElement;
    panel.current.querySelector('button')?.focus();
    const key=e=>{
      if(e.key==='Escape'){setFull(false);}
      if(e.key==='Tab'){
        const items=[...panel.current.querySelectorAll('button:not(:disabled),a,[tabindex="0"]')];
        const first=items[0],last=items.at(-1);
        if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
        if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
      }
    };
    document.addEventListener('keydown',key);
    return()=>{document.body.style.overflow=previousOverflow;document.body.classList.remove('plan-expanded');document.removeEventListener('keydown',key);previousFocus?.focus();};
  },[full]);
  const adjust=value=>setZoom(z=>Math.max(.75,Math.min(4,Math.round((z+value)*100)/100)));
  function reset(){setZoom(1);viewport.current.scrollTo({top:0,left:0});}
  return <div ref={panel} className={`plan-viewer ${full?'fullscreen':''}`} role={full?'dialog':undefined} aria-modal={full?true:undefined} aria-label="Original site master plan viewer">
    <div className="plan-toolbar"><span className="drawing-name">SITE MASTER PLAN <small>01 / 01</small></span><div className="plan-tools"><button aria-label="Zoom out" disabled={zoom<=.75} onClick={()=>adjust(-.25)}>−</button><output aria-label="Zoom level">{Math.round(zoom*100)}%</output><button aria-label="Zoom in" disabled={zoom>=4} onClick={()=>adjust(.25)}>+</button><button className="fit-button" onClick={reset} aria-label="Fit plan to view">Fit</button><span className="tool-divider"/><button ref={fullButton} onClick={()=>setFull(!full)} aria-label={full?'Exit fullscreen':'View fullscreen'}>{full?'Close ×':'Expand ⤢'}</button><a href={URL} target="_blank" rel="noreferrer" aria-label="Open original master plan PDF in a new tab">PDF ↗</a><a href={URL} download="SHANGRILA_HUA_HIN_MASTERPLAN.pdf" aria-label="Download original master plan PDF">↓</a></div></div>
    <div ref={viewport} className="plan-viewport" data-lenis-prevent={zoom>1||full?'':undefined} style={{overscrollBehavior:zoom>1||full?'contain':'auto'}} tabIndex={0} aria-label="Master plan. Use plus and minus to zoom, arrow keys to pan. Drag to move the enlarged drawing."
      onKeyDown={e=>{if(['+','='].includes(e.key)){e.preventDefault();adjust(.25);}if(e.key==='-'){e.preventDefault();adjust(-.25);}if(e.key==='0'){e.preventDefault();reset();}}}
      onPointerDown={e=>{if(e.pointerType!=='mouse')return;drag.current={x:e.clientX,y:e.clientY,left:e.currentTarget.scrollLeft,top:e.currentTarget.scrollTop};e.currentTarget.setPointerCapture(e.pointerId);}}
      onPointerMove={e=>{if(!drag.current)return;e.currentTarget.scrollLeft=drag.current.left+drag.current.x-e.clientX;e.currentTarget.scrollTop=drag.current.top+drag.current.y-e.clientY;}}
      onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}>
      <div className="plan-sheet">{error?<img src="/assets/masterplan.webp" alt="Original Shangri-La Hua Hin master plan, showing residences A and B, the central pool and island, restaurant, pool facilities, staff accommodation and entrance." style={{width:2384*fit*zoom}}/>:<canvas ref={canvas} role="img" aria-label="Original Shangri-La Hua Hin master plan drawing. The PDF is available from the toolbar."/>}</div>
    </div>
    <div className="plan-caption"><span>{error?'Preview image · open PDF for the original drawing':rendering?'Preparing drawing…':'Zoom in to explore · drag to pan'}</span><span>A1 · 1:250 AT ORIGINAL PRINT SIZE</span></div>
  </div>;
}
