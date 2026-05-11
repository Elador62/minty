export interface CardSearchResult {
  name_en: string;
  expansion_en: string;
  color?: string;
  card_type?: string;
  all_editions?: {
    name: string,
    code?: string,
    color?: string,
    card_type?: string,
    name_en: string
  }[];
}

export async function getEnglishName(name: string, game: string, expansion?: string): Promise<CardSearchResult | null> {
  const cleanName = name.split(' (')[0].replace(/\s*\d+\s*$/, '').trim();

  try {
    if (game === 'magic') {
      // 1. Chercher toutes les versions de cette carte pour lister les éditions
      const searchRes = await fetch(`https://api.scryfall.com/cards/search?q=!"${encodeURIComponent(cleanName)}"&unique=prints`);
      const searchData = await searchRes.json();

      if (searchData.data && searchData.data.length > 0) {
        const editions = searchData.data.map((c: any) => ({
          name: c.set_name,
          code: c.set,
          color: c.colors?.join(', ') || c.mana_cost,
          card_type: c.type_line,
          name_en: c.name
        }));

        // Filtrer les doublons d'éditions (certaines cartes ont plusieurs illustrations dans le même set)
        const uniqueEditions = editions.filter((v: any, i: any, a: any) => a.findIndex((t: any) => t.name === v.name) === i);

        const bestMatch = expansion
          ? searchData.data.find((c: any) => c.set.toLowerCase() === expansion.toLowerCase() || c.set_name.toLowerCase() === expansion.toLowerCase()) || searchData.data[0]
          : searchData.data[0];

        return {
          name_en: bestMatch.name,
          expansion_en: bestMatch.set_name,
          color: bestMatch.colors?.join(', ') || bestMatch.mana_cost,
          card_type: bestMatch.type_line,
          all_editions: uniqueEditions
        };
      }

      // Fallback fuzzy si recherche exacte échoue
      const fuzzyRes = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(cleanName)}`);
      const fuzzyData = await fuzzyRes.json();
      if (fuzzyData.name) {
        return {
          name_en: fuzzyData.name,
          expansion_en: fuzzyData.set_name,
          color: fuzzyData.colors?.join(', '),
          card_type: fuzzyData.type_line
        };
      }

    } else if (game === 'pokemon') {
      // Pour Pokémon, on liste aussi via une recherche large
      const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=name:"${cleanName}"`);
      const data = await response.json();

      if (data.data && data.data.length > 0) {
        const editions = data.data.map((c: any) => ({
          name: c.set.name,
          color: c.types?.join(', '),
          card_type: c.supertype + (c.subtypes ? ' - ' + c.subtypes.join(', ') : ''),
          name_en: c.name
        }));

        const uniqueEditions = editions.filter((v: any, i: any, a: any) => a.findIndex((t: any) => t.name === v.name) === i);

        const bestMatch = expansion
          ? data.data.find((c: any) => c.set.name.toLowerCase() === expansion.toLowerCase()) || data.data[0]
          : data.data[0];

        return {
          name_en: bestMatch.name,
          expansion_en: bestMatch.set.name,
          color: bestMatch.types?.join(', '),
          card_type: bestMatch.supertype + (bestMatch.subtypes ? ' - ' + bestMatch.subtypes.join(', ') : ''),
          all_editions: uniqueEditions
        };
      }
    }
  } catch (error) {
    console.error("Error fetching card data:", error);
  }
  return null;
}
