/**
 * Ljestvica predviđanja
 */
function Leaderboard({ allPredictions, matches, currentUser, calculatePoints }) {
  // Izračunaj bodove za svakog korisnika
  const usersWithPoints = allPredictions.map(user => {
    let points = 0
    let exact = 0
    let outcome = 0

    // Calculate total points
    matches.groupStage.forEach(m => {
      if (m.played && m.homeScore !== null && m.awayScore !== null) {
        const pred = user.predictions[m.id]
        const pts = calculatePoints(pred, m)
        points += pts
        if (pts === 3) exact++
        if (pts === 1) outcome++
      }
    })

    return { ...user, points, exact, outcome }
  }).sort((a, b) => b.points - a.points)

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
        <h3 className="text-2xl font-black text-fifa-blue dark:text-fifa-gold uppercase tracking-widest text-center">
          🏆 Ljestvica Predviđanja
        </h3>
        <p className="text-center text-slate-500 text-sm mt-2">
          3 boda za točan rezultat • 1 bod za pogođen ishod
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-100 dark:bg-slate-700 text-slate-500 font-bold uppercase text-xs tracking-wider">
            <tr>
              <th className="p-4 text-center w-16">#</th>
              <th className="p-4">Korisnik</th>
              <th className="p-4 text-center">Točno</th>
              <th className="p-4 text-center">Ishod</th>
              <th className="p-4 text-center text-fifa-blue dark:text-fifa-gold text-lg">Bodovi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {usersWithPoints.map((user, index) => (
              <tr 
                key={user.username} 
                className={user.username === currentUser ? "bg-blue-50 dark:bg-blue-900/20" : ""}
              >
                <td className="p-4 text-center font-bold text-slate-400">
                  {index + 1}.
                </td>
                <td className="p-4 font-bold text-slate-800 dark:text-slate-200">
                  {user.username}
                  {user.username === currentUser && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                      VI
                    </span>
                  )}
                </td>
                <td className="p-4 text-center font-mono text-green-600 font-bold">{user.exact}</td>
                <td className="p-4 text-center font-mono text-yellow-600 font-bold">{user.outcome}</td>
                <td className="p-4 text-center font-black text-xl text-fifa-blue dark:text-fifa-gold">
                  {user.points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {allPredictions.length === 0 && (
          <div className="p-10 text-center text-slate-400 italic">
            Još nema unesenih prognoza. Budite prvi!
          </div>
        )}
      </div>
    </div>
  )
}

export default Leaderboard
