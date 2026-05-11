export async function getCardPrice(name: string, game: string, expansion?: string, isFoil?: boolean, nameEn?: string): Promise<number | null> {
  // On utilise le nom anglais en priorité s'il est fourni
  const cleanName = (nameEn || name).split(' (')[0].replace(/\s*\d+\s*$/, '').trim();

  try {
    if (game === 'magic') {
      // Structure exacte demandée : https://api.scryfall.com/cards/named?exact="<card_name>"&set=<set_code>
      let url = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(`"${cleanName}"`)}`;
      if (expansion && expansion.length <= 5) {
        url += `&set=${encodeURIComponent(expansion)}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.prices) {
        const p = data.prices;
        if (isFoil) {
          return parseFloat(p.eur_foil) || parseFloat(p.eur) || parseFloat(p.usd_foil) || parseFloat(p.usd) || null;
        }
        return parseFloat(p.eur) || parseFloat(p.eur_foil) || parseFloat(p.usd) || parseFloat(p.usd_foil) || null;
      }

      // Fallback search si named échoue
      const searchQuery = expansion && expansion.length <= 5 ? `!"${cleanName}" set:${expansion}` : `!"${cleanName}"`;
      const searchRes = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(searchQuery)}`);
      const searchData = await searchRes.json();
      if (searchData.data?.[0]?.prices) {
        const p = searchData.data[0].prices;
        if (isFoil) return parseFloat(p.eur_foil) || parseFloat(p.eur) || null;
        return parseFloat(p.eur) || parseFloat(p.eur_foil) || null;
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
