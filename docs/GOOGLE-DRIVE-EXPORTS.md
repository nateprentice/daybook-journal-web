# Save Word exports to Google Drive

Open Settings → Export to Word → Save to Google Drive. Choose the Google account already linked to this journal and allow permission for files Daybook creates or opens. Calendar/Tasks sync permissions are unchanged.

The app reuses an accessible Daybook folder in My Drive, then creates/reuses Word exports inside it. It cannot see arbitrary pre-existing folders with its limited permission. If a manually-created Daybook folder is not accessible to the app, it creates a separate Daybook folder rather than requesting access to your whole Drive. No public sharing permissions are set; folders inherit their existing parent permissions.

Names use local time, for example 26--10-13--19-15-30.docx (YY--MM-DD--HH-mm-ss). Documents stay in Word format and do not sync edits back into the journal. The dialog can open the saved file in Drive. Download Word document remains available without Google or internet.

Google Cloud setup (existing owner): enable Google Drive API in the existing OAuth project. Under Google Auth Platform → Data Access → Add or remove scopes, include https://www.googleapis.com/auth/drive.file alongside the existing sync scopes. Save. Keep your allowed website origin and test users as configured. Users grant this optional permission only when choosing Save to Google Drive. No client secret belongs in the web app. No paid backend is required; documents count toward the user's Google Drive storage.

Drive uploads require a network connection. Failed saves are not queued for automatic upload. Retry Save to Google Drive while the same dialog is open to reuse its prepared document and reserved file ID. Pre-generated IDs are persisted before writes so a lost response can be retried safely. Opening a new export dialog starts a new export. Closing the browser does not preserve the prepared document bytes.

Verification: automated HTTP simulations cover folder creation/reuse, binary file contents, local timestamp naming, and ambiguous upload recovery. Dialog tests cover success, avoiding a repeated successful save, and declined permission with download still available. Native builds need physical-device verification; live Google approval is a separate user-controlled step.

References: https://developers.google.com/workspace/drive/api/guides/folder and https://developers.google.com/workspace/drive/api/guides/manage-uploads
