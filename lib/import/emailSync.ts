import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { parseCardMarketEmail } from '../parser/emailParser';
import { createClient } from '../supabase/client';
import { getCardThumbnail } from '../cardmarket/images';

export async function syncUserEmails(userId: string, importToken: string) {
  if (!importToken) throw new Error("Jeton d'importation manquant.");

  const client = new ImapFlow({
    host: process.env.IMAP_HOST || 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: {
      user: process.env.IMAP_USER || '',
      pass: process.env.IMAP_PASSWORD || ''
    },
    logger: false
  });

  await client.connect();

  let lock = await client.getMailboxLock('INBOX');
  const importedOrders = [];

  try {
    // On cherche les mails destinés à minty.imports+TOKEN@gmail.com
    // Note: Le format exact dépend de comment le mail arrive,
    // mais Gmail préserve généralement l'adresse +token dans le To:
    const searchTarget = `${process.env.IMAP_USER_PREFIX || 'minty.imports'}+${importToken}@gmail.com`;

    // On cherche les mails non lus OU on scanne tout ?
    // L'utilisateur a demandé un scan complet des mails stockés.
    // Pour éviter de tout re-parser à chaque fois, on filtre par destinataire
    // Note: On récupère tous les messages et on filtre manuellement si nécessaire
    // ou on utilise search si imapflow le permet
    // L'utilisateur a demandé un scan complet des mails stockés.
    // Pour éviter de tout re-parser à chaque fois, on filtre par destinataire
    // imapflow.fetch est plus robuste pour obtenir le contenu
    // On cherche d'abord les UIDs correspondants
    const uids = await client.search({
        to: searchTarget
    });

    if (!uids || uids.length === 0) return [];

    const messages = client.fetch(uids, {
        source: true
    });

    for await (let message of messages) {
      if (!message.source) continue;
      const parsed = await simpleParser(message.source);
      const emailText = parsed.text || "";

      const order = parseCardMarketEmail(emailText);
      if (order) {
        const saved = await saveOrderIfNew(userId, order);
        if (saved) {
          importedOrders.push(order.orderId);
        }
      }
    }
  } finally {
    lock.release();
    await client.logout();
  }

  return importedOrders;
}

async function saveOrderIfNew(userId: string, order: any) {
  const supabase = createClient();

  // Vérifier si la commande existe déjà
  const { data: existing } = await supabase
    .from('orders')
    .select('id')
    .eq('user_id', userId)
    .eq('external_order_id', order.orderId)
    .single();

  if (existing) return false;

  // Créer la commande
  const { data: newOrder, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      external_order_id: order.orderId,
      buyer_name: order.buyer,
      buyer_address: order.address,
      total_price: order.totalValue,
      shipping_cost: order.shippingCost,
      status: 'paid',
      source: 'auto-email',
      created_at: new Date().toISOString() // On pourrait essayer d'extraire la date du mail
    })
    .select()
    .single();

  if (orderError) throw orderError;

  // Insérer les items
  const itemsToInsert = [];
  for (const item of order.items) {
    const game = item.expansion?.toLowerCase().includes('magic') || item.details === 'R' ? 'magic' : 'pokemon';
    const imageUrl = await getCardThumbnail(item.name, game);

    for (let i = 0; i < item.quantity; i++) {
      itemsToInsert.push({
        order_id: newOrder.id,
        card_name: item.name,
        expansion: item.expansion,
        game,
        condition: item.condition,
        language: item.language,
        quantity: 1,
        price: item.price,
        image_url: imageUrl
      });
    }
  }

  const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert);
  if (itemsError) throw itemsError;

  return true;
}
