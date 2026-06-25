const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { login, verifyToken, authMiddleware } = require('./auth.cjs');
const openfootball = require('./openfootball.cjs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serviraj static frontend build (samo u production-u ako dist folder postoji)
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  // Fallback na index.html za SPA routing (samo za non-API zahtjeve).
  // Napomena: Express 5 koristi novu verziju path-to-regexp koja više ne podržava putanju "*",
  // zato koristimo regularni izraz kako bismo izbjegli konflikt i i dalje hvatali sve non-API rute.
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const dataDir = path.join(__dirname, '..', 'data');

// Helper funkcija za čitanje JSON datoteke
const readJsonFile = (filename) => {
  const filePath = path.join(dataDir, filename);
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Greška pri čitanju ${filename}:`, error);
    return null;
  }
};

// Helper funkcija za pisanje JSON datoteke
const writeJsonFile = (filename, data) => {
  const filePath = path.join(dataDir, filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Greška pri pisanju ${filename}:`, error);
    return false;
  }
};

// ============ API RUTE ============

// Dohvati sve reprezentacije
app.get('/api/teams', (req, res) => {
  const data = readJsonFile('teams.json');
  res.json(data);
});

// Dohvati sve grupe
app.get('/api/groups', (req, res) => {
  const data = readJsonFile('groups.json');
  res.json(data);
});

// Dohvati play-off podatke
app.get('/api/playoffs', (req, res) => {
  const data = readJsonFile('playoffs.json');
  res.json(data);
});

// Dohvati sve gradove/stadione
app.get('/api/venues', (req, res) => {
  const data = readJsonFile('venues.json');
  res.json(data);
});

// ============ AUTH ENDPOINTS ============

// Login endpoint - prima lozinku, vraća JWT token
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Lozinka je obavezna' });
  }

  const result = login(password);

  if (result.success) {
    res.json({ success: true, token: result.token });
  } else {
    res.status(401).json({ error: result.message });
  }
});

// Verify endpoint - proverava da li je token validan
app.get('/api/auth/verify', (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({ valid: false });
  }

  const token = authHeader.substring(7);
  const result = verifyToken(token);

  res.json({ valid: result.valid });
});

// Dohvati sve utakmice
app.get('/api/matches', (req, res) => {
  const data = readJsonFile('matches.json');
  res.json(data);
});

// Dohvati tablice grupa
app.get('/api/standings', (req, res) => {
  const data = readJsonFile('standings.json');
  const matchesData = readJsonFile('matches.json');

  // Izračunaj najbolje trećeplasirane samo ako su sve grupne utakmice odigrane
  // Inicijalno postavi na prazan array - UVJEK
  data.bestThirdPlaced = [];

  if (data && data.standings && matchesData && matchesData.groupStage) {
    // Provjeri da li su sve grupne utakmice odigrane
    const totalGroupMatches = matchesData.groupStage.length;
    const playedGroupMatches = matchesData.groupStage.filter(m =>
      m.played && m.homeScore !== null && m.awayScore !== null
    ).length;

    // Provjeri da li su sve grupne utakmice odigrane (barem 90% za toleranciju)
    const allGroupsFinished = playedGroupMatches >= totalGroupMatches * 0.9;

    // Debug log
    console.log(`[API /standings] playedGroupMatches: ${playedGroupMatches}, totalGroupMatches: ${totalGroupMatches}, allGroupsFinished: ${allGroupsFinished}`);

    // Također provjeri da li ima barem neke odigrane utakmice (ne samo 0)
    // I provjeri da li su svi timovi imali barem jednu odigranu utakmicu
    if (allGroupsFinished && playedGroupMatches > 0) {
      // Provjeri da li svi timovi imaju barem jednu odigranu utakmicu
      let allTeamsHaveMatches = true;
      for (const [groupKey, group] of Object.entries(data.standings)) {
        if (!group.teams || group.teams.length === 0) continue;
        for (const team of group.teams) {
          if (team && team.played === 0) {
            allTeamsHaveMatches = false;
            break;
          }
        }
        if (!allTeamsHaveMatches) break;
      }

      // Samo ako su sve utakmice odigrane I svi timovi imaju barem jednu utakmicu
      if (allTeamsHaveMatches) {
        const thirdPlaced = Object.entries(data.standings)
          .map(([groupKey, group]) => {
            // Provjeri da li grupa ima trećeplasiranog tima
            if (!group.teams || group.teams.length < 3) return null;
            const thirdTeam = group.teams[2];
            if (!thirdTeam || !thirdTeam.id) return null;

            return {
              group: groupKey,
              team: thirdTeam,
              ...thirdTeam
            };
          })
          .filter(t => t !== null && t.team) // ukloni prazne
          .sort((a, b) => {
            // Sortiraj po bodovima, gol-razlici, golovima
            if (b.points !== a.points) return b.points - a.points;
            if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
            if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
            return 0;
          })
          .slice(0, 8) // uzmi 8 najboljih
          .map(t => t.team.id); // samo ID-ovi timova

        data.bestThirdPlaced = thirdPlaced;
      }
    }
  }

  res.json(data);
});

// Ažuriraj knockout utakmicu
app.put('/api/knockout/:round/:id', authMiddleware, (req, res) => {
  const { round, id } = req.params;
  const { homeScore, awayScore, homePenalty, awayPenalty } = req.body;

  const data = readJsonFile('matches.json');
  if (!data || !data.knockoutStage[round]) {
    return res.status(404).json({ error: 'Runda nije pronađena' });
  }

  let match = null;

  // Provjeri je li array (roundOf32, roundOf16, itd.) ili objekt (thirdPlace, final)
  if (Array.isArray(data.knockoutStage[round])) {
    const matchIndex = data.knockoutStage[round].findIndex(m => m.id === parseInt(id));
    if (matchIndex === -1) {
      return res.status(404).json({ error: 'Utakmica nije pronađena' });
    }
    match = data.knockoutStage[round][matchIndex];
  } else {
    // thirdPlace ili final (objekti)
    if (data.knockoutStage[round].id === parseInt(id)) {
      match = data.knockoutStage[round];
    } else {
      return res.status(404).json({ error: 'Utakmica nije pronađena' });
    }
  }

  if (homeScore !== undefined) match.homeScore = homeScore;
  if (awayScore !== undefined) match.awayScore = awayScore;

  // Resetiraj penale ako rezultat nije neriješen
  if (match.homeScore !== match.awayScore) {
    match.homePenalty = null;
    match.awayPenalty = null;
  } else {
    // Ako je neriješeno, ažuriraj penale ako su poslani
    if (homePenalty !== undefined) match.homePenalty = homePenalty;
    if (awayPenalty !== undefined) match.awayPenalty = awayPenalty;
  }

  // Označi kao odigranu/neodigranu ovisno o rezultatima
  // Za knockout fazu, ako je neriješeno, moraju biti uneseni i penali da bi utakmica bila "odigrana"
  if (match.homeScore !== null && match.awayScore !== null) {
    if (match.homeScore === match.awayScore) {
      match.played = match.homePenalty !== null && match.awayPenalty !== null;
    } else {
      match.played = true;
    }
  } else {
    match.played = false;
  }

  // Ručni override: kad admin postavi rezultat, auto-sync ga više ne dira;
  // kad ga obriše (prazan), vrati pod auto-sync
  match.manual = !(match.homeScore == null && match.awayScore == null);

  if (writeJsonFile('matches.json', data)) {
    // Ažuriraj daljnje runde
    updateKnockoutWinners(data);
    // Spremi ažurirane podatke
    writeJsonFile('matches.json', data);
    // Ponovno učitaj podatke nakon ažuriranja
    const updatedData = readJsonFile('matches.json');
    if (Array.isArray(updatedData.knockoutStage[round])) {
      const updatedMatch = updatedData.knockoutStage[round].find(m => m.id === parseInt(id));
      res.json(updatedMatch);
    } else {
      res.json(updatedData.knockoutStage[round]);
    }
  } else {
    res.status(500).json({ error: 'Greška pri spremanju' });
  }
});

// ============ SIMULACIJA (PREDICTIONS) ============

// Spremi/Ažuriraj prognoze korisnika (NE zaštićeno - korisnici mogu čuvati svoje prognoze)
app.post('/api/predictions', (req, res) => {
  const { username, predictions, playoffPredictions } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Korisničko ime je obavezno' });
  }

  const data = readJsonFile('predictions.json') || [];
  const existingUserIndex = data.findIndex(u => u.username.toLowerCase() === username.toLowerCase());

  const userData = {
    username,
    predictions: predictions || {},
    playoffPredictions: playoffPredictions || {},
    lastUpdated: new Date().toISOString()
  };

  if (existingUserIndex >= 0) {
    // Ažuriraj postojećeg korisnika
    userData.predictions = { ...data[existingUserIndex].predictions, ...predictions };
    userData.playoffPredictions = { ...data[existingUserIndex].playoffPredictions, ...playoffPredictions };
    data[existingUserIndex] = userData;
  } else {
    // Novi korisnik
    data.push(userData);
  }

  if (writeJsonFile('predictions.json', data)) {
    res.json({ success: true, userData });
  } else {
    res.status(500).json({ error: 'Greška pri spremanju prognoza' });
  }
});

// Dohvati sve prognoze (za leaderboard)
app.get('/api/predictions', (req, res) => {
  const data = readJsonFile('predictions.json') || [];
  res.json(data);
});

// Dohvati prognoze specifičnog korisnika
app.get('/api/predictions/:username', (req, res) => {
  const { username } = req.params;
  const data = readJsonFile('predictions.json') || [];
  const user = data.find(u => u.username.toLowerCase() === username.toLowerCase());

  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: 'Korisnik nije pronađen' });
  }
});

// ============ AŽURIRANJE PODATAKA ============

// Ažuriraj utakmicu (unos rezultata)
app.put('/api/matches/:id', authMiddleware, (req, res) => {
  const matchId = parseInt(req.params.id);
  const { homeTeam, awayTeam, homeScore, awayScore, group, venue } = req.body;

  const data = readJsonFile('matches.json');
  if (!data) {
    return res.status(500).json({ error: 'Greška pri čitanju podataka' });
  }

  // Pronađi utakmicu u groupStage
  const matchIndex = data.groupStage.findIndex(m => m.id === matchId);
  if (matchIndex === -1) {
    return res.status(404).json({ error: 'Utakmica nije pronađena' });
  }

  // Ažuriraj utakmicu
  if (homeTeam !== undefined) data.groupStage[matchIndex].homeTeam = homeTeam;
  if (awayTeam !== undefined) data.groupStage[matchIndex].awayTeam = awayTeam;
  if (homeScore !== undefined) data.groupStage[matchIndex].homeScore = homeScore;
  if (awayScore !== undefined) data.groupStage[matchIndex].awayScore = awayScore;
  if (group !== undefined) data.groupStage[matchIndex].group = group;
  if (venue !== undefined) data.groupStage[matchIndex].venue = venue;

  // Označi kao odigranu/neodigranu ovisno o rezultatima
  const currentMatch = data.groupStage[matchIndex];
  if (currentMatch.homeScore !== null && currentMatch.awayScore !== null) {
    data.groupStage[matchIndex].played = true;
  } else {
    data.groupStage[matchIndex].played = false;
  }

  // Ručni override: postavljen rezultat -> auto-sync ne dira; obrisan -> vrati pod auto-sync
  currentMatch.manual = !(currentMatch.homeScore == null && currentMatch.awayScore == null);

  if (writeJsonFile('matches.json', data)) {
    // Ponovno izračunaj tablice
    recalculateStandings();

    // Ažuriraj knockout parove nakon svake ažurirane utakmice
    // (recalculateStandings već poziva updateKnockoutPairs, ali osiguravamo da se pozove)
    const standingsData = readJsonFile('standings.json');
    if (standingsData && standingsData.standings) {
      updateKnockoutPairs(standingsData.standings);
    }

    res.json(data.groupStage[matchIndex]);
  } else {
    res.status(500).json({ error: 'Greška pri spremanju' });
  }
});

// Dodaj novu utakmicu
app.post('/api/matches', authMiddleware, (req, res) => {
  const { date, venue, group, homeTeam, awayTeam, phase } = req.body;

  const data = readJsonFile('matches.json');
  if (!data) {
    return res.status(500).json({ error: 'Greška pri čitanju podataka' });
  }

  const newId = Math.max(...data.groupStage.map(m => m.id), 0) + 1;

  const newMatch = {
    id: newId,
    date,
    venue,
    group: group || null,
    homeTeam: homeTeam || null,
    awayTeam: awayTeam || null,
    homeScore: null,
    awayScore: null,
    played: false,
    phase: phase || 'group'
  };

  data.groupStage.push(newMatch);

  if (writeJsonFile('matches.json', data)) {
    res.json(newMatch);
  } else {
    res.status(500).json({ error: 'Greška pri spremanju' });
  }
});

// Ažuriraj play-off pobjednika
// Postavi/ukloni pobjednika play-offa: ažurira playoffs/groups/teams i preračuna
// tablice. Koriste je i admin ruta i auto-sync. Vraća { ok, status?, error? }.
function applyPlayoffWinner(playoffId, winner) {
  const playoffsData = readJsonFile('playoffs.json');
  const groupsData = readJsonFile('groups.json');
  const teamsData = readJsonFile('teams.json');

  if (!playoffsData || !groupsData || !teamsData) {
    return { ok: false, status: 500, error: 'Greška pri čitanju podataka' };
  }

  if (!playoffsData.playoffs[playoffId]) {
    return { ok: false, status: 404, error: 'Play-off nije pronađen' };
  }

  const previousWinner = playoffsData.playoffs[playoffId].winner;

  // Postavi ili ukloni pobjednika
  playoffsData.playoffs[playoffId].winner = winner || null;

  // Ažuriraj grupu koja čeka ovog pobjednika
  for (const [groupKey, group] of Object.entries(groupsData.groups)) {
    if (group.playoffSlot === playoffId) {
      // Ako je postojao prethodni pobjednik, ukloni ga iz grupe
      if (previousWinner) {
        const prevWinnerIndex = group.teams.indexOf(previousWinner);
        if (prevWinnerIndex !== -1) {
          group.teams[prevWinnerIndex] = null;
        }
        // Ažuriraj status prethodnog pobjednika
        const prevTeamIndex = teamsData.teams.findIndex(t => t.id === previousWinner);
        if (prevTeamIndex !== -1) {
          teamsData.teams[prevTeamIndex].qualified = false;
          teamsData.teams[prevTeamIndex].group = undefined;
        }
      }

      // Ako se uklanja pobjednik (winner je null), provjeri sve timove iz play-off grupe
      if (!winner) {
        // Pronađi sve timove koji su u play-off grupi i provjeri da li su u ovoj glavnoj grupi
        const playoffTeams = playoffsData.playoffs[playoffId]?.teams || [];
        for (const playoffTeamId of playoffTeams) {
          const teamIndexInGroup = group.teams.indexOf(playoffTeamId);
          if (teamIndexInGroup !== -1) {
            // Ovaj tim je iz play-off grupe i nije pobjednik, ukloni ga
            group.teams[teamIndexInGroup] = null;
            // Ažuriraj status tima
            const teamIndex = teamsData.teams.findIndex(t => t.id === playoffTeamId);
            if (teamIndex !== -1) {
              teamsData.teams[teamIndex].qualified = false;
              teamsData.teams[teamIndex].group = undefined;
            }
          }
        }
      }

      // Ako je novi pobjednik određen, postavi ga
      if (winner) {
        // Prvo ukloni sve timove iz play-off grupe koji su možda već u grupi
        const playoffTeams = playoffsData.playoffs[playoffId]?.teams || [];
        for (const playoffTeamId of playoffTeams) {
          if (playoffTeamId !== winner) {
            const teamIndexInGroup = group.teams.indexOf(playoffTeamId);
            if (teamIndexInGroup !== -1) {
              group.teams[teamIndexInGroup] = null;
              // Ažuriraj status tima
              const teamIndex = teamsData.teams.findIndex(t => t.id === playoffTeamId);
              if (teamIndex !== -1) {
                teamsData.teams[teamIndex].qualified = false;
                teamsData.teams[teamIndex].group = undefined;
              }
            }
          }
        }

        // Sada postavi novog pobjednika
        const nullIndex = group.teams.indexOf(null);
        if (nullIndex !== -1) {
          group.teams[nullIndex] = winner;
        }
        // Ažuriraj status ekipe kao kvalificirane
        const teamIndex = teamsData.teams.findIndex(t => t.id === winner);
        if (teamIndex !== -1) {
          teamsData.teams[teamIndex].qualified = true;
          // Pronađi grupu
          for (const [gKey, g] of Object.entries(groupsData.groups)) {
            if (g.teams.includes(winner)) {
              teamsData.teams[teamIndex].group = gKey;
              break;
            }
          }
        }
      }
    }
  }

  // Spremi sve
  writeJsonFile('playoffs.json', playoffsData);
  writeJsonFile('groups.json', groupsData);
  writeJsonFile('teams.json', teamsData);

  // Ponovno izračunaj tablice
  recalculateStandings();

  return { ok: true };
}

// Ruta: admin ručno postavi/ukloni pobjednika play-offa (override)
app.put('/api/playoffs/:id/winner', authMiddleware, (req, res) => {
  const playoffId = req.params.id;
  const { winner } = req.body;
  const result = applyPlayoffWinner(playoffId, winner);
  if (!result.ok) return res.status(result.status).json({ error: result.error });
  res.json({ success: true, winner: winner || null, playoffId });
});

// Izračunaj scenarije prolaza po timu: enumerira sve ishode preostalih utakmica
// grupe (P/N/Poraz) uz FIFA 2026 poredak (međusobni susret prvi) i određuje:
//  - eliminated: ne može u top 3 ni u jednom scenariju
//  - qualification: { status: 'secured'|'possible'|'eliminated', summary, outcomes }
// Granice ranga: bestRank (optimistično za tim na izjednačenom H2H), worstRank
// (pesimistično). "Sigurno" koristi worstRank, "moguće" koristi bestRank.
function computeScenarios(standings, matchesData, groupsData, playoffsData) {
  const getPlayoffWinner = (id) =>
    (playoffsData && playoffsData.playoffs && playoffsData.playoffs[id] && playoffsData.playoffs[id].winner) || null;

  for (const [groupKey, group] of Object.entries(standings)) {
    const teamIds = group.teams.map((t) => t.id);
    const nameOf = (id) => { const t = group.teams.find((x) => x.id === id); return t ? t.name : id; };
    group.teams.forEach((t) => { t.eliminated = false; t.qualification = { status: 'possible', summary: '' }; });
    if (teamIds.length < 4) continue;

    const gMatches = matchesData.groupStage.filter((m) => m.group === groupKey);
    const concrete = new Set();
    gMatches.forEach((m) => { if (m.homeTeam) concrete.add(m.homeTeam); if (m.awayTeam) concrete.add(m.awayTeam); });
    const missing = teamIds.filter((id) => !concrete.has(id));
    const slotTeam = missing.length === 1 ? missing[0] : null;
    const resolve = (id, po) => id || getPlayoffWinner(po) || slotTeam || null;

    const matches = gMatches
      .map((m) => ({
        home: resolve(m.homeTeam, m.homeTeamPlayoff),
        away: resolve(m.awayTeam, m.awayTeamPlayoff),
        played: m.played && m.homeScore != null && m.awayScore != null,
        result: m.homeScore > m.awayScore ? 'H' : m.awayScore > m.homeScore ? 'A' : 'D'
      }))
      .filter((m) => m.home && m.away && m.home !== m.away &&
        teamIds.includes(m.home) && teamIds.includes(m.away));

    const playedMatches = matches.filter((m) => m.played);
    const remaining = matches.filter((m) => !m.played);

    // Gotova grupa -> egzaktan poredak (tablica je već sortirana po 2026 pravilima).
    // Bez ovoga, kod izjednačenih bodova pesimistična procjena GR krivo bi spriječila "osiguran".
    if (remaining.length === 0) {
      group.teams.forEach((t, idx) => {
        t.eliminated = idx === 3;
        t.qualification = {
          status: idx < 2 ? 'secured' : idx === 2 ? 'possible' : 'eliminated',
          summary: idx < 2
            ? 'Osiguran prolaz (među prva 2).'
            : idx === 2
              ? 'Završio kao 3. — prolaz ovisi o ostalim trećeplasiranima.'
              : 'Ispao iz natjecanja.',
          outcomes: null
        };
      });
      continue;
    }

    const award = (pts, m, res) => {
      if (res === 'H') pts[m.home] += 3;
      else if (res === 'A') pts[m.away] += 3;
      else { pts[m.home] += 1; pts[m.away] += 1; }
    };
    const basePts = {};
    teamIds.forEach((id) => { basePts[id] = 0; });
    playedMatches.forEach((m) => award(basePts, m, m.result));

    // Preostala utakmica tima (za scenarije po ishodu) - tipično jedna
    const ownRemaining = {};
    teamIds.forEach((id) => { ownRemaining[id] = remaining.filter((m) => m.home === id || m.away === id); });

    // Akumulatori po timu
    const acc = {};
    teamIds.forEach((id) => {
      acc[id] = {
        everTop2: false, alwaysTop2: true, everTop3: false, alwaysTop3: true,
        byOutcome: { W: null, D: null, L: null } // { maxWorst, minBest } po vlastitom ishodu
      };
    });

    const n = remaining.length;
    const combos = Math.pow(3, n);
    for (let c = 0; c < combos; c++) {
      const pts = { ...basePts };
      const results = playedMatches.map((m) => ({ home: m.home, away: m.away, result: m.result }));
      const remRes = [];
      let cc = c;
      for (let k = 0; k < n; k++) {
        const o = cc % 3; cc = Math.floor(cc / 3);
        const res = o === 0 ? 'H' : o === 1 ? 'A' : 'D';
        const m = remaining[k];
        results.push({ home: m.home, away: m.away, result: res });
        remRes[k] = res;
        award(pts, m, res);
      }

      for (const T of teamIds) {
        const tied = teamIds.filter((x) => pts[x] === pts[T]);
        const h2h = {};
        tied.forEach((x) => { h2h[x] = 0; });
        if (tied.length > 1) {
          results.forEach((r) => { if (tied.includes(r.home) && tied.includes(r.away)) award(h2h, r, r.result); });
        }
        let guaranteedAbove = 0, possibleAbove = 0;
        for (const X of teamIds) {
          if (X === T) continue;
          if (pts[X] > pts[T]) { guaranteedAbove++; possibleAbove++; }
          else if (pts[X] === pts[T]) {
            if (h2h[X] > h2h[T]) { guaranteedAbove++; possibleAbove++; }
            else if (h2h[X] === h2h[T]) { possibleAbove++; } // izjednačen H2H -> moguće iznad po golovima
          }
        }
        const bestRank = guaranteedAbove + 1;
        const worstRank = possibleAbove + 1;

        const a = acc[T];
        if (bestRank <= 2) a.everTop2 = true;
        if (worstRank > 2) a.alwaysTop2 = false;
        if (bestRank <= 3) a.everTop3 = true;
        if (worstRank > 3) a.alwaysTop3 = false;

        // Scenarij po vlastitom ishodu (samo ako tim ima točno 1 preostalu)
        if (ownRemaining[T].length === 1) {
          const idx = remaining.indexOf(ownRemaining[T][0]);
          const r = remRes[idx];
          const m = remaining[idx];
          const outcome = r === 'D' ? 'D' : ((r === 'H') === (m.home === T) ? 'W' : 'L');
          const slot = a.byOutcome[outcome] || { maxWorst: 0, minBest: 99 };
          slot.maxWorst = Math.max(slot.maxWorst, worstRank);
          slot.minBest = Math.min(slot.minBest, bestRank);
          a.byOutcome[outcome] = slot;
        }
      }
    }

    // Pretvori akumulatore u status + tekst
    for (const t of group.teams) {
      const a = acc[t.id];
      const eliminated = !a.everTop3;
      t.eliminated = eliminated;

      let status = 'possible';
      if (eliminated) status = 'eliminated';
      else if (a.alwaysTop2) status = 'secured';

      const q = { status, summary: '', outcomes: null };

      if (status === 'eliminated') {
        q.summary = 'Ispao iz natjecanja.';
      } else if (status === 'secured') {
        q.summary = 'Osiguran prolaz (među prva 2).';
      } else if (ownRemaining[t.id].length === 1) {
        const opp = (() => { const m = ownRemaining[t.id][0]; return nameOf(m.home === t.id ? m.away : m.home); })();
        const classify = (o) => {
          if (!o) return null;
          if (o.maxWorst <= 2) return 'secures2';
          if (o.minBest <= 2) return 'maybe2';
          if (o.maxWorst <= 3) return 'secures3';
          if (o.minBest <= 3) return 'maybe3';
          return 'no';
        };
        const W = classify(a.byOutcome.W), D = classify(a.byOutcome.D), L = classify(a.byOutcome.L);
        const phrase = {
          secures2: 'osigurava prolaz', maybe2: 'moguć prolaz (ovisi o ostalima)',
          secures3: 'osigurava barem borbu za trećeplasirane', maybe3: 'moguće 3. mjesto (ovisi o ostalima)',
          no: 'nije dovoljno'
        };
        q.outcomes = {
          opponent: opp,
          win: W ? phrase[W] : null,
          draw: D ? phrase[D] : null,
          loss: L ? phrase[L] : null
        };
        // Sažetak: najmanji dovoljan rezultat
        if (L === 'secures2') q.summary = `Već praktički osiguran — i poraz drži prolaz.`;
        else if (D === 'secures2') q.summary = `Remi protiv ${opp} je dovoljan za prolaz.`;
        else if (W === 'secures2') q.summary = `Pobjeda protiv ${opp} osigurava prolaz.`;
        else if (D === 'secures3') q.summary = `Remi protiv ${opp} drži u borbi za trećeplasirane.`;
        else if (W === 'secures3') q.summary = `Pobjedom protiv ${opp} ulazi u borbu za trećeplasirane.`;
        else if (W === 'maybe2') q.summary = `Treba pobjeda protiv ${opp} + povoljni ostali rezultati.`;
        else if (W === 'maybe3') q.summary = `Treba pobjeda protiv ${opp} i pomoć sa strane.`;
        else q.summary = 'Vrlo male šanse za prolaz.';
      } else if (ownRemaining[t.id].length === 0) {
        q.summary = 'Sve odigrano — prolaz ovisi o ostalim utakmicama i skupinama.';
      } else {
        q.summary = 'Prolaz je još otvoren (više utakmica preostalo).';
      }

      t.qualification = q;
    }
  }
}

// Monte Carlo procjena šanse za prolaz (%) po timu. Egzaktna enumeracija svih
// preostalih utakmica nije izvediva (previše kombinacija), pa simuliramo N
// slučajnih ishoda (golovi ~ blaga Poissonova razdioba, bez težinjenja po jakosti)
// i brojimo u koliko sim. tim prođe (top 2 ili među 8 najboljih trećih).
function computeAdvanceChances(standings, matchesData, groupsData, playoffsData, sims = 10000) {
  const getPW = (id) =>
    (playoffsData && playoffsData.playoffs && playoffsData.playoffs[id] && playoffsData.playoffs[id].winner) || null;

  // Pripremi po grupi: timovi, odigrane (sa stvarnim golovima), preostale (h/a)
  const groupsPrep = [];
  for (const [g, group] of Object.entries(standings)) {
    const teamIds = group.teams.map((t) => t.id);
    if (teamIds.length < 4) { groupsPrep.push(null); continue; }
    const gm = matchesData.groupStage.filter((m) => m.group === g);
    const concrete = new Set();
    gm.forEach((m) => { if (m.homeTeam) concrete.add(m.homeTeam); if (m.awayTeam) concrete.add(m.awayTeam); });
    const missing = teamIds.filter((id) => !concrete.has(id));
    const slot = missing.length === 1 ? missing[0] : null;
    const res = (id, po) => id || getPW(po) || slot || null;
    const played = [], remaining = [];
    gm.forEach((m) => {
      const h = res(m.homeTeam, m.homeTeamPlayoff), a = res(m.awayTeam, m.awayTeamPlayoff);
      if (!h || !a || !teamIds.includes(h) || !teamIds.includes(a)) return;
      if (m.played && m.homeScore != null && m.awayScore != null) played.push({ h, a, hg: m.homeScore, ag: m.awayScore });
      else remaining.push({ h, a });
    });
    groupsPrep.push({ key: g, teamIds, played, remaining });
  }

  // Slučajni golovi: ~Poisson(1.3)
  const goalW = [0.27, 0.35, 0.23, 0.10, 0.04, 0.01];
  const randGoals = () => { let r = Math.random(), s = 0; for (let i = 0; i < goalW.length; i++) { s += goalW[i]; if (r < s) return i; } return 0; };

  // Poredaj timove grupe (2026: bodovi -> H2H[pts,gd,gf] -> ukupno gd, gf)
  const orderGroup = (teamIds, stat, results) => {
    const arr = teamIds.map((id) => ({ id, ...stat[id], gd: stat[id].gf - stat[id].ga }));
    arr.sort((a, b) => b.pts - a.pts);
    const out = [];
    let i = 0;
    while (i < arr.length) {
      let j = i + 1;
      while (j < arr.length && arr[j].pts === arr[i].pts) j++;
      const cluster = arr.slice(i, j);
      if (cluster.length > 1) {
        const ids = new Set(cluster.map((t) => t.id));
        const h = {}; cluster.forEach((t) => { h[t.id] = { pts: 0, gf: 0, ga: 0 }; });
        results.forEach((r) => {
          if (ids.has(r.h) && ids.has(r.a)) {
            h[r.h].gf += r.hg; h[r.h].ga += r.ag; h[r.a].gf += r.ag; h[r.a].ga += r.hg;
            if (r.hg > r.ag) h[r.h].pts += 3; else if (r.ag > r.hg) h[r.a].pts += 3; else { h[r.h].pts++; h[r.a].pts++; }
          }
        });
        cluster.sort((a, b) =>
          h[b.id].pts - h[a.id].pts ||
          (h[b.id].gf - h[b.id].ga) - (h[a.id].gf - h[a.id].ga) ||
          h[b.id].gf - h[a.id].gf ||
          b.gd - a.gd || b.gf - a.gf
        );
      }
      out.push(...cluster);
      i = j;
    }
    return out;
  };

  const advCount = {};
  for (const g of groupsPrep) if (g) g.teamIds.forEach((id) => { advCount[id] = 0; });

  for (let s = 0; s < sims; s++) {
    const thirds = [];
    for (const gp of groupsPrep) {
      if (!gp) continue;
      const stat = {}; gp.teamIds.forEach((id) => { stat[id] = { pts: 0, gf: 0, ga: 0 }; });
      const results = [];
      const apply = (h, a, hg, ag) => {
        stat[h].gf += hg; stat[h].ga += ag; stat[a].gf += ag; stat[a].ga += hg;
        if (hg > ag) stat[h].pts += 3; else if (ag > hg) stat[a].pts += 3; else { stat[h].pts++; stat[a].pts++; }
        results.push({ h, a, hg, ag });
      };
      gp.played.forEach((m) => apply(m.h, m.a, m.hg, m.ag));
      gp.remaining.forEach((m) => apply(m.h, m.a, randGoals(), randGoals()));
      const ord = orderGroup(gp.teamIds, stat, results);
      advCount[ord[0].id]++; advCount[ord[1].id]++; // top 2 prolaze
      const t = ord[2];
      thirds.push({ id: t.id, pts: t.pts, gd: t.gf - t.ga, gf: t.gf });
    }
    thirds.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
    for (let k = 0; k < Math.min(8, thirds.length); k++) advCount[thirds[k].id]++;
  }

  for (const group of Object.values(standings)) {
    group.teams.forEach((t) => {
      t.advanceChance = advCount[t.id] != null ? Math.round((advCount[t.id] / sims) * 100) : null;
    });
  }
}

// Rangiraj sve trećeplasirane (1 = najbolji ... 12 = najlošiji) po istim
// kriterijima kao najbolji trećeplasirani (bodovi -> gol-razlika -> golovi).
function computeThirdPlaceRanks(standings) {
  const thirds = [];
  for (const group of Object.values(standings)) {
    group.teams.forEach((t, i) => {
      delete t.thirdRank;
      delete t.thirdTotal;
      if (i === 2) thirds.push(t);
    });
  }
  thirds.sort((a, b) =>
    b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor
  );
  thirds.forEach((t, i) => { t.thirdRank = i + 1; t.thirdTotal = thirds.length; });
}

function recalculateStandings() {
  const matchesData = readJsonFile('matches.json');
  const groupsData = readJsonFile('groups.json');
  const teamsData = readJsonFile('teams.json');

  if (!matchesData || !groupsData || !teamsData) return;

  const standings = {};

  // Inicijaliziraj tablice za svaku grupu (uz očuvanje izvornog poretka u grupi)
  for (const [groupKey, group] of Object.entries(groupsData.groups)) {
    standings[groupKey] = {
      name: group.name,
      teams: group.teams.filter(t => t !== null).map((teamId, indexInGroup) => {
        const team = teamsData.teams.find(t => t.id === teamId);
        return {
          id: teamId,
          name: team ? team.name : teamId,
          code: team ? team.code : '',
          order: indexInGroup, // očuvaj izvorni raspored
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
          highlight: team ? team.highlight : false
        };
      })
    };
  }

  // Učitaj play-off pobjednike
  const playoffsData = readJsonFile('playoffs.json');
  const getPlayoffWinner = (playoffId) => {
    if (!playoffsData || !playoffsData.playoffs || !playoffsData.playoffs[playoffId]) return null;
    return playoffsData.playoffs[playoffId].winner || null;
  };

  // Izračunaj rezultate iz odigranih utakmica
  for (const match of matchesData.groupStage) {
    // Provjeri je li utakmica odigrana (ima rezultate ili je označena kao played)
    const hasScore = match.homeScore !== null && match.awayScore !== null;
    const isPlayed = match.played === true;

    if (!hasScore && !isPlayed) continue;
    if (!match.group) continue;

    // Odredi stvarne timove (uzmi play-off pobjednike ako postoje)
    let homeTeamId = match.homeTeam;
    let awayTeamId = match.awayTeam;

    if (!homeTeamId && match.homeTeamPlayoff) {
      homeTeamId = getPlayoffWinner(match.homeTeamPlayoff);
    }
    if (!awayTeamId && match.awayTeamPlayoff) {
      awayTeamId = getPlayoffWinner(match.awayTeamPlayoff);
    }

    // Ako još uvijek nemamo oba tima, preskoči
    if (!homeTeamId || !awayTeamId) continue;

    const group = standings[match.group];
    if (!group) continue;

    // Provjeri da li su oba tima još uvijek u grupi (nije null)
    const groupData = groupsData.groups[match.group];
    if (!groupData) continue;

    const homeTeamInGroup = groupData.teams.includes(homeTeamId);
    const awayTeamInGroup = groupData.teams.includes(awayTeamId);

    // Ako tim više nije u grupi, preskoči ovu utakmicu
    if (!homeTeamInGroup || !awayTeamInGroup) continue;

    const homeTeam = group.teams.find(t => t.id === homeTeamId);
    const awayTeam = group.teams.find(t => t.id === awayTeamId);

    if (!homeTeam || !awayTeam) continue;

    homeTeam.played++;
    awayTeam.played++;

    homeTeam.goalsFor += match.homeScore;
    homeTeam.goalsAgainst += match.awayScore;
    awayTeam.goalsFor += match.awayScore;
    awayTeam.goalsAgainst += match.homeScore;

    if (match.homeScore > match.awayScore) {
      homeTeam.won++;
      homeTeam.points += 3;
      awayTeam.lost++;
    } else if (match.homeScore < match.awayScore) {
      awayTeam.won++;
      awayTeam.points += 3;
      homeTeam.lost++;
    } else {
      homeTeam.drawn++;
      awayTeam.drawn++;
      homeTeam.points++;
      awayTeam.points++;
    }
  }

  // Izračunaj gol-razliku i sortiraj
  for (const [groupKey, group] of Object.entries(standings)) {
    for (const team of group.teams) {
      team.goalDifference = team.goalsFor - team.goalsAgainst;
    }

    // Funkcija za izračun head-to-head mini-tablice
    const calculateHeadToHead = (tiedTeams) => {
      if (tiedTeams.length < 2) return tiedTeams;

      // Kreiraj mini-tablicu za izjednačene timove
      const miniStandings = {};
      tiedTeams.forEach(team => {
        miniStandings[team.id] = {
          id: team.id,
          points: 0,
          goalDifference: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          originalTeam: team
        };
      });

      // Pronađi sve utakmice između izjednačenih timova
      const tiedTeamIds = new Set(tiedTeams.map(t => t.id));
      const validMatches = matchesData.groupStage.filter(m => {
        if (m.group !== groupKey) return false;
        if (m.homeScore === null || m.awayScore === null) return false;

        // Riješi play-off pobjednike
        let homeId = m.homeTeam;
        if (!homeId && m.homeTeamPlayoff) {
          homeId = getPlayoffWinner(m.homeTeamPlayoff);
        }
        let awayId = m.awayTeam;
        if (!awayId && m.awayTeamPlayoff) {
          awayId = getPlayoffWinner(m.awayTeamPlayoff);
        }

        // Provjeri da li su oba tima u izjednačenoj grupi
        return homeId && awayId && tiedTeamIds.has(homeId) && tiedTeamIds.has(awayId);
      });

      // Izračunaj rezultate za mini-tablicu
      for (const match of validMatches) {
        let homeId = match.homeTeam;
        let awayId = match.awayTeam;

        if (!homeId && match.homeTeamPlayoff) {
          homeId = getPlayoffWinner(match.homeTeamPlayoff);
        }
        if (!awayId && match.awayTeamPlayoff) {
          awayId = getPlayoffWinner(match.awayTeamPlayoff);
        }

        if (!homeId || !awayId) continue;
        if (!miniStandings[homeId] || !miniStandings[awayId]) continue;

        const homeMini = miniStandings[homeId];
        const awayMini = miniStandings[awayId];

        homeMini.goalsFor += match.homeScore;
        homeMini.goalsAgainst += match.awayScore;
        awayMini.goalsFor += match.awayScore;
        awayMini.goalsAgainst += match.homeScore;

        if (match.homeScore > match.awayScore) {
          homeMini.points += 3;
        } else if (match.homeScore < match.awayScore) {
          awayMini.points += 3;
        } else {
          homeMini.points += 1;
          awayMini.points += 1;
        }
      }

      // Izračunaj gol-razliku za mini-tablicu
      Object.values(miniStandings).forEach(mini => {
        mini.goalDifference = mini.goalsFor - mini.goalsAgainst;
      });

      // Sortiraj mini-tablicu po FIFA 2026 redoslijedu:
      // 1-3 međusobni susret (bodovi, gol-razlika, golovi),
      // 4-5 ukupna gol-razlika pa ukupni golovi (fallback ako je H2H izjednačen)
      const sortedMini = Object.values(miniStandings).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
        const ao = a.originalTeam, bo = b.originalTeam;
        if (bo.goalDifference !== ao.goalDifference) return bo.goalDifference - ao.goalDifference;
        if (bo.goalsFor !== ao.goalsFor) return bo.goalsFor - ao.goalsFor;
        return 0;
      });

      return sortedMini.map(mini => mini.originalTeam);
    };

    // Bazni poredak po bodovima (unutar istih bodova H2H odlučuje niže)
    group.teams.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return 0;
    });

    // Pronađi grupe izjednačenih timova i primijeni head-to-head
    const sortedTeams = [];
    let i = 0;

    while (i < group.teams.length) {
      const currentTeam = group.teams[i];
      const tiedGroup = [currentTeam];

      // Izjednačeni su svi s istim brojem BODOVA (H2H presuđuje među njima)
      let j = i + 1;
      while (j < group.teams.length) {
        const nextTeam = group.teams[j];
        if (nextTeam.points === currentTeam.points) {
          tiedGroup.push(nextTeam);
          j++;
        } else {
          break;
        }
      }

      // Ako su timovi izjednačeni na bodovima, primijeni head-to-head (2026)
      if (tiedGroup.length > 1) {
        const headToHeadSorted = calculateHeadToHead(tiedGroup);
        sortedTeams.push(...headToHeadSorted);
      } else {
        sortedTeams.push(currentTeam);
      }

      i = j;
    }

    group.teams = sortedTeams;
  }

  // Izračunaj scenarije prolaza i eliminacije (uz FIFA 2026 tiebreakere)
  computeScenarios(standings, matchesData, groupsData, playoffsData);

  // Rangiraj trećeplasirane (badge u tablici)
  computeThirdPlaceRanks(standings);

  // Monte Carlo procjena šanse za prolaz (%)
  computeAdvanceChances(standings, matchesData, groupsData, playoffsData);

  writeJsonFile('standings.json', { standings });

  // Ažuriraj knockout parove nakon izračuna tablica
  updateKnockoutPairs(standings);
}

// Funkcija za automatsko popunjavanje knockout parova
function updateKnockoutPairs(standings) {
  const matchesData = readJsonFile('matches.json');
  const groupsData = readJsonFile('groups.json');
  const playoffsData = readJsonFile('playoffs.json');
  if (!matchesData || !standings) return;

  // Provjeri da li postoje odigrane grupne utakmice
  const playedGroupMatches = matchesData.groupStage.filter(m =>
    m.played && m.homeScore !== null && m.awayScore !== null
  );

  // Ako nema odigranih utakmica, resetiraj sve knockout utakmice
  if (playedGroupMatches.length === 0) {
    // Resetiraj roundOf32
    if (matchesData.knockoutStage && matchesData.knockoutStage.roundOf32) {
      matchesData.knockoutStage.roundOf32.forEach(match => {
        match.homeTeam = null;
        match.awayTeam = null;
        match.homeScore = null;
        match.awayScore = null;
        match.played = false;
        delete match.homeTeamPlayoff;
        delete match.awayTeamPlayoff;
      });
    }

    // Resetiraj sve daljnje runde
    const roundsToReset = ['roundOf16', 'quarterFinals', 'semiFinals'];
    roundsToReset.forEach(roundKey => {
      if (matchesData.knockoutStage[roundKey]) {
        matchesData.knockoutStage[roundKey].forEach(match => {
          match.homeTeam = null;
          match.awayTeam = null;
          match.homeScore = null;
          match.awayScore = null;
          match.played = false;
        });
      }
    });

    // Resetiraj thirdPlace i final
    if (matchesData.knockoutStage.thirdPlace) {
      matchesData.knockoutStage.thirdPlace.homeTeam = null;
      matchesData.knockoutStage.thirdPlace.awayTeam = null;
      matchesData.knockoutStage.thirdPlace.homeScore = null;
      matchesData.knockoutStage.thirdPlace.awayScore = null;
      matchesData.knockoutStage.thirdPlace.played = false;
    }

    if (matchesData.knockoutStage.final) {
      matchesData.knockoutStage.final.homeTeam = null;
      matchesData.knockoutStage.final.awayTeam = null;
      matchesData.knockoutStage.final.homeScore = null;
      matchesData.knockoutStage.final.awayScore = null;
      matchesData.knockoutStage.final.played = false;
    }

    // Spremi resetirane podatke
    writeJsonFile('matches.json', matchesData);
    return;
  }

  // Provjeri da li je grupa završena (sve utakmice odigrane)
  const isGroupFinished = (groupKey) => {
    const groupMatches = matchesData.groupStage.filter(m => m.group === groupKey);
    if (groupMatches.length === 0) return false;
    return groupMatches.every(m => m.played && m.homeScore !== null && m.awayScore !== null);
  };

  // Provjeri da li su sve grupe završene
  const areAllGroupsFinished = () => {
    return Object.keys(standings).every(key => isGroupFinished(key));
  };

  // Funkcija za dobivanje ekipe po poziciji u grupi
  const getTeamByPosition = (groupKey, position) => {
    // Vrati null ako grupa nije završena
    if (!isGroupFinished(groupKey)) return null;

    const group = standings[groupKey];
    if (!group || !group.teams[position - 1]) return null;
    return group.teams[position - 1].id;
  };

  // Funkcija za dobivanje play-off pobjednika
  const getPlayoffWinner = (playoffId) => {
    if (!playoffsData || !playoffsData.playoffs || !playoffsData.playoffs[playoffId]) return null;
    return playoffsData.playoffs[playoffId].winner || null;
  };

  // Funkcija za određivanje tima iz opisa (npr. "1A", "2B", "3C/D/E")
  const getTeamFromDescription = (desc) => {
    if (!desc) return null;

    // Provjeri je li play-off placeholder (npr. "W Play-Off D")
    if (desc.includes('Play-Off') || desc.includes('playoff')) {
      const playoffMatch = desc.match(/Play-Off\s*([A-D12])/i);
      if (playoffMatch) {
        const playoffId = playoffMatch[1];
        return getPlayoffWinner(playoffId);
      }
    }

    // Provjeri je li standardni format (npr. "1A", "2B")
    const match = desc.match(/^(\d+)([A-L])$/);
    if (match) {
      const [, pos, group] = match;
      return getTeamByPosition(group, parseInt(pos));
    }

    return null;
  };

  // Odredi 8 najboljih trećeplasiranih (samo ako su sve grupe završene)
  const thirdPlaced = areAllGroupsFinished() ? Object.entries(standings)
    .map(([groupKey, group]) => ({
      group: groupKey,
      team: group.teams[2], // trećeplasirani (index 2)
      ...group.teams[2]
    }))
    .filter(t => t.team) // ukloni prazne
    .sort((a, b) => {
      // Sortiraj po bodovima, gol-razlici, golovima
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return 0;
    })
    .slice(0, 8) : []; // uzmi 8 najboljih

  // Mapiranje trećeplasiranih po grupama
  const thirdPlaceMap = {};
  thirdPlaced.forEach((t, index) => {
    thirdPlaceMap[t.group] = t.team.id;
  });

  // Set za praćenje već korištenih trećeplasiranih timova
  const usedThirdPlaced = new Set();

  // Funkcija za određivanje trećeplasiranog iz više opcija
  // Prvo sortiraj opcije po kvaliteti (bodovi, gol-razlika, golovi), zatim uzmi prvi koji nije korišten
  const getBestThirdPlace = (groups) => {
    // Pronađi sve trećeplasirane iz traženih grupa
    const candidates = groups
      .map(groupKey => {
        if (thirdPlaceMap[groupKey]) {
          const team = thirdPlaced.find(t => t.group === groupKey);
          return team ? { group: groupKey, team: team.team, ...team } : null;
        }
        return null;
      })
      .filter(t => t !== null && !usedThirdPlaced.has(t.team.id));

    if (candidates.length === 0) return null;

    // Sortiraj po kvaliteti (bodovi, gol-razlika, golovi)
    candidates.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return 0;
    });

    // Uzmi najbolji koji nije korišten
    const best = candidates[0];
    if (best) {
      usedThirdPlaced.add(best.team.id);
      return best.team.id;
    }

    return null;
  };

  // Ažuriraj šesnaestinu finala (roundOf32)
  if (matchesData.knockoutStage && matchesData.knockoutStage.roundOf32) {
    // Resetiraj set za korištene trećeplasirane za svaku izvršnu rundu
    usedThirdPlaced.clear();

    matchesData.knockoutStage.roundOf32.forEach(match => {
      if (!match.description) return;

      // Parsiraj opis (npr. "1A vs 3C/D/E")
      const desc = match.description.trim();
      const parts = desc.split(' vs ');

      if (parts.length === 2) {
        // Domaćin
        const homeMatch = parts[0].trim();
        let homeTeamId = null;

        // Provjeri je li trećeplasirani s više opcija (npr. "3A/B/C/D/F")
        if (homeMatch.startsWith('3') && homeMatch.includes('/')) {
          const groups = homeMatch.replace('3', '').split('/').filter(g => g);
          homeTeamId = getBestThirdPlace(groups);
        } else if (homeMatch.match(/^3([A-L])$/)) {
          // Trećeplasirani iz jedne grupe
          const group = homeMatch.replace('3', '');
          if (thirdPlaceMap[group] && !usedThirdPlaced.has(thirdPlaceMap[group])) {
            usedThirdPlaced.add(thirdPlaceMap[group]);
            homeTeamId = thirdPlaceMap[group];
          }
        } else if (homeMatch.match(/^(\d+)([A-L])$/)) {
          const [, pos, group] = homeMatch.match(/^(\d+)([A-L])$/);
          homeTeamId = getTeamByPosition(group, parseInt(pos));
        }

        // Ažuriraj ili resetiraj homeTeam
        if (homeTeamId) {
          match.homeTeam = homeTeamId;
          delete match.homeTeamPlayoff;
        } else {
          // Ako tim nije dostupan, resetiraj
          match.homeTeam = null;
        }

        // Gost
        const awayMatch = parts[1].trim();
        let awayTeamId = null;

        // Provjeri je li trećeplasirani s više opcija (npr. "3A/B/C/D/F")
        if (awayMatch.startsWith('3') && awayMatch.includes('/')) {
          const groups = awayMatch.replace('3', '').split('/').filter(g => g);
          awayTeamId = getBestThirdPlace(groups);
        } else if (awayMatch.match(/^3([A-L])$/)) {
          // Trećeplasirani iz jedne grupe
          const group = awayMatch.replace('3', '');
          if (thirdPlaceMap[group] && !usedThirdPlaced.has(thirdPlaceMap[group])) {
            usedThirdPlaced.add(thirdPlaceMap[group]);
            awayTeamId = thirdPlaceMap[group];
          }
        } else if (awayMatch.match(/^(\d+)([A-L])$/)) {
          const [, pos, group] = awayMatch.match(/^(\d+)([A-L])$/);
          awayTeamId = getTeamByPosition(group, parseInt(pos));
        }

        // Ažuriraj ili resetiraj awayTeam
        if (awayTeamId) {
          match.awayTeam = awayTeamId;
          delete match.awayTeamPlayoff;
        } else {
          // Ako tim nije dostupan, resetiraj
          match.awayTeam = null;
        }

        // Resetiraj rezultate ako timovi nisu dostupni
        if (!homeTeamId || !awayTeamId) {
          match.homeScore = null;
          match.awayScore = null;
          match.played = false;
        }
      }
    });
  }

  // Ažuriraj daljnje runde na temelju pobjednika
  updateKnockoutWinners(matchesData);

  // Spremi ažurirane podatke
  if (writeJsonFile('matches.json', matchesData)) {
    console.log('updateKnockoutPairs: Ažurirani knockout parovi spremljeni');
  } else {
    console.log('updateKnockoutPairs: Greška pri spremanju');
  }
}

// Funkcija za ažuriranje daljnjih rundi na temelju pobjednika
function updateKnockoutWinners(matchesData) {
  if (!matchesData) return;

  // Funkcija za određivanje pobjednika utakmice
  const getWinner = (match) => {
    // Provjeri ima li rezultate
    if (match.homeScore === null || match.awayScore === null) return null;
    // Provjeri ima li oba tima
    if (!match.homeTeam || !match.awayTeam) return null;

    // Odredi pobjednika regularnog dijela
    if (match.homeScore > match.awayScore) return match.homeTeam;
    if (match.awayScore > match.homeScore) return match.awayTeam;

    // Ako je neriješeno, provjeri penale
    if (match.homeScore === match.awayScore) {
      if (match.homePenalty !== null && match.awayPenalty !== null) {
        if (match.homePenalty > match.awayPenalty) return match.homeTeam;
        if (match.awayPenalty > match.homePenalty) return match.awayTeam;
      }
    }

    return null; // neriješeno i bez penala (ili neriješeni penali, što je nemoguće u nogometu ali za svaki slučaj)
  };

  // Funkcija za pronalaženje utakmice po matchCode
  const findMatchByCode = (code) => {
    // Pretraži u groupStage
    let match = matchesData.groupStage.find(m => m.matchCode === code);
    if (match) return match;

    // Pretraži u knockoutStage
    for (const round of Object.values(matchesData.knockoutStage)) {
      if (Array.isArray(round)) {
        match = round.find(m => m.matchCode === code);
        if (match) return match;
      }
    }
    return null;
  };

  // Ažuriraj osminu finala (roundOf16)
  if (matchesData.knockoutStage.roundOf16) {
    matchesData.knockoutStage.roundOf16.forEach(match => {
      if (!match.description) return;
      const desc = match.description.trim();
      const matchResult = desc.match(/^W(\d+)\s+vs\s+W(\d+)$/);
      if (matchResult) {
        const [, match1Code, match2Code] = matchResult;
        const prevMatch1 = findMatchByCode(`M${match1Code}`);
        const prevMatch2 = findMatchByCode(`M${match2Code}`);

        const winner1 = prevMatch1 ? getWinner(prevMatch1) : null;
        const winner2 = prevMatch2 ? getWinner(prevMatch2) : null;

        if (winner1) {
          match.homeTeam = winner1;
        } else {
          match.homeTeam = null;
        }

        if (winner2) {
          match.awayTeam = winner2;
        } else {
          match.awayTeam = null;
        }

        // Resetiraj rezultate ako pobjednici nisu dostupni
        if (!winner1 || !winner2) {
          match.homeScore = null;
          match.awayScore = null;
          match.played = false;
        }
      }
    });
  }

  // Ažuriraj četvrtfinale
  if (matchesData.knockoutStage.quarterFinals) {
    matchesData.knockoutStage.quarterFinals.forEach(match => {
      if (!match.description) return;
      const desc = match.description.trim();
      const matchResult = desc.match(/^W(\d+)\s+vs\s+W(\d+)$/);
      if (matchResult) {
        const [, match1Code, match2Code] = matchResult;
        const prevMatch1 = findMatchByCode(`M${match1Code}`);
        const prevMatch2 = findMatchByCode(`M${match2Code}`);

        const winner1 = prevMatch1 ? getWinner(prevMatch1) : null;
        const winner2 = prevMatch2 ? getWinner(prevMatch2) : null;

        if (winner1) {
          match.homeTeam = winner1;
        } else {
          match.homeTeam = null;
        }

        if (winner2) {
          match.awayTeam = winner2;
        } else {
          match.awayTeam = null;
        }

        // Resetiraj rezultate ako pobjednici nisu dostupni
        if (!winner1 || !winner2) {
          match.homeScore = null;
          match.awayScore = null;
          match.played = false;
        }
      }
    });
  }

  // Ažuriraj polufinale
  if (matchesData.knockoutStage.semiFinals) {
    matchesData.knockoutStage.semiFinals.forEach(match => {
      if (!match.description) return;
      const desc = match.description.trim();
      const matchResult = desc.match(/^W(\d+)\s+vs\s+W(\d+)$/);
      if (matchResult) {
        const [, match1Code, match2Code] = matchResult;
        const prevMatch1 = findMatchByCode(`M${match1Code}`);
        const prevMatch2 = findMatchByCode(`M${match2Code}`);

        const winner1 = prevMatch1 ? getWinner(prevMatch1) : null;
        const winner2 = prevMatch2 ? getWinner(prevMatch2) : null;

        if (winner1) {
          match.homeTeam = winner1;
        } else {
          match.homeTeam = null;
        }

        if (winner2) {
          match.awayTeam = winner2;
        } else {
          match.awayTeam = null;
        }

        // Resetiraj rezultate ako pobjednici nisu dostupni
        if (!winner1 || !winner2) {
          match.homeScore = null;
          match.awayScore = null;
          match.played = false;
        }
      }
    });
  }

  // Ažuriraj utakmicu za 3. mjesto (gubitnici polufinala)
  if (matchesData.knockoutStage.thirdPlace) {
    const thirdPlace = matchesData.knockoutStage.thirdPlace;
    if (thirdPlace.description && thirdPlace.description.includes('Loser')) {
      const desc = thirdPlace.description;
      const matches = desc.match(/Loser\s+M(\d+)/g);

      if (matches && matches.length >= 2) {
        const match1Code = matches[0].replace('Loser M', 'M');
        const match2Code = matches[1].replace('Loser M', 'M');
        const semi1 = matchesData.knockoutStage.semiFinals.find(m => m.matchCode === match1Code);
        const semi2 = matchesData.knockoutStage.semiFinals.find(m => m.matchCode === match2Code);

        let loser1 = null;
        let loser2 = null;

        if (semi1 && semi1.played && semi1.homeScore !== null && semi1.awayScore !== null) {
          loser1 = semi1.homeScore > semi1.awayScore ? semi1.awayTeam : semi1.homeTeam;
        }
        if (semi2 && semi2.played && semi2.homeScore !== null && semi2.awayScore !== null) {
          loser2 = semi2.homeScore > semi2.awayScore ? semi2.awayTeam : semi2.homeTeam;
        }

        if (loser1) {
          thirdPlace.homeTeam = loser1;
        } else {
          thirdPlace.homeTeam = null;
        }

        if (loser2) {
          thirdPlace.awayTeam = loser2;
        } else {
          thirdPlace.awayTeam = null;
        }

        // Resetiraj rezultate ako gubitnici nisu dostupni
        if (!loser1 || !loser2) {
          thirdPlace.homeScore = null;
          thirdPlace.awayScore = null;
          thirdPlace.played = false;
        }
      }
    }
  }

  // Ažuriraj finale (pobjednici polufinala)
  if (matchesData.knockoutStage.final) {
    const final = matchesData.knockoutStage.final;
    if (final.description && final.description.includes('Winner')) {
      const desc = final.description;
      const matches = desc.match(/Winner\s+M(\d+)/g);

      if (matches && matches.length >= 2) {
        const match1Code = matches[0].replace('Winner M', 'M');
        const match2Code = matches[1].replace('Winner M', 'M');
        const semi1 = matchesData.knockoutStage.semiFinals.find(m => m.matchCode === match1Code);
        const semi2 = matchesData.knockoutStage.semiFinals.find(m => m.matchCode === match2Code);

        let winner1 = null;
        let winner2 = null;

        if (semi1 && semi1.played && semi1.homeScore !== null && semi1.awayScore !== null) {
          winner1 = semi1.homeScore > semi1.awayScore ? semi1.homeTeam : semi1.awayTeam;
        }
        if (semi2 && semi2.played && semi2.homeScore !== null && semi2.awayScore !== null) {
          winner2 = semi2.homeScore > semi2.awayScore ? semi2.homeTeam : semi2.awayTeam;
        }

        if (winner1) {
          final.homeTeam = winner1;
        } else {
          final.homeTeam = null;
        }

        if (winner2) {
          final.awayTeam = winner2;
        } else {
          final.awayTeam = null;
        }

        // Resetiraj rezultate ako pobjednici nisu dostupni
        if (!winner1 || !winner2) {
          final.homeScore = null;
          final.awayScore = null;
          final.played = false;
        }
      }
    }
  }
}

// ============ LIVE SYNC (openfootball) ============
const LIVE_SYNC = process.env.LIVE_SYNC !== 'false';
const SYNC_INTERVAL = Math.max(60000, parseInt(process.env.LIVE_SYNC_INTERVAL_MS || '180000', 10));
let lastSync = null;

// Auto-razrješavanje play-off slotova iz openfootballa: tim koji se u izvoru
// pojavljuje u grupi, a nije među app-ovim konkretnim timovima te grupe, jest
// pobjednik pripadajućeg play-offa (ako je validan kandidat).
function autoResolvePlayoffs(source) {
  const playoffsData = readJsonFile('playoffs.json');
  const groupsData = readJsonFile('groups.json');
  if (!playoffsData || !groupsData || !Array.isArray(source.matches)) return [];

  const resolved = [];
  for (const [g, info] of Object.entries(groupsData.groups)) {
    const slot = info.playoffSlot;
    if (!slot || !playoffsData.playoffs[slot]) continue;
    if (playoffsData.playoffs[slot].winner) continue; // već razriješen

    const ofIds = new Set();
    source.matches
      .filter((m) => m.group && m.group.replace(/^group\s+/i, '').trim() === g)
      .forEach((m) => {
        const a = openfootball.idForName(m.team1);
        const b = openfootball.idForName(m.team2);
        if (a) ofIds.add(a);
        if (b) ofIds.add(b);
      });

    const concrete = new Set((info.teams || []).filter(Boolean));
    const candidateTeams = playoffsData.playoffs[slot].teams || [];
    const candidates = [...ofIds].filter((t) => !concrete.has(t) && candidateTeams.includes(t));

    if (candidates.length === 1) {
      const r = applyPlayoffWinner(slot, candidates[0]);
      if (r.ok) resolved.push(`${slot}=${candidates[0]}`);
    }
  }
  return resolved;
}

// Dohvati rezultate iz openfootballa, primijeni ih i preračunaj tablice
async function syncLiveResults() {
  try {
    const source = await openfootball.fetchSource();

    // Prvo razriješi play-off slotove (popuni grupe stvarnim timovima)
    const resolvedPlayoffs = autoResolvePlayoffs(source);
    if (resolvedPlayoffs.length) {
      console.log('🏟️ Auto play-off razriješen:', resolvedPlayoffs.join(', '));
    }

    const data = readJsonFile('matches.json');
    const groupsData = readJsonFile('groups.json'); // ponovno učitaj nakon eventualnog razrješavanja
    if (!data) return null;

    const stats = openfootball.applyResults(data, source, groupsData && groupsData.groups);
    if (stats.changed) {
      writeJsonFile('matches.json', data);
      recalculateStandings(); // ujedno ažurira i knockout parove
    }

    lastSync = { at: new Date().toISOString(), playoffsResolved: resolvedPlayoffs, ...stats };
    console.log(
      `🔄 Live sync: ${stats.changed ? stats.updated + ' ažurirano' : 'nema promjena'}` +
      ` (ručno preskočeno: ${stats.skipped}, pending: ${stats.pending.length})`
    );
    if (stats.unmatched.length) {
      console.warn('⚠️ Live sync nemapirano:', stats.unmatched.slice(0, 8));
    }
    return lastSync;
  } catch (err) {
    console.error('❌ Live sync greška:', err.message);
    return null;
  }
}

// Ručno pokretanje sinkronizacije (admin)
app.post('/api/sync', authMiddleware, async (req, res) => {
  const result = await syncLiveResults();
  if (result) res.json({ ok: true, ...result });
  else res.status(502).json({ ok: false, error: 'Sinkronizacija nije uspjela' });
});

// Status zadnje sinkronizacije
app.get('/api/sync/status', (req, res) => {
  res.json({
    enabled: LIVE_SYNC,
    intervalMs: SYNC_INTERVAL,
    source: openfootball.SOURCE_URL,
    last: lastSync
  });
});

// Inicijalno izračunaj tablice
recalculateStandings();

app.listen(PORT, () => {
  console.log(`🏆 FIFA 2026 Server pokrenut na http://localhost:${PORT}`);

  // Pokreni periodičnu sinkronizaciju rezultata
  if (LIVE_SYNC) {
    console.log(`🔄 Live sync uključen (svakih ${Math.round(SYNC_INTERVAL / 1000)}s, izvor: openfootball)`);
    syncLiveResults();
    setInterval(syncLiveResults, SYNC_INTERVAL);
  } else {
    console.log('🔄 Live sync isključen (LIVE_SYNC=false)');
  }
});

