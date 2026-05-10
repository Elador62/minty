export async function getCardPrice(name: string, game: string, expansion?: string): Promise<number | null> {
  // Nettoyer le nom
  const cleanName = name.split(' (')[0].replace(/\s*\d+\s*$/, '').trim();

  try {
    if (game === 'magic') {
      let url = `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(cleanName)}`;
      if (expansion) {
        url += `&set=${encodeURIComponent(expansion)}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.prices) {
        // Scryfall fournit eur, eur_foil, usd, usd_foil
        return parseFloat(data.prices.eur || data.prices.eur_foil || data.prices.usd || data.prices.usd_foil) || null;
      }

      // Fallback search
      const searchResponse = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(cleanName)}${expansion ? `+set:${expansion}` : ''}`);
      const searchData = await searchResponse.json();
      if (searchData.data?.[0]?.prices) {
        const p = searchData.data[0].prices;
        return parseFloat(p.eur || p.eur_foil || p.usd || p.usd_foil) || null;
      }

    } else if (game === 'pokemon') {
      let query = `name:"${cleanName}"`;
      if (expansion) {
        query += ` set.name:"${expansion}"`;
      }

      const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(query)}&pageSize=1`);
      const data = await response.json();

      if (data.data && data.data.length > 0) {
        const card = data.data[0];
        // pokemontcg.io fournit tcgplayer.prices ou cardmarket.prices
        if (card.cardmarket?.prices?.trendPrice) {
          return card.cardmarket.prices.trendPrice;
        }
        if (card.tcgplayer?.prices) {
          const prices = card.tcgplayer.prices;
          const firstPriceType = Object.keys(prices)[0];
          return prices[firstPriceType]?.market || prices[firstPriceType]?.mid || null;
        }
      }
    }
  } catch (error) {
    console.error("Error fetching card price:", error);
  }
  return null;
}
