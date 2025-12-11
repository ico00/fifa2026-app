const fs = require('fs');
const path = require('path');

// Mapiranje gradova na venue ID-eve
const cityToVenue = {
  'Mexico City': 'mexicocity',
  'Guadalajara': 'guadalajara',
  'Toronto': 'toronto',
  'Los Angeles': 'la',
  'Boston': 'boston',
  'Vancouver': 'vancouver',
  'New York': 'newyork',
  'San Francisco': 'sanfran',
  'Philadelphia': 'philly',
  'Houston': 'houston',
  'Dallas': 'dallas',
  'Monterrey': 'monterrey',
  'Miami': 'miami',
  'Atlanta': 'atlanta',
  'Seattle': 'seattle',
  'Kansas City': 'kansas'
};

// Mapiranje naziva reprezentacija na team ID-eve
const teamNameToId = {
  'Meksiko': 'mex',
  'Južnoafrička Republika': 'rsa',
  'Južna Afrika': 'rsa', // Također podržava stari naziv
  'Južnoafrička Republika': 'rsa',
  'Južna Koreja': 'kor',
  'Kanada': 'can',
  'Katar': 'qat',
  'Švicarska': 'sui',
  'SAD': 'usa',
  'Paragvaj': 'par',
  'Australija': 'aus',
  'Brazil': 'bra',
  'Maroko': 'mar',
  'Haiti': 'hai',
  'Škotska': 'sco',
  'Obala bjelokosti': 'civ',
  'Ekvador': 'ecu',
  'Njemačka': 'ger',
  'Curacao': 'cur',
  'Nizozemska': 'ned',
  'Japan': 'jpn',
  'Tunis': 'tun',
  'Saudijska Arabija': 'ksa',
  'Urugvaj': 'uru',
  'Španjolska': 'esp',
  'Zelenortski otoci': 'cpv',
  'Iran': 'irn',
  'Novi Zeland': 'nzl',
  'Belgija': 'bel',
  'Egipat': 'egy',
  'Francuska': 'fra',
  'Senegal': 'sen',
  'Norveška': 'nor',
  'Argentina': 'arg',
  'Alžir': 'alg',
  'Austrija': 'aut',
  'Jordan': 'jor',
  'Gana': 'gha',
  'Panama': 'pan',
  'Engleska': 'eng',
  'Hrvatska': 'cro',
  'Portugal': 'por',
  'Uzbekistan': 'uzb',
  'Kolumbija': 'col'
};

// Mapiranje play-off reprezentacija na play-off ID-eve
const playoffMapping = {
  'Danska, Makedonija, Češka, Irska': { type: 'away', playoff: 'D' },
  'Češka, Danska, Irska, Makedonija': { type: 'home', playoff: 'D' },
  'Bosna i Hercegovina, Italija, Sjeverna Irska, Wales': { type: 'away', playoff: 'A' },
  'Ukrajina, Švedska, Poljska, Albanija': { type: 'home', playoff: 'B' },
  'Kosovo, Rumunjska, Slovačka, Turska': { type: 'away', playoff: 'C' },
  'Kongo, Jamajka, Nova Kaledonija': { type: 'home', playoff: '2' },
  'Bolivija, Irak, Surinam': { type: 'away', playoff: '1' }
};

// Funkcija za parsiranje datuma
function parseDate(dateStr) {
  // Format: "11.6.2026."
  const parts = dateStr.replace(/\./g, '').split('.');
  const day = parts[0].padStart(2, '0');
  const month = parts[1].padStart(2, '0');
  const year = parts[2];
  return `${year}-${month}-${day}`;
}

// Funkcija za parsiranje vremena (uzimam CET vrijeme)
function parseTime(timeStr) {
  // Format: "23:00 " ili "06:00 "
  return timeStr.trim();
}

// Podaci iz tablice
const matchData = `M1	11.6.2026.	15:00 	23:00 	Mexico City	Meksiko	Južnoafrička Republika
M2	13.6.2026.	22:00	06:00 	Guadalajara	Južna Koreja	Danska, Makedonija, Češka, Irska
M3	12.6.2026.	15:00 	21:00 	Toronto	Kanada	Bosna i Hercegovina, Italija, Sjeverna Irska, Wales
M4	13.6.2026.	21:00 	06:00 	Los Angeles	SAD	Paragvaj
M5	13.6.2026.	21:00 	03:00 	Boston	Haiti	Škotska
M6	13.6.2026.	00:00	09:00 	Vancouver	Australija	Kosovo, Rumunjska, Slovačka, Turska
M7	14.6.2026.	18:00 	00:00 	New York	Brazil	Maroko
M8	14.6.2026.	15:00 	00:00 	San Francisco 	Katar	Švicarska
M9	14.6.2026.	19:00 	01:00 	Philadelphia 	Obala bjelokosti	Ekvador
M10	14.6.2026.	13:00 	20:00 	Houston	Njemačka	Curacao
M11	14.6.2026.	16:00 	23:00 	Dallas	Nizozemska	Japan
M12	15.6.2026.	22:00 	06:00 	Monterrey	Ukrajina, Švedska, Poljska, Albanija	Tunis
M13	16.6.2026.	18:00 	00:00 	Miami	Saudijska Arabija	Urugvaj
M14	15.6.2026.	12:00 	18:00 	Atlanta	Španjolska	Zelenortski otoci
M15	16.6.2026.	21:00 	06:00 	Los Angeles	Iran	Novi Zeland
M16	16.6.2026.	15:00 	00:00 	Seattle	Belgija	Egipat
M17	16.6.2026.	15:00 	21:00 	New York	Francuska	Senegal
M18	17.6.2026.	18:00 	00:00 	Boston	Kongo, Jamajka, Nova Kaledonija	Norveška
M19	17.6.2026.	21:00 	04:00 	Kansas City	Argentina	Alžir
M20	16.6.2026.	00:00 	09:00 	San Francisco 	Austrija	Jordan
M21	18.6.2026.	19:00 	01:00 	Toronto	Gana	Panama
M22	17.6.2026.	16:00 	23:00 	Dallas	Engleska	Hrvatska
M23	17.6.2026.	13:00 	20:00 	Houston	Portugal	Bolivija, Irak, Surinam
M24	18.6.2026.	22:00 	06:00 	Mexico City	Uzbekistan	Kolumbija
M25	18.6.2026.	12:00 	18:00 	Atlanta	Češka, Danska, Irska, Makedonija	Južnoafrička Republika
M26	19.6.2026.	15:00 	00:00 	Los Angeles	Švicarska	Bosna i Hercegovina, Italija, Sjeverna Irska, Wales
M27	19.6.2026.	18:00 	03:00 	Vancouver	Kanada	Katar
M28	19.6.2026.	21:00 	05:00 	Guadalajara	Meksiko	Južna Koreja
M29	20.6.2026.	21:00 	03:00 	Philadelphia 	Brazil	Haiti
M30	20.6.2026.	18:00 	00:00 	Boston	Škotska	Maroko
M31	19.6.2026.	00:00 	09:00 	San Francisco 	Kosovo, Rumunjska, Slovačka, Turska	Paragvaj
M32	20.6.2026.	15:00 	00:00 	Seattle	SAD	Australija
M33	20.6.2026.	16:00 	22:00 	Toronto	Njemačka	Obala bjelokosti
M34	21.6.2026.	20:00 	03:00 	Kansas City	Ekvador	Curacao
M35	20.6.2026.	13:00 	20:00 	Houston	Nizozemska	Ukrajina, Švedska, Poljska, Albanija
M36	20.6.2026.	00:00	08:00 	Monterrey	Tunis	Japan
M37	22.6.2026.	18:00 	00:00 	Miami	Urugvaj	Zelenortski otoci
M38	21.6.2026.	12:00 	18:00 	Atlanta	Španjolska	Saudijska Arabija
M39	22.6.2026.	15:00 	00:00 	Los Angeles	Belgija	Iran
M40	21.6.2026.	21:00 	06:00 	Vancouver	Novi Zeland	Egipat
M41	23.6.2026.	20:00 	02:00 	New York	Norveška	Senegal
M42	22.6.2026.	17:00 	23:00 	Philadelphia 	Francuska	Kongo, Jamajka, Nova Kaledonija
M43	22.6.2026.	13:00 	20:00 	Dallas	Argentina	Austrija
M44	22.6.2026.	23:00 	08:00 	San Francisco 	Jordan	Alžir
M45	23.6.2026.	16:00 	22:00 	Boston	Engleska	Gana
M46	24.6.2026.	19:00 	01:00 	Toronto	Panama	Hrvatska
M47	23.6.2026.	13:00 	20:00 	Houston	Portugal	Uzbekistan
M48	24.6.2026.	22:00 	06:00 	Guadalajara	Kolumbija	Bolivija, Irak, Surinam
M49	25.6.2026.	18:00 	00:00 	Miami	Škotska	Brazil
M50	25.6.2026.	18:00 	00:00 	Atlanta	Maroko	Haiti
M51	25.6.2026.	15:00 	00:00 	Vancouver	Švicarska	Kanada
M52	25.6.2026.	15:00 	00:00 	Seattle	Bosna i Hercegovina, Italija, Sjeverna Irska, Wales	Katar
M53	25.6.2026.	21:00 	05:00 	Mexico City	Češka, Danska, Irska, Makedonija	Meksiko
M54	25.6.2026.	21:00 	05:00 	Monterrey	Južnoafrička Republika	Južna Koreja
M55	25.6.2026.	16:00 	22:00 	Philadelphia 	Curacao	Obala bjelokosti
M56	25.6.2026.	16:00 	22:00 	New York	Ekvador	Njemačka
M57	26.6.2026.	19:00 	02:00 	Dallas	Japan	Ukrajina, Švedska, Poljska, Albanija
M58	26.6.2026.	19:00 	02:00 	Kansas City	Tunis	Nizozemska
M59	26.6.2026.	22:00 	07:00 	Los Angeles	Kosovo, Rumunjska, Slovačka, Turska	SAD
M60	26.6.2026.	22:00 	07:00 	San Francisco 	Paragvaj	Australija
M61	26.6.2026.	15:00 	21:00 	Boston	Norveška	Francuska
M62	26.6.2026.	15:00 	21:00 	Toronto	Senegal	Kongo, Jamajka, Nova Kaledonija
M63	27.6.2026.	23:00 	08:00 	Seattle	Egipat	Iran
M64	27.6.2026.	23:00 	08:00 	Vancouver	Novi Zeland	Belgija
M65	27.6.2026.	20:00 	03:00 	Houston	Zelenortski otoci	Saudijska Arabija
M66	27.6.2026.	20:00 	04:00 	Guadalajara	Urugvaj	Španjolska
M67	27.6.2026.	17:00 	23:00 	New York	Panama	Engleska
M68	27.6.2026.	17:00 	23:00 	Philadelphia 	Hrvatska	Gana
M69	28.6.2026.	22:00 	05:00 	Kansas City	Alžir	Austrija
M70	28.6.2026.	22:00 	05:00 	Dallas	Jordan	Argentina
M71	28.6.2026.	19:30 	01:30 	Miami	Kolumbija	Portugal
M72	28.6.2026.	19:30 	01:30 	Atlanta	Bolivija, Irak, Surinam	Uzbekistan`;

// Parsiranje podataka
const lines = matchData.split('\n').filter(l => l.trim());
const parsedMatches = {};

lines.forEach(line => {
  const parts = line.split('\t');
  if (parts.length < 7) return;
  
  const matchCode = parts[0].trim();
  const date = parseDate(parts[1].trim());
  const timeCET = parseTime(parts[3].trim());
  const city = parts[4].trim();
  const teamA = parts[5].trim();
  const teamB = parts[6].trim();
  
  parsedMatches[matchCode] = {
    date,
    time: timeCET,
    venue: cityToVenue[city],
    homeTeam: teamA,
    awayTeam: teamB
  };
});

// Učitaj postojeći matches.json
const matchesPath = path.join(__dirname, 'data', 'matches.json');
const matches = JSON.parse(fs.readFileSync(matchesPath, 'utf8'));

// Ažuriraj groupStage utakmice (M1-M72)
matches.groupStage.forEach(match => {
  const matchCode = match.matchCode;
  if (parsedMatches[matchCode]) {
    const data = parsedMatches[matchCode];
    match.date = data.date;
    match.time = data.time;
    match.venue = data.venue;
    
    // Ažuriraj reprezentacije
    const homeTeamName = data.homeTeam;
    const awayTeamName = data.awayTeam;
    
    // Provjeri je li play-off
    if (playoffMapping[homeTeamName]) {
      const playoff = playoffMapping[homeTeamName];
      match.homeTeam = null;
      match.homeTeamPlayoff = playoff.playoff;
      delete match.awayTeamPlayoff;
    } else if (teamNameToId[homeTeamName]) {
      match.homeTeam = teamNameToId[homeTeamName];
      delete match.homeTeamPlayoff;
    }
    
    if (playoffMapping[awayTeamName]) {
      const playoff = playoffMapping[awayTeamName];
      match.awayTeam = null;
      match.awayTeamPlayoff = playoff.playoff;
      delete match.homeTeamPlayoff;
    } else if (teamNameToId[awayTeamName]) {
      match.awayTeam = teamNameToId[awayTeamName];
      delete match.awayTeamPlayoff;
    }
  }
});

// Ažuriraj knockoutStage utakmice (M73-M104)
const knockoutMatches = [
  ...matches.knockoutStage.roundOf32,
  ...matches.knockoutStage.roundOf16,
  ...matches.knockoutStage.quarterFinals,
  ...matches.knockoutStage.semiFinals
];

const knockoutData = `M73	29.6.2026.	15:00 	00:00 	Los Angeles		
M74	29.6.2026.	16:30 	22:30 	Boston		
M75	30.6.2026.	21:00 	05:00 	Monterrey		
M76	29.6.2026.	13:00 	20:00 	Houston		
M77	30.6.2026.	17:00 	23:00 	New York		
M78	30.6.2026.	13:00 	20:00 	Dallas		
M79	1.7.2026.	21:00 	05:00 	Mexico City		
M80	1.7.2026.	12:00 	18:00 	Atlanta		
M81	2.7.2026.	20:00 	05:00 	San Francisco 		
M82	2.7.2026.	16:00 	01:00 	Seattle		
M83	2.7.2026.	19:00 	01:00 	Toronto		
M84	3.7.2026.	15:00 	00:00 	Los Angeles		
M85	3.7.2026.	23:00 	08:00 	Vancouver		
M86	4.7.2026.	18:00 	00:00 	Miami		
M87	4.7.2026.	21:30 	04:30 	Kansas City		
M88	3.7.2026.	14:00 	21:00 	Dallas		
M89	4.7.2026.	17:00 	23:00 	Philadelphia 		
M90	4.7.2026.	13:00 	20:00 	Houston		
M91	5.7.2026.	16:00	22:00 	New York		
M92	6.7.2026.	20:00 	04:00 	Mexico City		
M93	6.7.2026.	15:00 	22:00 	Dallas		
M94	7.7.2026.	20:00 	05:00 	Seattle		
M95	7.7.2026.	12:00 	18:00 	Atlanta		
M96	8.7.2026.	16:00 	01:00 	Vancouver		
M97	9.7.2026.	16:00 	22:00 	Boston		
M98	11.7.2026.	15:00 	00:00 	Los Angeles		
M99	11.7.2026.	17:00 	23:00 	Miami		
M100	12.7.2026.	21:00 	04:00 	Kansas City		
M101	14.7.2026.	15:00 	22:00 	Dallas		
M102	15.7.2026.	15:00 	21:00 	Atlanta		
M103	18.7.2026.	17:00 	23:00 	Miami		
M104	19.7.2026.	15:00 	21:00 	New York`;

const knockoutLines = knockoutData.split('\n').filter(l => l.trim());
const parsedKnockout = {};

knockoutLines.forEach(line => {
  const parts = line.split('\t');
  if (parts.length < 5) return;
  
  const matchCode = parts[0].trim();
  const date = parseDate(parts[1].trim());
  const timeCET = parseTime(parts[3].trim());
  const city = parts[4].trim();
  
  parsedKnockout[matchCode] = {
    date,
    time: timeCET,
    venue: cityToVenue[city]
  };
});

// Ažuriraj knockout utakmice
knockoutMatches.forEach(match => {
  const matchCode = match.matchCode;
  if (parsedKnockout[matchCode]) {
    const data = parsedKnockout[matchCode];
    match.date = data.date;
    match.time = data.time;
    match.venue = data.venue;
  }
});

// Spremi ažurirane podatke
fs.writeFileSync(matchesPath, JSON.stringify(matches, null, 2), 'utf8');
console.log('✅ Utakmice su uspješno ažurirane!');

