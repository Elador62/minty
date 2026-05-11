export interface CardSearchResult {
  name_en: string;
  expansion_en: string;
  color?: string;
  card_type?: string;
  image_url?: string;
  all_editions?: {
    name: string,
    code?: string,
    color?: string,
    card_type?: string,
    name_en: string,
    image_url?: string
  }[];
}

export async function getEnglishName(name: string, game: string, expansion?: string): Promise<CardSearchResult | CardSearchResult[] | null> {
  const cleanName = name.split(' (')[0].replace(/\s*\d+\s*$/, '').trim();

  try {
    if (game === 'magic') {
      // 1. Chercher par nom exact d'abord
      const searchRes = await fetch(`https://api.scryfall.com/cards/search?q=!"${encodeURIComponent(cleanName)}"&unique=prints`);
      const searchData = await searchRes.json();

      if (searchData.data && searchData.data.length > 0) {
        const editions = searchData.data.map((c: any) => ({
          name: c.set_name,
          code: c.set,
          color: c.colors?.join(', ') || c.mana_cost,
          card_type: c.type_line,
          name_en: c.name,
          image_url: c.image_uris?.small || c.image_uris?.normal
        }));

        const uniqueEditions = editions.filter((v: any, i: any, a: any) => a.findIndex((t: any) => t.name === v.name) === i);

        const bestMatch = expansion
          ? searchData.data.find((c: any) => c.set.toLowerCase() === expansion.toLowerCase() || c.set_name.toLowerCase() === expansion.toLowerCase()) || searchData.data[0]
          : searchData.data[0];

        return {
          name_en: bestMatch.name,
          expansion_en: bestMatch.set_name,
          color: bestMatch.colors?.join(', ') || bestMatch.mana_cost,
          card_type: bestMatch.type_line,
          image_url: bestMatch.image_uris?.small || bestMatch.image_uris?.normal,
          all_editions: uniqueEditions
        };
      }

      // 2. Si pas de nom exact, chercher par terme large pour proposer des choix
      const broadRes = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(cleanName)}`);
      const broadData = await broadRes.json();

      if (broadData.data && broadData.data.length > 1) {
        // Retourner une liste de candidats uniques par nom
        const candidates = [];
        const seenNames = new Set();
        for (const c of broadData.data) {
           if (!seenNames.has(c.name)) {
             seenNames.add(c.name);
             candidates.push({
               name_en: c.name,
               expansion_en: c.set_name,
               color: c.colors?.join(', '),
               card_type: c.type_line,
               image_url: c.image_uris?.small || c.image_uris?.normal
             });
           }
        }
        return candidates;
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
      const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=name:"${cleanName}"`);
      const data = await response.json();

      if (data.data && data.data.length > 0) {
        // Si beaucoup de cartes différentes, proposer des choix
        const uniqueNames = Array.from(new Set(data.data.map((c: any) => c.name)));
        if (uniqueNames.length > 1 && !cleanName.includes('"')) {
           return uniqueNames.map(name => {
              const best = data.data.find((c: any) => c.name === name);
              return {
                name_en: best.name,
                expansion_en: best.set.name,
                color: best.types?.join(', '),
                card_type: best.supertype,
                image_url: best.images.small
              };
           });
        }

        const editions = data.data.map((c: any) => ({
          name: c.set.name,
          color: c.types?.join(', '),
          card_type: c.supertype + (c.subtypes ? ' - ' + c.subtypes.join(', ') : ''),
          name_en: c.name,
          image_url: c.images.small
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
          image_url: bestMatch.images.small,
          all_editions: uniqueEditions
        };
      }
    }
  } catch (error) {
    console.error("Error fetching card data:", error);
  }
  return null;
}
