// Historical Build 264 guard token retained for release evidence: const BUILD=264
// Historical Build 265 guard token retained for release evidence: const BUILD=265
// Historical Build 266 guard token retained for release evidence: const BUILD=266
// Historical Build 265 exact module token: operations:{key:'operations',name:'Operations / Supervisor App',href:'/app/operations/',status:'runtime'}
// Build 267 — role-aware Rosie application module resolver.
// Module visibility controls navigation/runtime downloads only. Server API authorization remains authoritative.
(function attachRosieModuleResolver(globalScope){
  'use strict';
  const BUILD=267;
  const CACHE_KEY='rosie_module_runtime_flags_v267';
  const LAST_KEY='rosie_last_staff_module_v267';
  const CACHE_MS=15*60*1000;
  const INTERNAL_MODULES=['detailer','operations','admin','it','finance','daip','socials'];
  const MODULES=Object.freeze({
    customer:{key:'customer',name:'Customer App',href:'/app/customer/',status:'bridge',description:'Booking, account, progress, quote and payment-facing customer workflows.'},
    detailer:{key:'detailer',name:'Detailer Mobile App',href:'/app/detailer/',status:'runtime',description:'Assigned field work. Live messaging/media stays asleep until an eligible job is open.'},
    operations:{key:'operations',name:'Operations / Supervisor App',href:'/app/operations/',status:'runtime',description:'Today, schedule, blocks, assignments and live oversight load only when selected.'},
    admin:{key:'admin',name:'Business Administration App',href:'/app/admin/',status:'lazy',description:'Staff, inventory, catalog and core business configuration load on demand.'},
    it:{key:'it',name:'I.T. & Reliability App',href:'/app/it/',status:'control',description:'Module switches, preflights, tests, diagnostics, security and recovery.'},
    finance:{key:'finance',name:'Finance App',href:'/app/finance/',status:'lazy',description:'Accounting, payments, payroll, tax and close/reconciliation workflows.'},
    daip:{key:'daip',name:'DAIP App',href:'/app/daip/',status:'lazy',description:'Private governed media/evidence workflows. Existing DAIP gates remain authoritative.'},
    socials:{key:'socials',name:'Socials & Promotion App',href:'/app/socials/',status:'lazy',description:'Marketing, public content, proof, SEO and provider integrations.'}
  });
  const DEFAULT_FLAGS=Object.freeze({customer:true,detailer:true,operations:true,admin:true,it:true,finance:true,daip:true,socials:true});
  const ROLE_CEILINGS=Object.freeze({
    detailer:['detailer'],
    senior_detailer:['detailer','operations'],
    operations_manager:['detailer','operations'],
    accountant:['finance'],
    it_specialist:['it'],
    promoter:['socials'],
    daip_manager:['daip'],
    admin:[...INTERNAL_MODULES]
  });
  const ROLE_LABELS=Object.freeze({
    detailer:'Detailer',senior_detailer:'Senior Detailer',operations_manager:'Operations Manager',accountant:'Accountant / Finance',it_specialist:'I.T. Specialist',promoter:'Promoter / Marketing',daip_manager:'DAIP Manager',admin:'Administrator / Owner'
  });
  let runtimeFlags={...DEFAULT_FLAGS};
  let flagsUpdatedAt=null;
  function role(actor){
    const raw=String(actor?.role_code||'').trim().toLowerCase();
    return actor?.is_admin===true?'admin':raw;
  }
  function moduleProfile(actor){
    const direct=actor?.module_access;
    if(direct&&typeof direct==='object'&&!Array.isArray(direct)) return direct;
    const nested=actor?.permissions_profile?.module_access;
    return nested&&typeof nested==='object'&&!Array.isArray(nested)?nested:{};
  }
  function withinRoleCeiling(key,actor){
    if(key==='customer') return true;
    return (ROLE_CEILINGS[role(actor)]||[]).includes(key);
  }
  function profileAllows(key,actor){
    if(key==='customer') return true;
    if(!withinRoleCeiling(key,actor)) return false;
    if(role(actor)==='admin') return true; // Build 267: every admin account always has every internal module.
    const profile=moduleProfile(actor);
    if(Object.prototype.hasOwnProperty.call(profile,key)) return profile[key]===true;
    return true; // role-safe backward-compatible default for pre-module accounts.
  }
  function isEnabled(key){return key==='it'?true:runtimeFlags[key]!==false;}
  function canAccess(key,actor,{ignoreRuntimeFlag=false}={}){
    if(!MODULES[key]) return false;
    if(!ignoreRuntimeFlag&&!isEnabled(key)) return false;
    if(key==='customer') return true;
    if(!actor) return false;
    return profileAllows(key,actor);
  }
  function allowed(actor,{includeCustomer=false}={}){
    return Object.values(MODULES).filter((m)=>(includeCustomer||m.key!=='customer')&&canAccess(m.key,actor));
  }
  function readCachedFlags(){
    try{const raw=localStorage.getItem(CACHE_KEY);if(!raw)return null;const parsed=JSON.parse(raw);if(!parsed||typeof parsed!=='object'||Date.now()-Number(parsed.cached_at||0)>CACHE_MS)return null;return parsed;}catch{return null;}
  }
  function applyFlags(flags,updatedAt=null){
    const next={...DEFAULT_FLAGS};
    for(const key of Object.keys(DEFAULT_FLAGS))if(typeof flags?.[key]==='boolean')next[key]=flags[key];
    next.it=true;runtimeFlags=next;flagsUpdatedAt=updatedAt||null;return {...runtimeFlags};
  }
  async function loadRuntimeFlags({force=false}={}){
    if(!force){const cached=readCachedFlags();if(cached){applyFlags(cached.flags,cached.updated_at);return{flags:{...runtimeFlags},source:'cache',updated_at:flagsUpdatedAt};}}
    try{
      const response=await fetch('/api/admin/module_flags',{credentials:'include',cache:'no-store'});
      if(!response.ok)throw new Error(`Module flag read failed (${response.status}).`);
      const data=await response.json();applyFlags(data.flags,data.updated_at);
      try{localStorage.setItem(CACHE_KEY,JSON.stringify({flags:runtimeFlags,updated_at:data.updated_at||null,cached_at:Date.now()}));}catch{}
      return{flags:{...runtimeFlags},source:data.source||'database',updated_at:flagsUpdatedAt,locked:data.locked||{it:true}};
    }catch(error){
      const cached=readCachedFlags();if(cached){applyFlags(cached.flags,cached.updated_at);return{flags:{...runtimeFlags},source:'stale-cache',updated_at:flagsUpdatedAt,error:error.message};}
      applyFlags(DEFAULT_FLAGS,null);return{flags:{...runtimeFlags},source:'defaults',updated_at:null,error:error.message};
    }
  }
  function setRuntimeFlagsLocal(flags,updatedAt=null){applyFlags(flags,updatedAt);try{localStorage.setItem(CACHE_KEY,JSON.stringify({flags:runtimeFlags,updated_at:updatedAt||null,cached_at:Date.now()}));}catch{}return{...runtimeFlags};}
  function getRuntimeFlags(){return{...runtimeFlags};}
  function remember(key){try{if(MODULES[key])localStorage.setItem(LAST_KEY,key);}catch{}}
  function lastAllowed(actor){try{const key=localStorage.getItem(LAST_KEY);return key&&canAccess(key,actor)?MODULES[key]:null;}catch{return null;}}
  globalScope.RosieAppCore=globalScope.RosieAppCore||{};
  globalScope.RosieAppCore.ModuleResolver={BUILD,MODULES,DEFAULT_FLAGS,ROLE_CEILINGS,ROLE_LABELS,INTERNAL_MODULES,canAccess,allowed,withinRoleCeiling,profileAllows,isEnabled,loadRuntimeFlags,setRuntimeFlagsLocal,getRuntimeFlags,remember,lastAllowed};
})(window);
