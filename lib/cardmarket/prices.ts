export async function getCardPrice(name: string, game: string, expansion?: string, isFoil?: boolean): Promise<number | null> {
  // Nettoyer le nom
  const cleanName = name.split(' (')[0].replace(/\s*\d+\s*$/, '').trim();

  try {
    if (game === 'magic') {
      // Format spécifique demandé : !"Nom" set:code
      const searchQuery = expansion
        ? `!"${cleanName}" set:${expansion}`
        : `!"${cleanName}"`;

      const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(searchQuery)}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.data && data.data.length > 0) {
        const p = data.data[0].prices;
        if (isFoil) {
          return parseFloat(p.eur_foil || p.eur || p.usd_foil || p.usd) || null;
        }
        return parseFloat(p.eur || p.eur_foil || p.usd || p.usd_foil) || null;
      }

      // Fallback si l'édition n'est pas un code (recherche par nom d'édition)
      if (expansion && expansion.length > 5) {
        const fallbackQuery = `!"${cleanName}" set:"${expansion}"`;
        const fallbackUrl = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(fallbackQuery)}`;
        const fallbackRes = await fetch(fallbackUrl);
        const fallbackData = await fallbackRes.json();
        if (fallbackData.data && fallbackData.data.length > 0) {
          const p = fallbackData.data[0].prices;
          if (isFoil) return parseFloat(p.eur_foil || p.eur) || null;
          return parseFloat(p.eur || p.eur_foil) || null;
        }
      }

    } else if (game === 'pokemon') {
      // Format spécifique demandé : name:"Nom" set.name:"Édition"
      let query = `name:"${cleanName}"`;
      if (expansion) {
        query += ` set.name:"${expansion}"`;
      }

      const url = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(query)}&pageSize=1`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.data && data.data.length > 0) {
        const card = data.data[0];
        if (card.cardmarket?.prices?.trendPrice) {
          return card.cardmarket.prices.trendPrice;
        }
      }
    }
  } catch (error) {
    console.error("Error fetching card price:", error);
  }
  return null;
}
