import React from 'react';
export default function LoadingScreen({progress,message}){
 return <div className="loading-screen" role="status"><span>SHANGRI-LA RESIDENCE</span><p>{message || 'Preparing your perspective'}</p><div className="loading-track" role="progressbar" aria-label="Loading 3D presentation" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress*100)}><i style={{transform:`scaleX(${progress})`}}/></div><small>{Math.round(progress*100)}%</small></div>;
}
