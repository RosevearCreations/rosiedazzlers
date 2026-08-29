// Historical Build 264 guard token retained for release evidence: const BUILD=264
// Build 265 — shared Rosie application module resolver.
// UI/module visibility is a download/navigation decision only; APIs remain authoritative.
(function attachRosieModuleResolver(globalScope){
  'use strict';
  const BUILD=265;
  const MODULES = Object.freeze({
    customer:{key:'customer',name:'Customer App',href:'/app/customer/',status:'bridge'},
    detailer:{key:'detailer',name:'Detailer Mobile App',href:'/app/detailer/',status:'runtime'},
    operations:{key:'operations',name:'Operations / Supervisor App',href:'/app/operations/',status:'runtime'},
    admin:{key:'admin',name:'Business Administration App',href:'/app/admin/',status:'bridge'}
  });
  function role(actor){ return String(actor?.role_code || '').trim().toLowerCase(); }
  function cap(actor,key){ return actor?.is_admin === true || actor?.capabilities?.[key] === true || actor?.[key] === true; }
  function canAccess(key,actor){
    if(key==='customer') return true;
    if(!actor) return false;
    const r=role(actor);
    if(key==='detailer') return actor.is_admin===true || r==='admin' || r==='detailer' || r==='senior_detailer' || cap(actor,'can_manage_bookings') || cap(actor,'can_manage_progress');
    if(key==='operations') return actor.is_admin===true || r==='admin' || r==='senior_detailer' || r==='supervisor' || r==='booking_manager' || cap(actor,'can_manage_bookings') || cap(actor,'can_manage_blocks');
    if(key==='admin') return actor.is_admin===true || r==='admin' || r==='owner' || cap(actor,'can_manage_staff');
    return false;
  }
  function allowed(actor,{includeCustomer=false}={}){
    return Object.values(MODULES).filter((m)=>(includeCustomer||m.key!=='customer') && canAccess(m.key,actor));
  }
  function remember(key){ try{ if(MODULES[key]) localStorage.setItem('rosie_last_staff_module_v265',key); }catch{} }
  function lastAllowed(actor){ try{ const key=localStorage.getItem('rosie_last_staff_module_v265'); return key&&canAccess(key,actor)?MODULES[key]:null; }catch{return null;} }
  globalScope.RosieAppCore=globalScope.RosieAppCore||{};
  globalScope.RosieAppCore.ModuleResolver={BUILD,MODULES,canAccess,allowed,remember,lastAllowed};
})(window);
