// Build 264 — same-browser refresh leadership without a heartbeat timer.
// A future module may claim a short lease only when it actually needs recurring reads.
(function attachRosieRefreshLeader(globalScope){
  'use strict';
  const ownerId=(globalScope.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`);
  function create(scope,{leaseMs=90000}={}){
    const key=`rosie_refresh_leader_v264_${scope}`;
    const channel=typeof BroadcastChannel!=='undefined'?new BroadcastChannel(key):null;
    const listeners=new Set();
    channel?.addEventListener('message',(event)=>listeners.forEach((fn)=>{try{fn(event.data);}catch{}}));
    function read(){try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}}
    function claim(){const now=Date.now(),cur=read();if(!cur||Number(cur.expires_at||0)<=now||cur.owner_id===ownerId){const next={owner_id:ownerId,expires_at:now+leaseMs};try{localStorage.setItem(key,JSON.stringify(next));}catch{};return true;}return false;}
    function isLeader(){const cur=read();return !!cur&&cur.owner_id===ownerId&&Number(cur.expires_at||0)>Date.now();}
    function release(){const cur=read();if(cur?.owner_id===ownerId)try{localStorage.removeItem(key);}catch{};}
    function publish(message){channel?.postMessage({scope,owner_id:ownerId,...message});}
    function subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);}
    return {claim,isLeader,release,publish,subscribe,ownerId,close:()=>{release();channel?.close();}};
  }
  globalScope.RosieAppCore=globalScope.RosieAppCore||{};
  globalScope.RosieAppCore.RefreshLeader={create};
})(window);
