# Dinky Threat Model

Last reviewed: 2026-11-15

## 1. System overview

Dinky is a static, client-only React SPA served from S3 + CloudFront at
https://dinky.dev and installable as a PWA. There is no Dinky backend.

| Component | Where it runs | Notes |
|---|---|---|
| SPA bundle (`index.html`, JS, CSS, service worker) | User's browser | Built by GitHub Actions, deployed to S3 `dinky-dev-website-assets`, served via CloudFront |
| Local data store | Browser IndexedDB (`dinky` DB) | Tasks, notes, topics, works, settings, **AWS access keys** |
| Cloud sync (optional) | The **user's own** S3 bucket | Accessed directly from the browser with the user's IAM access keys (AWS SDK v3) |
| Import / export | Local JSON files | Export strips storage settings and credentials |
| CI/CD | GitHub Actions | Assumes AWS role `Builder` via OIDC to deploy the site |

### Data flows

```
                 ┌────────────── GitHub Actions ───────────────┐
 source + deps ─▶│ build (npm ci, test, build)  ─artifact─▶ deploy│──OIDC──▶ S3 site bucket ─▶ CloudFront
                 └─────────────────────────────────────────────┘                                 │
                                                                                                  ▼
  user ─▶ Browser (SPA + service worker) ◀────────────────────────────────────────────── https://dinky.dev
              │  ▲
   IndexedDB ◀┘  └──▶ user's S3 bucket (data object + events/*)   [user's IAM keys, CORS]
              ▲
   import/export JSON files
```

### Trust boundaries

1. **Site origin → browser**: anything served from dinky.dev runs with full access to IndexedDB, including the AWS keys.
2. **User's S3 bucket → app**: the `data` object and `events/*` objects are parsed and merged into local state. Anyone with write access to the bucket (other devices, a leaked key) controls this input.
3. **Imported files → app**: a JSON file of unknown origin is merged into local state.
4. **URL → app**: the URL hash is interpreted as a search term (regular expression).
5. **Markdown content → DOM**: user content is rendered as Markdown (including content synced from the bucket).
6. **Dependencies / CI → site**: third-party npm packages and GitHub Actions run during the build and end up in the deployed bundle.

## 2. Assets

| Asset | Impact if compromised |
|---|---|
| A1. User's AWS access keys | Read/modify/delete everything in the user's bucket; AWS charges; if over-privileged, much more |
| A2. User's notes/tasks (confidentiality) | Personal information disclosure |
| A3. User's data (integrity/availability) | Silent data loss or corruption, across all synced devices |
| A4. The dinky.dev site bucket / CloudFront distribution | Malicious code served to every user → A1–A3 for all users |
| A5. CI deploy role (`Builder`) | Same as A4 |

## 3. Threat actors

- **T1 Remote attacker** who can get the user to open a link or import a file.
- **T2 Holder of a bucket credential** (leaked/stolen key, compromised second device).
- **T3 Supply-chain attacker** (malicious npm package version, compromised GitHub Action).
- **T4 Local attacker / malware** with access to the user's browser profile.
- **T5 Network attacker** (mitigated by HTTPS everywhere; not considered further).

## 4. Threats and mitigations

Status legend: ✅ mitigated in this review · ☑️ already mitigated · ⚠️ residual / accepted · 📋 recommended action outside the repo

### Spoofing / Tampering

| ID | Threat | Status / mitigation |
|---|---|---|
| TM-1 | **Credential & sync redirection via crafted input.** `mergeData` spread `settings.storage` from incoming data over local settings. An imported file or a tampered `data` object in the bucket could replace the bucket name and keys, so that the next sync uploads all of the user's data to an attacker-controlled bucket (T1, T2). | ✅ `mergeData` now never takes storage settings from incoming data, and all untrusted input (imports, cloud `data`, cloud events) passes through `src/models/Sanitize.tsx`, which drops storage settings. |
| TM-2 | **Malformed / hostile records** from imports or the bucket: non-string `data` crashing rendering, `__proto__`/`constructor` IDs, invalid dates, bogus fields. | ✅ `Sanitize.tsx` validates every item against its content type's schema (`Schema.tsx`; model types are derived from the same schemas, so validation follows the models automatically), drops device-local fields such as `unsynced`, validates retention and theme, and rejects prototype-polluting keys. |
| TM-3 | **Retention tampering**: an event or file setting `periodDays` to `NaN`/negative makes `purgeDeleted` delete every item in the trash. | ✅ Retention values are validated on input (UI and sanitizer) and `purgeDeleted` falls back to 30 days for invalid values. |
| TM-4 | **Supply-chain compromise in CI** (T3): AWS credentials were configured *before* `npm install`, so any dependency's install script could deploy to the site bucket. `npm install` did not enforce the lockfile. | ✅ Workflow split into a credential-less `build` job (`npm ci`, tests, build) and a `deploy` job that only downloads the artifact and holds `id-token: write`. Deprecated action versions upgraded. 📋 Pin actions to commit SHAs; restrict the `Builder` role's trust policy to `repo:rri/dinky:ref:refs/heads/main` and its permissions to the site bucket + the one distribution. |
| TM-5 | **Vulnerable dependencies.** | ✅ `npm audit fix` cleared all critical/high advisories (all were in build/dev tooling). ⚠️ 34 moderate/low remain that need major upgrades (`react-router` 7, `uuid` 11, webpack-dev-server tooling). 📋 Enable Dependabot security updates. |

### Information disclosure

| ID | Threat | Status / mitigation |
|---|---|---|
| ID-1 | **XSS → key theft.** Any script execution on dinky.dev can read the AWS keys from IndexedDB. | ☑️ React escapes text; `react-markdown` does not render raw HTML and neutralises `javascript:` URLs. ✅ Production builds now ship a strict Content-Security-Policy (`script-src 'self'`, no inline scripts — the runtime chunk is no longer inlined — `connect-src` limited to self + `*.amazonaws.com`, `object-src 'none'`, `base-uri 'self'`, `form-action 'none'`). The CSP also limits exfiltration if an injection is ever found. |
| ID-2 | **Long-lived keys stored in plaintext** in IndexedDB (T4, or any XSS). | ⚠️ Inherent to a backend-less design. ✅ User guide now tells users to use a dedicated least-privilege IAM user scoped to the bucket and how to rotate keys. Keys are never exported or uploaded (`toExport` strips them). 📋 Longer term: Cognito Identity Pool / STS temporary credentials. |
| ID-3 | **Clickjacking / missing security headers.** `frame-ancestors`, HSTS, `X-Content-Type-Options` cannot be set from a `<meta>` tag. | 📋 Add a CloudFront response-headers policy: `Content-Security-Policy: frame-ancestors 'none'` (plus the same CSP as the meta tag), `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`. |
| ID-4 | **Bucket exposure** via public access or broad CORS. | ☑️ User guide requires Block Public Access and a CORS policy allowing only `https://dinky.dev`. |
| ID-5 | **External links / images** leak referrer or IP. | ✅ External links get `rel="noopener noreferrer"`; referrer policy set. ⚠️ Remote Markdown images are allowed (user-authored content) and reveal the viewer's IP to the image host. |
| ID-6 | **Protocol-relative links** (`//host`) treated as in-app routes. | ✅ `Link` now treats `//` and `/\` URLs as external. |

### Denial of service

| ID | Threat | Status / mitigation |
|---|---|---|
| DoS-1 | **Malformed URL hash** (e.g. a stray `%`) throws `URIError` and blanks the whole app; a search term containing `%` triggers this via the "back to results" link. | ⚠️ Accepted (decided during the bug review; see "Reviewed and kept as is"). Impact is a blank page until the hash is removed; no data impact. |
| DoS-2 | **ReDoS via crafted link**: the hash is used as a regular expression, so `https://dinky.dev/#(a+)+$` can freeze the tab. | ⚠️ Accepted: regex search is a feature, impact is limited to a tab hang with no data impact. |
| DoS-3 | **Single bad cloud event blocks sync** / events skipped after a network error were marked as applied and later deleted. | ✅ Malformed events are skipped; only processed events are marked as seen and deleted from the bucket; the rest are retried. |

### Integrity of user data (repudiation n/a; elevation of privilege n/a — no server-side roles)

Covered in the bug list below (B1, B3, B4, B5).

## 5. Bugs found and fixed (sorted by criticality)

| # | Severity | Bug | Fix |
|---|---|---|---|
| B1 | **Critical** | `mergeRecords` only iterated over the *incoming* records, so any local item not present in the incoming data was dropped: tasks created locally were lost when pulling a changed `data` object from the cloud, and **importing a file discarded every local item not in the file**. | Merge iterates over the union of IDs; on a cloud pull, only saved (`created`), synced items missing from the authoritative copy are removed (drafts and unsynced items are kept); inputs are no longer mutated. `unsynced` is now cleared after a successful event push (unless the item changed during the push), so deletions propagate cleanly. |
| B2 | **Critical (security)** | Imported files / cloud data could overwrite bucket and credentials (TM-1). | See TM-1. |
| B3 | High | Clearing the retention-period field stored `NaN`, after which the next sync permanently purged the whole trash (also reachable via a synced event). | Retention and auto-sync period are saved on blur/Enter only (`NumberSetting`); empty or invalid input reverts to the saved value, Escape reverts; `validRetentionDays` guard in `purgeDeleted`; sanitizer. |
| B4 | High | A failed event download marked all remaining events as applied; a full sync then deleted them from the bucket → updates from other devices silently lost. Introduced by the 2026-04-01 async/await refactor. | Track processed events; only mark/delete those; malformed events are skipped. |
| B5 | High | Auto-sync throttle stored the last sync time as a UTC string without a zone, which was re-parsed as local time: west of UTC auto-sync stalled for hours after a sync; east of UTC it ran every minute regardless of the configured period. | Timestamp stored as a number (`Date.now()`). The test suite now runs in `America/Los_Angeles` so time zone bugs surface in tests. |
| B6 | Medium | Both "Sync" and "Sync and compact data" buttons on the Profile page did a full sync (the click event was passed as `fullSync`). | Explicit `sync(false)` / `sync(true)`; test asserts the argument. |
| B7 | Medium | Scheduling dates used UTC: in the Americas, tasks scheduled for a date showed on the agenda the afternoon before, and in the evening "today" could not be picked. | Local-time date helpers (`toLocalDateInput` / `fromLocalDateInput`). |
| B8 | Medium | Items removed from memory (purged after the retention period, or deleted from the authoritative copy) were never removed from IndexedDB and reappeared on reload. | Expired tombstones are purged from memory and disk on load; items removed by a sync are deleted from disk (only items that existed when the sync started). |
| B12 | Medium | No mutual exclusion between syncs: manual sync, auto-sync, sync-on-load and auto-push could overlap and write diverging versions of the event registry. Sync timers lived in the Store constructor (never cleaned up, duplicated under StrictMode) and syncs were started from inside state updaters. | One sync at a time; requests made during a sync collapse into a single follow-up (full if any request was full). Timers owned by a `useEffect` via `Store.start()`. Cloud calls now report failures, so a failed sync always releases the guard. |
| B17 | Medium | After an automatic event push, the whole state was replaced by the snapshot taken when the push was scheduled, discarding edits made while the push was in flight (in memory and on disk). Found while implementing B1. | Push completion is applied to the latest state (marks events, clears `unsynced` only for unchanged items). |
| B18 | Medium | Registry entries for local edits were kept in memory only: an edit followed by a reload before syncing was never pushed by a normal sync. Found while implementing B12. | Registry is persisted to disk whenever events are registered or marked. |
| B13 | Low | Notifications: an older timer cleared newer notifications early (error messages could vanish after ~1 s). | Single restartable timer, cleared on unmount. |
| B14 | Low | State updaters (`newTask`/…, draft discard) and the sync registry helpers mutated objects shared with the previous state (and with in-flight syncs). | Immutable updates (`putContentItem`, `removeContentItem`, registry helpers return new state); tested with deep-frozen state. |
| B9 | Low | Theme: every theme change leaked a `matchMedia` listener. No visible effect (the most recent listener always reflects the current setting and runs last). | Effect cleanup removes the listener. |
| B15 | Low | `sortByData` comparator never returned 0 for equal values (latent; no visible effect today since topics are unique). | Returns 0 on ties. |
| B16 | Low | User guide fetched inside `useMemo` with no error handling. | `useEffect` + fallback message. |
| B19 | Low | Failed cloud calls (and an ignored 404 when listing events) never completed the sync's promise. Found while implementing B12. | Cloud calls take a failure callback; listing events with an ignorable status completes with no events. |

### Reviewed and kept as is

- **URL hash handling** (originally B10): help links such as `/profile/#cloud-sync` are treated as search terms, a `%` in the hash blanks the app (DoS-1), and the "back to search results" link is built as a full URL. The proposed fix was reverted at the owner's request.
- **Partial tag matching** (originally B11): a topic's "Related" list includes items tagged with longer topics that start with the same text (e.g. `#foo` lists `#food`). This is intended behaviour.

### Known issues not fixed

- **Edits made while a full sync is in flight can be overwritten** in memory: `cloudSyncData` replaces state with a merge computed from the snapshot taken when the sync started. Fixing this needs a merge-on-commit redesign of the sync pipeline.
- Moderate dependency advisories requiring major upgrades (TM-5).

## 6. Recommended follow-ups (outside this repo)

1. CloudFront response-headers policy (ID-3).
2. Restrict the `Builder` IAM role trust policy to the `main` branch of this repo and its permissions to the site bucket + distribution (TM-4).
3. Pin GitHub Actions to commit SHAs and enable Dependabot (TM-4, TM-5).
4. Consider temporary credentials (Cognito Identity Pools) instead of long-lived IAM user keys (ID-2).
