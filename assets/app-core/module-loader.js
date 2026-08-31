// Build 264 — explicit lazy module loader. Heavy module code is not requested until needed.
(function attachRosieModuleLoader(globalScope){
  'use strict';
  const loaded=new Map();
  async function load(key,url){
    if(loaded.has(key)) return loaded.get(key);
    const promise=import(url).catch((error)=>{loaded.delete(key);throw error;});
    loaded.set(key,promise);
    return promise;
  }
  function has(key){return loaded.has(key);}
  globalScope.RosieAppCore=globalScope.RosieAppCore||{};
  globalScope.RosieAppCore.ModuleLoader={load,has};
})(window);
