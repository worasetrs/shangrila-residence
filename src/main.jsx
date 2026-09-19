import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import '@fontsource/manrope/latin-400.css';
import '@fontsource/manrope/latin-500.css';
import '@fontsource/manrope/latin-600.css';
import '@fontsource/cormorant-garamond/latin-400.css';
import '@fontsource/cormorant-garamond/latin-400-italic.css';
import {navigation} from './data/project';
import {getDeviceProfile} from './device';
import MasterPlan from './MasterPlan';
import InteriorGallery from './components/InteriorGallery';
import ExploreControls,{Hotspots} from './components/ExploreControls';
import LoadingScreen from './components/LoadingScreen';
import './style.css';

function Mark(){return <svg viewBox="0 0 44 44" fill="none" aria-hidden="true"><path d="M6 33V19L22 5l16 14v14M14 33V22l8-8 8 8v11M2 38h40" stroke="currentColor" strokeWidth="1.2"/></svg>;}
function App(){
 const reduced=useRef(matchMedia('(prefers-reduced-motion: reduce)').matches).current;
 const device=useRef(getDeviceProfile()).current;
 const [active,setActive]=useState('explore'),[load,setLoad]=useState(0),[ready,setReady]=useState(false),[failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0),[menu,setMenu]=useState(false),[phase,setPhase]=useState('loading'),[selected,setSelected]=useState(null);
 const host=useRef(null),stage=useRef(null),hotspotLayer=useRef(null),engine=useRef(null),menuButton=useRef(null);
 const paused=useRef(false);

 useEffect(()=>{
  const header=document.querySelector('.header');let observer;
  const observe=()=>{
   observer?.disconnect();
   observer=new IntersectionObserver(([entry])=>{
    paused.current=!entry.isIntersecting||entry.intersectionRatio<.01;host.current.dataset.paused=String(paused.current);engine.current?.setPaused(paused.current);
   },{rootMargin:`-${header.getBoundingClientRect().height}px 0px 0px 0px`,threshold:.01});
   observer.observe(stage.current);
  };
  const resize=new ResizeObserver(observe);resize.observe(header);observe();
  return()=>{observer.disconnect();resize.disconnect();};
 },[]);
 useEffect(()=>{
  const update=()=>{
   const sections=navigation.map(item=>document.getElementById(item.id));
   const current=sections.filter(el=>el.getBoundingClientRect().top<=innerHeight*.4).at(-1);
   setActive(current?.id||'explore');
  };
  window.addEventListener('scroll',update,{passive:true});update();
  return()=>window.removeEventListener('scroll',update);
 },[]);
 useEffect(()=>{
  const abort=new AbortController();let cleanup;
  setLoad(0);setReady(false);setFailed(false);setPhase('loading');
  import('./scene').then(({createScene})=>{
   if(abort.signal.aborted)return;
   return createScene(host.current,{signal:abort.signal,onController:value=>{engine.current=value;value.setPaused(paused.current);},onProgress:setLoad,onReady:()=>setReady(true),onFailure:()=>{setReady(false);setFailed(true);setPhase('unavailable');},onExploreState:setPhase,reducedMotion:reduced,mobile:device.mobile,hotspotLayer:hotspotLayer.current});
  }).then(fn=>{cleanup=fn;if(abort.signal.aborted)cleanup?.();}).catch(error=>{
   if(abort.signal.aborted)return;console.error('Unable to initialize the 3D scene.',error);setFailed(true);setPhase('unavailable');
  });
  return()=>{abort.abort();cleanup?.();engine.current=null;};
 },[attempt,reduced,device]);
 useEffect(()=>{
  const key=e=>{if(e.key==='Escape'&&menu){setMenu(false);menuButton.current?.focus();}};
  document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key);
 },[menu]);
 useEffect(()=>{
  const hash=location.hash.slice(1);
  if(hash==='interiors'||hash==='masterplan')requestAnimationFrame(()=>document.getElementById(hash)?.scrollIntoView());
  else if(hash&&hash!=='explore')history.replaceState(null,'','#explore');
 },[]);
 function navigate(event,id){
  event?.preventDefault();setMenu(false);history.replaceState(null,'',`#${id}`);
  const section=document.getElementById(id);section.scrollIntoView({behavior:reduced?'instant':'smooth'});section.focus({preventScroll:true});
 }
 function reset(){setSelected(null);engine.current?.resetView();}
 function focusPlace(id){setSelected(id);engine.current?.focusHotspot(id);}

 return <>
  <a className="skip" href="#interiors" onClick={e=>navigate(e,'interiors')}>Skip 3D and view gallery</a>
  <header className="header"><a href="#explore" className="brand" aria-label="Shangri-La Residence, Explore" onClick={e=>navigate(e,'explore')}><Mark/><span>SHANGRI-LA<small>RESIDENCE</small></span></a>
   <nav className="desktop-nav" aria-label="Main navigation">{navigation.map(item=><a key={item.id} href={`#${item.id}`} aria-current={active===item.id?'location':undefined} onClick={e=>navigate(e,item.id)}>{item.label}</a>)}</nav>
   <div className="header-end"><span className="location">HUA HIN, THAILAND</span><button ref={menuButton} className="menu-button" aria-label={menu?'Close navigation':'Open navigation'} aria-expanded={menu} aria-controls="section-menu" onClick={()=>setMenu(!menu)}><span/><span/></button></div>
  </header>
  {menu&&<nav id="section-menu" className="section-menu" aria-label="Sections">{navigation.map((item,i)=><a key={item.id} href={`#${item.id}`} aria-current={active===item.id?'location':undefined} onClick={e=>navigate(e,item.id)}><span>0{i+1}</span>{item.label}<span>↗</span></a>)}</nav>}
  <main>
   <section id="explore" ref={stage} className="explore-section" tabIndex={-1} aria-label="Explore Shangri-La Residence">
    <div className="poster-stack" aria-hidden="true"><img src="/assets/aerial.webp" alt="" fetchPriority="high"/></div>
    <div ref={host} className={`webgl ${ready?'is-ready':''}`} aria-hidden={!ready}/>
    <Hotspots layer={hotspotLayer} active={ready} selected={selected} onSelect={focusPlace}/>
    <ExploreControls active={ready} phase={phase} selected={selected} touch={device.touch} onReset={reset} onGallery={e=>navigate(e,'interiors')} onPlan={e=>navigate(e,'masterplan')} onBack={reset} onZoom={factor=>engine.current?.zoom(factor)}/>
    {!ready&&<div className="explore-welcome"><p className="eyebrow">HUA HIN · THAILAND</p><h1>Your own<br/><em>perspective.</em></h1><p>{failed?'Explore the project through our collection of images.':'Explore freely. Discover a place to call home.'}</p><a className="button" href="#interiors" onClick={e=>navigate(e,'interiors')}>View gallery ↓</a>{failed&&<button className="retry-3d" onClick={()=>setAttempt(value=>value+1)}>Retry 3D</button>}</div>}
    {!ready&&!failed&&<LoadingScreen progress={load} message="Loading your interactive view…"/>}
   </section>
   <InteriorGallery/>
   <section id="masterplan" className="masterplan-section" tabIndex={-1}>
    <div className="section-heading"><div><p className="eyebrow">03 / THE MASTER PLAN</p><h2>Every place.<br/><em>One considered whole.</em></h2></div><p>Explore the original site drawing.<br/>Pinch to zoom. Drag to move.</p></div>
    <MasterPlan/>
    <div className="plan-legend"><span><b>A / B</b> Residences</span><span><b>P03</b> Restaurant</span><span><b>P04</b> Pool</span><span><b>P05</b> Pool facilities</span><span><b>P06</b> Staff accommodation</span><span><b>P07</b> Guardhouse</span></div>
    <a className="plan-download" href="/assets/SITE_MASTERPLAN.pdf" target="_blank" rel="noreferrer">Download original PDF ↗</a>
   </section>
  </main>
  <footer><span>SHANGRI-LA RESIDENCE · HUA HIN</span><a href="#explore" onClick={e=>navigate(e,'explore')}>Back to Explore ↑</a></footer>
 </>;
}
createRoot(document.getElementById('root')).render(<App/>);
