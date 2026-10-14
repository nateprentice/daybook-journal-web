/* Audio never leaves this origin. Speech recognition is separately opt-in. */
(() => {
  let session, player, playerUrl, transcriptionWorker;
  let transcriptionProgress = '';
  // Resolve from this script so GitHub Pages subdirectory hosting also works.
  const workerUrl = new URL('transcription_worker.js?queue=3', document.currentScript?.src || document.baseURI);
  const db = () => new Promise((resolve, reject) => {
    const request = indexedDB.open('daybook-voice', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('clips');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  async function rawStorage(mode, id, value) {
    const database = await db();
    try {
      return await new Promise((resolve, reject) => {
        const tx = database.transaction('clips', mode);
        const store = tx.objectStore('clips');
        const request = mode === 'readwrite' ? store.put(value, id) : store.get(id);
        tx.oncomplete = () => resolve(request.result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error('Audio storage failed'));
      });
    } finally { database.close(); }
  }
  async function storage(mode, id, value) {
    const cipher = window.daybookLocalCipher;
    if (cipher?.required()) {
      if (mode === 'readwrite') return rawStorage(mode,id,await cipher.seal(value,id));
      return cipher.open(await rawStorage(mode,id),id);
    }
    const stored = mode === 'readwrite' ? value : await rawStorage(mode,id);
    if (stored?.daybookEncrypted) {
      if (!cipher) throw new Error('Reload Daybook to unlock this recording');
      return cipher.open(stored,id);
    }
    return mode === 'readwrite' ? rawStorage(mode,id,value) : stored;
  }
  async function migrateVaultAudio() {
    const database = await db();
    let ids;
    try {
      ids=await new Promise((resolve,reject)=>{
        const tx=database.transaction('clips','readonly');
        const request=tx.objectStore('clips').getAllKeys();
        tx.oncomplete=()=>resolve(request.result);tx.onerror=()=>reject(tx.error);
      });
    } finally {database.close();}
    for (const id of ids) {
      const value=await rawStorage('readonly',id);
      // A damaged encrypted clip must not prevent the entire journal opening.
      // Playback authenticates each clip; migration never overwrites encrypted data.
      if (value === undefined || value?.daybookEncrypted) continue;
      const sealed=await window.daybookLocalCipher.seal(value,id);
      await rawStorage('readwrite',id,sealed);
    }
  }
  const release = s => {
    clearTimeout(s.timer);
    s.stream.getTracks().forEach(track => track.stop());
    try { s.recognition?.stop(); } catch (_) { /* already stopped */ }
  };
  async function transcribe(args) {
    const cacheKey = `transcript:${args.id}:${args.request}`;
    const cached = await storage('readonly', cacheKey);
    if (cached) return cached;
    const blob = await storage('readonly', args.id);
    if (!blob) return {state: 'waiting', offline: true, message: 'Audio is only available on the browser/device where it was recorded.'};
    if (navigator.onLine === false) return {state: 'waiting', offline: true, message: 'Waiting for a network connection.'};
    let samples;
    try {
      const Context = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      const context = new Context(1, 1, 16000);
      const decoded = await context.decodeAudioData(await blob.arrayBuffer());
      if (decoded.duration > 125) throw new Error('Audio too long');
      samples = new Float32Array(decoded.length);
      for (let channel = 0; channel < decoded.numberOfChannels; channel++) {
        const pcm = decoded.getChannelData(channel);
        for (let i = 0; i < samples.length; i++) samples[i] += pcm[i] / decoded.numberOfChannels;
      }
    } catch (_) { return {state: 'error', message: 'This browser cannot decode this recording. Try a supported browser on the original device or download the audio.'}; }
    try {
      transcriptionWorker ||= new Worker(workerUrl, {type: 'module'});
      const result = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Transcription timed out')), 10 * 60 * 1000);
        transcriptionWorker.onmessage = ({data}) => {
          if (data.type === 'progress') transcriptionProgress = data.text;
          else {
            clearTimeout(timer);
            resolve(data.type === 'result'
              ? {state: 'complete', text: data.text}
              : {state: data.retryable ? 'waiting' : 'error', message: data.text, detail: data.detail});
          }
        };
        transcriptionWorker.onerror = () => { clearTimeout(timer); reject(new Error('Speech worker unavailable')); };
        transcriptionWorker.postMessage({audio: samples}, [samples.buffer]);
      });
      if (result.state === 'complete') await storage('readwrite', cacheKey, result);
      return result;
    } catch (_) {
      transcriptionWorker?.terminate(); transcriptionWorker = undefined;
      return {state: 'waiting', message: 'Transcription could not finish. The recording is kept; retrying while Daybook is open.'};
    }
  }
  window.daybookVoice = async (action, json) => {
    const args = JSON.parse(json);
    if (action === 'vaultMigrate') {await migrateVaultAudio();return JSON.stringify({vaultEncryption:1});}
    if (action === 'vaultLock') {
      if (session) {const s=session;session=undefined;release(s);if(s.recorder.state!=='inactive')s.recorder.stop();}
      player?.pause();player=undefined;
      if(playerUrl)URL.revokeObjectURL(playerUrl);playerUrl=undefined;
      transcriptionWorker?.terminate();transcriptionWorker=undefined;
      return '{}';
    }

    if (action === 'transcriptionStatus') {
      return JSON.stringify({message: transcriptionProgress});
    } else if (action === 'transcribe') {
      // Serialize inference across tabs when browser Web Locks are available.
      const result = navigator.locks
        ? await navigator.locks.request('daybook-transcription', () => transcribe(args))
        : await transcribe(args);
      return JSON.stringify(result);
    } else if (action === 'start') {
      if (session) throw new Error('Finish the previous recording first');
      if (!window.isSecureContext || !navigator.mediaDevices || !window.MediaRecorder) {
        throw new Error('Recording requires HTTPS and a supported browser');
      }
      const stream = await navigator.mediaDevices.getUserMedia({audio: true});
      const s = {stream, chunks: [], started: Date.now(), transcript: '', notice: ''};
      try {
        s.recorder = new MediaRecorder(stream, {audioBitsPerSecond: 32000});
        s.finished = new Promise((resolve, reject) => {
          s.recorder.ondataavailable = e => { if (e.data.size) s.chunks.push(e.data); };
          s.recorder.onerror = () => { release(s); reject(new Error('Recording failed')); };
          s.recorder.onstop = () => { s.ended = Date.now(); release(s); resolve(); };
        });
        // Prevent an unhandled rejection before Stop is pressed.
        s.finished.catch(() => {});
        s.recorder.start(1000);
        session = s;
        s.timer = setTimeout(() => { if (s.recorder.state !== 'inactive') s.recorder.stop(); }, 120000);
        if (args.transcribe) {
          const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          if (!Recognition) s.notice = 'Audio saved. This browser does not support live transcription.';
          else {
            try {
              s.recognition = new Recognition();
              s.recognition.lang = navigator.language || 'en-US';
              s.recognition.continuous = true;
              s.recognition.interimResults = false;
              s.recognition.onresult = e => {
                for (let i = e.resultIndex; i < e.results.length; i++) {
                  if (e.results[i].isFinal) s.transcript += e.results[i][0].transcript + ' ';
                }
              };
              s.recognition.onerror = () => { s.notice = 'Audio saved. Transcription was unavailable or interrupted; the text may be incomplete.'; };
              s.recognition.start();
            } catch (_) { s.notice = 'Audio saved. Live transcription could not start.'; }
          }
        }
      } catch (error) { release(s); session = undefined; throw error; }
    } else if (action === 'stop') {
      const s = session;
      if (!s) throw new Error('No recording');
      if (s.recorder.state !== 'inactive') s.recorder.stop();
      await s.finished;
      const blob = new Blob(s.chunks, {type: s.recorder.mimeType});
      if (!blob.size || blob.size > 8 * 1024 * 1024) throw new Error('Recording empty or too large');
      const id = s.id ||= crypto.randomUUID();
      // Keep the session available for retry if IndexedDB cannot save.
      await storage('readwrite', id, blob);
      session = undefined;
      return JSON.stringify({id, createdAt: new Date(s.started).toISOString(),
        seconds: Math.round((s.ended - s.started) / 1000), transcript: s.transcript.trim(), notice: s.notice});
    } else if (action === 'cancel') {
      if (session) {
        const s = session; session = undefined;
        if (s.recorder.state !== 'inactive') s.recorder.stop();
        release(s);
      }
    } else if (action === 'pause') {
      player?.pause();
    } else if (action === 'play' || action === 'download') {
      const blob = await storage('readonly', args.id);
      if (!blob) throw new Error('Recording exists only on the original device');
      const url = URL.createObjectURL(blob);
      if (action === 'play') {
        player?.pause();
        if (playerUrl) URL.revokeObjectURL(playerUrl);
        playerUrl = url; player = new Audio(url);
        await player.play();
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = `Daybook-audio-${args.id}.${blob.type.includes('mp4') ? 'm4a' : blob.type.includes('ogg') ? 'ogg' : 'webm'}`;
        link.click(); setTimeout(() => URL.revokeObjectURL(url), 60000);
      }
    }
    return '{}';
  };
})();
