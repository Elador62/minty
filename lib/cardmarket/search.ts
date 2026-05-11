export async function getEnglishName(name: string, game: string, expansion?: string): Promise<{ name_en: string, expansion_en?: string } | null> {
  const cleanName = name.split(' (')[0].replace(/\s*\d+\s*$/, '').trim();

  try {
    if (game === 'magic') {
      let query = `!"${cleanName}"`;
      if (expansion) {
        query += expansion.length <= 5 ? ` set:${expansion}` : ` set:"${expansion}"`;
      }

      const response = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (data.data && data.data.length > 0) {
        return {
          name_en: data.data[0].name,
          expansion_en: data.data[0].set_name
        };
      }

      // Fallback fuzzy
      const fuzzyRes = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(cleanName)}`);
      const fuzzyData = await fuzzyRes.json();
      if (fuzzyData.name) {
        return { name_en: fuzzyData.name, expansion_en: fuzzyData.set_name };
      }

    } else if (game === 'pokemon') {
      let query = `name:"${cleanName}"`;
      if (expansion) {
        query += ` set.name:"${expansion}"`;
      }

      const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(query)}&pageSize=1`);
      const data = await response.json();

      if (data.data && data.data.length > 0) {
        return {
          name_en: data.data[0].name,
          expansion_en: data.data[0].set.name
        };
      }
    }
  } catch (error) {
    console.error("Error fetching English name:", error);
  }
  return null;
}
