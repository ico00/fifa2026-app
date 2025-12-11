# 🏆 FIFA World Cup 2026 - Aplikacija za praćenje

Aplikacija za praćenje FIFA Svjetskog prvenstva 2026 koje se održava u SAD-u, Kanadi i Meksiku.

## 🇭🇷 Poseban fokus na Hrvatsku!

Aplikacija posebno ističe sve utakmice i pozicije Hrvatske reprezentacije.

## 🚀 Pokretanje aplikacije

### Brzi start (preporučeno)

**Na Mac/Linux:**
```bash
cd fifa2026-app
./start.sh
```

**Na Windows:**
```bash
cd fifa2026-app
start.bat
```

Skripta će automatski:
- Provjeriti da li su dependencies instalirani
- Pokrenuti frontend i backend zajedno
- Prikazati URL-ove za pristup

### Ručno pokretanje

#### Instalacija
```bash
cd fifa2026-app
npm install
```

#### Pokretanje (frontend + backend)
```bash
npm start
```

Ovo će pokrenuti:
- **Frontend** na `http://localhost:5173`
- **Backend API** na `http://localhost:3001`

#### Samo frontend
```bash
npm run dev
```

#### Samo backend
```bash
npm run server
```

## 📁 Struktura podataka

Svi podaci se spremaju u JSON datoteke u mapi `/data`:

- `teams.json` - Sve reprezentacije
- `groups.json` - Grupe i raspored
- `playoffs.json` - Play-off kvalifikacije
- `matches.json` - Utakmice i rezultati
- `standings.json` - Tablice grupa (automatski generirano)
- `venues.json` - Stadioni i gradovi

## ⚽ Funkcionalnosti

### 📋 Grupe
- Pregled svih 12 grupa
- Prikaz reprezentacija u svakoj grupi
- Označena mjesta za play-off pobjednike

### 🎯 Play-Off
- Odabir pobjednika play-off skupina
- Automatsko ažuriranje grupa nakon odabira

### ⚽ Utakmice
- Pregled rasporeda po datumima
- Unos rezultata
- Dodavanje novih utakmica
- Odabir reprezentacija za svaku utakmicu

### 📊 Tablice
- Automatski izračun na temelju rezultata
- Bodovi, golovi, gol-razlika
- Označene kvalificirane reprezentacije

### 🏆 Knockout
- Pregled knockout faze
- Šesnaestina finala do finala

## 🎨 Dizajn

- Tamna tema inspirirana noćnim stadionima
- Zlatni akcenti za naslove
- Crveno-bijelo-plavo isticanje za Hrvatsku
- Responzivan dizajn za sve uređaje

## 📝 Napomene

- Podaci se trajno spremaju u JSON datoteke
- Tablice se automatski ažuriraju nakon unosa rezultata
- Hrvatska je uvijek posebno istaknuta 🇭🇷

## 🌐 Deployment na web

Aplikacija je spremna za javno korištenje! Detaljne upute za deployment na različite hosting servise (Render, Railway, Vercel, itd.) nalaze se u [DEPLOYMENT.md](./DEPLOYMENT.md).

### Brzi start za deployment:

1. **Pushaj kod na GitHub**
2. **Odaberi hosting servis** (preporučeno: Render.com - besplatno)
3. **Postavi environment variables:**
   - Backend: `PORT` (automatski se postavlja na većini servisa)
   - Frontend: `VITE_API_URL` (URL tvog backend servisa)
4. **Deploy!**

Za detaljne upute, pogledaj [DEPLOYMENT.md](./DEPLOYMENT.md).

---

**Idemo Vatreni! 🔥⚽🇭🇷**
