import React,{useEffect,useRef,useState} from 'react';
const IMAGE='/assets/masterplan.webp',WIDTH=2384,HEIGHT=1684;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export default function MasterPlan(){
 const [view,setView]=useState({zoom:1,x:0,y:0}),[size,setSize]=useState({width:1,height:1,fit:1/WIDTH}),[full,setFull]=useState(false),[failed,setFailed]=useState(false);
 const viewport=useRef(null),panel=useRef(null),current=useRef(view),metrics=useRef(size),pointers=useRef(new Map()),gesture=useRef(null);
 function commit(next){
  const {width,height,fit}=metrics.current,zoom=clamp(next.zoom,.75,5);
  const maxX=Math.max(0,(WIDTH*fit*zoom-width)/2),maxY=Math.max(0,(HEIGHT*fit*zoom-height)/2);
  const bounded={zoom,x:clamp(next.x,-maxX,maxX),y:clamp(next.y,-maxY,maxY)};
  current.current=bounded;setView(bounded);
 }
 function zoomAt(zoom,point){
  const old=current.current,{width,height}=metrics.current;
  const focus=point||{x:width/2,y:height/2},ratio=clamp(zoom,.75,5)/old.zoom;
  commit({zoom,x:focus.x-width/2-(focus.x-width/2-old.x)*ratio,y:focus.y-height/2-(focus.y-height/2-old.y)*ratio});
 }
 function reset(){pointers.current.clear();gesture.current=null;commit({zoom:1,x:0,y:0});}
 useEffect(()=>{
  const element=viewport.current;
  const resize=()=>{
   const width=element.clientWidth,height=element.clientHeight;
   const next={width,height,fit:Math.max(.01,Math.min((width-32)/WIDTH,(height-32)/HEIGHT))};
   metrics.current=next;setSize(next);pointers.current.clear();gesture.current=null;commit(current.current);
  };
  const observer=new ResizeObserver(resize);observer.observe(element);resize();
  return()=>observer.disconnect();
 },[]);
 useEffect(()=>{
  const element=viewport.current;
  const wheel=e=>{
   if(!e.ctrlKey&&!full)return;
   e.preventDefault();const rect=element.getBoundingClientRect();
   zoomAt(current.current.zoom*Math.exp(-e.deltaY*.004),{x:e.clientX-rect.left,y:e.clientY-rect.top});
  };
  element.addEventListener('wheel',wheel,{passive:false});return()=>element.removeEventListener('wheel',wheel);
 },[full]);
 useEffect(()=>{
  pointers.current.clear();gesture.current=null;
  if(!full)return;
  const previousOverflow=document.body.style.overflow,previousFocus=document.activeElement;
  document.body.style.overflow='hidden';document.body.classList.add('plan-expanded');panel.current.querySelector('button')?.focus();
  const key=e=>{
   if(e.key==='Escape'){e.preventDefault();setFull(false);}
   if(e.key==='Tab'){
    const items=[...panel.current.querySelectorAll('button:not(:disabled),a,[tabindex="0"]')],first=items[0],last=items.at(-1);
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
   }
  };
  document.addEventListener('keydown',key);
  return()=>{document.body.style.overflow=previousOverflow;document.body.classList.remove('plan-expanded');document.removeEventListener('keydown',key);previousFocus?.focus({preventScroll:true});};
 },[full]);
 function point(event){const rect=viewport.current.getBoundingClientRect();return {x:event.clientX-rect.left,y:event.clientY-rect.top};}
 function span(){
  const [a,b]=[...pointers.current.values()];
  return b?{center:{x:(a.x+b.x)/2,y:(a.y+b.y)/2},distance:Math.hypot(b.x-a.x,b.y-a.y)}:a?{center:a,distance:0}:null;
 }
 function rebase(){const touch=span();gesture.current=touch?{...touch,view:{...current.current}}:null;}
 function down(event){
  if(event.target.closest('a,button'))return;
  if(event.pointerType==='mouse'&&event.button!==0)return;
  event.preventDefault();pointers.current.set(event.pointerId,point(event));event.currentTarget.setPointerCapture(event.pointerId);rebase();
 }
 function move(event){
  if(!pointers.current.has(event.pointerId))return;
  event.preventDefault();pointers.current.set(event.pointerId,point(event));
  const start=gesture.current,now=span(),{width,height}=metrics.current;if(!start||!now)return;
  const zoom=clamp(start.distance?start.view.zoom*now.distance/Math.max(1,start.distance):start.view.zoom,.75,5),ratio=zoom/start.view.zoom;
  commit({zoom,x:now.center.x-width/2-(start.center.x-width/2-start.view.x)*ratio,y:now.center.y-height/2-(start.center.y-height/2-start.view.y)*ratio});
 }
 function up(event){pointers.current.delete(event.pointerId);if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);rebase();}
 function keyboard(event){
  const key=event.key,old=current.current;
  if(['+','=','-','0','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(key))event.preventDefault();
  if(key==='+'||key==='=')zoomAt(old.zoom+.25);
  if(key==='-')zoomAt(old.zoom-.25);
  if(key==='0')reset();
  if(key.startsWith('Arrow'))commit({...old,x:old.x+(key==='ArrowLeft'?40:key==='ArrowRight'?-40:0),y:old.y+(key==='ArrowUp'?40:key==='ArrowDown'?-40:0)});
 }
 return <div ref={panel} className={`plan-viewer ${full?'fullscreen':''}`} role={full?'dialog':undefined} aria-modal={full?true:undefined} aria-label="Original site master plan viewer">
  <div className="plan-toolbar"><span className="drawing-name">SITE MASTER PLAN</span><div className="plan-tools"><button aria-label="Zoom out" disabled={view.zoom<=.75} onClick={()=>zoomAt(current.current.zoom-.25)}>−</button><output aria-label="Zoom level">{Math.round(view.zoom*100)}%</output><button aria-label="Zoom in" disabled={view.zoom>=5} onClick={()=>zoomAt(current.current.zoom+.25)}>+</button><button onClick={reset} aria-label="Fit plan to view">Reset</button><button onClick={()=>setFull(value=>!value)} aria-label={full?'Exit fullscreen':'View fullscreen'}>{full?'Close ×':'Full screen ⤢'}</button><a href={IMAGE} target="_blank" rel="noreferrer" aria-label="Open master plan image">Image ↗</a></div></div>
  <div ref={viewport} className="plan-viewport" tabIndex={0} aria-label="Master plan. Pinch to zoom, drag to pan, or use plus, minus and arrow keys." onKeyDown={keyboard} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onLostPointerCapture={event=>{if(pointers.current.has(event.pointerId)){pointers.current.delete(event.pointerId);rebase();}}} data-zoom={view.zoom} data-pan-x={view.x} data-pan-y={view.y}>
   <div className="plan-sheet">{failed?<div className="image-placeholder"><strong>Site master plan</strong><p>The preview is temporarily unavailable.</p><a href="/assets/SITE_MASTERPLAN.pdf" target="_blank" rel="noreferrer">Open original master plan PDF ↗</a></div>:<img src={IMAGE} width={WIDTH} height={HEIGHT} loading="lazy" decoding="async" draggable={false} onError={()=>setFailed(true)} alt="Shangri-La Hua Hin master plan: residences A and B, pool, restaurant, pool facilities, staff accommodation and entrance." style={{width:WIDTH*size.fit*view.zoom,height:HEIGHT*size.fit*view.zoom,transform:`translate(-50%,-50%) translate(${view.x}px,${view.y}px)`}}/>}</div>
  </div>
  <div className="plan-caption"><span>{failed?'Preview unavailable':'Pinch to zoom · drag to pan · + / −'}</span><span>ORIGINAL SITE DRAWING</span></div>
 </div>;
}
