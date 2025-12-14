import { useState, useEffect } from 'react'
import Flag from './Flag'

function CountdownTimer({ targetDate, targetTime, homeTeam, awayTeam, homeTeamPlayoff, awayTeamPlayoff, venue, teams, venues, playoffs }) {
  const [timeLeft, setTimeLeft] = useState(null)

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!targetDate || !targetTime) return null

      // Kombiniraj datum i vrijeme
      const [hours, minutes] = targetTime.split(':').map(Number)
      const target = new Date(targetDate)
      target.setHours(hours, minutes, 0, 0)

      const now = new Date()
      const difference = target - now

      if (difference <= 0) {
        return null // Utakmica je već počela ili završila
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hoursLeft = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutesLeft = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const secondsLeft = Math.floor((difference % (1000 * 60)) / 1000)

      return { days, hours: hoursLeft, minutes: minutesLeft, seconds: secondsLeft }
    }

    setTimeLeft(calculateTimeLeft())

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(interval)
  }, [targetDate, targetTime])

  if (!timeLeft) return null

  const getTeamById = (id) => teams?.find(t => t.id === id)
  const getVenueById = (id) => venues?.find(v => v.id === id)
  
  // Funkcija za dobivanje play-off pobjednika
  const getPlayoffWinner = (playoffId) => {
    if (!playoffs || !playoffs[playoffId]) return null
    return playoffs[playoffId].winner || null
  }

  // Provjeri play-off pobjednike
  const homePlayoffWinner = homeTeamPlayoff ? getPlayoffWinner(homeTeamPlayoff) : null
  const awayPlayoffWinner = awayTeamPlayoff ? getPlayoffWinner(awayTeamPlayoff) : null

  // Koristi play-off pobjednika ako postoji, inače koristi direktan tim
  const homeTeamId = homeTeam || homePlayoffWinner
  const awayTeamId = awayTeam || awayPlayoffWinner

  const home = homeTeamId ? getTeamById(homeTeamId) : null
  const away = awayTeamId ? getTeamById(awayTeamId) : null
  const venueData = venue ? getVenueById(venue) : null

  const formatDate = (dateStr, timeStr) => {
    const date = new Date(dateStr)
    const formattedDate = date.toLocaleDateString('hr-HR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long'
    })
    // Koristi originalno vrijeme iz matches.json umjesto konvertiranog
    return `${formattedDate} u ${timeStr}`
  }

  return (
    <div className="relative w-full bg-white dark:bg-slate-800 border-2 border-fifa-red/30 dark:border-fifa-red/50 rounded-xl p-4 sm:p-5 mb-4 shadow-lg overflow-hidden">
      {/* Hrvatski šahovni uzorak u pozadini */}
      <div className="absolute inset-0 opacity-[0.09] dark:opacity-[0.08] pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="croatian-checkerboard" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
              <rect width="25" height="25" fill="#dc2626"/>
              <rect x="25" y="25" width="25" height="25" fill="#dc2626"/>
              <rect x="25" y="0" width="25" height="25" fill="#ffffff"/>
              <rect x="0" y="25" width="25" height="25" fill="#ffffff"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#croatian-checkerboard)"/>
        </svg>
      </div>
      
      <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-5">
        {/* Match Info */}
        <div className="flex items-center gap-4 sm:gap-5 flex-1 min-w-0">
          <div className="flex items-center gap-4 sm:gap-5 min-w-0">
            {home && <Flag code={home.code} size="lg" className="shrink-0" />}
            <span className="font-bold text-lg sm:text-xl md:text-2xl text-slate-700 dark:text-slate-200 truncate">
              {home?.name || 'TBD'}
            </span>
            <span className="text-slate-400 dark:text-slate-500 font-bold text-lg sm:text-xl">vs</span>
            <span className="font-bold text-lg sm:text-xl md:text-2xl text-slate-700 dark:text-slate-200 truncate">
              {away?.name || 'TBD'}
            </span>
            {away && <Flag code={away.code} size="lg" className="shrink-0" />}
          </div>
        </div>

        {/* Countdown */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="text-center">
            <div className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
              Do utakmice
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              {timeLeft.days > 0 && (
                <div className="flex flex-col items-center bg-white dark:bg-slate-800 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 shadow-md border border-slate-200 dark:border-slate-700 min-w-[50px] sm:min-w-[60px]">
                  <span className="text-lg sm:text-2xl font-black text-fifa-red dark:text-fifa-gold">{timeLeft.days}</span>
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">d</span>
                </div>
              )}
              <div className="flex flex-col items-center bg-white dark:bg-slate-800 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 shadow-md border border-slate-200 dark:border-slate-700 min-w-[50px] sm:min-w-[60px]">
                <span className="text-lg sm:text-2xl font-black text-fifa-red dark:text-fifa-gold">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">h</span>
              </div>
              <div className="flex flex-col items-center bg-white dark:bg-slate-800 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 shadow-md border border-slate-200 dark:border-slate-700 min-w-[50px] sm:min-w-[60px]">
                <span className="text-lg sm:text-2xl font-black text-fifa-red dark:text-fifa-gold">{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">m</span>
              </div>
              {timeLeft.days === 0 && (
                <div className="flex flex-col items-center bg-white dark:bg-slate-800 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 shadow-md border border-slate-200 dark:border-slate-700 min-w-[50px] sm:min-w-[60px]">
                  <span className="text-lg sm:text-2xl font-black text-fifa-red dark:text-fifa-gold">{String(timeLeft.seconds).padStart(2, '0')}</span>
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">s</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Date & Venue */}
        <div className="text-center sm:text-right">
          <div className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
            {formatDate(targetDate, targetTime)}
          </div>
          {venueData && (
            <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span className="text-fifa-red">📍</span> {venueData.city}{venueData.stadium ? `, ${venueData.stadium}` : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CountdownTimer

