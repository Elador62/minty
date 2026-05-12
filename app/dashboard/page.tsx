"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, Package, ShoppingCart, Star, Wallet, ArrowUpRight, AlertCircle, BarChart3, CheckCircle2, Box, Layers, Palette, Tags } from "lucide-react";
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
    collectionCount: 0,
    pokemonCount: 0,
    magicCount: 0,
    storageStats: [] as any[],
    editionStats: [] as any[],
    colorStats: [] as any[],
    typeStats: [] as any[],
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

      // 2. Répartition Pokémon vs Magic (Ventes)
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

      // 3. Suivi Collection (Basé sur inventory_items)
      const { data: inventory } = await supabase
        .from('inventory_items')
        .select('*');

      const collectionValue = inventory?.reduce((acc: number, item: any) => acc + (Number(item.last_market_price || 0) * (item.quantity || 1)), 0) || 0;
      const listedValue = inventory?.reduce((acc: number, item: any) => acc + (Number(item.listed_price || 0) * (item.quantity || 1)), 0) || 0;
      const valueIncrease = listedValue > 0 ? ((collectionValue - listedValue) / listedValue) * 100 : 0;
      const collectionCount = inventory?.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0) || 0;

      let pokemonCount = 0;
      let magicCount = 0;
      const storageMap: Record<string, number> = {};
      const editionMap: Record<string, number> = {};
      const colorMap: Record<string, number> = {};
      const typeMap: Record<string, number> = {};

      inventory?.forEach((item: any) => {
        const qty = item.quantity || 1;
        if (item.game === 'pokemon') pokemonCount += qty;
        else if (item.game === 'magic') magicCount += qty;

        const storage = item.storage_location || 'Non rangé';
        storageMap[storage] = (storageMap[storage] || 0) + qty;

        const edition = item.expansion || 'Inconnu';
        editionMap[edition] = (editionMap[edition] || 0) + qty;

        const color = item.color || 'Incolore / N/A';
        colorMap[color] = (colorMap[color] || 0) + qty;

        const type = item.card_type || 'Inconnu';
        typeMap[type] = (typeMap[type] || 0) + qty;
      });

      const alerts = inventory?.filter((item: any) => {
        const diff = item.listed_price > 0 ? ((Number(item.last_market_price) - Number(item.listed_price)) / Number(item.listed_price)) * 100 : 0;
        const itemDate = new Date(item.created_at);
        const now = new Date();
        const diffDays = (now.getTime() - itemDate.getTime()) / (1000 * 3600 * 24);
        return diff >= threshold && diffDays <= periodDays;
      }).map((item: any) => ({
        name: item.card_name,
        listed: Number(item.listed_price),
        market: Number(item.last_market_price),
        diff: item.listed_price > 0 ? ((Number(item.last_market_price) - Number(item.listed_price)) / Number(item.listed_price)) * 100 : 0,
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
        alerts,
        collectionCount,
        pokemonCount,
        magicCount,
        storageStats: Object.entries(storageMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5),
        editionStats: Object.entries(editionMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5),
        colorStats: Object.entries(colorMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
        typeStats: Object.entries(typeMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5),
      });
      setIsLoading(false);
    }

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return <div className="container mx-auto py-10 text-center">Chargement du dashboard...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Vue d'ensemble de votre activité Minty</p>
        </div>
        <p className="text-[10px] md:text-xs text-muted-foreground italic">Données synchronisées en temps réel</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CA Brut</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.grossCA.toFixed(2)} €</div>
            <p className="text-xs text-muted-foreground mt-1">Ventes nettes (hors port)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventes PKM/MTG</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-blue-600 font-medium">Pokémon</span>
              <span className="font-bold">{stats.pokemonSales.toFixed(0)}€</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-red-600 font-medium">Magic</span>
              <span className="font-bold">{stats.magicSales.toFixed(0)}€</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Totale</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.collectionCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Nombre total de cartes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Répartition TCG</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-blue-600 font-medium">Pokémon</span>
              <span className="font-bold">{stats.pokemonCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-red-600 font-medium">Magic</span>
              <span className="font-bold">{stats.magicCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-primary" /> Valeur Collection
            </CardTitle>
            <CardDescription>Estimation prix marché x quantité</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="text-3xl md:text-4xl font-black text-primary">{stats.collectionValue.toFixed(2)} €</div>
            <div className={`flex items-center mt-2 font-bold ${stats.valueIncrease >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.valueIncrease >= 0 ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <TrendingUp className="h-4 w-4 mr-1 rotate-180" />}
              {stats.valueIncrease.toFixed(1)}% vs. Prix Listé
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="h-5 w-5 text-orange-500" /> Alertes Hausse de Prix (+{settings?.price_alert_threshold || 10}%)
            </CardTitle>
            <CardDescription>
              Hausse détectée sur les derniers {settings?.price_alert_period_days || 30} jours
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 overflow-x-auto">
            {stats.alerts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">Carte</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Votre Prix</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Marché</TableHead>
                    <TableHead className="text-right">Hausse</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.alerts.map((alert, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium text-xs sm:text-sm">{alert.name}</TableCell>
                      <TableCell className="text-right text-xs sm:text-sm">{alert.listed.toFixed(2)}€</TableCell>
                      <TableCell className="text-right font-bold text-green-600 text-xs sm:text-sm">{alert.market.toFixed(2)}€</TableCell>
                      <TableCell className="text-right">
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-[10px] sm:text-xs">+{alert.diff.toFixed(0)}%</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mb-4 text-slate-200" />
                <p className="text-sm">Aucune alerte de prix pour le moment.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
               <Box className="h-4 w-4" /> Top Stockages
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
             {stats.storageStats.map((s, i) => (
               <div key={i} className="flex justify-between text-[11px] border-b border-slate-50 pb-1">
                 <span className="truncate max-w-[140px]">{s.name}</span>
                 <span className="font-bold">{s.count}</span>
               </div>
             ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
               <Tags className="h-4 w-4" /> Top Éditions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
             {stats.editionStats.map((s, i) => (
               <div key={i} className="flex justify-between text-[11px] border-b border-slate-50 pb-1">
                 <span className="truncate max-w-[140px]">{s.name}</span>
                 <span className="font-bold">{s.count}</span>
               </div>
             ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
               <Palette className="h-4 w-4" /> Couleurs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
             {stats.colorStats.map((s, i) => (
               <div key={i} className="flex justify-between text-[11px] border-b border-slate-50 pb-1">
                 <span className="truncate max-w-[140px]">{s.name}</span>
                 <span className="font-bold">{s.count}</span>
               </div>
             ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
               <Layers className="h-4 w-4" /> Top Types
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
             {stats.typeStats.map((s, i) => (
               <div key={i} className="flex justify-between text-[11px] border-b border-slate-50 pb-1">
                 <span className="truncate max-w-[140px]">{s.name}</span>
                 <span className="font-bold">{s.count}</span>
               </div>
             ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Star className="h-5 w-5 text-yellow-500" /> Top 5 Ventes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
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
                    <TableCell className="font-medium text-xs sm:text-sm">{card.name}</TableCell>
                    <TableCell className="text-right font-bold text-xs sm:text-sm">{card.count}</TableCell>
                  </TableRow>
                ))}
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
              <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Potentiel de profit</p>
              <p className="text-xl md:text-2xl font-bold">+{(stats.collectionValue - (stats.collectionValue / (1 + stats.valueIncrease/100))).toFixed(2)} €</p>
              <p className="text-[10px] text-slate-500">Si vous alignez vos prix sur le marché</p>
            </div>
          </CardContent>
          <div className="absolute -bottom-10 -right-10 opacity-10 hidden sm:block">
             <TrendingUp size={200} />
          </div>
        </Card>
      </div>
    </div>
  );
}
