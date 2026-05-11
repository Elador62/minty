export async function getCardThumbnail(name: string, game: string): Promise<string | null> {
  // Nettoyer le nom pour enlever les mentions inutiles au parsing (ex: (Dominaria), Foil, etc.)
  const cleanName = name.split(' (')[0].replace(/\s*\d+\s*$/, '').trim();

  try {
    if (game === 'magic') {
      const response = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(cleanName)}`);
      const data = await response.json();
      if (data.image_uris) {
        return data.image_uris.small || data.image_uris.normal;
      }

      // Fallback Scryfall search if direct match fails
      const searchResponse = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(cleanName)}`);
      const searchData = await searchResponse.json();
      return searchData.data?.[0]?.image_uris?.small || null;

    } else if (game === 'pokemon') {
      const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=name:"${cleanName}"&pageSize=1`);
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        return data.data[0].images.small || data.data[0].images.large;
      }

      // Fallback Pokemon search with fuzzy
      const fuzzyResponse = await fetch(`https://api.pokemontcg.io/v2/cards?q=name:"*${cleanName}*"&pageSize=1`);
      const fuzzyData = await fuzzyResponse.json();
      return fuzzyData.data?.[0]?.images?.small || null;
    }
  } catch (error) {
    console.error("Error fetching card thumbnail:", error);
  }
  return null;
}
