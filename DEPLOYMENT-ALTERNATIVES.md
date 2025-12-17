# 🚀 Alternative za Deployment - Rješavanje problema s Render.com

Render.com nakon 15 minuta neaktivnosti usporava prvo učitavanje (cold start problem). Evo najboljih besplatnih alternativa:

## ⭐ Preporučene Alternative

### 1. **Fly.io** (NAJBOLJA OPCIJA) ⭐⭐⭐⭐⭐

**Zašto Fly.io?**
- ✅ Besplatni tier s 3 shared-cpu-1x VM-ovima
- ✅ **Brži cold start** - server se "budi" za 1-2 sekunde umjesto minute
- ✅ Može hostati cijelu aplikaciju (frontend + backend)
- ✅ Jednostavan deployment
- ✅ Besplatni SSL certifikat
- ✅ Podrška za vlastitu domenu

**Koraci za deployment:**

1. **Instaliraj Fly.io CLI:**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Prijavi se:**
   ```bash
   fly auth login
   ```

3. **Kreiraj Fly.io aplikaciju:**
   ```bash
   fly launch
   ```
   - Odaberi region (npr. `fra` za Frankfurt)
   - Ne kreiraj PostgreSQL (ne treba nam)
   - Ne deployaj odmah

4. **Kreiraj `fly.toml` konfiguraciju:**
   ```toml
   app = "fifa2026-app"
   primary_region = "fra"

   [build]
     builder = "paketobuildpacks/builder:base"

   [http_service]
     internal_port = 3001
     force_https = true
     auto_stop_machines = false
     auto_start_machines = true
     min_machines_running = 1
     processes = ["app"]

   [[services]]
     http_checks = []
     internal_port = 3001
     processes = ["app"]
     protocol = "tcp"
     script_checks = []

     [services.concurrency]
       hard_limit = 25
       soft_limit = 20
       type = "connections"

     [[services.ports]]
       force_https = true
       handlers = ["http"]
       port = 80

     [[services.ports]]
       handlers = ["tls", "http"]
       port = 443

     [[services.tcp_checks]]
       grace_period = "1s"
       interval = "15s"
       restart_limit = 0
       timeout = "2s"
   ```

5. **Kreiraj `Dockerfile`:**
   ```dockerfile
   FROM node:18-alpine

   WORKDIR /app

   # Kopiraj package files
   COPY package*.json ./

   # Instaliraj dependencies
   RUN npm ci --only=production

   # Kopiraj sve fajlove
   COPY . .

   # Build frontend
   RUN npm run build

   # Eksponiraj port
   EXPOSE 3001

   # Start server (server će servirati i frontend i backend)
   CMD ["node", "server/index.cjs"]
   ```

6. **Ažuriraj `server/index.cjs` da servira i frontend:**
   Dodaj na početak servera (nakon `const app = express()`):
   ```javascript
   // Serviraj static frontend build
   app.use(express.static(path.join(__dirname, '..', 'dist')));
   
   // Fallback na index.html za SPA routing
   app.get('*', (req, res) => {
     if (!req.path.startsWith('/api')) {
       res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
     }
   });
   ```

7. **Deploy:**
   ```bash
   fly deploy
   ```

8. **Dodaj vlastitu domenu (opcionalno):**
   ```bash
   fly domains add yourdomain.com
   ```

**Cijena:** Besplatno do 3 shared-cpu-1x VM-ova

---

### 2. **Cloudflare Pages + Workers** ⭐⭐⭐⭐

**Zašto Cloudflare?**
- ✅ **Potpuno besplatno** (neograničeno)
- ✅ **Izvrsna brzina** - CDN globalno
- ✅ **Nema cold start problema** - Workers su instant
- ✅ Besplatni SSL
- ✅ Podrška za vlastitu domenu

**Koraci:**

1. **Frontend na Cloudflare Pages:**
   - Pushaj kod na GitHub
   - Idi na [Cloudflare Pages](https://pages.cloudflare.com)
   - New Project → Connect GitHub repo
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment variables: `VITE_API_URL` (postavi nakon što deployaš backend)

2. **Backend na Cloudflare Workers:**
   - Cloudflare Workers ima ograničenja za Express servere
   - **Alternativa:** Koristi Cloudflare Workers za API endpoints
   - Ili deployaj backend na Fly.io i poveži s Cloudflare Pages frontendom

**Cijena:** Besplatno

---

### 3. **Vercel (Frontend) + Fly.io (Backend)** ⭐⭐⭐⭐

**Zašto ova kombinacija?**
- ✅ Vercel je odličan za React frontend (besplatno, brzo)
- ✅ Fly.io za backend (brži cold start)
- ✅ Jednostavno za setup

**Koraci:**

1. **Frontend na Vercel:**
   - Pushaj kod na GitHub
   - Idi na [Vercel](https://vercel.com)
   - Import Project → Select GitHub repo
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Environment Variables: `VITE_API_URL` (postavi nakon backend deploymenta)

2. **Backend na Fly.io:**
   - Slijedi korake iz opcije 1 (Fly.io), ali samo za backend
   - Ne serviraj frontend iz backend-a

3. **Ažuriraj CORS u backendu:**
   ```javascript
   app.use(cors({
     origin: ['https://your-app.vercel.app', 'http://localhost:5173'],
     credentials: true
   }));
   ```

**Cijena:** Besplatno

---

### 4. **Railway.app** ⭐⭐⭐

**Zašto Railway?**
- ✅ Besplatni tier ($5 kredita mjesečno)
- ✅ Jednostavniji od Render-a
- ⚠️ Može imati cold start problem (ali manji od Render-a)

**Koraci:**

1. Idi na [Railway](https://railway.app)
2. New Project → Deploy from GitHub repo
3. Dodaj environment variables:
   - `PORT`: Automatski
   - `VITE_API_URL`: `https://your-app.railway.app/api` (za frontend)

**Cijena:** $5 kredita mjesečno (besplatno)

---

## 🏠 Deployment na Vlastitu Domenu (VPS)

Ako imaš vlastitu domenu i želiš potpunu kontrolu:

### Opcija A: DigitalOcean Droplet ($6/mjesec)

1. **Kreiraj Droplet:**
   - Ubuntu 22.04
   - Najmanji plan ($6/mjesec)

2. **SSH na server:**
   ```bash
   ssh root@your-server-ip
   ```

3. **Instaliraj Node.js:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. **Instaliraj Nginx:**
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

5. **Kloniraj repo:**
   ```bash
   git clone <your-repo-url>
   cd fifa2026-app
   npm install
   npm run build
   ```

6. **Instaliraj PM2:**
   ```bash
   sudo npm install -g pm2
   pm2 start server/index.cjs --name fifa2026-server
   pm2 save
   pm2 startup
   ```

7. **Nginx konfiguracija:**
   ```bash
   sudo nano /etc/nginx/sites-available/fifa2026
   ```
   
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;

       # Frontend
       root /root/fifa2026-app/dist;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       # Backend API
       location /api {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

8. **Aktiviraj Nginx config:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/fifa2026 /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

9. **SSL s Let's Encrypt:**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

**Cijena:** $6/mjesec (DigitalOcean) + domena (~$10-15/godina)

---

### Opcija B: Oracle Cloud Free Tier

Oracle nudi **besplatni VPS** s:
- 2 AMD VM-ova (1/8 OCPU, 1GB RAM)
- Ili 4 ARM VM-ova (1 OCPU, 24GB RAM)

**Koraci:** Isti kao DigitalOcean, ali besplatno!

1. Registriraj se na [Oracle Cloud](https://www.oracle.com/cloud/free/)
2. Kreiraj Always Free VM
3. Slijedi korake iz Opcije A (korak 2-9)

**Cijena:** Besplatno (trajno)

---

## 📊 Usporedba Opcija

| Opcija | Cijena | Cold Start | Brzina | Vlastita Domen | Težina |
|--------|--------|------------|--------|----------------|--------|
| **Fly.io** | Besplatno | 1-2s | ⭐⭐⭐⭐⭐ | ✅ | ⭐⭐ |
| **Cloudflare Pages** | Besplatno | Instant | ⭐⭐⭐⭐⭐ | ✅ | ⭐⭐⭐ |
| **Vercel + Fly.io** | Besplatno | 1-2s | ⭐⭐⭐⭐⭐ | ✅ | ⭐⭐⭐ |
| **Railway** | $5 kredit | 5-10s | ⭐⭐⭐⭐ | ✅ | ⭐⭐ |
| **Oracle Cloud** | Besplatno | Nema | ⭐⭐⭐⭐⭐ | ✅ | ⭐⭐⭐⭐ |
| **DigitalOcean** | $6/mjesec | Nema | ⭐⭐⭐⭐⭐ | ✅ | ⭐⭐⭐⭐ |

---

## 🎯 Moja Preporuka

**Za najbrže rješenje:** **Fly.io** - jednostavan setup, brz cold start, besplatno

**Za potpuno besplatno bez cold start problema:** **Oracle Cloud Free Tier** - VPS koji je uvijek aktivan

**Za najjednostavnije rješenje:** **Vercel (frontend) + Fly.io (backend)** - odlična kombinacija

---

## 🔧 Migracija s Render.com

1. **Backup podataka:**
   - Preuzmi sve JSON datoteke iz `data/` foldera
   - Spremi ih lokalno

2. **Odaberi novu platformu** (preporučujem Fly.io)

3. **Deploy na novu platformu** (slijedi korake iznad)

4. **Ažuriraj DNS** ako koristiš vlastitu domenu

5. **Testiraj** da sve radi

6. **Obriši Render.com servis** nakon što potvrdiš da nova platforma radi

---

## ❓ Pitanja?

Ako imaš pitanja o deploymentu, otvori issue na GitHub repo-u ili kontaktiraj me.
