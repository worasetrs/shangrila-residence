import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import '@fontsource/manrope/latin-400.css';
import '@fontsource/manrope/latin-500.css';
import '@fontsource/manrope/latin-600.css';
import '@fontsource/cormorant-garamond/latin-400.css';
import '@fontsource/cormorant-garamond/latin-400-italic.css';
import {chapters,navigation} from './data/project';
import {getDeviceProfile} from './device';
import MasterPlan from './MasterPlan';
import InteriorGallery from './components/InteriorGallery';
import ExploreControls,{Hotspots} from './components/ExploreControls';
import LoadingScreen from './components/LoadingScreen';
import './style.css';
import './experience.css';
gsap.registerPlugin(ScrollTrigger);
function Mark(){return <svg viewBox="0 0 44 44" fill="none" aria-hidden="true"><path d="M6 33V19L22 5l16 14v14M14 33V22l8-8 8 8v11M2 38h40" stroke="currentColor" strokeWidth="1.2"/></svg>;}
function App(){
 const reduced=useRef(matchMedia('(prefers-reduced-motion: reduce)').matches).current,device=useRef(getDeviceProfile()).current;
 const [mode,setMode]=useState(()=>reduced||device.mobile||navigator.connection?.saveData?'stills':'3d');
 const [active,setActive]=useState(0),[load,setLoad]=useState(0),[ready,setReady]=useState(false),[message,setMessage]=useState(''),[menu,setMenu]=useState(false),[phase,setPhase]=useState('guided'),[selected,setSelected]=useState(null);
 const host=useRef(null),stage=useRef(null),hotspotLayer=useRef(null),engine=useRef(null),journey=useRef(null),sceneProgress=useRef(0),activeRef=useRef(0),lenis=useRef(null),progressBar=useRef(null),menuButton=useRef(null),exploreButton=useRef(null),exploringRef=useRef(false),pendingExplore=useRef(false),pendingContinue=useRef(false);
 const exploring=phase!=='guided',inPaper=active===5||active===6,paused=active>=5;
 useEffect(()=>{
  if(reduced||device.touch)return;
  const smooth=new Lenis({duration:1.2,smoothWheel:true,syncTouch:false,anchors:false});lenis.current=smooth;smooth.on('scroll',ScrollTrigger.update);
  const tick=t=>smooth.raf(t*1000);gsap.ticker.add(tick);return()=>{gsap.ticker.remove(tick);smooth.destroy();lenis.current=null;};
 },[reduced,device]);
 useEffect(()=>{
  const nodes=[...document.querySelectorAll('[data-chapter]')];
  const triggers=nodes.map((node,i)=>ScrollTrigger.create({trigger:node,start:'top 55%',end:'bottom 55%',onToggle:self=>{if(self.isActive&&!exploringRef.current){activeRef.current=i;setActive(i);engine.current?.invalidate();}}}));
  const motion=ScrollTrigger.create({trigger:journey.current,start:'top top',end:'bottom top',onUpdate:self=>{if(!exploringRef.current){sceneProgress.current=Math.min(4,self.progress*5);engine.current?.invalidate();}}});
  const total=ScrollTrigger.create({start:0,end:'max',onUpdate:self=>{if(progressBar.current&&!exploringRef.current)progressBar.current.style.transform=`scaleX(${self.progress})`;}});
  requestAnimationFrame(()=>ScrollTrigger.refresh());return()=>{triggers.forEach(t=>t.kill());motion.kill();total.kill();};
 },[]);
 useEffect(()=>{if(host.current)host.current.dataset.paused=paused?'true':'false';if(!exploring)engine.current?.setPaused(paused);},[paused,exploring]);
 useEffect(()=>{
  if(mode!=='3d'){setReady(false);return;}
  const abort=new AbortController();let cleanup;setLoad(0);setReady(false);setMessage('');
  const timeout=setTimeout(()=>setMessage('The image tour is ready while 3D loads.'),18000);
  const timer=setTimeout(()=>import('./scene').then(({createScene})=>{
   if(abort.signal.aborted)return;
   return createScene(host.current,{signal:abort.signal,onController:value=>{engine.current=value;},onProgress:setLoad,onReady:()=>{clearTimeout(timeout);setReady(true);setMessage('');},onFailure:value=>{pendingExplore.current=false;pendingContinue.current=false;setPhase('guided');setMessage(value);setMode('stills');},onExploreState:setPhase,getProgress:()=>sceneProgress.current,getHero:()=>activeRef.current===0,reducedMotion:reduced,mobile:device.mobile,hotspotLayer:hotspotLayer.current});
  }).then(fn=>{cleanup=fn;if(abort.signal.aborted)cleanup?.();}).catch(()=>{pendingExplore.current=false;setPhase('guided');setMode('stills');setMessage('Continue with the image tour.');}),200);
  return()=>{clearTimeout(timeout);clearTimeout(timer);abort.abort();cleanup?.();engine.current=null;};
 },[mode,reduced,device]);
 useEffect(()=>{if(ready&&pendingExplore.current){pendingExplore.current=false;exploringRef.current=true;engine.current?.enterExplore();}},[ready]);
 useEffect(()=>{
  if(!exploring)return;
  exploringRef.current=true;lenis.current?.stop();
  const y=scrollY,body=document.body,prior={position:body.style.position,top:body.style.top,width:body.style.width,overflow:body.style.overflow};
  body.style.position='fixed';body.style.top=`-${y}px`;body.style.width='100%';body.style.overflow='hidden';body.classList.add('exploring');
  const key=e=>{
   if(e.key==='Escape'){e.preventDefault();pendingContinue.current=false;setSelected(null);engine.current?.continueTour();}
   if(e.key==='Tab'){
    const items=[...stage.current.querySelectorAll('button:not(:disabled),canvas[tabindex="0"]')].filter(el=>el.getClientRects().length);
    const first=items[0],last=items.at(-1);
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
   }
  };
  document.addEventListener('keydown',key);
  return()=>{document.removeEventListener('keydown',key);Object.assign(body.style,prior);body.classList.remove('exploring');window.scrollTo({top:y,behavior:'instant'});lenis.current?.resize();lenis.current?.start();exploringRef.current=false;exploreButton.current?.focus({preventScroll:true});};
 },[exploring]);
 useEffect(()=>{if(!exploring&&pendingContinue.current){pendingContinue.current=false;requestAnimationFrame(()=>navigate('interiors'));}},[exploring]);
 useEffect(()=>{if(!menu)return;const key=e=>{if(e.key==='Escape'){setMenu(false);menuButton.current?.focus();}};document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key);},[menu]);
 function navigate(id){
  setMenu(false);if(id!=='explore')pendingExplore.current=false;const el=document.getElementById(id);if(!el)return;const top=el.getBoundingClientRect().top+scrollY;history.replaceState(null,'',`#${id}`);
  if(lenis.current){lenis.current.resize();lenis.current.scrollTo(top,{duration:1.4});}else window.scrollTo({top,behavior:reduced?'instant':'smooth'});el.focus({preventScroll:true});
 }
 function go(e,id){e.preventDefault();navigate(id);}
 function startExplore(){
  setSelected(null);if(!ready){pendingExplore.current=true;setMode('3d');return;}exploringRef.current=true;engine.current?.enterExplore();
 }
 function exitExplore(continueToInterior=false){pendingContinue.current=continueToInterior;setSelected(null);engine.current?.continueTour();}
 function resetExplore(){setSelected(null);engine.current?.resetView();}
 function focusPlace(id){setSelected(id);engine.current?.focusHotspot(id);}
 const image=active===7?'evening':chapters[Math.min(active,4)].image;
 return <>
  <a className="skip" href="#overview" inert={exploring}>Skip to the presentation</a>
  <header className="header" inert={exploring}><a href="#perspective" className="brand" aria-label="Shangri-La Residence, back to top" onClick={e=>go(e,'perspective')}><Mark/><span>SHANGRI-LA<small>RESIDENCE</small></span></a><nav className="desktop-nav" aria-label="Main navigation"><a href="#overview" onClick={e=>go(e,'overview')}>The experience</a><a href="#explore" onClick={e=>go(e,'explore')}>Explore</a><a href="#interiors" onClick={e=>go(e,'interiors')}>Interiors</a><a href="#masterplan" onClick={e=>go(e,'masterplan')}>The master plan</a></nav><div className="header-end"><span className="location">HUA HIN, THAILAND</span><button ref={menuButton} className="menu-button" aria-label={menu?'Close chapters':'Open chapters'} aria-expanded={menu} aria-controls="chapter-menu" onClick={()=>setMenu(!menu)}><span/><span/></button></div></header>
  {menu&&<nav id="chapter-menu" className="chapter-menu" aria-label="Chapters">{navigation.map((n,i)=><a key={n.id} href={`#${n.id}`} aria-current={active===i?'location':undefined} onClick={e=>go(e,n.id)}><span>{String(i+1).padStart(2,'0')}</span>{n.label}<span>↗</span></a>)}</nav>}
  <div ref={stage} className={`scene-stage ${inPaper?'obscured':''} ${exploring?'interactive':''}`} role={exploring?'dialog':undefined} aria-modal={exploring?true:undefined} aria-label={exploring?'Explore Shangri-La Residence':undefined}>
   <div className="poster-stack" aria-hidden="true">{['aerial','arrival','pool','evening'].map(name=><img key={name} src={`/assets/${name}.webp`} className={image===name?'visible':''} alt="" loading={name==='aerial'?'eager':'lazy'} onError={e=>{e.currentTarget.hidden=true;}}/>)}</div>
   <div ref={host} className={`webgl ${ready&&mode==='3d'&&!paused?'is-ready':''}`} aria-hidden={!exploring}/><div className="scene-shade" aria-hidden="true"/>
   <Hotspots layer={hotspotLayer} active={exploring} selected={selected} onSelect={focusPlace}/>
   <ExploreControls active={exploring} phase={phase} selected={selected} touch={device.touch} onReset={resetExplore} onContinue={()=>exitExplore(true)} onExit={()=>exitExplore(false)} onBack={resetExplore}/>
   {mode==='3d'&&!ready&&!paused&&<LoadingScreen progress={load} message={message}/>}
  </div>
  <aside className={`chapter-rail ${inPaper?'dark':''}`} aria-label="Presentation chapters" inert={exploring}>{navigation.map((n,i)=><a key={n.id} href={`#${n.id}`} onClick={e=>go(e,n.id)} className={active===i?'active':''} aria-label={`${String(i+1).padStart(2,'0')}. ${n.label}`} aria-current={active===i?'location':undefined}><span>{n.label}</span><i/></a>)}</aside>
  <main inert={exploring}>
   <div ref={journey} className="journey">{chapters.map((c,i)=><section id={c.id} tabIndex={-1} data-chapter key={c.id} className={`chapter chapter-${i} ${active===i?'current':''}`}><div className="chapter-content"><p className="eyebrow"><span/>{c.eyebrow}</p>{i===0?<h1>{c.title[0]}<br/><em>{c.title[1]}</em></h1>:<h2>{c.title[0]}<br/><em>{c.title[1]}</em></h2>}<p className="description">{c.description}</p>{i===0?<a className="journey-link" href="#overview" onClick={e=>go(e,'overview')}><span className="circle">↓</span>SCROLL TO EXPLORE<span className="fine-line"/></a>:i===4?<div className="explore-entry"><button ref={exploreButton} className="button button-light" aria-label="Explore project" disabled={pendingExplore.current&&!ready} onClick={startExplore}>{pendingExplore.current&&!ready?'Preparing 3D…':'Explore'} <span>↗</span></button><a href="#interiors" onClick={e=>go(e,'interiors')}>Continue to interiors ↓</a></div>:<p className="chapter-detail">{c.detail}</p>}</div></section>)}</div>
   <InteriorGallery/>
   <section id="masterplan" tabIndex={-1} data-chapter className="masterplan-section"><div className="plan-heading"><div><p className="eyebrow"><span/>07 / The master plan</p><h2>Every place.<br/><em>One considered whole.</em></h2></div><p>The original site drawing.<br/>Explore the whole project, in detail.</p></div><MasterPlan/><div className="plan-legend"><span><b>A / B</b> Residences</span><span><b>P03</b> Restaurant</span><span><b>P04</b> Pool</span><span><b>P05</b> Pool facilities</span><span><b>P06</b> Staff accommodation</span><span><b>P07</b> Guardhouse</span></div><div className="plan-note"><span>ORIGINAL PROJECT DRAWING</span><a href="/assets/SITE_MASTERPLAN.pdf" target="_blank" rel="noreferrer">Download original PDF ↗</a></div></section>
   <section id="closing" tabIndex={-1} data-chapter className="closing chapter"><div className="closing-content"><p className="eyebrow">08 / Until we meet here</p><h2>A place to return to.<br/><em>A life to look forward to.</em></h2><p className="closing-brand">SHANGRI-LA RESIDENCE</p><div className="closing-actions"><a className="button button-light" href="#masterplan" onClick={e=>go(e,'masterplan')}>View master plan ↗</a><a className="text-button" href="#perspective" onClick={e=>go(e,'perspective')}>Back to the beginning ↑</a></div></div><footer><span>SHANGRI-LA RESIDENCE</span><span>AN ARCHITECTURAL JOURNEY</span><span>HUA HIN, THAILAND</span></footer></section>
  </main>
  <div className={`experience-bar ${paused?'hide':''}`} inert={exploring}><span className="chapter-counter"><b>{String(active+1).padStart(2,'0')}</b><span>/ {String(navigation.length).padStart(2,'0')}</span><i/>{navigation[active]?.label}</span><div className="mode-controls"><span className="mode-status" role="status">{message||(mode==='3d'?(ready?'GUIDED 3D TOUR':'LOADING 3D'):'IMAGE TOUR')}</span><button onClick={()=>{pendingExplore.current=false;setMode(mode==='3d'?'stills':'3d');}} aria-label={mode==='3d'?'Switch to image tour':'Enable 3D experience'}>{mode==='3d'?'Image tour':'3D tour'} ↗</button></div></div>
  <div ref={progressBar} className="progress-line"/>
 </>;
}
createRoot(document.getElementById('root')).render(<App/>);
