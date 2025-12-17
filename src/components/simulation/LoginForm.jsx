/**
 * Forma za prijavu u simulaciju
 */
function LoginForm({ username, setUsername, onSubmit, loading }) {
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!username.trim()) return
    onSubmit()
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 animate-fade-in-up">
      <h2 className="text-3xl font-black text-center text-fifa-blue dark:text-fifa-gold mb-8 uppercase tracking-widest">
        🔮 Simulacija Prvenstva
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide">
            Vaše Ime / Nadimak
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 rounded-xl font-bold text-lg border-2 border-transparent focus:border-fifa-blue dark:focus:border-fifa-gold focus:outline-none transition-all"
            placeholder="Upišite ime..."
            autoFocus
          />
        </div>
        <button
          type="submit"
          disabled={!username.trim() || loading}
          className="w-full bg-gradient-to-r from-fifa-blue to-blue-900 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Učitavanje...' : 'ZAPOČNI PROGNOZU'}
        </button>
      </form>
    </div>
  )
}

export default LoginForm
