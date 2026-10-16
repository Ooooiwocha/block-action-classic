"use client";
import {useEffect,useRef} from 'react';
import {installController} from './controller-logic';
export default function MobileController(){
 const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(!root.current)return;
  const pad=installController(root.current,(code:number,down:boolean)=>{const frame=document.querySelector('iframe');frame?.contentWindow?.dispatchEvent(new CustomEvent('ba-controller',{detail:{code,down}}));});
  const loaded=(e:Event)=>{if(e.target instanceof HTMLIFrameElement)pad.release();};
  document.addEventListener('load',loaded,true);
  return()=>{document.removeEventListener('load',loaded,true);pad.dispose();};
 },[]);
 return <div ref={root} className="controller-host"/>;
}
