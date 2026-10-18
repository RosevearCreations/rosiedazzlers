// Build 573: whitelisted quote-first intake mapping into existing public_inquiry_leads.
import {WIZARD_OPTIONS_570} from "./quote-first-wizard-model-v570.js";
const allowed=(type,value)=>WIZARD_OPTIONS_570[type]?.some(x=>x.id===value)===true;
const clean=(v,max)=>String(v??"").replace(/[\u0000-\u001f\u007f<>]/g," ").replace(/\s+/g," ").trim().slice(0,max);
const UUID4=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function normalizeQuoteFirstRequest573(input){
  if(!input||typeof input!=="object"||Array.isArray(input))return {ok:false,error:"Invalid request."};
  const id=clean(input.request_id,60);
  if(!UUID4.test(id))return {ok:false,error:"Refresh the request before submitting."};
  const vehicle=clean(input.vehicle,30),goal=clean(input.goal,30),condition=clean(input.condition,30);
  if(!allowed("vehicle",vehicle)||!allowed("goal",goal)||!allowed("condition",condition))
    return {ok:false,error:"Complete your vehicle, goal and condition selections."};
  const extras=Array.isArray(input.extras)?input.extras:[];
  if(extras.length>5||extras.some(x=>!allowed("extras",x))||new Set(extras).size!==extras.length)
    return {ok:false,error:"Invalid additional concerns."};
  const full_name=clean(input.full_name,180),email=clean(input.email,220).toLowerCase(),
    phone=clean(input.phone,50),service_area=clean(input.service_area,120),notes=clean(input.notes,450);
  if(full_name.length<2||full_name.length>180)return {ok:false,error:"Please enter your name."};
  if(!email&&!phone)return {ok:false,error:"Email or telephone is required."};
  if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return {ok:false,error:"Please check your email address."};
  if(phone&&!/^[+0-9() .-]{7,50}$/.test(phone))return {ok:false,error:"Please check your telephone number."};
  if(input.contact_consent!==true)return {ok:false,error:"Please agree to be contacted about this inquiry."};
  const msg=[
    "Quote-first request (not a quote or booking)",
    "Request reference: "+id,
    "Vehicle: "+vehicle,"Goal: "+goal,"Condition: "+condition,
    "Additional concerns: "+(extras.join(", ")||"none"),
    "Area: "+(service_area||"not specified"),
    "Additional details: "+(notes||"none"),
    "Contact consent: inquiry response only; not marketing"
  ].join("\n");
  return {ok:true,request_id:id,payload:{
    id,topic:"general",full_name,email:email||null,phone:phone||null,
    service_area:service_area||null,vehicle_count:1,preferred_cadence:null,
    source_path:"/preview/quote-first/",message:msg,photo_estimate_links:[],status:"new"
  }};
}
export function sameQuoteFirstRequest573(existing,payload){
  return Boolean(existing&&existing.id===payload.id&&existing.message===payload.message
    &&existing.full_name===payload.full_name&&existing.email===payload.email
    &&existing.phone===payload.phone&&existing.service_area===payload.service_area
    &&existing.source_path===payload.source_path);
}
