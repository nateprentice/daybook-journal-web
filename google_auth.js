// Google's official token model. Tokens stay in Dart memory, never web storage.
let daybookGoogleLibrary;
function daybookLoadGoogle() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (!daybookGoogleLibrary) daybookGoogleLibrary = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const timer = setTimeout(() => {
      daybookGoogleLibrary = null;
      reject(new Error('Google library timed out'));
    }, 15000);
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => { clearTimeout(timer); resolve(); };
    script.onerror = () => { clearTimeout(timer); daybookGoogleLibrary = null; reject(new Error('Google library unavailable')); };
    document.head.appendChild(script);
  });
  return daybookGoogleLibrary;
}
window.daybookGoogleConnect = async (clientId, scopes, loginHint = '') => {
  await daybookLoadGoogle();
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error, response) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve(JSON.stringify(response));
    };
    const timer = setTimeout(() => finish(new Error('Google sign-in timed out')), 180000);
    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId, scope: scopes, include_granted_scopes: true,
      ...(loginHint ? {login_hint: loginHint} : {}),
      callback: response => finish(response.error ? new Error(response.error) : null, response),
      error_callback: () => finish(new Error('Google popup closed or blocked')),
    });
    try { client.requestAccessToken({ prompt: loginHint ? '' : 'select_account' }); }
    catch (error) { finish(error); }
  });
};
window.daybookGoogleRevoke = token => new Promise(resolve => {
  if (!window.google?.accounts?.oauth2) return resolve();
  google.accounts.oauth2.revoke(token, resolve);
});
