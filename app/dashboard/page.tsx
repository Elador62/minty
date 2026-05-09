"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, Package, ShoppingCart, Star } from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalCA: 0,
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
        .select('total_price, status');

      const totalCA = orders?.reduce((acc: number, o: any) => acc + Number(o.total_price), 0) || 0;
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

      setStats({ totalCA, totalOrders, pokemonSales, magicSales, topCards });
      setIsLoading(false);
    }

    fetchStats();
  }, []);

  if (isLoading) {
    return <div className="container mx-auto py-10">Chargement du dashboard...</div>;
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'Affaires</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCA.toFixed(2)} €</div>
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
            <CardTitle className="text-sm font-medium">Ventes Pokémon</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pokemonSales.toFixed(2)} €</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventes Magic</CardTitle>
            <Package className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.magicSales.toFixed(2)} €</div>
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
          <CardContent className="text-muted-foreground text-sm">
            Graphiques de rentabilité (Sprint 4)
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
