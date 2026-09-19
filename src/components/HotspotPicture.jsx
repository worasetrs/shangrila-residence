import React,{useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';

function EnlargedPicture({item,src,opener,onClose}){
 const dialog=useRef(null),[failed,setFailed]=useState(false);
 useEffect(()=>{
  const previousOverflow=document.body.style.overflow;
  document.body.style.overflow='hidden';dialog.current.showModal();
  return()=>{document.body.style.overflow=previousOverflow;opener.current?.focus({preventScroll:true});};
 },[opener]);
 return createPortal(<dialog ref={dialog} className="gallery-dialog hotspot-image-dialog" aria-label={`${item.label} — enlarged image`} onCancel={event=>{event.preventDefault();onClose();}} onClick={event=>{
  if(event.target!==event.currentTarget)return;
  const rect=event.currentTarget.getBoundingClientRect();
  if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)onClose();
 }}>
  <div className="lightbox-bar"><span>A CLOSER LOOK</span><button autoFocus onClick={onClose} aria-label="Close enlarged image">Close ×</button></div>
  <div className="lightbox-picture">{failed?<div className="image-placeholder"><strong>{item.label}</strong><p>Image temporarily unavailable.</p></div>:<img src={src} alt={`${item.label} exterior view`} decoding="async" onError={()=>setFailed(true)}/>}</div>
  <div className="lightbox-caption"><h2>{item.label}</h2></div>
 </dialog>,document.body);
}

export default function HotspotPicture({item}){
 const [open,setOpen]=useState(false),[failed,setFailed]=useState(false),opener=useRef(null);
 const src=item.image.startsWith('/')?item.image:`/assets/${item.image}.webp`;
 return <>
  <button ref={opener} className="hotspot-preview" aria-label={`View larger image of ${item.label}`} aria-haspopup="dialog" disabled={failed} onClick={()=>setOpen(true)}>
   {failed?<span className="preview-unavailable">Image unavailable</span>:<><img src={src} alt={`${item.label} exterior view`} onError={()=>setFailed(true)}/><span className="preview-expand" aria-hidden="true">⤢</span></>}
  </button>
  {open&&<EnlargedPicture item={item} src={src} opener={opener} onClose={()=>setOpen(false)}/>}
 </>;
}
