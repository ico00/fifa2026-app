# 🚀 Deployment vodič za FIFA 2026 aplikaciju

Ovaj vodič objašnjava kako deployati aplikaciju na javni web.

## 📋 Preduvjeti

- Node.js 18+ i npm
- Git
- Račun na hosting servisu (Render, Railway, Vercel, itd.)

## 🏗️ Struktura aplikacije

Aplikacija se sastoji od:
- **Frontend**: React + Vite (port 5173 u developmentu)
- **Backend**: Express server (port 3001 u developmentu)
- **Podaci**: JSON datoteke u `data/` folderu

## 🌐 Opcije za deployment

### Opcija 1: Render.com (Preporučeno - besplatno)

Render podržava full-stack aplikacije i besplatni tier.

#### Koraci:

1. **Kreiraj Render account** na https://render.com
2. **Pushaj kod na GitHub**
3. **Kreiraj Web Service za backend:**
   - New → Web Service
   - Poveži GitHub repo
   - Build Command: `npm install`
   - Start Command: `npm run server`
   - Environment Variables:
     - `PORT`: Render će automatski dodijeliti port
   - Root Directory: `/fifa2026-app` (ako je repo u subfolderu)

4. **Kreiraj Static Site za frontend:**
   - New → Static Site
   - Poveži GitHub repo
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   - Environment Variables:
     - `VITE_API_URL`: `https://your-backend-service.onrender.com/api`
   - Root Directory: `/fifa2026-app` (ako je repo u subfolderu)

5. **Ažuriraj backend CORS** (ako treba):
   - Backend će automatski raditi s frontendom ako su na istom domenu
   - Ako su na različitim domenima, možda trebaš ažurirati CORS u `server/index.cjs`

### Opcija 2: Railway.app

Railway je jednostavan za korištenje i ima besplatni tier.

1. **Kreiraj Railway account** na https://railway.app
2. **Pushaj kod na GitHub**
3. **Kreiraj novi projekt:**
   - New Project → Deploy from GitHub repo
4. **Dodaj environment variables:**
   - `PORT`: Railway će automatski dodijeliti
   - `VITE_API_URL`: `https://your-app.railway.app/api` (za frontend)

### Opcija 3: Vercel (Frontend) + Render/Railway (Backend)

1. **Deploy backend** na Render ili Railway (kao gore)
2. **Deploy frontend na Vercel:**
   - Pushaj kod na GitHub
   - Importuj repo u Vercel
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Environment Variables:
     - `VITE_API_URL`: `https://your-backend-service.onrender.com/api`

### Opcija 4: VPS (DigitalOcean, Linode, itd.)

Ako imaš VPS, možeš deployati cijelu aplikaciju:

1. **SSH na server**
2. **Instaliraj Node.js i npm**
3. **Kloniraj repo:**
   ```bash
   git clone <your-repo-url>
   cd fifa2026-app
   ```
4. **Instaliraj dependencies:**
   ```bash
   npm install
   ```
5. **Build frontend:**
   ```bash
   npm run build
   ```
6. **Koristi PM2 za backend:**
   ```bash
   npm install -g pm2
   pm2 start server/index.cjs --name fifa2026-server
   pm2 save
   pm2 startup
   ```
7. **Koristi Nginx za servirati frontend i proxy za backend:**
   - Nginx config za servirati `dist/` folder
   - Proxy `/api/*` zahtjeve na `http://localhost:3001`

## 🔧 Environment Variables

### Backend
- `PORT`: Port na kojem server sluša (default: 3001)

### Frontend
- `VITE_API_URL`: URL backend API-ja (npr. `https://your-backend.onrender.com/api`)

## 📝 Production Build

Za production build:

```bash
# Build frontend
npm run build

# Start backend
npm run server
```

Frontend build će biti u `dist/` folderu.

## 🔒 Sigurnost

- Aplikacija koristi CORS za zaštitu
- Nema autentifikacije (javna aplikacija)
- Podaci se čuvaju u JSON datotekama (za production, razmotri bazu podataka)

## 🐛 Troubleshooting

### Backend ne radi
- Provjeri da li je `PORT` environment variable postavljen
- Provjeri logove na hosting servisu

### Frontend ne može pristupiti backendu
- Provjeri da li je `VITE_API_URL` postavljen ispravno
- Provjeri CORS postavke u backendu

### Podaci se ne čuvaju
- Na serverless okruženjima (Vercel, Netlify Functions), JSON datoteke se ne mogu pisati
- Razmotri korištenje baze podataka (MongoDB, PostgreSQL) ili servisa kao što je Supabase

## 📞 Podrška

Za pitanja o deploymentu, provjeri dokumentaciju hosting servisa ili otvori issue na GitHub repo-u.

