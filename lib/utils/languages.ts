const LANG_FLAGS: Record<string, string> = {
  'Français': '🇫🇷',
  'Anglais': '🇬🇧',
  'Espagnol': '🇪🇸',
  'Allemand': '🇩🇪',
  'Italien': '🇮🇹',
  'Portugais': '🇵🇹',
  'Japonais': '🇯🇵',
  'Coréen': '🇰🇷',
  'Russe': '🇷🇺',
  'Chinois': '🇨🇳'
};

const LANG_CODES: Record<string, string> = {
  'Français': 'FR',
  'Anglais': 'EN',
  'Espagnol': 'ES',
  'Allemand': 'DE',
  'Italien': 'IT',
  'Portugais': 'PT',
  'Japonais': 'JP',
  'Coréen': 'KR',
  'Russe': 'RU',
  'Chinois': 'CN'
};

export function getLanguageDisplay(lang: string): string {
  const flag = LANG_FLAGS[lang];
  const code = LANG_CODES[lang];

  if (flag) return `${flag} ${code || lang}`;
  return code || lang;
}

export function getLanguageFlag(lang: string): string {
  return LANG_FLAGS[lang] || LANG_CODES[lang] || lang;
}

export const SUPPORTED_LANGUAGES = [
  "Français",
  "Anglais",
  "Espagnol",
  "Allemand",
  "Italien",
  "Portugais",
  "Japonais",
  "Coréen",
  "Russe",
  "Chinois"
];
