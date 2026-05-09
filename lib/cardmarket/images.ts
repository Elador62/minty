export async function getCardThumbnail(name: string, game: string): Promise<string | null> {
  try {
    if (game === 'magic') {
      const response = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`);
      const data = await response.json();
      return data.image_uris?.small || data.image_uris?.normal || null;
    } else if (game === 'pokemon') {
      // PokeAPI ne donne pas directement les visuels TCG facilement par nom
      // Utilisation d'une recherche simplifiée sur pokemon-tcg-api si possible ou fallback
      const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=name:"${name}"&pageSize=1`);
      const data = await response.json();
      return data.data?.[0]?.images?.small || null;
    }
  } catch (error) {
    console.error("Error fetching card thumbnail:", error);
  }
  return null;
}
