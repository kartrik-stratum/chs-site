# Caliber Home Solutions – Homepage & Bath Designer

The Caliber Home Solutions homepage (aging-in-place remodeling, walk-in showers and tubs, stair lifts, home elevators), with the original design tool kept inside it.

**Homepage sections:** promo bar · header with dropdowns · hero with a quick consultation card · partner strip · solutions bento · about · **Caliber Bath Designer** (design tool, on the left) · four-step process · recent transformations · **before/after sliders** · offers + referral banner · testimonials · consultation CTA (second quick card) · FAQ accordion · service areas · footer.

**Design tool (kept and rebranded):**
- The homepage designer has five tabs: Base, Walls, Fixtures, Safety and Review. It reads and writes the same saved board as the full 10-step builder at `#/builder`, with its style presets, accessibility toggle, sub-options and share link.
- Picks are stored in `localStorage` and stay in sync across open tabs.

**Forms open in a new tab:** every "Free Consultation", "Send to Consultant", "Claim This Offer" and "Book a Free Consultation" button opens the full lead form (`/#/summary`) in a new tab. The homepage and its design state stay where they were.
- The quick consultation cards check name, phone and zip first, then open the full form in a new tab with those details already filled in. The hand-off uses `localStorage` (key `caliber-lead-prefill`), so no personal details go in the URL.
- That form submits to `POST /api/submit-form`, and the owner email now includes the **"I'm interested in"** selections.

**Mobile:** multi-card grids marked `data-carousel` (solutions, steps, transformations, offers, reviews) become swipeable carousels at widths of 720 px and below. They auto-advance every 4 s while on screen, pause when touched or focused, and have dot navigation. The before/after sliders stack vertically instead of using a carousel, so dragging the divider never fights with swiping.

## Pages, URLs & SEO

Every URL from the client's sitemap is listed in **`data/pages.json`**: path, meta title, meta description, `<h1>`, breadcrumb parent and a `ready` flag. The titles and descriptions are copied word for word from the metadata document. The server (`services/seoService.js`) renders each page with:

- `<title>`, meta description, canonical (`SITE_URL` + path), Open Graph and Twitter tags
- JSON-LD: `HomeAndConstructionBusiness` + `WebSite` on the homepage, `WebApplication` on the design tool, and `BreadcrumbList` on inner pages
- exactly one `<h1>`, and a 301 redirect to the trailing-slash URL (`/services/stairlifts` → `/services/stairlifts/`)

| URL | What it is |
|---|---|
| `/` | Homepage (finished) |
| `/design-tool/` | Bath Designer: style picker, then `#/builder/step-1` … `step-10` (finished) |
| `/contact-us/` | Board summary + lead form; all "Free Consultation" buttons open it in a new tab (finished) |
| all other pages | **Placeholder** with the shared header and footer, breadcrumbs, `<h1>`, intro and child links. Waiting for designs. |

**Indexing rules:**
- Placeholder pages are `noindex, follow` and left out of `/sitemap.xml` until their design is built. When one is built, set its `"ready": true` in `data/pages.json`.
- Search engines may only index pages on the production host (`SITE_URL`, default `https://caliberhsolutions.com`). Preview links (trycloudflare, Render, localhost) always send `noindex`, and their `robots.txt` blocks all crawling, so test links never show up in Google.

**Header and footer:** these come from `public/index.html` (between the `HEADER-START/END` and `FOOTER-START/END` comments) and are reused on every placeholder page. The menu links follow the navigation document.

**To build a placeholder page:** add an HTML file for it and have `pagesMiddleware` render it, or extend `templates/page.html`. Then set `ready: true`.

## Designed inner pages

| URL | Template |
|---|---|
| `/offers/` | `templates/pages/offers.html` |
| `/financing/` | `templates/pages/financing.html` |
| `/contact-us/` | `templates/pages/contact-us.html` |
| `/locations/` | `templates/pages/locations.html` |
| `/services/elevator-lifts/` | `templates/pages/elevator-lifts.html` |

Page templates use shared sections from `services/pageParts.js`: `{{quickForm}}`, `{{getStarted title="…"}}`, `{{finBanner …}}`, `{{gallery set="bath|mixed|lift"}}`, `{{map mode="all|hq"}}`, `{{locationCards}}`, `{{reviews}}`, `{{brands}}`, `{{call}}` and `{{icon name="…"}}`. Styles live in `public/css/pages.css`.

**To add a designed page:** create `templates/pages/<name>.html`, then in `data/pages.json` set `"template": "<name>"` and `"ready": true` for that URL.

- **Office details:** `data/locations.json`. Read off the design at low resolution, so please confirm them.
- **Images:** `public/images/pages/` (heroes, promos, option cards, `g1`–`g12` gallery tiles). Overwrite a file to swap a photo.
- **On mobile** every card grid (rules excluded) becomes an auto-sliding carousel.

## Brand tokens

All colours and fonts are CSS variables in `public/css/style.css` (`:root`):

| Token | Value | Use |
|---|---|---|
| `--navy` | `#0A2540` | headings, dark sections, footer |
| `--gold` | `#F6B23C` | primary CTAs, badges, highlights |
| `--blue` | `#0B6FB6` | links, buttons, selected states |
| `--teal` | `#14A39A` | accents, italic headline words, progress |
| `--serif` | Fraunces | headings |
| `--font` | Poppins | body, buttons, labels |
| `--grad-media`, `--grad-overlay`, `--grad-navy` | gradients | image boxes and cards |

Homepage styles are in `public/css/home.css`. Builder and summary styles are in `style.css`.

## Replacing images

Every homepage image has its own named file. Overwrite a file with the same name, and the layout, rounded corners and gradient stay the same. The current files are temporary placeholders.

| File (`public/images/home/`) | Where it's used |
|---|---|
| `hero-banner.jpg` | hero background (from the supplied banner) |
| `solution-walk-in-showers.jpg`, `solution-walk-in-tubs.jpg`, `solution-stair-lifts.jpg`, `solution-home-elevators.jpg` | solutions bento |
| `about.jpg` | About Caliber |
| `transform-1.jpg` … `transform-6.jpg` | Recent transformations |
| `before-1.jpg` / `after-1.jpg`, `before-2.jpg` / `after-2.jpg` | before/after sliders (use matching framing) |
| `consultation-bg.jpg` | consultation CTA background |

- **Logo:** `public/images/brand/caliber-logo.png`
- **Placeholder content:** the testimonials in `public/js/home.js` (`REVIEWS`) are placeholder copy. Replace them with real, verified customer reviews before launch. Offer amounts, FAQ answers and service states should also be confirmed with the client.

---|------|---------|--------|
   | 1 | Shower / Tub Style | 7 | |
   | 2 | Wall Pattern | 9 | Panel Etch Design: Othello / Grayline |
   | 3 | Wall Color | 9 | |
   | 4 | Flooring | 6 | |
   | 5 | Vanity | 6 | |
   | 6 | Countertop | 6 | |
   | 7 | Shower Door | 6 | Glass Type (Clear/Rain/Frost/Corrugated), V-Groove Pattern (None/Arrow/Hopscotch/Roman Block/Vertical Block) |
   | 8 | Faucet & Hardware Finish | 5 | |
   | 9 | Mirror | 4 | |
   | 10 | Accessories | 8 (multi-select) | |

   Single-choice steps move ahead on their own after a pick. Every single-choice step also has a **Not in my project** card for skipping it. Navigation uses Back/Next buttons and step dots. Steps 1–9 have a **Next** button; step 10 has **Reveal My Board**.
4. **Summary**: a "Your Vision Board is Ready!" banner, a **Copy Share Link** button, a printable vision-board mosaic, and the **Your Selections** list with Edit Board.
5. **Lead form** (First/Last name, Email, Phone, Zip, City, State, Best Time to Call), with validation, a loading state, duplicate-submission protection, and a success screen.

Each submission sends **one HTML email to the owner**. It contains:
- every form field
- all 10 selections with their sub-options and thumbnails embedded inline
- whether the accessible option was on, and the starting style
- the shareable board link
- the date and time in the owner's time zone
- the IP address and browser
- a JSON copy of the submission

The success message is shown **only after** the SMTP server accepts the email.

---

## Project structure

```
├── public/                 # Frontend (static)
│   ├── index.html
│   ├── 404.html
│   ├── css/style.css
│   ├── js/script.js        # router, state, builder, sidebar, summary
│   ├── js/form.js          # lead form validation + submission
│   ├── js/icons.js
│   └── images/             # options/, patterns/, styles/, hero/, logo.svg
├── shared/catalog.js       # steps/options/presets – used by browser AND server validation
├── routes/formRoutes.js    # POST /api/submit-form, GET /api/health
├── controllers/formController.js
├── middleware/validation.js      # express-validator rules + board validation
├── middleware/spamProtection.js  # rate limit, honeypot, time-on-form check
├── middleware/errorHandler.js
├── services/submissionService.js # builds the full submission record
├── services/emailService.js      # Nodemailer send + attachments
├── templates/ownerEmail.js       # HTML + plain-text email
├── config/emailConfig.js         # SMTP settings from environment variables
├── utils/logger.js, utils/duplicateGuard.js
├── scripts/dev-mail-server.js    # local SMTP mail catcher for testing
├── scripts/generate-pattern-assets.js
├── tests/api.test.js             # end-to-end API + email tests
├── .env.example
└── server.js
```

## Install & run locally

Requires Node.js 18.18 or newer (tested on Node 22).

```bash
npm install
```

```bash
cp .env.example .env
```

Edit `.env` (see below), then:

```bash
npm start
```

Open http://localhost:3000. Use `npm run dev` to auto-restart the server when files change.

### Try the full email flow without a real mailbox

In terminal 1, start the local mail catcher (listens on `127.0.0.1:1025`):

```bash
npm run mail:dev
```

Point `.env` at it:

```
OWNER_EMAIL=owner@example.com
SMTP_HOST=127.0.0.1
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_SECURE=false
SMTP_IGNORE_TLS=true
MAIL_FROM="Caliber Vision Board <no-reply@localhost>"
```

In terminal 2:

```bash
npm start
```

Submit the form. Each email is saved to `dev-mail/` as a `.eml` file and a `.html` file. Open the `.html` file in a browser to see exactly what the owner receives.

## Live preview without a domain (Render, free)

GitHub Pages only serves static files, so it cannot run the form's Node server. Render can, and gives a free `https://<name>.onrender.com` URL.

1. Sign in at https://render.com with GitHub, and give Render access to `kartrik-stratum/chs-site`.
2. Go to **New → Blueprint** and pick this repo. `render.yaml` sets up the service on branch `claude/intelligent-mayer-nv3axy`.
3. Fill in `OWNER_EMAIL`, `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` and `MAIL_FROM` when Render prompts for them, then click **Apply**.
4. After the build, open the `onrender.com` URL. The builder works even before SMTP is set, but form submissions return an error until the email settings are filled in.

The free plan sleeps when idle, so the first visit after a while takes about 30 seconds to load.

## Configuring the owner's email (production)

All settings are environment variables. Nothing secret is in the source code or sent to the browser.

| Variable | Purpose |
|---|---|
| `OWNER_EMAIL` | **Where submissions are sent.** Lives on the server only. |
| `OWNER_CC` | Optional extra recipients (comma separated) |
| `SMTP_HOST`, `SMTP_PORT` | SMTP server, e.g. `smtp.gmail.com` / `587` |
| `SMTP_USER`, `SMTP_PASS` | SMTP login. For Gmail or Google Workspace, use an **App Password**. |
| `SMTP_SECURE` | `true` for port 465. Leave empty to detect it from the port. |
| `SMTP_REQUIRE_TLS` | `true` forces STARTTLS on port 587 (recommended) |
| `MAIL_FROM` | Sender address. Your provider must allow it (usually the same as `SMTP_USER`). |
| `OWNER_TIMEZONE` | Time zone for the date/time shown in the email (default `America/Denver`) |
| `EMAIL_INCLUDE_IMAGES` | Embed the selected product images in the email (default `true`) |
| `SITE_URL` | Production address for canonicals and sitemap; only this host is indexable |
| `PORT`, `NODE_ENV`, `TRUST_PROXY` | Server settings. Set `TRUST_PROXY=1` behind Nginx, Render, Heroku, etc. |
| `RATE_LIMIT_MAX`, `MIN_FORM_FILL_MS` | Spam-protection limits |

Common SMTP providers:
- **Gmail / Google Workspace:** `smtp.gmail.com:587`. Turn on 2-Step Verification, then create an App Password.
- **Microsoft 365:** `smtp.office365.com:587`
- **SendGrid:** `smtp.sendgrid.net:587`, user `apikey`, password = your API key
- **Mailgun:** `smtp.mailgun.org:587`

When the server starts, it checks the SMTP connection and logs whether it succeeded. `GET /api/health` reports whether email is configured.

## API

`POST /api/submit-form` (JSON)

| Status | Meaning |
|---|---|
| 200 `{ ok: true, reference }` | Validated, and the owner email was accepted by SMTP. A repeat of an already-sent submission returns `duplicate: true` and no new email is sent. |
| 400 | Malformed JSON, or the spam check failed (honeypot filled, or the form was submitted too quickly) |
| 409 | The same submission is already being processed |
| 422 `{ errors: [{ field, message }] }` | Validation failed. The form shows the message next to each field. |
| 429 | Rate limit reached (8 requests per 15 minutes per IP by default) |
| 502 | Email delivery failed (SMTP unreachable, login rejected, etc.). **No success is shown.** |
| 503 | Email is not configured |

Every attempt is logged as one JSON line to stdout and to `logs/submissions.log`. If email delivery fails, the full submission is saved to `logs/failed-submissions.jsonl` so the lead is not lost. The customer can also retry the same submission once SMTP is back.

## Security & spam protection

- SMTP credentials and the owner's address exist only on the server (`.env`, which git ignores).
- The server re-validates everything, including each board option against the shared catalog, so tampered option IDs are rejected.
- All user input is HTML-escaped before it goes into the email.
- Spam protection: a hidden honeypot field, a minimum time on the form, and per-IP rate limiting.
- Duplicate prevention: the client disables the button and sends an idempotency key (`submissionId`). The server also ignores the same email + board content sent within 2 minutes.
- Helmet security headers with a strict Content-Security-Policy, and a 32 KB JSON body limit.
- The duplicate guard keeps its data in memory. If you run several server instances, move it to a shared store such as Redis.

## Testing

### Automated

```bash
npm test
```

There are 16 end-to-end tests. They start the real Express app and a real SMTP server in the same process, then parse the email that the owner actually receives. They cover:
- all fields, selections, sub-options, images, the JSON attachment, the date/time, and reply-to
- skipped and unchosen categories
- missing or invalid name, email, phone, zip, and state
- a tampered board and an empty board
- HTML escaping
- the honeypot and the too-fast check
- duplicate submissions
- SMTP down (502, plus the recovery log, plus a successful retry)
- SMTP login rejected (502)
- email not configured (503)
- malformed JSON
- that static files are served and no secrets leak

### Manual checklist

1. Run `npm run mail:dev` and `npm start`, then open http://localhost:3000.
2. Click **Design Your Dream Bathroom**. Try a style preset and the **Make it Accessible** toggle.
3. Go through all 10 steps. Check auto-advance, sub-option chips, **Not in my project**, the multi-select accessories, and that Back/Next and the dots work.
4. On the summary page, click **Submit** with the form empty. Each field should show an error.
5. Enter an invalid email (`jane@`) and a short phone number. Both should show errors. The phone number formats itself as you type.
6. Submit valid details. The button should show a spinner and ignore extra clicks, then the success screen should appear.
7. Open the newest file in `dev-mail/*.html` and confirm every answer is there.
8. Stop `mail:dev` and submit again. You should see an error message and no success screen.
9. Use DevTools device mode to check phone (~390 px), tablet (~768 px), and desktop widths.

## Asset notes

The product photos and the style and hero images were cropped from frames of the reference video. They are lower resolution than the originals, and some had the reference's badges and the mouse cursor painted out. Before launch, replace them with the client's original high-resolution files, keeping the same filenames in `public/images/`.

The wall-pattern tiles are vector SVGs created by `npm run build:patterns`. That script also renders PNG copies for the emails, using Playwright and Chromium if they are installed.

