# iDealz Quotation System — Production Deployment Guide

## Stack
- **Backend**: Node.js + Express + Prisma ORM
- **Database**: PostgreSQL (Railway free tier)
- **Frontend**: React + Vite (served by Express in production)
- **PDF**: Puppeteer (Chromium headless)
- **Email**: Nodemailer (Gmail App Password — free)
- **Hosting**: Railway (free tier — $5 credit/month, enough for this)

---

## Step 1 — Prepare your code

1. Copy `logo.png` (your iDealz logo) into `client/public/logo.png`
2. This is already referenced throughout the system

---

## Step 2 — Push to GitHub

```bash
cd idealz
git init
git add .
git commit -m "Initial commit"
# Create repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/idealz-quotations.git
git push -u origin main
```

---

## Step 3 — Deploy on Railway (100% free)

1. Go to **https://railway.app** → Sign up with GitHub (free)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your `idealz-quotations` repo
4. Railway auto-detects it — click **"Deploy"**

### Add PostgreSQL database (free):
5. In your project dashboard → **"+ New"** → **"Database"** → **"Add PostgreSQL"**
6. Railway automatically sets `DATABASE_URL` in your service

### Set environment variables:
7. Click your service → **"Variables"** tab → add these:

```
DATABASE_URL          = (auto-set by Railway PostgreSQL)
JWT_SECRET            = any-long-random-string-min-32-chars
APP_URL               = https://YOUR-APP-NAME.up.railway.app
CLIENT_URL            = https://YOUR-APP-NAME.up.railway.app
NODE_ENV              = production

# Gmail (free SMTP):
SMTP_HOST             = smtp.gmail.com
SMTP_PORT             = 587
SMTP_SECURE           = false
SMTP_USER             = info@idealz.lk
SMTP_PASS             = (Gmail App Password — see below)

# Puppeteer (Railway provides Chromium via nixpacks)
PUPPETEER_EXECUTABLE_PATH = /usr/bin/chromium
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = true
```

8. Click **"Deploy"** — Railway builds and starts the app

---

## Step 4 — Get Gmail App Password (free SMTP)

Gmail allows free email sending via App Passwords:

1. Go to **myaccount.google.com** → Security
2. Enable **2-Step Verification** (if not already)
3. Search for **"App passwords"**
4. Select app: "Mail", device: "Other" → type "iDealz"
5. Copy the 16-character password → paste as `SMTP_PASS`

**Free limits**: Gmail allows ~500 emails/day — more than enough.

**Alternative free SMTP services**:
- **Brevo** (formerly Sendinblue): 300 emails/day free → https://brevo.com
- **Mailersend**: 3,000 emails/month free → https://mailersend.com
- **Resend**: 3,000 emails/month free → https://resend.com

---

## Step 5 — Seed the database

After first deploy, run the seed script once via Railway shell:

1. In Railway dashboard → your service → **"Shell"** tab
2. Run:
```bash
cd server && node seed.js
```

This creates:
- Admin: `admin@idealz.lk` / `Admin@idealz2024`
- Prime Manager: `prime@idealz.lk` / `Manager@2024`
- Marino Manager: `marino@idealz.lk` / `Manager@2024`
- Liberty Manager: `liberty@idealz.lk` / `Manager@2024`

**Change all passwords immediately after first login!**

---

## Step 6 — Add custom domain (optional, free)

1. Railway dashboard → your service → **"Settings"** → **"Domains"**
2. Add your domain (e.g. `quotes.idealz.lk`)
3. Add the CNAME record to your DNS provider
4. Update `APP_URL` and `CLIENT_URL` env vars to your custom domain

---

## Local development

```bash
# Install all dependencies
npm install

# Copy env file
cp server/.env.example server/.env
# Edit server/.env with your values

# Start PostgreSQL locally (or use Railway DB URL directly)
# Run migrations
cd server && npx prisma migrate dev

# Seed
node seed.js

# Start dev servers (both frontend and backend)
cd .. && npm run dev
```

Frontend runs on http://localhost:5173
Backend runs on http://localhost:3001

---

## How the system works

### Quotation numbering
- Global counter in DB, incremented atomically on each creation
- Prime creates #1 → Liberty creates #2 → Marino creates #3 (sequential globally)

### Download link
- Each quotation has a unique `downloadToken` (UUID)
- Link: `https://your-app.up.railway.app/download/{token}`
- No login required for client to download
- Status auto-updates to `VIEWED` when client downloads

### PDF generation
- Puppeteer renders the exact HTML quotation template
- Includes your logo, branch-specific contact, all 3 branch footers
- 077 numbers → WhatsApp links, 011 numbers → call links

### Email
- HTML email with summary + download button
- Sent via Nodemailer to client's email address
- Branch-specific sender name

---

## File structure

```
idealz/
├── server/
│   ├── index.js              # Express app entry
│   ├── seed.js               # One-time DB seed
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   ├── routes/
│   │   ├── auth.js           # Login, users
│   │   ├── quotations.js     # CRUD + email + PDF
│   │   └── public.js         # Download link (no auth)
│   ├── lib/
│   │   ├── prisma.js         # DB client
│   │   ├── tax.js            # Tax calculations
│   │   ├── pdf.js            # Puppeteer PDF
│   │   └── email.js          # Nodemailer
│   └── middleware/
│       └── auth.js           # JWT middleware
├── client/
│   ├── public/
│   │   └── logo.png          # ← PUT YOUR LOGO HERE
│   └── src/
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Dashboard.jsx
│       │   ├── NewQuotation.jsx
│       │   ├── Quotations.jsx
│       │   └── Users.jsx
│       ├── components/
│       │   ├── Sidebar.jsx
│       │   └── Icons.jsx
│       ├── hooks/
│       │   └── useAuth.jsx   # Auth + Toast
│       └── utils/
│           └── api.js        # Axios + tax utils
├── railway.toml              # Railway config
├── nixpacks.toml             # Build config (Puppeteer)
└── package.json              # Root scripts
```
