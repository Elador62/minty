export interface ParsedCard {
  quantity: number;
  name: string;
  expansion: string;
  details?: string; // e.g. "R", "SAR", "ART"
  language: string;
  condition: string;
  price: number;
}

export interface ParsedOrder {
  orderId: string;
  buyer: string;
  status: string;
  address?: string;
  trackingId?: string;
  totalValue: number;
  commission?: number;
  netValue?: number;
  shippingCost: number;
  items: ParsedCard[];
}

export function parseCardMarketEmail(text: string): ParsedOrder | null {
  const orderIdMatch = text.match(/Commande ([\d-]+)/);
  const buyerMatch = text.match(/Acheteur: (.*)/);
  const statusMatch = text.match(/État: (.*)/);

  // Extraction de l'adresse (entre État et Suivi ou Valeur totale)
  // L'adresse est souvent multi-ligne juste après l'état
  let address = "";
  const addressRegex = /État:.*\n\n([\s\S]*?)\n\n(?:Suivi:|Valeur totale)/;
  const addressMatch = text.match(addressRegex);
  if (addressMatch) {
    const extracted = addressMatch[1].trim();
    if (extracted !== "Suivi:") {
        address = extracted;
    }
  }

  const trackingMatch = text.match(/Suivi: (.*)/);
  const totalMatch = text.match(/Valeur totale de vente: ([\d,]+) EUR/);
  const shippingMatch = text.match(/Frais de port ([\d,]+) EUR/);

  if (!orderIdMatch || !buyerMatch) return null;

  const items: ParsedCard[] = [];
  // Extraction des items entre "Contenu:" et "Total" ou la fin des +++++
  const contentSectionMatch = text.match(/\+{10,}\n([\s\S]*?)\n\+{10,}/);

  if (contentSectionMatch) {
    const lines = contentSectionMatch[1].split('\n');
    for (const line of lines) {
      if (line.includes('Frais de port') || line.trim() === '') continue;

      // Format: 1x Nom (Expansion) - Details - Langue - Condition Prix EUR
      // Exemple: 1x Flameshadow Conjuring (Magic Origins) - R - Français - NM 1,00 EUR
      const cardMatch = line.match(/(\d+)x (.*?) \((.*?)\) - (.*?) - (.*?) - (.*?) ([\d,]+) EUR/);
      if (cardMatch) {
        items.push({
          quantity: parseInt(cardMatch[1]),
          name: cardMatch[2].trim(),
          expansion: cardMatch[3].trim(),
          details: cardMatch[4].trim(),
          language: cardMatch[5].trim(),
          condition: cardMatch[6].trim(),
          price: parseFloat(cardMatch[7].replace(',', '.'))
        });
      } else {
        // Fallback pour des formats légèrement différents
        const simpleCardMatch = line.match(/(\d+)x (.*?) \((.*?)\) - (.*?) - (.*?) ([\d,]+) EUR/);
        if (simpleCardMatch) {
           items.push({
            quantity: parseInt(simpleCardMatch[1]),
            name: simpleCardMatch[2].trim(),
            expansion: simpleCardMatch[3].trim(),
            language: simpleCardMatch[4].trim(),
            condition: simpleCardMatch[5].trim(),
            price: parseFloat(simpleCardMatch[6].replace(',', '.'))
          });
        }
      }
    }
  }

  return {
    orderId: orderIdMatch[1],
    buyer: buyerMatch[1].trim(),
    status: statusMatch ? statusMatch[1].trim() : "Inconnu",
    address: address,
    trackingId: trackingMatch ? trackingMatch[1].trim() : undefined,
    totalValue: totalMatch ? parseFloat(totalMatch[1].replace(',', '.')) : 0,
    shippingCost: shippingMatch ? parseFloat(shippingMatch[1].replace(',', '.')) : 0,
    items
  };
}
