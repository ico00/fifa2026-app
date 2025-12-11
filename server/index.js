const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

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

// Dohvati sve utakmice
app.get('/api/matches', (req, res) => {
  const data = readJsonFile('matches.json');
  res.json(data);
});

// Dohvati tablice grupa
app.get('/api/standings', (req, res) => {
  const data = readJsonFile('standings.json');
  res.json(data);
});

// ============ AŽURIRANJE PODATAKA ============

// Ažuriraj utakmicu (unos rezultata)
app.put('/api/matches/:id', (req, res) => {
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
  
  // Označi kao odigranu ako su uneseni rezultati
  if (homeScore !== null && awayScore !== null && homeScore !== undefined && awayScore !== undefined) {
    data.groupStage[matchIndex].played = true;
  }
  
  if (writeJsonFile('matches.json', data)) {
    // Ponovno izračunaj tablice
    recalculateStandings();
    res.json(data.groupStage[matchIndex]);
  } else {
    res.status(500).json({ error: 'Greška pri spremanju' });
  }
});

// Dodaj novu utakmicu
app.post('/api/matches', (req, res) => {
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
app.put('/api/playoffs/:id/winner', (req, res) => {
  const playoffId = req.params.id;
  const { winner } = req.body;
  
  const playoffsData = readJsonFile('playoffs.json');
  const groupsData = readJsonFile('groups.json');
  const teamsData = readJsonFile('teams.json');
  
  if (!playoffsData || !groupsData || !teamsData) {
    return res.status(500).json({ error: 'Greška pri čitanju podataka' });
  }
  
  if (!playoffsData.playoffs[playoffId]) {
    return res.status(404).json({ error: 'Play-off nije pronađen' });
  }
  
  // Postavi pobjednika
  playoffsData.playoffs[playoffId].winner = winner;
  
  // Ažuriraj grupu koja čeka ovog pobjednika
  for (const [groupKey, group] of Object.entries(groupsData.groups)) {
    if (group.playoffSlot === playoffId) {
      const nullIndex = group.teams.indexOf(null);
      if (nullIndex !== -1) {
        group.teams[nullIndex] = winner;
      }
    }
  }
  
  // Ažuriraj status ekipe kao kvalificirane
  const teamIndex = teamsData.teams.findIndex(t => t.id === winner);
  if (teamIndex !== -1) {
    teamsData.teams[teamIndex].qualified = true;
    // Pronađi grupu
    for (const [groupKey, group] of Object.entries(groupsData.groups)) {
      if (group.teams.includes(winner)) {
        teamsData.teams[teamIndex].group = groupKey;
        break;
      }
    }
  }
  
  // Spremi sve
  writeJsonFile('playoffs.json', playoffsData);
  writeJsonFile('groups.json', groupsData);
  writeJsonFile('teams.json', teamsData);
  
  // Ponovno izračunaj tablice
  recalculateStandings();
  
  res.json({ success: true, winner, playoffId });
});

// Funkcija za izračun tablica
function recalculateStandings() {
  const matchesData = readJsonFile('matches.json');
  const groupsData = readJsonFile('groups.json');
  const teamsData = readJsonFile('teams.json');
  
  if (!matchesData || !groupsData || !teamsData) return;
  
  const standings = {};
  
  // Inicijaliziraj tablice za svaku grupu
  for (const [groupKey, group] of Object.entries(groupsData.groups)) {
    standings[groupKey] = {
      name: group.name,
      teams: group.teams.filter(t => t !== null).map(teamId => {
        const team = teamsData.teams.find(t => t.id === teamId);
        return {
          id: teamId,
          name: team ? team.name : teamId,
          code: team ? team.code : '',
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
  
  // Izračunaj rezultate iz odigranih utakmica
  for (const match of matchesData.groupStage) {
    if (match.played && match.group && match.homeTeam && match.awayTeam) {
      const group = standings[match.group];
      if (!group) continue;
      
      const homeTeam = group.teams.find(t => t.id === match.homeTeam);
      const awayTeam = group.teams.find(t => t.id === match.awayTeam);
      
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
  }
  
  // Izračunaj gol-razliku i sortiraj
  for (const group of Object.values(standings)) {
    for (const team of group.teams) {
      team.goalDifference = team.goalsFor - team.goalsAgainst;
    }
    group.teams.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.name.localeCompare(b.name);
    });
  }
  
  writeJsonFile('standings.json', { standings });
}

// Inicijalno izračunaj tablice
recalculateStandings();

app.listen(PORT, () => {
  console.log(`🏆 FIFA 2026 Server pokrenut na http://localhost:${PORT}`);
});

