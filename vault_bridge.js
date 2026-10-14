/* Local vault session. Keys stay in memory and are never put in browser storage. */
(() => {
  let key, releaseLease, lease;
  const encoder = new TextEncoder();
  const decode64 = value => Uint8Array.from(atob(value), c => c.charCodeAt(0));
  const encode64 = bytes => btoa(Array.from(bytes, n => String.fromCharCode(n)).join(''));
  window.daybookLocalCipher = {
    required: () => !!localStorage.getItem('flutter.daybook.vault.v1'),
    async seal(value, id) {
      if (!key) throw new Error('Unlock the vault first');
      const blob = value instanceof Blob;
      const mime=blob ? value.type : '';
      const plain = blob ? await value.arrayBuffer() : encoder.encode(JSON.stringify(value));
      const nonce = crypto.getRandomValues(new Uint8Array(12));
      const data = await crypto.subtle.encrypt({name:'AES-GCM', iv:nonce,
        additionalData:encoder.encode(`daybook:voice:v1:${id}:${blob ? 1 : 0}:${mime}`), tagLength:128}, key, plain);
      return {daybookEncrypted:1, nonce:encode64(nonce), data, blob, mime};
    },
    async open(value, id) {
      if (!value?.daybookEncrypted) return value;
      if (!key) throw new Error('Unlock the vault first');
      if(value.daybookEncrypted!==1 || typeof value.mime!=='string')throw new Error('Unsupported encrypted recording');
      const plain = await crypto.subtle.decrypt({name:'AES-GCM',iv:decode64(value.nonce),
        additionalData:encoder.encode(`daybook:voice:v1:${id}:${value.blob ? 1 : 0}:${value.mime}`),tagLength:128},key,value.data);
      return value.blob ? new Blob([plain],{type:value.mime}) : JSON.parse(new TextDecoder().decode(plain));
    }
  };
  window.daybookVault = async (action,json) => {
    try {
      const args = JSON.parse(json);
      if (['plainSet','plainRemove','plainClear'].includes(action)) {
        const write=()=>{
          if(localStorage.getItem('flutter.daybook.vault.v1'))throw new Error('Encryption is active. Reopen Daybook to unlock.');
          if(action==='plainSet')localStorage.setItem(args.key,JSON.stringify(args.value));
          else if(action==='plainRemove')localStorage.removeItem(args.key);
          else for(const name of Object.keys(localStorage))if(name.startsWith('flutter.'))localStorage.removeItem(name);
        };
        if(navigator.locks)await navigator.locks.request('daybook-vault-session',{ifAvailable:true},lock=>{
          if(!lock)throw new Error('The vault is active in another window. Reopen Daybook.');write();
        });else write();
      } else if (action === 'acquire') {
        if (!window.isSecureContext || !crypto.subtle || !navigator.locks)
          throw new Error('Use a supported browser over HTTPS for encryption.');
        if (!lease) {
          await new Promise((resolve,reject) => {
            navigator.locks.request('daybook-vault-session',{ifAvailable:true}, async lock => {
              if (!lock) {reject(new Error('Daybook is unlocked in another tab. Lock or close that tab first.'));return;}
              lease=true;
              const held = new Promise(done => {releaseLease=done;});
              resolve(); await held; lease=false;
            }).catch(reject);
          });
        }
      } else if (action === 'key') {
        const bytes=decode64(args.key);
        if(bytes.length!==32)throw new Error('The vault requires a 256-bit key.');
        try {key=await crypto.subtle.importKey('raw',bytes,'AES-GCM',false,['encrypt','decrypt']);}
        finally {bytes.fill(0);}
      } else if (action === 'migrate') {
        if (typeof window.daybookVoice !== 'function') throw new Error('Audio storage is unavailable. Reload to finish encryption.');
        const migrated=JSON.parse(await window.daybookVoice('vaultMigrate','{}'));
        if(migrated.vaultEncryption!==1)throw new Error('Reload Daybook to finish audio encryption.');
      } else if (action === 'lock') {
        try {await window.daybookVoice?.('vaultLock','{}');} finally {
          key=undefined; releaseLease?.(); releaseLease=undefined; lease=false;
        }
      }
      return JSON.stringify({ok:true});
    } catch (error) {return JSON.stringify({ok:false,message:error.message || 'Vault operation failed'});}
  };
})();
