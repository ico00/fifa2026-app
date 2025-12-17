import SimulatedMatchCard from './SimulatedMatchCard'

/**
 * Knockout simulacija na temelju prognoza
 */
function KnockoutSimulation({ tree, predictions, onChange }) {
  if (!tree) return null

  return (
    <div className="animate-fade-in-up">
      <div className="bg-fifa-blue dark:bg-slate-900 p-8 rounded-2xl shadow-xl mb-8">
        <h2 className="text-3xl font-black text-white text-center uppercase tracking-[0.2em] mb-4">
          ⚔️ Knockout Simulacija
        </h2>
        <p className="text-white/60 text-center mb-8">
          Na temelju vaših prognoza u grupama, generirali smo kostur natjecanja.
        </p>

        {/* Round of 32 */}
        <h3 className="text-xl font-bold text-fifa-gold mb-6 border-b border-white/10 pb-2">
          Round of 32
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {tree.r32.map(m => (
            <SimulatedMatchCard 
              key={m.id} 
              match={m} 
              predictions={predictions} 
              onChange={onChange} 
            />
          ))}
        </div>

        {/* Round of 16 */}
        <h3 className="text-xl font-bold text-fifa-gold mb-6 border-b border-white/10 pb-2">
          Round of 16
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {tree.r16.map(m => 
            m.homeTeamObj && m.awayTeamObj ? (
              <SimulatedMatchCard 
                key={m.id} 
                match={m} 
                predictions={predictions} 
                onChange={onChange} 
              />
            ) : null
          )}
        </div>

        {/* Quarter Finals */}
        <h3 className="text-xl font-bold text-fifa-gold mb-6 border-b border-white/10 pb-2">
          Quarter Finals
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {tree.qf.map(m => 
            m.homeTeamObj && m.awayTeamObj ? (
              <SimulatedMatchCard 
                key={m.id} 
                match={m} 
                predictions={predictions} 
                onChange={onChange} 
              />
            ) : null
          )}
        </div>

        {/* Semi Finals */}
        <h3 className="text-xl font-bold text-fifa-gold mb-6 border-b border-white/10 pb-2">
          Semi Finals
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {tree.sf.map(m => 
            m.homeTeamObj && m.awayTeamObj ? (
              <SimulatedMatchCard 
                key={m.id} 
                match={m} 
                predictions={predictions} 
                onChange={onChange} 
              />
            ) : null
          )}
        </div>

        {/* FINAL */}
        <h3 className="text-xl font-bold text-fifa-gold mb-6 border-b border-white/10 pb-2">
          FINAL 🏆
        </h3>
        <div className="flex justify-center">
          {tree.final.homeTeamObj && tree.final.awayTeamObj ? (
            <div className="w-full max-w-lg">
              <SimulatedMatchCard 
                match={tree.final} 
                predictions={predictions} 
                onChange={onChange} 
                isFinal 
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default KnockoutSimulation
