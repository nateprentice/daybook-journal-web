# Optional device encryption

Open Settings → Protect this device with encryption. The setup page shows the complete security details before you choose whether to enable it. Choose your own passphrase of at least 12 characters, preferably several unrelated words, and save it in a password manager. Never send it in chat. Close other Daybook tabs first. Enabling encryption is optional and requires a secure browser with Web Crypto and Web Locks.

## Standards shown in the app

- AES-256-GCM authenticated encryption: 256-bit key, fresh random 96-bit nonce per write, 128-bit authentication tag.
- PBKDF2-HMAC-SHA256: 600,000 iterations and random 128-bit salt derive the key from your passphrase.
- Passphrases and unlock keys are not persisted. A locked/reopened journal needs the passphrase; inactivity locks it after 15 minutes. Unsubmitted forms are discarded. Browser memory erasure cannot be guaranteed.
- Setup verifies the encrypted preference snapshot before removing readable Daybook preferences. Recording content and cached transcripts are migrated too; interrupted setup resumes on unlock. Filesystem/browser-system snapshots made before setup cannot be erased by the app.
- Local journal, recovery/sync copies and recordings are encrypted. JSON backups exported while unlocked are encrypted. A locked-screen encrypted recovery download contains journal preferences, not recordings. Keep separate downloads of important recordings.
- Google Calendar/Tasks objects and the private Drive sync copy remain readable by those services. Word documents, downloaded audio, emails and earlier backups remain outside this vault. This is not end-to-end Google sync encryption.
- There is no forgotten-passphrase recovery, disable-encryption or passphrase-change workflow in this first version. Keep recovery copies and the passphrase separately. Storage deletion still deletes encrypted data.
- One unlocked browser tab at a time is supported. Native device verification and an independent security audit remain outstanding. Encryption does not establish FIPS validation, HIPAA compliance or another certification, and does not protect an unlocked app or malicious website code.

The choices follow OWASP guidance for [authenticated storage encryption](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html) and [PBKDF2 work factors](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html). The implementation uses the cryptography package and browser Web Crypto, rather than a custom cipher.
