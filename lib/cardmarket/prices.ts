export async function getCardPrice(name: string, game: string, expansion?: string, isFoil?: boolean, nameEn?: string, setCode?: string): Promise<number | null> {
  // On utilise le nom anglais en priorité s'il est fourni
  const cleanName = (nameEn || name).split(' (')[0].replace(/\s*\d+\s*$/, '').trim();

  // Mode debugging pour Jules si nécessaire
  // console.log(`Fetching price for: ${cleanName}, game: ${game}, expansion: ${expansion}, foil: ${isFoil}, setCode: ${setCode}`);

  try {
    if (game === 'magic') {
      // Structure exacte demandée : https://api.scryfall.com/cards/named?exact="<card_name>"&set=<set_code>
      let url = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(`"${cleanName}"`)}`;

      // On utilise le setCode s'il est fourni, sinon on tente avec l'expansion si elle ressemble à un code
      const set = setCode || (expansion && expansion.length <= 5 ? expansion : null);
      if (set) {
        url += `&set=${encodeURIComponent(set)}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.prices) {
        const p = data.prices;
        let price = null;
        if (isFoil) {
          price = parseFloat(p.eur_foil) || parseFloat(p.eur) || parseFloat(p.usd_foil) || parseFloat(p.usd);
        } else {
          price = parseFloat(p.eur) || parseFloat(p.eur_foil) || parseFloat(p.usd) || parseFloat(p.usd_foil);
        }
        if (price) return price;
      }

      // Fallback search si named échoue
      const sc = setCode || (expansion && expansion.length <= 5 ? expansion : null);
      const searchQuery = sc ? `!"${cleanName}" set:${sc}` : `!"${cleanName}"`;
      const searchRes = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(searchQuery)}`);
      const searchData = await searchRes.json();
      if (searchData.data?.[0]?.prices) {
        const p = searchData.data[0].prices;
        let price = null;
        if (isFoil) {
          price = parseFloat(p.eur_foil) || parseFloat(p.eur);
        } else {
          price = parseFloat(p.eur) || parseFloat(p.eur_foil);
        }
        if (price) return price;
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
