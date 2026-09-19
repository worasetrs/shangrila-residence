import React,{useEffect,useRef,useState} from 'react';
import images from '../data/interior-assets.json';
import {galleryCategories} from '../data/project';

const provenance=image=>image.concept?'CONCEPT STUDY · DESIGN UNDER REVIEW':'ORIGINAL INTERIOR PRESENTATION';
function Picture({image,large=false}){
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[image.id]);
 return failed?<div className="image-placeholder"><strong>{image.title}</strong><p>Image temporarily unavailable.</p></div>:<img src={image.src} srcSet={large?undefined:`${image.small} ${image.smallWidth}w, ${image.src} ${image.width}w`} sizes="(max-width: 640px) calc(100vw - 40px), (max-width: 1000px) 46vw, 30vw" width={image.width} height={image.height} alt={`${image.title}${image.concept?' — concept study':''}`} loading={large?'eager':'lazy'} decoding="async" draggable={false} onError={()=>setFailed(true)}/>;
}
function Lightbox({items,index,onIndex,onClose}){
 const dialog=useRef(null),image=items[index];
 useEffect(()=>{
  const opener=document.activeElement,prior=document.body.style.overflow;
  document.body.style.overflow='hidden';dialog.current.showModal();
  return()=>{document.body.style.overflow=prior;opener?.focus({preventScroll:true});};
 },[]);
 const move=delta=>onIndex((index+delta+items.length)%items.length);
 return <dialog ref={dialog} className="gallery-dialog" aria-label={`${image.title} — full image`} onCancel={e=>{e.preventDefault();onClose();}} onKeyDown={e=>{if(e.key==='ArrowRight'){e.preventDefault();move(1);}if(e.key==='ArrowLeft'){e.preventDefault();move(-1);}}}>
  <div className="lightbox-bar"><span>{String(index+1).padStart(2,'0')} / {items.length}</span><button autoFocus onClick={onClose} aria-label="Close image">Close ×</button></div>
  <div className="lightbox-picture"><Picture image={image} large/></div>
  <div className="lightbox-caption"><div><h2>{image.title}</h2><p>{provenance(image)}</p></div><div className="lightbox-navigation"><button onClick={()=>move(-1)} aria-label="Previous image">←</button><button onClick={()=>move(1)} aria-label="Next image">→</button><a href={image.src} target="_blank" rel="noreferrer" aria-label="Open original size image">↗</a></div></div>
 </dialog>;
}
export default function InteriorGallery(){
 const [category,setCategory]=useState('all'),[index,setIndex]=useState(null);
 const selected=category==='all'?images:images.filter(image=>image.category===category);
 return <section id="interiors" className="interior-gallery" tabIndex={-1}>
  <div className="section-heading"><div><p className="eyebrow">02 / THE IMAGE COLLECTION</p><h2>A closer look<br/><em>at life here.</em></h2></div><p>29 images. 28 spaces.<br/>Discover the complete collection.</p></div>
  <div className="gallery-filters" aria-label="Filter gallery">{galleryCategories.map(item=><button key={item.id} aria-pressed={category===item.id} onClick={()=>setCategory(item.id)}>{item.label}<span>{item.id==='all'?images.length:images.filter(image=>image.category===item.id).length}</span></button>)}</div>
  <p className="gallery-count" role="status">{selected.length} images</p>
  <div className="gallery-grid">{selected.map((image,i)=><article className="gallery-card" key={image.id} data-image-id={image.id}>
   <button className="gallery-picture" aria-label={`Open ${image.title}`} onClick={()=>setIndex(i)}><Picture image={image}/><span aria-hidden="true">↗</span></button>
   <div className="gallery-caption"><span>{image.sceneId}</span><h3>{image.title}</h3><p>{provenance(image)}</p></div>
  </article>)}</div>
  {index!==null&&<Lightbox items={selected} index={index} onIndex={setIndex} onClose={()=>setIndex(null)}/>}
 </section>;
}
