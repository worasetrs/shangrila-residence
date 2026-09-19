import React,{useEffect,useRef,useState} from 'react';
import {interiorScenes} from '../data/project';

function InteriorScene({scene,index}){
 const [view,setView]=useState(0),[failed,setFailed]=useState(false),ref=useRef(null);
 const image=scene.images[view];
 useEffect(()=>{setFailed(false);},[view]);
 useEffect(()=>{
  const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting){ref.current.classList.add('revealed');observer.disconnect();}},{threshold:.1});
  observer.observe(ref.current);return()=>observer.disconnect();
 },[]);
 return <article ref={ref} id={`interior-${scene.id}`} className="interior-scene" data-interior={scene.id}>
  <div className="interior-caption"><p className="eyebrow">{String(index+1).padStart(2,'0')} / {scene.label}</p><h3>{scene.title}</h3><p>{scene.text}</p></div>
  <figure>
   {image && !failed?<img src={image.src} srcSet={`${image.small} ${image.smallWidth}w, ${image.src} ${image.width}w`} sizes="(max-width: 767px) calc(100vw - 40px), calc(100vw - 144px)" width={image.width} height={image.height} alt={`${scene.label}${scene.views?' — '+scene.views[view]:''}. ${image.concept?'Concept interior study.':'Original interior design presentation.'}`} loading="lazy" decoding="async" onError={()=>setFailed(true)}/>:<div className="image-placeholder"><span>SHANGRI-LA RESIDENCE</span><strong>{scene.label}</strong><p>Presentation image coming soon.</p></div>}
   <figcaption><span>{image?.concept?'CONCEPT STUDY · DESIGN UNDER REVIEW':'ORIGINAL INTERIOR PRESENTATION'}</span>{scene.views && <div className="interior-views" aria-label={`${scene.label} views`}>{scene.views.map((label,i)=><button key={label} aria-pressed={view===i} onClick={()=>setView(i)}>{label}</button>)}</div>}</figcaption>
  </figure>
 </article>;
}
export default function InteriorGallery(){
 return <section id="interiors" className="interior-gallery" data-chapter tabIndex={-1}>
  <div className="gallery-heading"><p className="eyebrow">06 / Within the residence</p><h2>Warmth,<br/><em>from within.</em></h2><p>An intimate collection of spaces.<br/>Material, light and the comfort of home.</p></div>
  {interiorScenes.map((scene,index)=><InteriorScene key={scene.id} scene={scene} index={index}/>)}
 </section>;
}
