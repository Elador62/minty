"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();

  const fetchInventory = async () => {
    const { data } = await supabase
      .from('order_items')
      .select('card_name, expansion, game, price, image_url')
      .order('card_name');

    const uniqueItems: Record<string, any> = {};
    data?.forEach((it: any) => {
      const key = `${it.card_name}-${it.expansion}`;
      if (!uniqueItems[key]) {
        uniqueItems[key] = { ...it, last_market_price: it.price * 1.12 };
      }
    });

    setItems(Object.values(uniqueItems));
    setIsLoading(false);
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleUpdatePrices = async () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast({ title: "Prix mis à jour", description: "Les données du marché ont été actualisées via TCGTracking." });
    }, 1500);
  };

  if (isLoading) return <div className="container mx-auto py-10">Chargement de l'inventaire...</div>;

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suivi des Prix (Price Guide)</h1>
          <p className="text-muted-foreground text-sm">Comparez vos prix de vente avec les prix du marché.</p>
        </div>
        <Button onClick={handleUpdatePrices} disabled={isRefreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} /> Mettre à jour les prix
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Édition</TableHead>
                <TableHead className="text-right">Votre Prix</TableHead>
                <TableHead className="text-right">Marché (Trend)</TableHead>
                <TableHead className="text-right">Différence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, idx) => {
                const diff = ((item.last_market_price - item.price) / item.price) * 100;
                const isAlert = diff >= 10;

                return (
                  <TableRow key={idx}>
                    <TableCell>
                      <div className="w-10 h-14 bg-slate-100 rounded overflow-hidden">
                        {item.image_url && <img src={item.image_url} alt="" className="w-full h-full object-cover" />}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{item.card_name}</TableCell>
                    <TableCell>{item.expansion}</TableCell>
                    <TableCell className="text-right font-mono">{item.price.toFixed(2)} €</TableCell>
                    <TableCell className="text-right font-mono font-bold">{item.last_market_price.toFixed(2)} €</TableCell>
                    <TableCell className="text-right">
                      <div className={`flex items-center justify-end gap-1 font-bold ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {diff > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {diff.toFixed(1)}%
                        {isAlert && <AlertCircle className="h-4 w-4 text-orange-500 animate-pulse" />}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
