import { parseCardMarketEmail } from './emailParser';

const samples = [
`Commande 20231024-123456
Vendeur: saler
Acheteur: buyer_one
État: À payer

Suivi:

Valeur totale de vente: 2,82 EUR
Commission: 0,05 EUR
Valeur nette de vente: 2,77 EUR

Contenu:

++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
1x Flameshadow Conjuring (Magic Origins) - R - Français - NM 1,00 EUR
Frais de port 1,82 EUR
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Total 2,82 EUR`,

`Commande 20231025-987654
Vendeur: saler
Acheteur: buyer_two
État: Payée

123 Rue de la Carte
75000 Paris
France

Suivi: LP123456789FR

Valeur totale de vente: 16,52 EUR
Commission: 0,70 EUR
Valeur nette de vente: 15,82 EUR

Contenu:

++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
1x Skuntank V (Silver Tempest) - SAR - Français - NM 14,00 EUR
Frais de port 2,52 EUR
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Total 16,52 EUR`
];

samples.forEach((sample, index) => {
  console.log(`--- Test Sample ${index + 1} ---`);
  const result = parseCardMarketEmail(sample);
  console.log(JSON.stringify(result, null, 2));
});
