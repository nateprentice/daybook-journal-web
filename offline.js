(() => {
  let registration;
  async function worker() {
    if(!window.isSecureContext || !navigator.serviceWorker)throw new Error('Offline opening needs a supported secure browser.');
    const scope=new URL('.',document.baseURI);
    const reg=await (registration ||= navigator.serviceWorker.getRegistration(scope.href).then(existing=>{
      if(existing && [existing.active,existing.waiting,existing.installing].some(w=>w?.scriptURL.includes('/daybook_offline_sw.js'))) {
        if(navigator.onLine!==false)existing.update().catch(()=>{});
        return existing;
      }
      return navigator.serviceWorker.register(new URL('daybook_offline_sw.js',scope),{scope:scope.pathname});
    }).catch(e=>{registration=undefined;throw e;}));
    const selected=reg.installing || reg.waiting || reg.active;
    if(!selected)throw new Error('Offline worker is not ready.');
    if(selected.state!=='activated')await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error('Offline setup timed out.')),30000);
      selected.addEventListener('statechange',()=>{if(selected.state==='activated'){clearTimeout(timer);resolve();}else if(selected.state==='redundant'){clearTimeout(timer);reject(new Error('Offline setup needs retry.'));}});
    });
    return selected;
  }
  window.daybookOffline=async action=>{
    try {
      const target=await worker();
      const result=await new Promise((resolve,reject)=>{
        const channel=new MessageChannel();
        const timer=setTimeout(()=>reject(new Error('Offline preparation timed out.')),180000);
        channel.port1.onmessage=({data})=>{clearTimeout(timer);resolve(data);};
        target.postMessage({action},[channel.port2]);
      });
      return JSON.stringify({...result,available:true,online:navigator.onLine!==false});
    } catch (_) {return JSON.stringify({available:true,ready:false,online:navigator.onLine!==false,error:'Offline preparation is unavailable or incomplete. Reconnect and try Prepare offline files.'});}
  };
  // Start after the main app begins loading, without delaying journal startup.
  window.addEventListener('load',()=>{window.daybookOffline('prepare');},{once:true});
})();
