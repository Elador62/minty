export async function getCardPrice(name: string, game: string, expansion?: string, isFoil?: boolean): Promise<number | null> {
  // Nettoyer le nom
  const cleanName = name.split(' (')[0].replace(/\s*\d+\s*$/, '').trim();

  try {
    if (game === 'magic') {
      // Format recommandé par l'utilisateur : !"Nom" set:code
      // On gère intelligemment si l'édition est un code ou un nom complet
      let searchQuery = `!"${cleanName}"`;
      if (expansion) {
        if (expansion.length <= 5) {
          searchQuery += ` set:${expansion}`;
        } else {
          searchQuery += ` set:"${expansion}"`;
        }
      }

      const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(searchQuery)}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.data && data.data.length > 0) {
        const p = data.data[0].prices;
        // Extraction du prix avec priorité au type (Foil/Normal)
        if (isFoil) {
          return parseFloat(p.eur_foil) || parseFloat(p.eur) || parseFloat(p.usd_foil) || parseFloat(p.usd) || null;
        }
        return parseFloat(p.eur) || parseFloat(p.eur_foil) || parseFloat(p.usd) || parseFloat(p.usd_foil) || null;
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
