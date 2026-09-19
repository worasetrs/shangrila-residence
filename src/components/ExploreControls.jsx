import React,{useEffect,useRef,useState} from 'react';
import {hotspots} from '../data/hotspots';
export function Hotspots({layer,active,selected,onSelect}){
 return <div ref={layer} className="hotspots" hidden={!active} aria-label="Places in the project">{hotspots.map((item,i)=><button data-hotspot-id={item.id} key={item.id} className={`hotspot ${selected===item.id?'selected':''}`} aria-label={`Explore ${item.label}`} aria-pressed={selected===item.id} onClick={()=>onSelect(item.id)}><i>{i+1}</i><span>{item.label}</span></button>)}</div>;
}
export default function ExploreControls({active,phase,selected,touch,onReset,onContinue,onExit,onBack}){
 const [hint,setHint]=useState(false),seen=useRef(false);
 const item=hotspots.find(h=>h.id===selected);
 useEffect(()=>{if(!active || seen.current)return;seen.current=true;setHint(true);const timer=setTimeout(()=>setHint(false),6500);return()=>clearTimeout(timer);},[active]);
 const busy=phase!=='explore';
 return <div className="explore-ui" hidden={!active}>
  <div className="explore-heading"><span className="eyebrow" role="status">{busy?'CHANGING PERSPECTIVE':'EXPLORE THE PROJECT'}</span><button className="exit-explore" onClick={onExit} aria-label="Exit Explore">Exit Explore ×</button></div>
  {hint && <p className="explore-hint">{touch?'One finger to rotate · Pinch to zoom · Two fingers to pan':'Drag to explore · Scroll to zoom · Right-drag or arrow keys to pan'}</p>}
  {item && <aside className="hotspot-card" aria-label={`${item.label} details`}><button className="card-close" onClick={onBack} aria-label="Close place details">×</button><img src={item.image.startsWith('/')?item.image:`/assets/${item.image}.webp`} alt={`${item.label} exterior view`} onError={e=>{e.currentTarget.hidden=true;}}/><div><p className="eyebrow">A CLOSER LOOK</p><h2>{item.label}</h2><p>{item.description}</p><button className="overview-button" onClick={onBack}>Back to overview ↑</button></div></aside>}
  <div className="explore-actions"><button onClick={onReset} disabled={busy}>Reset View</button><button className="continue-tour" aria-label="Continue Tour" onClick={onContinue}>Continue Tour ↓</button></div>
 </div>;
}
