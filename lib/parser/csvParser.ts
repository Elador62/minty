export interface ParsedCSVOrder {
  orderId: string;
  buyer: string;
  name: string;
  address: string;
  date: string;
  itemCount: number;
  merchandiseValue: number;
  shippingCost: number;
  totalValue: number;
  currency: string;
  items: Array<{
    quantity: number;
    name: string;
    expansion: string;
    condition: string;
    language: string;
    price: number;
    isFoil: boolean;
  }>;
}

export function parseCardMarketCSV(csvText: string): ParsedCSVOrder[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(';');
  const orders: ParsedCSVOrder[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(';');
    if (values.length < headers.length) continue;

    const orderId = values[0];
    const buyer = values[1];
    const name = values[2];
    const street = values[3];
    const city = values[4];
    const country = values[5];
    const date = values[8];
    const itemCount = parseInt(values[9]);
    const merchandiseValue = parseFloat(values[10].replace(',', '.'));
    const shippingCost = parseFloat(values[11].replace(',', '.'));
    const totalValue = parseFloat(values[12].replace(',', '.'));
    const currency = values[14];

    // Parse items from Description (formatted as "1x Name (Expansion) - ID - Condition - Language - Price | ...")
    const description = values[15];
    const itemStrings = description.split(' | ');
    const items = itemStrings.map(s => {
      // Regexp to extract: 1x Name (Expansion) - ID - Condition - Language - Price
      // Example: 1x Marwyn, the Nurturer (Dominaria) - 172 - Rare - NM - French - 1,45 EUR
      const parts = s.split(' - ');
      const qtyNameExp = parts[0]; // "1x Marwyn, the Nurturer (Dominaria)"

      const qtyMatch = qtyNameExp.match(/^(\d+)x/);
      const quantity = qtyMatch ? parseInt(qtyMatch[1]) : 1;

      const nameExp = qtyNameExp.replace(/^\d+x\s+/, '');
      const expMatch = nameExp.match(/\((.*)\)$/);
      const expansion = expMatch ? expMatch[1] : '';
      const name = nameExp.replace(/\s*\(.*\)$/, '');

      const condition = parts[2] || 'NM';
      const language = parts[3] || 'French';
      const isFoil = s.toLowerCase().includes('foil');

      const pricePart = parts[parts.length - 1]; // "1,45 EUR"
      const price = parseFloat(pricePart.split(' ')[0].replace(',', '.'));

      return { quantity, name, expansion, condition, language, price, isFoil };
    });

    orders.push({
      orderId,
      buyer,
      name,
      address: `${name}\n${street}\n${city}\n${country}`,
      date,
      itemCount,
      merchandiseValue,
      shippingCost,
      totalValue,
      currency,
      items
    });
  }

  return orders;
}
