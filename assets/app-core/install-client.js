// Build 270 — install + opt-in Web Push client. No recurring reads and no push subscription is created automatically.
(function(globalScope){
  'use strict';
  let deferredPrompt=null;
  const state={installable:false};
  const all=(sel)=>[...document.querySelectorAll(sel)];
  function setStatus(message){all('[data-app-device-status]').forEach((el)=>el.textContent=message);}
  function update(){
    all('[data-pwa-install]').forEach((button)=>{button.hidden=!state.installable;button.disabled=!state.installable;});
    all('[data-notification-enable]').forEach((button)=>{button.disabled=!("Notification" in globalScope);});
    all('[data-notification-test]').forEach((button)=>{button.disabled=!("Notification" in globalScope)||Notification.permission!=="granted";});
  }
  function pushRoutes(){
    const isCustomer=document.body?.dataset?.appModule==='customer';
    return isCustomer
      ? {kind:'customer',config:'/api/customer_push_config',subscribe:'/api/customer_push_subscribe',unsubscribe:'/api/customer_push_unsubscribe'}
      : {kind:'staff',config:'/api/push_config',subscribe:'/api/push_subscribe',unsubscribe:'/api/push_unsubscribe'};
  }
  globalScope.addEventListener('beforeinstallprompt',(event)=>{event.preventDefault();deferredPrompt=event;state.installable=true;setStatus('Rosie can be installed as a standalone app on this device.');update();});
  globalScope.addEventListener('appinstalled',()=>{deferredPrompt=null;state.installable=false;setStatus('Rosie is installed on this device.');update();});
  async function install(){
    if(!deferredPrompt){setStatus('Use the browser Install app / Add to Home Screen command if no install button is offered here.');return;}
    await deferredPrompt.prompt();
    const choice=await deferredPrompt.userChoice.catch(()=>null);
    setStatus(choice?.outcome==='accepted'?'Install accepted.':'Install was not completed.');
    deferredPrompt=null;state.installable=false;update();
  }
  async function registration(){
    if(!('serviceWorker' in navigator))throw new Error('Service workers are not supported on this device.');
    return (await navigator.serviceWorker.getRegistration())||navigator.serviceWorker.register('/service-worker.js');
  }
  async function apiJson(url,options={}){
    const response=await fetch(url,{credentials:'include',cache:'no-store',...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error||`Request failed (${response.status}).`);
    return data;
  }
  function applicationServerKey(value){
    const padding='='.repeat((4-value.length%4)%4);
    const base64=(value+padding).replace(/-/g,'+').replace(/_/g,'/');
    const raw=atob(base64);
    return Uint8Array.from([...raw].map((c)=>c.charCodeAt(0)));
  }
  async function enableNotifications(){
    if(!('Notification' in globalScope)){setStatus('Notifications are not supported by this browser.');return;}
    const permission=await Notification.requestPermission();
    if(permission!=='granted'){setStatus(`Notification permission: ${permission}.`);update();return;}
    try{
      const routes=pushRoutes();
      const reg=await registration();
      if(!reg.pushManager){setStatus('Local device notifications are enabled; this browser does not support Web Push subscriptions.');update();return;}
      const config=await apiJson(routes.config);
      if(routes.kind==='customer'&&config.notification_opt_in!==true){
        setStatus('Remote push is off in your Rosie notification preferences. Enable notifications in your customer account first.');
        update();return;
      }
      if(!config.subscription_enabled||!config.vapid_public_key){
        setStatus('Local device notifications are enabled. Remote push is waiting for server VAPID configuration.');
        update();return;
      }
      let subscription=await reg.pushManager.getSubscription();
      if(!subscription){
        subscription=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:applicationServerKey(config.vapid_public_key)});
      }
      await apiJson(routes.subscribe,{
        method:'POST',
        body:JSON.stringify({
          subscription:subscription.toJSON(),
          timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||'America/Toronto',
          platform:navigator.userAgentData?.platform||navigator.platform||null
        })
      });
      const ownerLabel=routes.kind==='customer'?'customer account':'staff account';
      setStatus(config.delivery_ready?`Remote Rosie notifications are enabled for this ${ownerLabel}.`:'This device is subscribed. Server push delivery is waiting for the VAPID private key.');
    }catch(error){setStatus(error?.message||'Could not enable remote Rosie notifications.');}
    update();
  }
  async function disableRemotePush(){
    try{
      const routes=pushRoutes();
      const reg=await registration();
      const subscription=await reg.pushManager?.getSubscription();
      if(!subscription){setStatus('No remote Rosie push subscription is active on this device.');return;}
      const endpoint=subscription.endpoint;
      await apiJson(routes.unsubscribe,{method:'POST',body:JSON.stringify({endpoint})});
      await subscription.unsubscribe();
      setStatus('Remote Rosie notifications are disabled on this device.');
    }catch(error){setStatus(error?.message||'Could not disable remote Rosie notifications.');}
  }
  async function testNotification(){
    if(Notification.permission!=='granted'){setStatus('Enable notifications first.');return;}
    try{
      const reg=await registration();
      await reg.showNotification('Rosie Dazzlers',{body:'Device notifications are working on this installed/web app.',tag:'rosie-build270-local-test',data:{url:location.pathname+location.search}});
      setStatus('Local Rosie test notification sent.');
    }catch(error){setStatus(error.message||'Could not send the test notification.');}
  }
  function bind(){
    all('[data-pwa-install]').forEach((b)=>b.addEventListener('click',install));
    all('[data-notification-enable]').forEach((b)=>b.addEventListener('click',enableNotifications));
    all('[data-notification-test]').forEach((b)=>b.addEventListener('click',testNotification));
    if(globalScope.matchMedia?.('(display-mode: standalone)').matches)setStatus('Rosie is running in installed/standalone mode.');
    else setStatus('Web mode. Install availability depends on this browser/device.');
    update();
  }
  if('serviceWorker' in navigator)globalScope.addEventListener('load',()=>navigator.serviceWorker.register('/service-worker.js').catch(()=>null),{once:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
  globalScope.RosieInstall={install,enableNotifications,disableRemotePush,testNotification};
})(window);