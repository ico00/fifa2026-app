import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ispravna vremena i datumi po hrvatskom vremenu (CEST, UTC+2)
// Grupna faza M1-M72: vrijednosti koje je dao korisnik
// Knockout M73-M104: izracunato iz sluzbenog rasporeda (Wikipedia, lokalna vremena + UTC offset)
const matchUpdates = {
    'M1': { date: '2026-06-11', time: '21:00' },
    'M2': { date: '2026-06-12', time: '04:00' },
    'M3': { date: '2026-06-12', time: '21:00' },
    'M4': { date: '2026-06-13', time: '03:00' },
    'M5': { date: '2026-06-14', time: '03:00' },
    'M6': { date: '2026-06-14', time: '06:00' },
    'M7': { date: '2026-06-14', time: '00:00' },
    'M8': { date: '2026-06-13', time: '21:00' },
    'M9': { date: '2026-06-15', time: '01:00' },
    'M10': { date: '2026-06-14', time: '19:00' },
    'M11': { date: '2026-06-14', time: '22:00' },
    'M12': { date: '2026-06-15', time: '04:00' },
    'M13': { date: '2026-06-16', time: '00:00' },
    'M14': { date: '2026-06-15', time: '18:00' },
    'M15': { date: '2026-06-16', time: '03:00' },
    'M16': { date: '2026-06-15', time: '21:00' },
    'M17': { date: '2026-06-16', time: '21:00' },
    'M18': { date: '2026-06-17', time: '00:00' },
    'M19': { date: '2026-06-17', time: '03:00' },
    'M20': { date: '2026-06-17', time: '06:00' },
    'M21': { date: '2026-06-18', time: '01:00' },
    'M22': { date: '2026-06-17', time: '22:00' },
    'M23': { date: '2026-06-17', time: '19:00' },
    'M24': { date: '2026-06-18', time: '04:00' },
    'M25': { date: '2026-06-18', time: '18:00' },
    'M26': { date: '2026-06-18', time: '21:00' },
    'M27': { date: '2026-06-19', time: '00:00' },
    'M28': { date: '2026-06-19', time: '03:00' },
    'M29': { date: '2026-06-20', time: '02:30' },
    'M30': { date: '2026-06-20', time: '00:00' },
    'M31': { date: '2026-06-20', time: '05:00' },
    'M32': { date: '2026-06-19', time: '21:00' },
    'M33': { date: '2026-06-20', time: '22:00' },
    'M34': { date: '2026-06-21', time: '02:00' },
    'M35': { date: '2026-06-20', time: '19:00' },
    'M36': { date: '2026-06-21', time: '06:00' },
    'M37': { date: '2026-06-22', time: '00:00' },
    'M38': { date: '2026-06-21', time: '18:00' },
    'M39': { date: '2026-06-21', time: '21:00' },
    'M40': { date: '2026-06-22', time: '03:00' },
    'M41': { date: '2026-06-23', time: '02:00' },
    'M42': { date: '2026-06-22', time: '23:00' },
    'M43': { date: '2026-06-22', time: '19:00' },
    'M44': { date: '2026-06-23', time: '05:00' },
    'M45': { date: '2026-06-23', time: '22:00' },
    'M46': { date: '2026-06-24', time: '01:00' },
    'M47': { date: '2026-06-23', time: '19:00' },
    'M48': { date: '2026-06-24', time: '04:00' },
    'M49': { date: '2026-06-25', time: '00:00' },
    'M50': { date: '2026-06-25', time: '00:00' },
    'M51': { date: '2026-06-24', time: '21:00' },
    'M52': { date: '2026-06-24', time: '21:00' },
    'M53': { date: '2026-06-25', time: '03:00' },
    'M54': { date: '2026-06-25', time: '03:00' },
    'M55': { date: '2026-06-25', time: '22:00' },
    'M56': { date: '2026-06-25', time: '22:00' },
    'M57': { date: '2026-06-26', time: '01:00' },
    'M58': { date: '2026-06-26', time: '01:00' },
    // M59: korisnik je upisao 24.6, ali M59 i M60 (skupina D, 3. kolo) igraju se istovremeno
    'M59': { date: '2026-06-26', time: '04:00' },
    'M60': { date: '2026-06-26', time: '04:00' },
    'M61': { date: '2026-06-26', time: '21:00' },
    'M62': { date: '2026-06-26', time: '21:00' },
    'M63': { date: '2026-06-27', time: '05:00' },
    'M64': { date: '2026-06-27', time: '05:00' },
    'M65': { date: '2026-06-27', time: '02:00' },
    'M66': { date: '2026-06-27', time: '02:00' },
    'M67': { date: '2026-06-27', time: '23:00' },
    'M68': { date: '2026-06-27', time: '23:00' },
    'M69': { date: '2026-06-28', time: '04:00' },
    'M70': { date: '2026-06-28', time: '04:00' },
    'M71': { date: '2026-06-28', time: '01:30' },
    'M72': { date: '2026-06-28', time: '01:30' },
    // Knockout faza (izracunato iz sluzbenog rasporeda u hrvatsko vrijeme)
    'M73': { date: '2026-06-28', time: '21:00' },
    'M74': { date: '2026-06-29', time: '22:30' },
    'M75': { date: '2026-06-30', time: '03:00' },
    'M76': { date: '2026-06-29', time: '19:00' },
    'M77': { date: '2026-06-30', time: '23:00' },
    'M78': { date: '2026-06-30', time: '19:00' },
    'M79': { date: '2026-07-01', time: '03:00' },
    'M80': { date: '2026-07-01', time: '18:00' },
    'M81': { date: '2026-07-02', time: '02:00' },
    'M82': { date: '2026-07-01', time: '22:00' },
    'M83': { date: '2026-07-03', time: '01:00' },
    'M84': { date: '2026-07-02', time: '21:00' },
    'M85': { date: '2026-07-03', time: '05:00' },
    'M86': { date: '2026-07-04', time: '00:00' },
    'M87': { date: '2026-07-04', time: '03:30' },
    'M88': { date: '2026-07-03', time: '20:00' },
    'M89': { date: '2026-07-04', time: '23:00' },
    'M90': { date: '2026-07-04', time: '19:00' },
    'M91': { date: '2026-07-05', time: '22:00' },
    'M92': { date: '2026-07-06', time: '02:00' },
    'M93': { date: '2026-07-06', time: '21:00' },
    'M94': { date: '2026-07-07', time: '02:00' },
    'M95': { date: '2026-07-07', time: '18:00' },
    'M96': { date: '2026-07-07', time: '22:00' },
    'M97': { date: '2026-07-09', time: '22:00' },
    'M98': { date: '2026-07-10', time: '21:00' },
    'M99': { date: '2026-07-11', time: '23:00' },
    'M100': { date: '2026-07-12', time: '03:00' },
    'M101': { date: '2026-07-14', time: '21:00' },
    'M102': { date: '2026-07-15', time: '21:00' },
    'M103': { date: '2026-07-18', time: '23:00' },
    'M104': { date: '2026-07-19', time: '21:00' }
};

// Učitaj matches.json
const matchesPath = path.join(__dirname, 'data', 'matches.json');
const matchesData = JSON.parse(fs.readFileSync(matchesPath, 'utf8'));

let updatedCount = 0;

const applyUpdate = (match) => {
    const update = matchUpdates[match.matchCode];
    if (update) {
        match.date = update.date;
        match.time = update.time;
        updatedCount++;
        console.log(`✓ Ažuriran ${match.matchCode}: ${update.date} ${update.time}`);
    }
};

// Ažuriraj groupStage utakmice
matchesData.groupStage.forEach(applyUpdate);

// Ažuriraj knockout utakmice
const knockoutStages = ['roundOf32', 'roundOf16', 'quarterFinals', 'semiFinals'];
knockoutStages.forEach(stage => {
    if (matchesData.knockoutStage[stage]) {
        matchesData.knockoutStage[stage].forEach(applyUpdate);
    }
});

// Ažuriraj thirdPlace i final
if (matchesData.knockoutStage.thirdPlace) applyUpdate(matchesData.knockoutStage.thirdPlace);
if (matchesData.knockoutStage.final) applyUpdate(matchesData.knockoutStage.final);

// Sačuvaj ažurirani fajl
fs.writeFileSync(matchesPath, JSON.stringify(matchesData, null, 2), 'utf8');

console.log(`\n✅ Uspešno ažurirano ${updatedCount} utakmica!`);
console.log(`📁 Fajl sačuvan: ${matchesPath}`);
