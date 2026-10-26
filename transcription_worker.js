// Free local inference. Network requests download software/weights, never audio.
let transcriber;
self.onmessage = async ({data}) => {
  let stage = 'download';
  try {
    if (!transcriber) {
      self.postMessage({type: 'progress', text: 'Downloading free speech model…'});
      const {pipeline, env} = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js');
      env.allowLocalModels = false;
      env.useBrowserCache = true;
      env.backends.onnx.wasm.numThreads = 1;
      transcriber = await pipeline('automatic-speech-recognition',
        'onnx-community/whisper-tiny.en', {
          device: 'wasm', dtype: 'q8',
          progress_callback: event => {
            if (event.status === 'progress') self.postMessage({type: 'progress',
              text: `Downloading speech model: ${Math.round(event.progress || 0)}% of ${event.file || 'file'}`});
          },
        });
    }
    stage = 'transcribe';
    self.postMessage({type: 'progress', text: 'Transcribing on this device…'});
    const result = await transcriber(data.audio, {
      chunk_length_s: 30, stride_length_s: 5, return_timestamps: false,
    });
    self.postMessage({type: 'result', text: result.text.trim()});
  } catch (error) {
    if (stage === 'download') transcriber = undefined;
    self.postMessage({type: 'error', retryable: stage === 'download',
      detail: String(error).slice(0,500),
      text: stage === 'download'
        ? 'Speech model download failed. Waiting to retry when the network works.'
        : 'This device could not transcribe the recording. Try again on this device, or download the audio. Your recording is safe.'});
  }
};
