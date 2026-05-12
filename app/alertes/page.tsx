"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Clock, Truck, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchAlerts() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Settings
      const { data: settings } = await supabase.from('user_settings').select('*').single();
      const threshold = settings?.price_alert_threshold || 10;
      const shipOrange = settings?.shipping_delay_orange || 4;
      const shipRed = settings?.shipping_delay_red || 7;
      const recOrange = settings?.reception_delay_orange || 5;
      const recRed = settings?.reception_delay_red || 7;

      const allAlerts: any[] = [];

      // 2. Price Alerts
      const { data: inventory } = await supabase
        .from('inventory_items')
        .select('*')
        .neq('last_market_price', 0);

      inventory?.forEach((item: any) => {
        const diff = item.listed_price > 0 ? ((Number(item.last_market_price) - Number(item.listed_price)) / Number(item.listed_price)) * 100 : 0;
        if (Math.abs(diff) >= threshold) {
          allAlerts.push({
            type: 'price',
            severity: diff > 0 ? 'high' : 'info',
            title: `Variation de prix : ${item.card_name}`,
            description: `${diff > 0 ? 'Hausse' : 'Baisse'} de ${Math.abs(diff).toFixed(1)}% par rapport à votre prix listé.`,
            date: new Date().toISOString(),
            link: '/collection',
            icon: diff > 0 ? TrendingUp : TrendingDown
          });
        }
      });

      // 3. Shipping & Reception Alerts
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['paid', 'ready', 'preparing', 'shipped']);

      orders?.forEach((order: any) => {
        const daysSinceCreation = (new Date().getTime() - new Date(order.created_at).getTime()) / (1000 * 3600 * 24);

        if (['paid', 'ready', 'preparing'].includes(order.status)) {
          if (daysSinceCreation > shipRed) {
            allAlerts.push({
              type: 'delay_ship',
              severity: 'critical',
              title: `Retard d'envoi critique : ${order.buyer_name}`,
              description: `Commande en attente depuis ${Math.floor(daysSinceCreation)} jours.`,
              date: order.created_at,
              link: '/suivi',
              icon: Clock
            });
          } else if (daysSinceCreation > shipOrange) {
            allAlerts.push({
              type: 'delay_ship',
              severity: 'warning',
              title: `Retard d'envoi : ${order.buyer_name}`,
              description: `Commande en attente depuis ${Math.floor(daysSinceCreation)} jours.`,
              date: order.created_at,
              link: '/suivi',
              icon: Clock
            });
          }
        }

        if (order.status === 'shipped' && order.shipped_at) {
          const daysSinceShipping = (new Date().getTime() - new Date(order.shipped_at).getTime()) / (1000 * 3600 * 24);
          if (daysSinceShipping > recRed) {
            allAlerts.push({
              type: 'delay_rec',
              severity: 'critical',
              title: `Retard de réception critique : ${order.buyer_name}`,
              description: `Expédié il y a ${Math.floor(daysSinceShipping)} jours et non reçu.`,
              date: order.shipped_at,
              link: '/suivi',
              icon: Truck
            });
          } else if (daysSinceShipping > recOrange) {
            allAlerts.push({
              type: 'delay_rec',
              severity: 'warning',
              title: `Retard de réception : ${order.buyer_name}`,
              description: `Expédié il y a ${Math.floor(daysSinceShipping)} jours.`,
              date: order.shipped_at,
              link: '/suivi',
              icon: Truck
            });
          }
        }
      });

      setAlerts(allAlerts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setIsLoading(false);
    }

    fetchAlerts();
  }, []);

  if (isLoading) return <div className="container mx-auto py-10">Chargement des alertes...</div>;

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Alertes ({alerts.length})</h1>
        <p className="text-muted-foreground">Suivez les opportunités de prix et les retards logistiques.</p>
      </div>

      <div className="grid gap-4">
        {alerts.length === 0 && (
          <Card className="bg-slate-50 border-dashed">
            <CardContent className="py-10 text-center text-muted-foreground">
              Aucune alerte pour le moment. Tout est sous contrôle !
            </CardContent>
          </Card>
        )}

        {alerts.map((alert, idx) => (
          <Card key={idx} className={`border-l-4 ${
            alert.severity === 'critical' ? 'border-l-red-600' :
            alert.severity === 'warning' ? 'border-l-orange-500' :
            alert.severity === 'high' ? 'border-l-green-600' : 'border-l-blue-500'
          }`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full ${
                  alert.severity === 'critical' ? 'bg-red-100 text-red-600' :
                  alert.severity === 'warning' ? 'bg-orange-100 text-orange-600' :
                  alert.severity === 'high' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  <alert.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">{alert.title}</h3>
                  <p className="text-xs text-muted-foreground">{alert.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] text-muted-foreground">{new Date(alert.date).toLocaleDateString()}</span>
                <Link href={alert.link}>
                  <Badge variant="outline" className="hover:bg-slate-100 cursor-pointer">
                    Voir <ArrowRight className="ml-1 h-3 w-3" />
                  </Badge>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
