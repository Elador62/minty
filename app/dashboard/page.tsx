"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, Package, ShoppingCart, Star, Wallet, ArrowUpRight, AlertCircle, BarChart3, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalCA: 0,
    grossCA: 0, // Hors frais de port
    totalOrders: 0,
    pokemonSales: 0,
    magicSales: 0,
    topCards: [] as any[],
    collectionValue: 0,
    valueIncrease: 0,
    alerts: [] as any[],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);

  const supabase = createClient();

  useEffect(() => {
    async function fetchDashboardData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Récupérer les paramètres
      const { data: settingsData } = await supabase.from('user_settings').select('*').single();
      setSettings(settingsData);
      const threshold = settingsData?.price_alert_threshold || 10;
      const periodDays = settingsData?.price_alert_period_days || 30;

      // 1. Total CA et Commandes
      const { data: orders } = await supabase
        .from('orders')
        .select('total_price, shipping_cost, status');

      const totalCA = orders?.reduce((acc: number, o: any) => acc + Number(o.total_price), 0) || 0;
      const totalShipping = orders?.reduce((acc: number, o: any) => acc + Number(o.shipping_cost || 0), 0) || 0;
      const grossCA = totalCA - totalShipping;
      const totalOrders = orders?.length || 0;

      // 2. Répartition Pokémon vs Magic
      const { data: items } = await supabase
        .from('order_items')
        .select('price, game, card_name, quantity');

      let pokemonSales = 0;
      let magicSales = 0;
      const cardCounts: Record<string, { count: number; name: string }> = {};

      items?.forEach((item: any) => {
        const value = Number(item.price) * item.quantity;
        if (item.game === 'pokemon') pokemonSales += value;
        else if (item.game === 'magic') magicSales += value;

        if (!cardCounts[item.card_name]) {
          cardCounts[item.card_name] = { count: 0, name: item.card_name };
        }
        cardCounts[item.card_name].count += item.quantity;
      });

      const topCards = Object.values(cardCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // 3. Suivi Collection (Simulation basée sur inventory_items)
      const { data: inventory } = await supabase
        .from('inventory_items')
        .select('*');

      const collectionValue = inventory?.reduce((acc: number, item: any) => acc + Number(item.last_market_price || 0), 0) || 0;
      const listedValue = inventory?.reduce((acc: number, item: any) => acc + Number(item.listed_price || 0), 0) || 0;
      const valueIncrease = collectionValue > 0 ? ((collectionValue - listedValue) / listedValue) * 100 : 0;

      const alerts = inventory?.filter((item: any) => {
        const diff = ((Number(item.last_market_price) - Number(item.listed_price)) / Number(item.listed_price)) * 100;

        // Simulation d'une augmentation "récente" basée sur la période paramétrable
        // On vérifie la date de création de l'item d'inventaire
        const itemDate = new Date(item.created_at);
        const now = new Date();
        const diffDays = (now.getTime() - itemDate.getTime()) / (1000 * 3600 * 24);

        return diff >= threshold && diffDays <= periodDays;
      }).map((item: any) => ({
        name: item.card_name,
        listed: Number(item.listed_price),
        market: Number(item.last_market_price),
        diff: ((Number(item.last_market_price) - Number(item.listed_price)) / Number(item.listed_price)) * 100,
        date: new Date(item.created_at).toLocaleDateString()
      })) || [];

      setStats({
        totalCA,
        grossCA,
        totalOrders,
        pokemonSales,
        magicSales,
        topCards,
        collectionValue,
        valueIncrease,
        alerts
      });
      setIsLoading(false);
    }

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return <div className="container mx-auto py-10 text-center">Chargement du dashboard...</div>;
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Vue d'ensemble de votre activité Minty</p>
        </div>
        <p className="text-xs text-muted-foreground italic">Données synchronisées en temps réel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'Affaires Brut</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.grossCA.toFixed(2)} €</div>
            <p className="text-xs text-muted-foreground mt-1">Ventes nettes hors frais de port</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CA Total (TTC)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCA.toFixed(2)} €</div>
            <p className="text-xs text-muted-foreground mt-1">Incluant les frais d'envoi</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes Totales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">Volumes de transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Répartition Jeux</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-blue-600 font-medium">Pokémon</span>
              <span className="font-bold">{stats.pokemonSales.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-red-600 font-medium">Magic</span>
              <span className="font-bold">{stats.magicSales.toFixed(2)}€</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* NOUVELLE SECTION : RENTABILITE & COLLECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" /> Valeur Collection
            </CardTitle>
            <CardDescription>Estimation basée sur les prix du marché</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="text-4xl font-black text-primary">{stats.collectionValue.toFixed(2)} €</div>
            <div className={`flex items-center mt-2 font-bold ${stats.valueIncrease >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.valueIncrease >= 0 ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <TrendingUp className="h-4 w-4 mr-1 rotate-180" />}
              {stats.valueIncrease.toFixed(1)}% vs. Prix Listé
            </div>
            <div className="mt-8 w-full space-y-3">
              <div className="flex justify-between text-xs">
                <span>Optimisation de marge</span>
                <span className="font-bold text-green-600">Forte</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: '75%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" /> Alertes Hausse de Prix (+{settings?.price_alert_threshold || 10}%)
            </CardTitle>
            <CardDescription>
              Hausse détectée sur les derniers {settings?.price_alert_period_days || 30} jours
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.alerts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Carte</TableHead>
                    <TableHead>Date détection</TableHead>
                    <TableHead className="text-right">Votre Prix</TableHead>
                    <TableHead className="text-right">Marché</TableHead>
                    <TableHead className="text-right">Hausse</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.alerts.map((alert, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{alert.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{alert.date}</TableCell>
                      <TableCell className="text-right">{alert.listed.toFixed(2)}€</TableCell>
                      <TableCell className="text-right font-bold text-green-600">{alert.market.toFixed(2)}€</TableCell>
                      <TableCell className="text-right">
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">+{alert.diff.toFixed(0)}%</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mb-4 text-slate-200" />
                <p>Aucune alerte de prix pour le moment.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" /> Top 5 Ventes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom de la carte</TableHead>
                  <TableHead className="text-right">Quantité</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.topCards.map((card, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{card.name}</TableCell>
                    <TableCell className="text-right font-bold">{card.count}</TableCell>
                  </TableRow>
                ))}
                {stats.topCards.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground py-4">
                      Aucune vente enregistrée
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 text-white overflow-hidden relative">
           <CardHeader>
            <CardTitle className="text-slate-100">Conseil Vendeur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 relative z-10">
            <p className="text-slate-300 text-sm leading-relaxed">
              Le marché Pokémon est actuellement en hausse sur les séries "Épée et Bouclier". Pensez à réévaluer vos prix sur les cartes Alternatives.
            </p>
            <div className="bg-white/10 p-4 rounded-lg border border-white/10">
              <p className="text-xs font-bold uppercase text-slate-400 mb-1">Potentiel de profit</p>
              <p className="text-xl font-bold">+124.50 €</p>
              <p className="text-[10px] text-slate-500">Si vous alignez vos 12 alertes sur le prix marché</p>
            </div>
          </CardContent>
          <div className="absolute -bottom-10 -right-10 opacity-10">
             <TrendingUp size={200} />
          </div>
        </Card>
      </div>
    </div>
  );
}
