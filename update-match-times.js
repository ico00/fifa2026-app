import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Nova vremena i datumi za sve utakmice
const matchUpdates = {
    'M1': { date: '2026-06-11', time: '23:00', venue: 'mexicocity' },
    'M2': { date: '2026-06-12', time: '06:00', venue: 'guadalajara' },
    'M3': { date: '2026-06-12', time: '21:00', venue: 'toronto' },
    'M4': { date: '2026-06-13', time: '06:00', venue: 'la' },
    'M5': { date: '2026-06-14', time: '03:00', venue: 'boston' },
    'M6': { date: '2026-06-13', time: '09:00', venue: 'vancouver' },
    'M7': { date: '2026-06-14', time: '00:00', venue: 'newyork' },
    'M8': { date: '2026-06-14', time: '00:00', venue: 'sanfran' },
    'M9': { date: '2026-06-15', time: '01:00', venue: 'philly' },
    'M10': { date: '2026-06-14', time: '20:00', venue: 'houston' },
    'M11': { date: '2026-06-14', time: '23:00', venue: 'dallas' },
    'M12': { date: '2026-06-15', time: '06:00', venue: 'monterrey' },
    'M13': { date: '2026-06-16', time: '00:00', venue: 'miami' },
    'M14': { date: '2026-06-15', time: '18:00', venue: 'atlanta' },
    'M15': { date: '2026-06-16', time: '06:00', venue: 'la' },
    'M16': { date: '2026-06-16', time: '00:00', venue: 'seattle' },
    'M17': { date: '2026-06-16', time: '21:00', venue: 'newyork' },
    'M18': { date: '2026-06-17', time: '00:00', venue: 'boston' },
    'M19': { date: '2026-06-17', time: '04:00', venue: 'kansas' },
    'M20': { date: '2026-06-16', time: '09:00', venue: 'sanfran' },
    'M21': { date: '2026-06-17', time: '16:00', venue: 'toronto' },
    'M22': { date: '2026-06-17', time: '23:00', venue: 'dallas' },
    'M23': { date: '2026-06-17', time: '20:00', venue: 'houston' },
    'M24': { date: '2026-06-18', time: '06:00', venue: 'mexicocity' },
    'M25': { date: '2026-06-18', time: '18:00', venue: 'atlanta' },
    'M26': { date: '2026-06-19', time: '00:00', venue: 'la' },
    'M27': { date: '2026-06-19', time: '03:00', venue: 'vancouver' },
    'M28': { date: '2026-06-19', time: '05:00', venue: 'guadalajara' },
    'M29': { date: '2026-06-20', time: '03:00', venue: 'philly' },
    'M30': { date: '2026-06-20', time: '00:00', venue: 'boston' },
    'M31': { date: '2026-06-19', time: '09:00', venue: 'sanfran' },
    'M32': { date: '2026-06-20', time: '00:00', venue: 'seattle' },
    'M33': { date: '2026-06-20', time: '22:00', venue: 'toronto' },
    'M34': { date: '2026-06-21', time: '03:00', venue: 'kansas' },
    'M35': { date: '2026-06-20', time: '20:00', venue: 'houston' },
    'M36': { date: '2026-06-20', time: '08:00', venue: 'monterrey' },
    'M37': { date: '2026-06-22', time: '00:00', venue: 'miami' },
    'M38': { date: '2026-06-21', time: '18:00', venue: 'atlanta' },
    'M39': { date: '2026-06-22', time: '00:00', venue: 'la' },
    'M40': { date: '2026-06-22', time: '06:00', venue: 'vancouver' },
    'M41': { date: '2026-06-23', time: '02:00', venue: 'newyork' },
    'M42': { date: '2026-06-22', time: '23:00', venue: 'philly' },
    'M43': { date: '2026-06-22', time: '20:00', venue: 'dallas' },
    'M44': { date: '2026-06-23', time: '08:00', venue: 'sanfran' },
    'M45': { date: '2026-06-23', time: '22:00', venue: 'boston' },
    'M46': { date: '2026-06-24', time: '01:00', venue: 'toronto' },
    'M47': { date: '2026-06-23', time: '20:00', venue: 'houston' },
    'M48': { date: '2026-06-24', time: '06:00', venue: 'guadalajara' },
    'M49': { date: '2026-06-25', time: '00:00', venue: 'miami' },
    'M50': { date: '2026-06-25', time: '00:00', venue: 'atlanta' },
    'M51': { date: '2026-06-25', time: '00:00', venue: 'vancouver' },
    'M52': { date: '2026-06-25', time: '00:00', venue: 'seattle' },
    'M53': { date: '2026-06-25', time: '05:00', venue: 'mexicocity' },
    'M54': { date: '2026-06-25', time: '05:00', venue: 'monterrey' },
    'M55': { date: '2026-06-25', time: '22:00', venue: 'philly' },
    'M56': { date: '2026-06-25', time: '22:00', venue: 'newyork' },
    'M57': { date: '2026-06-26', time: '02:00', venue: 'dallas' },
    'M58': { date: '2026-06-26', time: '02:00', venue: 'kansas' },
    'M59': { date: '2026-06-26', time: '07:00', venue: 'la' },
    'M60': { date: '2026-06-26', time: '07:00', venue: 'sanfran' },
    'M61': { date: '2026-06-26', time: '21:00', venue: 'boston' },
    'M62': { date: '2026-06-26', time: '21:00', venue: 'toronto' },
    'M63': { date: '2026-06-27', time: '08:00', venue: 'seattle' },
    'M64': { date: '2026-06-27', time: '08:00', venue: 'vancouver' },
    'M65': { date: '2026-06-27', time: '03:00', venue: 'houston' },
    'M66': { date: '2026-06-27', time: '04:00', venue: 'guadalajara' },
    'M67': { date: '2026-06-27', time: '23:00', venue: 'newyork' },
    'M68': { date: '2026-06-27', time: '23:00', venue: 'philly' },
    'M69': { date: '2026-06-28', time: '05:00', venue: 'kansas' },
    'M70': { date: '2026-06-28', time: '05:00', venue: 'dallas' },
    'M71': { date: '2026-06-28', time: '01:30', venue: 'miami' },
    'M72': { date: '2026-06-28', time: '01:30', venue: 'atlanta' },
    'M73': { date: '2026-06-29', time: '00:00', venue: 'la' },
    'M74': { date: '2026-06-29', time: '22:30', venue: 'boston' },
    'M75': { date: '2026-06-30', time: '05:00', venue: 'monterrey' },
    'M76': { date: '2026-06-29', time: '20:00', venue: 'houston' },
    'M77': { date: '2026-06-30', time: '23:00', venue: 'newyork' },
    'M78': { date: '2026-06-30', time: '20:00', venue: 'dallas' },
    'M79': { date: '2026-07-01', time: '05:00', venue: 'mexicocity' },
    'M80': { date: '2026-07-01', time: '18:00', venue: 'atlanta' },
    'M81': { date: '2026-07-02', time: '05:00', venue: 'sanfran' },
    'M82': { date: '2026-07-02', time: '01:00', venue: 'seattle' },
    'M83': { date: '2026-07-03', time: '01:00', venue: 'toronto' },
    'M84': { date: '2026-07-03', time: '00:00', venue: 'la' },
    'M85': { date: '2026-07-03', time: '08:00', venue: 'vancouver' },
    'M86': { date: '2026-07-04', time: '00:00', venue: 'miami' },
    'M87': { date: '2026-07-04', time: '04:30', venue: 'kansas' },
    'M88': { date: '2026-07-03', time: '21:00', venue: 'dallas' },
    'M89': { date: '2026-07-04', time: '23:00', venue: 'philly' },
    'M90': { date: '2026-07-04', time: '20:00', venue: 'houston' },
    'M91': { date: '2026-07-05', time: '22:00', venue: 'newyork' },
    'M92': { date: '2026-07-06', time: '04:00', venue: 'mexicocity' },
    'M93': { date: '2026-07-06', time: '22:00', venue: 'dallas' },
    'M94': { date: '2026-07-07', time: '05:00', venue: 'seattle' },
    'M95': { date: '2026-07-07', time: '18:00', venue: 'atlanta' },
    'M96': { date: '2026-07-10', time: '01:00', venue: 'vancouver' },
    'M97': { date: '2026-07-10', time: '22:00', venue: 'boston' },
    'M98': { date: '2026-07-11', time: '00:00', venue: 'la' },
    'M99': { date: '2026-07-11', time: '23:00', venue: 'miami' },
    'M100': { date: '2026-07-12', time: '04:00', venue: 'kansas' },
    'M101': { date: '2026-07-14', time: '22:00', venue: 'dallas' },
    'M102': { date: '2026-07-15', time: '21:00', venue: 'atlanta' },
    'M103': { date: '2026-07-18', time: '23:00', venue: 'miami' },
    'M104': { date: '2026-07-19', time: '21:00', venue: 'newyork' }
};

// Učitaj matches.json
const matchesPath = path.join(__dirname, 'data', 'matches.json');
const matchesData = JSON.parse(fs.readFileSync(matchesPath, 'utf8'));

let updatedCount = 0;

// Ažuriraj groupStage utakmice
matchesData.groupStage.forEach(match => {
    const update = matchUpdates[match.matchCode];
    if (update) {
        match.date = update.date;
        match.time = update.time;
        match.venue = update.venue;
        updatedCount++;
        console.log(`✓ Ažuriran ${match.matchCode}: ${update.date} ${update.time} @ ${update.venue}`);
    }
});

// Ažuriraj knockout utakmice
const knockoutStages = ['roundOf32', 'roundOf16', 'quarterFinals', 'semiFinals'];
knockoutStages.forEach(stage => {
    if (matchesData.knockoutStage[stage]) {
        const matches = Array.isArray(matchesData.knockoutStage[stage])
            ? matchesData.knockoutStage[stage]
            : [matchesData.knockoutStage[stage]];

        matches.forEach(match => {
            const update = matchUpdates[match.matchCode];
            if (update) {
                match.date = update.date;
                match.time = update.time;
                match.venue = update.venue;
                updatedCount++;
                console.log(`✓ Ažuriran ${match.matchCode}: ${update.date} ${update.time} @ ${update.venue}`);
            }
        });
    }
});

// Ažuriraj thirdPlace
if (matchesData.knockoutStage.thirdPlace) {
    const match = matchesData.knockoutStage.thirdPlace;
    const update = matchUpdates[match.matchCode];
    if (update) {
        match.date = update.date;
        match.time = update.time;
        match.venue = update.venue;
        updatedCount++;
        console.log(`✓ Ažuriran ${match.matchCode}: ${update.date} ${update.time} @ ${update.venue}`);
    }
}

// Ažuriraj final
if (matchesData.knockoutStage.final) {
    const match = matchesData.knockoutStage.final;
    const update = matchUpdates[match.matchCode];
    if (update) {
        match.date = update.date;
        match.time = update.time;
        match.venue = update.venue;
        updatedCount++;
        console.log(`✓ Ažuriran ${match.matchCode}: ${update.date} ${update.time} @ ${update.venue}`);
    }
}

// Sačuvaj ažurirani fajl
fs.writeFileSync(matchesPath, JSON.stringify(matchesData, null, 2), 'utf8');

console.log(`\n✅ Uspešno ažurirano ${updatedCount} utakmica!`);
console.log(`📁 Fajl sačuvan: ${matchesPath}`);
