# 🚀 Brzi Vodič za Deployment na Fly.io

Ovaj vodič će te provesti kroz deployment aplikacije na Fly.io u nekoliko jednostavnih koraka.

> 💡 **Ovaj vodič je optimiziran za GitHub workflow** - kod se pusha na GitHub, a zatim deploya na Fly.io (ručno ili automatski s GitHub Actions).

## 🔑 Kako Fly.io radi s GitHub-om?

**Dva načina deploymenta:**

### Način 1: Ručni deploy iz lokalnog repo-a (koji je povezan s GitHub-om)
```
Tvoj lokalni kod (Git repo)
    ↓
git push → GitHub (backup i verzioniranje)
    ↓
fly deploy (komanda lokalno)
    ↓
Fly.io serveri (build + deploy)
    ↓
Aplikacija na webu
```

### Način 2: Automatski deploy s GitHub Actions (preporučeno!)
```
Tvoj lokalni kod
    ↓
git push → GitHub
    ↓
GitHub Actions (automatski)
    ↓
Fly.io serveri (build + deploy)
    ↓
Aplikacija na webu
```

**Prednosti GitHub workflowa:**
- ✅ Backup koda na GitHub-u
- ✅ Povijest promjena
- ✅ Možeš koristiti GitHub Actions za automatski deploy
- ✅ Lakše suradnja s drugima

## 📋 Preduvjeti

- ✅ GitHub account (kod već pushan na GitHub)
- ✅ Fly.io account (besplatno)
- ✅ Git repozitorij lokalno (povezan s GitHub-om)

## 🎯 Koraci

### 1. Instaliraj Fly.io CLI

**macOS:**
```bash
curl -L https://fly.io/install.sh | sh
```

**Windows:**
```powershell
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

**Linux:**
```bash
curl -L https://fly.io/install.sh | sh
```

### 2. Prijavi se na Fly.io

```bash
fly auth login
```

Otvorit će se browser gdje se možeš prijaviti ili registrirati.

### 3. Pushaj kod na GitHub

Budući da već koristiš GitHub, pushaj nove promjene:

```bash
git add .
git commit -m "Add Fly.io deployment config"
git push origin main
```

Ovo će spremiti tvoj kod na GitHub (backup i verzioniranje).

### 4. Deploy aplikacije

```bash
fly launch
```

**Odgovori na pitanja:**
- App name: `fifa2026-app` (ili bilo koje ime koje želiš)
- Region: Odaberi najbliži (npr. `fra` za Frankfurt)
- PostgreSQL: `n` (ne treba nam)
- Deploy now: `y` (da)

### 5. Postavi Environment Variables

Ako koristiš vlastitu domenu ili imaš specifične postavke:

```bash
fly secrets set VITE_API_URL=https://fifa2026-app.fly.dev/api
```

**Napomena:** Ako serviraš frontend iz backend-a (kao što je konfigurirano), ne trebaš postavljati `VITE_API_URL` jer će frontend koristiti relativne putanje.

### 6. Provjeri deployment

Nakon deploymenta, aplikacija će biti dostupna na:
```
https://fifa2026-app.fly.dev
```

### 7. (Opcionalno) Dodaj vlastitu domenu

```bash
fly domains add yourdomain.com
```

Fly.io će automatski konfigurirati SSL certifikat.

## 🔄 Ažuriranje aplikacije

### Opcija 1: Ručni deploy (jednostavno)

```bash
# 1. Napravi promjene u kodu
git add .
git commit -m "Update app"
git push origin main  # Push na GitHub (backup)

# 2. Deploy na Fly.io
fly deploy
```

### Opcija 2: Automatski deploy s GitHub Actions (preporučeno!)

S GitHub Actions, svaki put kada pushaš na `main` branch, aplikacija se automatski deploya!

**Koraci:**

1. **Dobij Fly.io API token:**
   ```bash
   fly auth token
   ```
   Kopiraj token koji se prikaže.

2. **Dodaj token kao GitHub Secret:**
   - Idi na GitHub repo → Settings → Secrets and variables → Actions
   - Klikni "New repository secret"
   - Name: `FLY_API_TOKEN`
   - Value: Zalijepi token iz koraka 1
   - Klikni "Add secret"

3. **Kreiraj GitHub Actions workflow:**
   
   Kreiraj datoteku `.github/workflows/fly.yml`:
   ```yaml
   name: Fly Deploy
   on:
     push:
       branches: [main]
   jobs:
     deploy:
       name: Deploy app
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: superfly/flyctl-actions/setup-flyctl@master
         - run: flyctl deploy --remote-only
           env:
             FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
   ```

4. **Pushaj na GitHub:**
   ```bash
   git add .github/workflows/fly.yml
   git commit -m "Add GitHub Actions for auto-deploy"
   git push origin main
   ```

**Od sada:** Svaki put kada pushaš na `main`, aplikacija se automatski deploya! 🎉

**Prednosti:**
- ✅ Automatski deploy na svaki push
- ✅ Ne trebaš ručno pokretati `fly deploy`
- ✅ Deployment se dešava u pozadini

## 📊 Monitoring

Pogledaj logove:
```bash
fly logs
```

Provjeri status:
```bash
fly status
```

## 🐛 Troubleshooting

### Aplikacija se ne pokreće

1. Provjeri logove:
   ```bash
   fly logs
   ```

2. Provjeri da li je build uspješan:
   ```bash
   fly status
   ```

### Backend ne radi

1. Provjeri da li je `PORT` environment variable postavljen (Fly.io automatski postavlja)
2. Provjeri logove za greške

### Frontend ne učitava

1. Provjeri da li je `npm run build` uspješno završio
2. Provjeri da li `dist` folder postoji u Docker image-u

## 💰 Cijena

Fly.io besplatni tier uključuje:
- 3 shared-cpu-1x VM-ova
- 3GB storage
- 160GB outbound transfer

Za ovu aplikaciju, besplatni tier je više nego dovoljan!

## 📚 Dodatni resursi

- [Fly.io dokumentacija](https://fly.io/docs/)
- [Fly.io pricing](https://fly.io/docs/about/pricing/)
