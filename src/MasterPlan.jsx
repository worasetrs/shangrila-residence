import React, {useEffect,useRef,useState} from 'react';
const IMAGE='/assets/masterplan.webp';
const WIDTH=2384, HEIGHT=1684;
export default function MasterPlan(){
  const [zoom,setZoom]=useState(1),[fit,setFit]=useState(.4),[full,setFull]=useState(false),[failed,setFailed]=useState(false);
  const viewport=useRef(null),panel=useRef(null),drag=useRef(null),fullButton=useRef(null);
  useEffect(()=>{
    const el=viewport.current;
    const resize=()=>setFit(Math.max(.05,Math.min((el.clientWidth-40)/WIDTH,(el.clientHeight-40)/HEIGHT)));
    const observer=new ResizeObserver(resize);observer.observe(el);resize();
    return()=>observer.disconnect();
  },[]);
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
    <div className="plan-toolbar"><span className="drawing-name">SITE MASTER PLAN <small>01 / 01</small></span><div className="plan-tools"><button aria-label="Zoom out" disabled={zoom<=.75} onClick={()=>adjust(-.25)}>−</button><output aria-label="Zoom level">{Math.round(zoom*100)}%</output><button aria-label="Zoom in" disabled={zoom>=4} onClick={()=>adjust(.25)}>+</button><button className="fit-button" onClick={reset} aria-label="Fit plan to view">Fit</button><span className="tool-divider"/><button ref={fullButton} onClick={()=>setFull(!full)} aria-label={full?'Exit fullscreen':'View fullscreen'}>{full?'Close ×':'Expand ⤢'}</button><a href={IMAGE} target="_blank" rel="noreferrer" aria-label="Open master plan image in a new tab">Image ↗</a><a href={IMAGE} download="SHANGRILA_HUA_HIN_MASTERPLAN.webp" aria-label="Download master plan image">↓</a></div></div>
    <div ref={viewport} className="plan-viewport" data-lenis-prevent={zoom>1||full?'':undefined} style={{overscrollBehavior:zoom>1||full?'contain':'auto'}} tabIndex={0} aria-label="Master plan. Use plus and minus to zoom, arrow keys to pan. Drag to move the enlarged drawing."
      onKeyDown={e=>{if(['+','='].includes(e.key)){e.preventDefault();adjust(.25);}if(e.key==='-'){e.preventDefault();adjust(-.25);}if(e.key==='0'){e.preventDefault();reset();}}}
      onPointerDown={e=>{if(e.pointerType!=='mouse')return;drag.current={x:e.clientX,y:e.clientY,left:e.currentTarget.scrollLeft,top:e.currentTarget.scrollTop};e.currentTarget.setPointerCapture(e.pointerId);}}
      onPointerMove={e=>{if(!drag.current)return;e.currentTarget.scrollLeft=drag.current.left+drag.current.x-e.clientX;e.currentTarget.scrollTop=drag.current.top+drag.current.y-e.clientY;}}
      onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}>
      <div className="plan-sheet"><img src={IMAGE} width={WIDTH} height={HEIGHT} loading="lazy" decoding="async" draggable={false} onError={()=>setFailed(true)} onLoad={()=>setFailed(false)} alt="Shangri-La Hua Hin master plan: residences A and B, the central pool and planted island, restaurant, pool facilities, staff accommodation and entrance." style={{width:WIDTH*fit*zoom,height:HEIGHT*fit*zoom}}/></div>
    </div>
    <div className="plan-caption"><span>{failed?'Image unavailable. Please reload the page.':'Zoom in to explore · drag to pan'}</span><span>ORIGINAL SITE PLAN · IMAGE</span></div>
  </div>;
}
