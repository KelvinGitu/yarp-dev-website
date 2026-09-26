# Store setup: what you have to do by hand

The code for `/store` is done: the pages, the checkout, the webhook that mints
and emails licence keys, and the success page. Everything below needs an
account, a dashboard, or a decision only you can make.

It's ordered so you can stop after **Part 1** with a working local test, and be
selling after **Part 5**.

**What's for sale (since 2026-09-26):** StoryForge only, in euros, through
Stripe. pdfsign, Resume Maker and Ink Lifter are free (no licence code left in
them), and the bundle is withdrawn. Their product ids stay in
`functions/products.js`, not for sale, so earlier receipts still resolve. The
Kenyan-shilling prices (Paystack, M-Pesa) were removed the same day.

**One rule throughout:** never commit a secret. `.gitignore` covers `.env*`,
`*.secret.local` and `functions/node_modules`, but it can't stop you pasting a
key into a source file.

## How it fits together

```
 yarpdevelopers.com/store (static pages, Firebase Hosting)
        |  Buy
        v
 /api/checkout ── Cloud Function "api" ──> Stripe Checkout (card details stay with Stripe)
                                                 |
 /api/webhook <── Stripe: checkout.session.completed
        |   1. mint a YD1 licence key (Ed25519, signed with YARP_SIGNING_KEY)
        |   2. record the order in Firestore (optional audit copy)
        |   3. email key + download links through Resend
        v
 /store/success?session_id=...  ── /api/order asks Stripe, re-derives the same key, shows it
```

The apps check keys **offline** with the public half of the signing key, so
they never talk to this site. Keys are deterministic (same Stripe session, same
key), so a webhook retry or the success page always shows the key the buyer
was emailed, without a database.

---

## Part 1: prove it works locally (Stripe test mode)

### 1.1 The signing key

Already generated:

```
C:\Users\gituk\Documents\yarp-signing-key.json
```

The **public** half is built into both apps (`app/license.py`). The **private**
half (`private_key_b64`) mints licences.

> **This is the most sensitive value in the whole business.** Anyone who has it
> can issue unlimited valid keys, and it can't be rotated without shipping new
> builds of both apps. Back the JSON file up somewhere you trust (a password
> manager is ideal), and never put it in a repo, a chat or an email.
> **Don't regenerate it**: that would invalidate every key already sold.

### 1.2 Stripe products (test mode)

In the Stripe dashboard, stay in **test mode** for all of Part 1.

1. **Product catalogue → Add product**: `StoryForge`, with a **one-time**
   price in EUR matching `src/data/products.js` (€24.99). Change the page and
   Stripe together.
2. Copy the **Price ID** (`price_...`, from the price row's ⋯ menu, *not* the
   `prod_...` product ID).
3. **Developers → API keys**: copy the secret key (`sk_test_...`).

### 1.3 Local settings

`functions/.env.local` (emulator only, already exists) gets the price ID:

```
STRIPE_PRICE_STORYFORGE=price_...
SITE_URL=http://127.0.0.1:5000
FIRESTORE_EMULATOR_HOST=127.0.0.1:1   # keeps local tests out of your real Firestore
```

`functions/.secret.local` (emulator only) gets the secrets:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...        # from `stripe listen`, next step
YARP_SIGNING_KEY=<private_key_b64 from yarp-signing-key.json>
RESEND_API_KEY=                        # leave empty for now
```

### 1.4 Run it

```powershell
npm run build                                   # the static site into out/
cd functions; npm install; cd ..
firebase emulators:start --only hosting,functions
stripe listen --forward-to http://127.0.0.1:5000/api/webhook   # second terminal; prints whsec_...
```

Open <http://127.0.0.1:5000/store/pdfsign>, click **Buy**, pay with the test
card `4242 4242 4242 4242` (any future date, any CVC). You should land on the
success page with a `YD1-...` key. The emulator log shows
`[email] ... licence NOT emailed` with the same key: that's the **expected**
result until Part 2.

### 1.5 Prove the key unlocks the app

Paste the key into StoryForge (the Explore button at the top right, or
Settings → Licence & data). **That is the whole loop.** Everything after this
is plumbing.

`cd functions; npm test` re-checks that keys minted by the store verify in
StoryForge, whenever you change either side.

---

## Part 2: email delivery (Resend)

Without this, buyers still get their key on the success page, but no email.

1. Sign up at [resend.com](https://resend.com), **add the domain**
   `yarpdevelopers.com`, and add the DNS records it gives you (SPF, DKIM) at
   your registrar. DNS can take an hour; skipping it sends keys to spam.
2. Create an API key.
3. Put the key in `functions/.secret.local` as `RESEND_API_KEY=re_...`, and set
   the sender in `functions/.env.local`:
   ```
   RESEND_FROM=Yarp Developers <licences@yarpdevelopers.com>
   ```
   The sender **must** be on the domain you verified.
4. Buy again in test mode and check a real email arrives, and not in spam.

---

## Part 3: downloads

The store links to
`https://github.com/KelvinGitu/yarp-downloads/releases/latest/download/<file>`.

1. Create a **public** repo `KelvinGitu/yarp-downloads` (installers only, no code).
2. Build every app (`.\packaging\build.ps1` in each app repo). Each build writes
   `dist\<App>-setup-<version>.exe` **and** a copy without the version.
3. Publish a release with the version-less copies. A new release must carry
   **every** installer the store links to, because `latest/download/<file>`
   only looks in the latest release:
   ```powershell
   gh release create v1.1.0 --repo KelvinGitu/yarp-downloads --title "1.1.0: StoryForge" `
     ..\..\pdfsign\dist\pdfsign-setup.exe ..\..\resume_maker\dist\ResumeMaker-setup.exe `
     ..\..\story_forge\dist\StoryForge-setup.exe
   ```
   The links then always serve the latest release.
4. Download each from the store page on a machine where it isn't installed,
   and install it. The copy you download is the one buyers get.

---

## Part 4: decisions the code can't make

| What | Where | Decide |
|---|---|---|
| Prices | Stripe **and** `src/data/products.js` | The page's price is display only. **If they differ, the page says one thing and Stripe charges another.** Nothing checks |
| VAT | Stripe Tax + `STRIPE_AUTOMATIC_TAX` | Selling digital goods to EU consumers from Belgium means charging VAT at the buyer's country rate, usually via OSS registration. Turn on Stripe Tax in the dashboard (it needs your tax registrations), then set `STRIPE_AUTOMATIC_TAX=true`. **Worth confirming with an accountant before launch** |
| Terms & privacy | `src/pages/store/terms.js`, `privacy.js` | Written as a plain-language starting point, not legal advice. The 30-day refund promise appears on the product pages too |
| Support address | `SUPPORT_EMAIL` in `src/data/products.js`, `functions/lib/email.js` | Currently `support@yarpdevelopers.com` |
| The bundle | withdrawn 2026-09-26 | Bundle keys already sold still unlock StoryForge (its verifier accepts `yarp-bundle`). Archive the bundle's Stripe product |
| mediagrab | not in the store | Packaged (its repo builds an installer) but held back until it's ready. StoryForge's `license.py` still lists `mediagrab`; decide whether it's sold or free before listing it |
| Code signing | the installers | Unsigned installers show "Windows protected your PC" (the store page explains it). Azure Trusted Signing (~$10/month, if you're eligible) or an OV certificate removes most of it |

---

## Part 5: going live

### 5.1 Firebase

Cloud Functions need the **Blaze** (pay-as-you-go) plan. At this volume it
costs roughly nothing, but it needs a card: **Firebase console → Upgrade**.

Optionally create a **Firestore** database (europe-west1) for the order audit
log. The store works without it; lookups time out after 2.5 s and are skipped.

### 5.2 Deployed settings and secrets

Non-secret settings go in `functions/.env.yarp-dev-website` (gitignored, read at deploy):

```
STRIPE_PRICE_STORYFORGE=price_...  # the LIVE-mode price ID
RESEND_FROM=Yarp Developers <licences@yarpdevelopers.com>
SITE_URL=https://yarpdevelopers.com
STRIPE_AUTOMATIC_TAX=false         # true once Stripe Tax is set up
```

Secrets go in Secret Manager:

```powershell
firebase functions:secrets:set STRIPE_SECRET_KEY       # sk_live_...
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET   # from 5.3
firebase functions:secrets:set YARP_SIGNING_KEY        # private_key_b64
firebase functions:secrets:set RESEND_API_KEY
firebase functions:secrets:set ADMIN_NOTIFY_KEY        # any long random string; kept only on your machine
```

The function declares every one of these, so **a deploy fails until all of
them exist**. (`PAYSTACK_SECRET_KEY` is no longer used; delete it with
`firebase functions:secrets:destroy PAYSTACK_SECRET_KEY` once the function
without it is deployed.)

Each of those pauses for you to paste the value and press enter. To set one
without the prompt (e.g. from a script, or a terminal that can't do
interactive input), pipe it in instead:

```powershell
echo the-secret-value | firebase functions:secrets:set ADMIN_NOTIFY_KEY --data-file -
```

Either way, `firebase deploy --only functions:store` afterwards is what
actually grants the deployed function access to the secret and picks up the
new value — the output says `Granted roles/secretmanager.secretAccessor ...`
and `Successful update operation` when it worked.

### 5.3 The live webhook

**Easy to forget, and everything works until someone pays.** Stripe dashboard
(live mode) → **Developers → Webhooks → Add endpoint**:

- URL: `https://yarpdevelopers.com/api/webhook`
- Events: `checkout.session.completed` and `checkout.session.async_payment_succeeded`

Copy its signing secret (a different `whsec_` from `stripe listen`) into
`STRIPE_WEBHOOK_SECRET`.

### 5.4 Deploy

```powershell
npm run build
firebase deploy --only functions:store,hosting
```

### 5.5 Buy it yourself

With a real card, at the real price. Check the key email
arrives, the key unlocks the installed app, and then refund yourself in the
Stripe dashboard. This is the only test that exercises live keys, the live
webhook, real DNS and real email at once. **Do it before you tell anyone the
store exists.**

### 5.6 Ship an update to buyers

Four steps, in order — skipping the release step and going straight to the
email would tell buyers about a download that isn't actually there yet.

1. **Build.** Bump that app's version (e.g. `desktop/__init__.py` for
   StoryForge — also update `frontend/src/config.js`'s display version if it
   has one), then `.\packaging\build.ps1` in its repo. Writes
   `dist\<App>-setup-<version>.exe` and a version-less copy.
2. **Release.** A new `yarp-downloads` release must carry **every** app's
   installer (Part 3) — pull the ones that didn't change from the current
   release rather than rebuilding them:
   ```powershell
   gh release download v1.0.0 --repo KelvinGitu/yarp-downloads --dir dist\others `
     --pattern "*-setup.exe" --clobber
   # remove the one(s) you did rebuild from dist\others, then:
   gh release create v1.1.0 --repo KelvinGitu/yarp-downloads --title "1.1.0: StoryForge" `
     dist\others\*.exe ..\..\story_forge\dist\StoryForge-setup.exe
   ```
3. **Update the listing.** Bump that product's `version` field in
   `src/data/products.js` (display only, but should match what's in the
   release) and redeploy (5.4).
4. **Notify** (StoryForge only; the free apps have no buyers to tell). Email
   everyone who owns it — bought directly or via the old bundle — that it's out:
   ```powershell
   $env:ADMIN_NOTIFY_KEY = "..."   # the value you set in Secret Manager
   node scripts/push-update.js --app storyforge --version 1.1.0 --notes "Faster autosave, fixed text selection."
   ```
   Safe to re-run: buyers already emailed for that exact version are skipped
   (`store_orders/<session id>.notifiedVersions`), so a retry after a partial
   failure only reaches whoever didn't get it the first time.

---

## Part 6: Kenyan prices (removed)

Until 2026-09-26, visitors in Kenya saw prices in KES and paid with M-Pesa or
Airtel Money through Paystack. That's gone: `src/data/regions.js`,
`functions/pricing.js`, `functions/lib/paystack.js`, the
`/api/paystack/checkout` route and the `paystackReconcile` schedule were all
deleted, and every price is in euros through Stripe. The Kenya ad material in
`marketing/meta-ke-launch/` is kept as an archive, with its old KES prices
written into `build.js`.

---

## Pre-launch checklist

- [ ] `yarp-signing-key.json` backed up somewhere safe, and in no repo
- [ ] Test purchase → key → unlocks StoryForge (Part 1)
- [ ] A real licence email arrives, not in spam (Part 2)
- [ ] All four download links work, and the downloaded installers install and run (Part 3)
- [ ] Prices in `products.js` match the Stripe prices (Part 4)
- [ ] VAT handled (Part 4)
- [ ] Live price IDs, live secret key, live webhook secret deployed (Part 5)
- [ ] You bought StoryForge with a real card, got the key, and refunded (5.5)

## When something goes wrong after a sale

- **Key not emailed:** it's in the function log (`[email] ... licenceKey`) and,
  with Firestore on, in `store_orders/<session id>`. The buyer also saw it on the
  success page. To resend, open the order in Stripe, then visit
  `/store/success?session_id=<cs_...>` yourself: it shows the same key.
- **Webhook failed:** it returned 500, and Stripe retries for three days.
  Retries send the same key, never a second one.
- **"The key doesn't work":** first, which app? pdfsign, Resume Maker and Ink
  Lifter are free since 2026-09-26 and need no key: point them at the latest
  download. For StoryForge, it's almost always a partial copy. The apps accept
  lower case, missing dashes and stray spaces, so a failing key is usually
  incomplete. Ask them to copy the whole key again.
- **Refunds:** refund in Stripe. The key keeps working (it's checked offline),
  which is the honest trade-off of a licence that never phones home.
