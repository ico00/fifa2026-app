/**
 * Informacije o formatu natjecanja
 */
function FormatInfo() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 md:p-8 shadow-lg border border-slate-200 dark:border-slate-700 text-center mb-8">
      <h3 className="text-2xl font-bold text-fifa-gold mb-4 tracking-wide">
        Format natjecanja
      </h3>
      <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed max-w-3xl mx-auto">
        Iz svake grupe prolaze <strong className="text-green-600 dark:text-green-400 font-bold">prva 2 mjesta</strong>,
        plus <strong className="text-yellow-600 dark:text-yellow-400 font-bold">8 najboljih trećeplasiranih</strong> reprezentacija.
        <br />
        Ukupno 32 reprezentacije ulaze u knockout fazu.
      </p>

      <div className="flex flex-wrap justify-center gap-4 mt-8">
        <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg min-w-[120px]">
          <div className="text-3xl font-black text-slate-800 dark:text-white">32</div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Šest. finala</div>
        </div>
        <div className="text-slate-400 self-center">→</div>
        <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg min-w-[120px]">
          <div className="text-3xl font-black text-slate-800 dark:text-white">16</div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Osmina finala</div>
        </div>
        <div className="text-slate-400 self-center">→</div>
        <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg min-w-[120px]">
          <div className="text-3xl font-black text-slate-800 dark:text-white">8</div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Četvrtfinale</div>
        </div>
        <div className="text-slate-400 self-center">→</div>
        <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg min-w-[120px]">
          <div className="text-3xl font-black text-slate-800 dark:text-white">4</div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Polufinale</div>
        </div>
        <div className="text-slate-400 self-center">→</div>
        <div className="bg-gradient-to-r from-fifa-gold to-yellow-500 p-4 rounded-lg min-w-[120px] text-white shadow-lg shadow-yellow-500/20">
          <div className="text-3xl">🏆</div>
          <div className="text-xs font-bold uppercase tracking-wider mt-1">Finale</div>
        </div>
      </div>
    </div>
  )
}

export default FormatInfo
