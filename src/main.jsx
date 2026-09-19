import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import '@fontsource/manrope/latin-400.css';
import '@fontsource/manrope/latin-500.css';
import '@fontsource/manrope/latin-600.css';
import '@fontsource/cormorant-garamond/latin-400.css';
import '@fontsource/cormorant-garamond/latin-400-italic.css';
import { chapters, navigation } from './story';
import { getDeviceProfile } from './device';
import MasterPlan from './MasterPlan';
import './style.css';
gsap.registerPlugin(ScrollTrigger);

function Mark(){return <svg viewBox="0 0 44 44" fill="none" aria-hidden="true"><path d="M6 33V19L22 5l16 14v14M14 33V22l8-8 8 8v11M2 38h40" stroke="currentColor" strokeWidth="1.2"/></svg>}
function Arrow({down=false}){return <span aria-hidden="true">{down?'↓':'↗'}</span>}
function App(){
  const reduced=useRef(window.matchMedia('(prefers-reduced-motion: reduce)').matches).current;
  const device=useRef(getDeviceProfile()).current;
  const [mode,setMode]=useState(()=>reduced || device.mobile || navigator.connection?.saveData?'stills':'3d');
  const [active,setActive]=useState(0),[load,setLoad]=useState(0),[ready,setReady]=useState(false),[message,setMessage]=useState(''),[menu,setMenu]=useState(false),[inPlan,setInPlan]=useState(false);
  const sceneHost=useRef(null),sceneController=useRef(null),journey=useRef(null),sceneProgress=useRef(0),closing=useRef(false),lenis=useRef(null),progressBar=useRef(null),menuButton=useRef(null);
  useEffect(()=>{
    if(!reduced && !device.touch){
      const smooth=new Lenis({duration:1.35,smoothWheel:true,syncTouch:false,anchors:false});lenis.current=smooth;
      smooth.on('scroll',ScrollTrigger.update);
      const tick=t=>smooth.raf(t*1000);gsap.ticker.add(tick);
      return()=>{gsap.ticker.remove(tick);smooth.destroy();lenis.current=null;};
    }
  },[reduced,device]);
  useEffect(()=>{
    const nodes=[...document.querySelectorAll('[data-chapter]')];
    const triggers=nodes.map((node,i)=>ScrollTrigger.create({trigger:node,start:'top 55%',end:'bottom 55%',onToggle:self=>{if(self.isActive){setActive(i);closing.current=i===9;setInPlan(i===8);sceneController.current?.invalidate();}}}));
    const motion=ScrollTrigger.create({trigger:journey.current,start:'top top',end:'bottom top',onUpdate:self=>{sceneProgress.current=Math.min(7.8,self.progress*8);sceneController.current?.invalidate();}});
    const total=ScrollTrigger.create({start:0,end:'max',onUpdate:self=>{if(progressBar.current)progressBar.current.style.transform=`scaleX(${self.progress})`;}});
    requestAnimationFrame(()=>ScrollTrigger.refresh());
    return()=>{triggers.forEach(t=>t.kill());motion.kill();total.kill();};
  },[]);
  useEffect(()=>{
    if(sceneHost.current)sceneHost.current.dataset.paused=inPlan?'true':'false';
    sceneController.current?.setPaused(inPlan);
  },[inPlan]);
  useEffect(()=>{
    if(mode!=='3d'){setReady(false);return;}
    const controller=new AbortController();let cleanup;
    setMessage('');setLoad(0);setReady(false);
    const timeout=setTimeout(()=>{setMessage('Your image tour is ready while 3D loads.');},18000);
    const timer=setTimeout(()=>import('./scene').then(({createScene})=>{
      if(controller.signal.aborted)return;
      return createScene(sceneHost.current,{signal:controller.signal,onController:value=>{sceneController.current=value;},onProgress:setLoad,onReady:()=>{clearTimeout(timeout);setReady(true);setMessage('');},onFailure:message=>{setMessage(message);setMode('stills');},getProgress:()=>closing.current?7.8:sceneProgress.current,getClosing:()=>closing.current,reducedMotion:reduced,mobile:device.mobile});
    }).then(fn=>{cleanup=fn;if(controller.signal.aborted)cleanup?.();}).catch(()=>{setMode('stills');setMessage('Continue with the image tour.');}),250);
    return()=>{clearTimeout(timer);clearTimeout(timeout);controller.abort();cleanup?.();sceneController.current=null;};
  },[mode,reduced,device]);
  useEffect(()=>{
    if(!menu)return;
    const handler=e=>{if(e.key==='Escape'){setMenu(false);menuButton.current?.focus();}};
    document.addEventListener('keydown',handler);return()=>document.removeEventListener('keydown',handler);
  },[menu]);
  function go(event,id){
    event.preventDefault();setMenu(false);
    const el=document.getElementById(id);if(!el)return;
    const top=el.getBoundingClientRect().top+window.scrollY;
    history.replaceState(null,'',`#${id}`);
    if(lenis.current){lenis.current.resize();lenis.current.scrollTo(top,{duration:1.6});}else window.scrollTo({top,behavior:reduced?'instant':'smooth'});
    el.focus({preventScroll:true});
  }
  const image=active===9?'evening':chapters[Math.min(active,7)].image;
  return <>
    <a className="skip" href="#perspective">Skip to the presentation</a>
    <header className="header">
      <a href="#perspective" className="brand" aria-label="Shangri-La Hua Hin, back to top" onClick={e=>go(e,'perspective')}><Mark/><span>SHANGRI-LA<small>HUA HIN</small></span></a>
      <nav className="desktop-nav" aria-label="Main navigation"><a className={active<8?'selected':''} href="#overview" onClick={e=>go(e,'overview')}>The experience</a><a className={active===8?'selected':''} href="#masterplan" onClick={e=>go(e,'masterplan')}>The master plan</a></nav>
      <div className="header-end"><span className="location">HUA HIN, THAILAND</span><button ref={menuButton} className="menu-button" aria-label={menu?'Close chapters':'Open chapters'} aria-expanded={menu} aria-controls="chapter-menu" onClick={()=>setMenu(!menu)}><span/><span/></button></div>
    </header>
    {menu && <nav id="chapter-menu" className="chapter-menu" aria-label="Chapters">{navigation.map((n,i)=><a key={n.id} href={`#${n.id}`} aria-current={active===i?'location':undefined} onClick={e=>go(e,n.id)}><span>{String(i+1).padStart(2,'0')}</span>{n.label}<Arrow/></a>)}</nav>}
    <div className={`scene-stage ${inPlan?'obscured':''}`} aria-hidden="true">
      <div className="poster-stack">{[...new Set([...chapters.map(c=>c.image),'evening'])].map(name=><img key={name} src={`/assets/${name}.webp`} className={image===name?'visible':''} alt="" loading={name==='aerial'?'eager':'lazy'} />)}</div>
      <div ref={sceneHost} className={`webgl ${ready && mode==='3d'?'is-ready':''}`} />
      <div className="scene-shade"/>
    </div>
    <aside className={`chapter-rail ${inPlan?'dark':''}`} aria-label="Presentation chapters">{navigation.map((n,i)=><a key={n.id} href={`#${n.id}`} onClick={e=>go(e,n.id)} className={active===i?'active':''} aria-label={`${String(i+1).padStart(2,'0')}. ${n.label}`} aria-current={active===i?'location':undefined}><span>{n.label}</span><i/></a>)}</aside>
    <main>
      <div ref={journey} className="journey">
      {chapters.map((c,i)=><section id={c.id} tabIndex={-1} data-chapter key={c.id} className={`chapter chapter-${i} ${active===i?'current':''}`}>
        <div className="chapter-content"><p className="eyebrow"><span/>{c.eyebrow}</p><h1 style={{display:i===0?undefined:'none'}}>{c.title[0]}<br/><em>{c.title[1]}</em></h1>{i!==0 && <h2>{c.title[0]}<br/><em>{c.title[1]}</em></h2>}<p className="description">{c.description}</p>
        {i===0?<a className="journey-link" href="#overview" onClick={e=>go(e,'overview')}><span className="circle"><Arrow down/></span>SCROLL TO EXPLORE<span className="fine-line"/></a>:<p className="chapter-detail">{c.detail}</p>}
        </div>
        <span className="giant-number" aria-hidden="true">{String(i+1).padStart(2,'0')}</span>
      </section>)}
      </div>
      <section id="masterplan" tabIndex={-1} data-chapter className="masterplan-section">
        <div className="plan-heading"><div><p className="eyebrow"><span/>08 / The master plan</p><h2>Every place.<br/><em>One considered whole.</em></h2></div><p>Explore the original site plan.<br/>A closer look at how it all comes together.</p></div>
        <MasterPlan />
        <div className="plan-legend"><span><b>A / B</b> Residences</span><span><b>P03</b> Pavilion</span><span><b>P04</b> Swimming pool</span><span><b>P05</b> Pool facilities</span><span><b>P06</b> Staff accommodation</span><span><b>P07</b> Guardhouse</span></div>
        <div className="plan-note"><span>ORIGINAL PROJECT DRAWING</span><span>18 SEPTEMBER 2026 · DIMENSIONS IN METRES</span></div>
      </section>
      <section id="closing" tabIndex={-1} data-chapter className="closing chapter">
        <div className="closing-content"><p className="eyebrow">09 / Until we meet here</p><h2>A place to return to.<br/><em>A life to look forward to.</em></h2><p className="closing-brand">SHANGRI-LA HUA HIN</p><div className="closing-actions"><a className="button button-light" href="#masterplan" onClick={e=>go(e,'masterplan')}>View master plan <Arrow/></a><a className="text-button" href="#perspective" onClick={e=>go(e,'perspective')}>Back to the beginning ↑</a></div></div>
        <footer><span>SHANGRI-LA HUA HIN</span><span>AN ARCHITECTURAL JOURNEY</span><span>HUA HIN, THAILAND</span></footer>
      </section>
    </main>
    <div className={`experience-bar ${inPlan?'hide':''}`}>
      <span className="chapter-counter"><b>{String(active+1).padStart(2,'0')}</b><span>/ 10</span><i/>{navigation[active]?.label}</span>
      <div className="mode-controls"><span className="mode-status" role="status">{message || (mode==='3d'?(ready?'LIVE 3D EXPERIENCE':`PREPARING YOUR PERSPECTIVE · ${Math.round(load*100)}%`):'IMAGE EXPERIENCE')}</span><button onClick={()=>setMode(mode==='3d'?'stills':'3d')} aria-label={mode==='3d'?'Switch to image tour':'Enable 3D experience'}>{mode==='3d'?'Image tour':'Explore in 3D'}<Arrow/></button></div>
    </div>
    <div ref={progressBar} className="progress-line"/>
  </>;
}
createRoot(document.getElementById('root')).render(<App/>);
