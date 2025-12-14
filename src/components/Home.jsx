import { useState, useEffect, useRef } from 'react'

function Home() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [scrollY, setScrollY] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const heroRef = useRef(null)

  // Lista fotografija s konfiguracijom za svaku sliku
  // 
  // src - slika za velike ekrane (desktop, tablet)
  // mobileSrc - opcionalna slika za mobitele (ako nije definirana, koristi se src)
  // backgroundPosition - definira početnu, centralnu točku od koje kreće Ken Burns efekt
  // 
  // Moguće vrijednosti za backgroundPosition:
  // - "center" (default) - centrira sliku
  // - "top", "bottom", "left", "right" - pozicionira na rub
  // - "top left", "top right", "bottom left", "bottom right" - kombinacije
  // - "center left", "center right", "top center", "bottom center" - kombinacije
  // - Procenti: "50% 30%" - prvi broj je horizontalno (0% = lijevo, 100% = desno),
  //             drugi je vertikalno (0% = gore, 100% = dolje)
  // - Pikseli: "100px 200px" - točna pozicija u pikselima
  //
  // Primjer: Ako želite da se fokusira na lice osobe koje je u gornjem lijevom dijelu slike:
  // backgroundPosition: "30% 20%" ili "top left"
  const teamImages = [
    { 
      src: '/images/modric-hero.jpg', 
      mobileSrc: '/images/modric-hero-mobile.jpg', // Opcionalno - ako ne postoji, koristi se src
      backgroundPosition: 'center' // Početna pozicija za Ken Burns efekt
    },
    { 
      src: '/images/team-1.jpg', 
      mobileSrc: '/images/team-1-mobile.jpg', // Opcionalno
      backgroundPosition: 'center' 
    },
    { 
      src: '/images/team-2.jpg', 
      mobileSrc: '/images/team-2-mobile.jpg', // Opcionalno
      backgroundPosition: 'center' 
    },
    { 
      src: '/images/team-3.jpg', 
      mobileSrc: '/images/team-3-mobile.jpg', // Opcionalno
      backgroundPosition: 'center' 
    },
    { 
      src: '/images/team-4.jpg', 
      mobileSrc: '/images/team-4-mobile.jpg', // Opcionalno
      backgroundPosition: 'center' 
    },
  ]

  // Detekcija veličine ekrana za responsive slike
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint u Tailwindu
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Parallax scroll efekt
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Postavi loaded state nakon mounta
  useEffect(() => {
    setIsLoaded(true)
  }, [])

  // Auto-rotacija slika na hero sekciji
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % teamImages.length)
    }, 5000) // Mijenja sliku svakih 5 sekundi
    return () => clearInterval(interval)
  }, [teamImages.length])

  // Parallax offset za hero sliku
  const parallaxOffset = scrollY * 0.5

  return (
    <div className="w-full">
      {/* Hero Sekcija s Luka Modrićem */}
      <section 
        ref={heroRef}
        className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden pb-24 sm:pb-32 md:pb-40"
      >
        {/* Rotirajuće pozadinske slike s Ken Burns efektom */}
        {teamImages.length > 0 ? (
          teamImages.map((imageConfig, index) => {
            // Odaberi sliku ovisno o veličini ekrana
            const imageSrc = isMobile && imageConfig.mobileSrc 
              ? imageConfig.mobileSrc 
              : imageConfig.src
            
            return (
              <div
                key={index}
                className={`absolute inset-0 bg-cover bg-no-repeat ken-burns transition-opacity duration-1000 ${
                  index === currentImageIndex ? 'opacity-100 z-0' : 'opacity-0 z-0'
                }`}
                style={{
                  backgroundImage: `url(${imageSrc})`,
                  backgroundPosition: imageConfig.backgroundPosition || 'center',
                  transform: `translateY(${parallaxOffset}px) scale(1.1)`,
                  transition: 'transform 0.1s ease-out, opacity 1s ease-in-out'
                }}
              >
                {/* Overlay gradient za bolju čitljivost */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80"></div>
                {/* Dodatni overlay za filmski efekt */}
                <div className="absolute inset-0 bg-gradient-to-r from-fifa-blue/20 via-transparent to-fifa-red/20"></div>
                {/* Animirani svjetleći efekti */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-fifa-gold/10 rounded-full blur-3xl animate-pulse-slow"></div>
                  <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fifa-blue/10 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80"></div>
          </div>
        )}

        {/* Sadržaj hero sekcije */}
        <div className="relative z-10 text-center px-4 sm:px-6 md:px-8 max-w-4xl mx-auto">
          {/* Glavni naslov - pulsirajući tekst */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 sm:mb-8 drop-shadow-2xl animate-pulse-slow">
            HRVATSKA JE SPREMNA
          </h1>

          {/* Luka Modrić quote */}
          <div className="mt-8 sm:mt-12 mb-16 sm:mb-20 md:mb-24 animate-fade-in-up delay-500">
            <p className="text-lg sm:text-xl md:text-2xl text-fifa-gold italic font-semibold drop-shadow-md">
              ""Najvažnije je nikad ne odustati, nikad se ne predati okolnostima, vjerovati u sebe".
            </p>
            <p className="text-base sm:text-lg text-white/80 mt-2 mb-16 sm:mb-20 md:mb-24">- Luka Modrić</p>
          </div>

          {/* Navigacijske točkice za slike */}
          {teamImages.length > 1 && (
            <div className="absolute bottom-8 sm:bottom-12 md:bottom-16 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
              {teamImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentImageIndex
                      ? 'bg-fifa-gold w-8'
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                  aria-label={`Prikaži sliku ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Call to action sekcija */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-fifa-gold mb-6 uppercase tracking-wider">
            Budite dio priče
          </h2>
          <p className="text-lg sm:text-xl text-white/80 mb-8 leading-relaxed">
            Pratite sve utakmice, rezultate i statistike u realnom vremenu. 
            Hrvatska čeka svoj trenutak.
          </p>
          
          {/* Tablica povijesti nastupa Hrvatske */}
          <div className="mt-12 overflow-x-auto rounded-xl border border-white/10 dark:border-white/5 bg-white/5 dark:bg-slate-800/50 backdrop-blur-sm">
            <div className="inline-block min-w-full">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-fifa-gold/30 dark:border-fifa-gold/20 bg-white/5 dark:bg-slate-800/70">
                    <th className="text-left py-3 px-3 sm:py-4 sm:px-6 text-fifa-gold font-bold text-xs sm:text-sm md:text-base uppercase tracking-wider">
                      Domaćin / Godina
                    </th>
                    <th className="hidden md:table-cell text-left py-3 px-3 sm:py-4 sm:px-6 text-fifa-gold font-bold text-xs sm:text-sm md:text-base uppercase tracking-wider">
                      Faza / Rezultat
                    </th>
                    <th className="text-left py-3 px-3 sm:py-4 sm:px-6 text-fifa-gold font-bold text-xs sm:text-sm md:text-base uppercase tracking-wider">
                      Pozicija
                    </th>
                  </tr>
                </thead>
                <tbody className="text-white/90 dark:text-slate-200">
                  {/* 1998 - Francuska - 3. mjesto */}
                  <tr className="border-b border-white/10 dark:border-white/5 hover:bg-white/5 dark:hover:bg-slate-700/50 transition-colors bg-amber-900/20 dark:bg-amber-900/30">
                    <td className="py-3 px-3 sm:py-4 sm:px-6">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🇫🇷</span>
                        <span className="text-blue-400 font-semibold">1998</span>
                      </div>
                    </td>
                    <td className="hidden md:table-cell py-4 px-4 sm:px-6 font-medium">Polufinale</td>
                    <td className="py-3 px-3 sm:py-4 sm:px-6">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-fifa-gold/20 text-fifa-gold font-bold">
                        3
                      </span>
                    </td>
                  </tr>
                  
                  {/* 2002 - Južna Koreja & Japan - 23. mjesto */}
                  <tr className="border-b border-white/10 dark:border-white/5 hover:bg-white/5 dark:hover:bg-slate-700/50 transition-colors bg-slate-800/30 dark:bg-slate-800/40">
                    <td className="py-3 px-3 sm:py-4 sm:px-6">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🇰🇷</span>
                        <span className="text-xl">🇯🇵</span>
                        <span className="text-blue-400 font-semibold">2002</span>
                      </div>
                    </td>
                    <td className="hidden md:table-cell py-4 px-4 sm:px-6 font-medium">Skupina</td>
                    <td className="py-3 px-3 sm:py-4 sm:px-6">
                      <span className="text-white/70 font-semibold">23.</span>
                    </td>
                  </tr>
                  
                  {/* 2006 - Njemačka - 22. mjesto */}
                  <tr className="border-b border-white/10 dark:border-white/5 hover:bg-white/5 dark:hover:bg-slate-700/50 transition-colors bg-slate-800/30 dark:bg-slate-800/40">
                    <td className="py-3 px-3 sm:py-4 sm:px-6">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🇩🇪</span>
                        <span className="text-blue-400 font-semibold">2006</span>
                      </div>
                    </td>
                    <td className="hidden md:table-cell py-4 px-4 sm:px-6 font-medium">Skupina</td>
                    <td className="py-3 px-3 sm:py-4 sm:px-6">
                      <span className="text-white/70 font-semibold">22.</span>
                    </td>
                  </tr>
                  
                  {/* 2010 - Južna Afrika - nije se kvalificirala */}
                  <tr className="border-b border-white/10 dark:border-white/5 hover:bg-white/5 dark:hover:bg-slate-700/50 transition-colors bg-slate-800/30 dark:bg-slate-800/40">
                    <td className="py-3 px-3 sm:py-4 sm:px-6">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🇿🇦</span>
                        <span className="text-blue-400 font-semibold">2010</span>
                      </div>
                    </td>
                    <td className="hidden md:table-cell py-4 px-4 sm:px-6 font-medium text-white/50">-</td>
                    <td className="py-3 px-3 sm:py-4 sm:px-6">
                      <span className="text-white/50">-</span>
                    </td>
                  </tr>
                  
                  {/* 2014 - Brazil - 19. mjesto */}
                  <tr className="border-b border-white/10 dark:border-white/5 hover:bg-white/5 dark:hover:bg-slate-700/50 transition-colors bg-slate-800/30 dark:bg-slate-800/40">
                    <td className="py-3 px-3 sm:py-4 sm:px-6">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🇧🇷</span>
                        <span className="text-blue-400 font-semibold">2014</span>
                      </div>
                    </td>
                    <td className="hidden md:table-cell py-4 px-4 sm:px-6 font-medium">Skupina</td>
                    <td className="py-3 px-3 sm:py-4 sm:px-6">
                      <span className="text-white/70 font-semibold">19.</span>
                    </td>
                  </tr>
                  
                  {/* 2018 - Rusija - 2. mjesto */}
                  <tr className="border-b border-white/10 dark:border-white/5 hover:bg-white/5 dark:hover:bg-slate-700/50 transition-colors bg-slate-700/30 dark:bg-slate-700/50">
                    <td className="py-3 px-3 sm:py-4 sm:px-6">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🇷🇺</span>
                        <span className="text-blue-400 font-semibold">2018</span>
                      </div>
                    </td>
                    <td className="hidden md:table-cell py-4 px-4 sm:px-6 font-medium">Finale</td>
                    <td className="py-3 px-3 sm:py-4 sm:px-6">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-fifa-gold/20 text-fifa-gold font-bold">
                        2
                      </span>
                    </td>
                  </tr>
                  
                  {/* 2022 - Katar - 3. mjesto */}
                  <tr className="border-b border-white/10 dark:border-white/5 hover:bg-white/5 dark:hover:bg-slate-700/50 transition-colors bg-amber-900/20 dark:bg-amber-900/30">
                    <td className="py-3 px-3 sm:py-4 sm:px-6">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🇶🇦</span>
                        <span className="text-blue-400 font-semibold">2022</span>
                      </div>
                    </td>
                    <td className="hidden md:table-cell py-4 px-4 sm:px-6 font-medium">Polufinale</td>
                    <td className="py-3 px-3 sm:py-4 sm:px-6">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-fifa-gold/20 text-fifa-gold font-bold">
                        3
                      </span>
                    </td>
                  </tr>
                  
                  {/* 2026 - SAD, Kanada, Meksiko - još nije odigrano */}
                  <tr className="border-b border-white/10 dark:border-white/5 hover:bg-white/5 dark:hover:bg-slate-700/50 transition-colors bg-slate-800/30 dark:bg-slate-800/40">
                    <td className="py-3 px-3 sm:py-4 sm:px-6">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🇺🇸</span>
                        <span className="text-xl">🇨🇦</span>
                        <span className="text-xl">🇲🇽</span>
                        <span className="text-blue-400 font-semibold">2026</span>
                      </div>
                    </td>
                    <td className="hidden md:table-cell py-4 px-4 sm:px-6 font-medium text-fifa-gold">U tijeku...</td>
                    <td className="py-3 px-3 sm:py-4 sm:px-6">
                      <span className="text-fifa-gold font-semibold">-</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home

