"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, Package, ShoppingCart, Star, Wallet } from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalCA: 0,
    grossCA: 0, // Hors frais de port
    totalOrders: 0,
    pokemonSales: 0,
    magicSales: 0,
    topCards: [] as any[],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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

      setStats({ totalCA, grossCA, totalOrders, pokemonSales, magicSales, topCards });
      setIsLoading(false);
    }

    fetchStats();
  }, []);

  if (isLoading) {
    return <div className="container mx-auto py-10 text-center">Chargement du dashboard...</div>;
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-end">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Données synchronisées en temps réel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'Affaires Brut</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.grossCA.toFixed(2)} €</div>
            <p className="text-xs text-muted-foreground mt-1">Hors frais de port</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" /> Top 5 Cartes Vendues
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
                    <TableCell className="text-right">{card.count}</TableCell>
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

        <Card className="flex items-center justify-center bg-slate-50 border-dashed">
          <CardContent className="text-muted-foreground text-sm text-center p-12">
            <p className="font-bold mb-2">Suivi de Collection & Rentabilité</p>
            Graphiques et alertes prix du marché (+10%) prévus au Sprint 4.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
