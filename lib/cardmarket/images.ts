export async function getCardThumbnail(name: string, game: string): Promise<string | null> {
  const data = await fetchCardMetadata(name, game);
  return data?.image_url || null;
}

export async function fetchCardMetadata(name: string, game: string, expansion?: string) {
  // Nettoyer le nom pour enlever les mentions inutiles au parsing
  const cleanName = name.split(' (')[0].replace(/\s*\d+\s*$/, '').trim();

  try {
    if (game === 'magic') {
      let url = `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(cleanName)}`;
      if (expansion) {
        // Some users might pass set code or set name in expansion field
        // We try with fuzzy match first to get the correct set code
        url = `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(cleanName)}&set=${encodeURIComponent(expansion)}`;
      }

      let response = await fetch(url);
      let data = await response.json();

      if (data.status === 404 && expansion) {
        // Try without expansion if it failed
        response = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(cleanName)}`);
        data = await response.json();
      }

      if (data.id) {
        return {
          card_name_en: data.name,
          set_code: data.set.toUpperCase(),
          image_url: data.image_uris?.small || data.image_uris?.normal || null,
          price: data.prices?.eur || data.prices?.eur_foil || null,
          scryfall_id: data.id
        };
      }
    } else if (game === 'pokemon') {
      const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=name:"${cleanName}"&pageSize=1`);
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        const card = data.data[0];
        return {
          card_name_en: card.name,
          set_code: card.set.id,
          image_url: card.images.small || card.images.large || null,
          price: card.cardmarket?.prices?.trendPrice || null
        };
      }
    }
  } catch (error) {
    console.error("Error fetching card metadata:", error);
  }
  return null;
}

export async function getScryfallPrice(nameEn: string, setCode: string) {
  try {
    const url = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(nameEn)}&set=${encodeURIComponent(setCode)}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.prices) {
      return data.prices.eur || data.prices.eur_foil || null;
    }
  } catch (error) {
    console.error("Error fetching Scryfall price:", error);
  }
  return null;
}
