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
  try { await daybookLoadGoogle(); }
  catch (error) { return JSON.stringify({daybook_auth_error: error.message === 'Google library timed out' ? 'library_timeout' : 'library_unavailable'}); }
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error, response) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) resolve(JSON.stringify({daybook_auth_error:error}));
      else resolve(JSON.stringify(response));
    };
    const timer = setTimeout(() => finish('sign_in_timeout'), 180000);
    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId, scope: scopes, include_granted_scopes: true,
      ...(loginHint ? {login_hint: loginHint} : {}),
      callback: response => finish(response.error ? (response.error === 'access_denied' ? 'access_denied' : ['invalid_client','invalid_request','unauthorized_client','redirect_uri_mismatch','origin_mismatch'].includes(response.error) ? 'oauth_setup' : 'unknown') : null, response),
      error_callback: error => finish(['popup_closed','popup_failed_to_open'].includes(error?.type) ? error.type : 'unknown'),
    });
    try { client.requestAccessToken({ prompt: loginHint ? '' : 'select_account' }); }
    catch (_) { finish('unknown'); }
  });
};
window.daybookGoogleRevoke = token => new Promise(resolve => {
  if (!window.google?.accounts?.oauth2) return resolve();
  google.accounts.oauth2.revoke(token, resolve);
});
