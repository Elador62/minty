export function slugify(text: string): string {
  return text
    .toString()
    .trim()
    .replace(/\s+/g, '-')              // replace spaces with hyphens
    .replace(/\//g, '-')               // replace slashes with hyphens
    .replace(/[^a-zA-Z0-9-]/g, '');    // remove other special chars but keep case
}

export function getCardMarketUrl(item: { game: string, card_name: string, expansion?: string, is_foil?: boolean }): string {
  const gamePath = item.game === 'pokemon' ? 'Pokemon' : 'Magic';
  const setName = slugify(item.expansion || 'Unknown-Set');
  const cardName = slugify(item.card_name);
  const foil = item.is_foil ? 'Y' : 'N';

  return `https://www.cardmarket.com/fr/${gamePath}/Products/Singles/${setName}/${cardName}?isFoil=${foil}`;
}
