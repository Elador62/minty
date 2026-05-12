import { createClient } from "@/lib/supabase/client";

export async function getActiveAlerts(supabase: ReturnType<typeof createClient>) {
  // 1. Fetch settings
  const { data: settings } = await supabase
    .from('user_settings')
    .select('*')
    .single();

  const threshold = settings?.price_alert_threshold || 10;
  const shipOrange = settings?.delay_shipping_orange || 4;
  const shipRed = settings?.delay_shipping_red || 7;
  const recOrange = settings?.delay_reception_orange || 5;
  const recRed = settings?.delay_reception_red || 7;

  const alerts: any[] = [];

  // 2. Price Alerts
  const { data: items } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('is_archived', false);

  if (items) {
    items.forEach(item => {
      const diff = item.listed_price > 0 ? ((item.last_market_price - item.listed_price) / item.listed_price) * 100 : 0;
      if (Math.abs(diff) >= threshold) {
        alerts.push({
          id: `price-${item.id}`,
          type: 'price',
          title: item.card_name,
          description: `${diff > 0 ? 'Hausse' : 'Baisse'} de ${Math.abs(diff).toFixed(1)}% (${item.listed_price}€ → ${item.last_market_price}€)`,
          date: item.updated_at || item.created_at,
          severity: 'none',
          metadata: {
            item,
            diff
          }
        });
      }
    });
  }

  // 3. Shipping Alerts
  const { data: shipOrders } = await supabase
    .from('orders')
    .select('*')
    .not('status', 'in', ['shipped', 'completed']);

  if (shipOrders) {
    const now = new Date();
    shipOrders.forEach(order => {
      const days = Math.floor((now.getTime() - new Date(order.created_at).getTime()) / (1000 * 3600 * 24));
      if (days >= shipOrange) {
        alerts.push({
          id: `ship-${order.id}`,
          type: 'shipping',
          title: `Commande #${order.external_order_id}`,
          description: `En attente d'expédition depuis ${days} jours (Acheteur: ${order.buyer_name})`,
          date: order.created_at,
          severity: days >= shipRed ? 'red' : 'orange',
          metadata: { order, days }
        });
      }
    });
  }

  // 4. Reception Alerts
  const { data: recOrders } = await supabase
    .from('orders')
    .select('*')
    .eq('status', 'shipped');

  if (recOrders) {
    const now = new Date();
    recOrders.forEach(order => {
      if (!order.shipped_at) return;
      const days = Math.floor((now.getTime() - new Date(order.shipped_at).getTime()) / (1000 * 3600 * 24));
      if (days >= recOrange) {
        alerts.push({
          id: `rec-${order.id}`,
          type: 'reception',
          title: `Commande #${order.external_order_id}`,
          description: `En attente de réception depuis ${days} jours (Expédiée le ${new Date(order.shipped_at).toLocaleDateString()})`,
          date: order.shipped_at,
          severity: days >= recRed ? 'red' : 'orange',
          metadata: { order, days }
        });
      }
    });
  }

  return alerts;
}
