import { memo } from 'react'

// Mapiranje kodova zemalja za zastave
const FLAG_MAP = {
  'AL': '🇦🇱', // Albanija
  'DZ': '🇩🇿', // Alžir
  'AR': '🇦🇷', // Argentina
  'AU': '🇦🇺', // Australija
  'AT': '🇦🇹', // Austrija
  'BE': '🇧🇪', // Belgija
  'BO': '🇧🇴', // Bolivija
  'BA': '🇧🇦', // Bosna i Hercegovina
  'BR': '🇧🇷', // Brazil
  'CZ': '🇨🇿', // Češka
  'CW': '🇨🇼', // Curacao
  'DK': '🇩🇰', // Danska
  'EG': '🇪🇬', // Egipat
  'EC': '🇪🇨', // Ekvador
  'GB-ENG': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', // Engleska
  'FR': '🇫🇷', // Francuska
  'GH': '🇬🇭', // Gana
  'HT': '🇭🇹', // Haiti
  'HR': '🇭🇷', // Hrvatska
  'IQ': '🇮🇶', // Irak
  'IR': '🇮🇷', // Iran
  'IE': '🇮🇪', // Irska
  'IT': '🇮🇹', // Italija
  'JM': '🇯🇲', // Jamajka
  'JP': '🇯🇵', // Japan
  'JO': '🇯🇴', // Jordan
  'ZA': '🇿🇦', // Južnoafrička Republika
  'KR': '🇰🇷', // Južna Koreja
  'CA': '🇨🇦', // Kanada
  'QA': '🇶🇦', // Katar
  'CO': '🇨🇴', // Kolumbija
  'CG': '🇨🇬', // Kongo
  'XK': '🇽🇰', // Kosovo
  'MK': '🇲🇰', // Makedonija
  'MA': '🇲🇦', // Maroko
  'MX': '🇲🇽', // Meksiko
  'NL': '🇳🇱', // Nizozemska
  'DE': '🇩🇪', // Njemačka
  'NO': '🇳🇴', // Norveška
  'NC': '🇳🇨', // Nova Kaledonija (koristi francusku ili posebnu)
  'NZ': '🇳🇿', // Novi Zeland
  'CI': '🇨🇮', // Obala bjelokosti
  'PA': '🇵🇦', // Panama
  'PY': '🇵🇾', // Paragvaj
  'PL': '🇵🇱', // Poljska
  'PT': '🇵🇹', // Portugal
  'RO': '🇷🇴', // Rumunjska
  'US': '🇺🇸', // SAD
  'SA': '🇸🇦', // Saudijska Arabija
  'SN': '🇸🇳', // Senegal
  'GB-NIR': '🏴󠁧󠁢󠁮󠁩󠁲󠁿', // Sjeverna Irska
  'GB-SCT': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', // Škotska
  'SK': '🇸🇰', // Slovačka
  'ES': '🇪🇸', // Španjolska
  'SR': '🇸🇷', // Surinam
  'SE': '🇸🇪', // Švedska
  'CH': '🇨🇭', // Švicarska
  'TN': '🇹🇳', // Tunis
  'TR': '🇹🇷', // Turska
  'UA': '🇺🇦', // Ukrajina
  'UY': '🇺🇾', // Urugvaj
  'UZ': '🇺🇿', // Uzbekistan
  'GB-WLS': '🏴󠁧󠁢󠁷󠁬󠁳󠁿', // Wales
  'CV': '🇨🇻', // Zelenortski otoci
}

// SVG za Ulster Banner (Sjeverna Irska) - bijela pozadina, crveni križ, bijela zvijezda s crvenom rukom i krunom
const UlsterBannerSVG = ({ size }) => {
  const width = size === 'sm' ? 24 : size === 'lg' ? 48 : 32
  const height = size === 'sm' ? 16 : size === 'lg' ? 32 : 21

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 1200 600"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle', borderRadius: '2px' }}
    >
      {/* Bijela pozadina */}
      <rect width="1200" height="600" fill="#FFFFFF" />
      {/* Crveni križ sv. Jurja */}
      <rect x="0" y="250" width="1200" height="100" fill="#C8102E" />
      <rect x="550" y="0" width="100" height="600" fill="#C8102E" />
      {/* Bijela šesterokraka zvijezda u sredini */}
      <g transform="translate(600, 300)">
        {/* Zvijezda (šesterokraka) */}
        <path d="M 0,-70 L 20,-25 L 65,-25 L 33,-8 L 52,35 L 0,18 L -52,35 L -33,-8 L -65,-25 L -20,-25 Z" fill="#FFFFFF" stroke="#C8102E" strokeWidth="2" />
        {/* Crvena ruka Ulstera */}
        <path d="M -18,-15 L -12,-25 L -3,-20 L 0,-30 L 3,-20 L 12,-25 L 18,-15 L 12,-8 L 8,-3 L 3,-8 L 0,-3 L -3,-8 L -8,-3 L -12,-8 Z" fill="#C8102E" />
        {/* Zlatna kruna iznad ruke */}
        <path d="M -12,-35 L -8,-42 L 0,-38 L 8,-42 L 12,-35 L 8,-30 L 0,-33 L -8,-30 Z" fill="#FFD700" stroke="#C8102E" strokeWidth="1" />
      </g>
    </svg>
  )
}

const SIZE_CLASSES = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-4xl'
}

/**
 * Memoizirana Flag komponenta - sprječava nepotrebne renderiranja
 */
const Flag = memo(function Flag({ code, size = 'md' }) {
  const sizeClass = SIZE_CLASSES[size]

  // Poseban slučaj za Sjevernu Irsku - koristi SVG
  if (code === 'GB-NIR') {
    return (
      <span
        className={`flag ${sizeClass}`}
        role="img"
        aria-label="Sjeverna Irska"
        style={{ display: 'inline-block', verticalAlign: 'middle' }}
      >
        <UlsterBannerSVG size={size} />
      </span>
    )
  }

  const flag = FLAG_MAP[code] || '🏳️'

  return (
    <span
      className={`inline-block align-middle filter drop-shadow-sm hover:scale-110 transition-transform ${sizeClass}`}
      role="img"
      aria-label={code}
    >
      {flag}
    </span>
  )
})

export default Flag
export { FLAG_MAP }

