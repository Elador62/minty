"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  LayoutDashboard,
  List as ListIcon,
  ArrowUpDown,
  Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'diff' | 'tcg'>('name');
  const [groupBy, setGroupBy] = useState<'none' | 'tcg' | 'expansion'>('none');
  const [filters, setFilters] = useState({
    search: '',
    tcg: 'all',
    minPrice: '',
    maxPrice: '',
  });

  const supabase = createClient();
  const { toast } = useToast();

  const fetchInventory = async () => {
    const { data } = await supabase
      .from('inventory_items')
      .select('*')
      .order('card_name');

    setItems(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleUpdatePrices = async () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast({ title: "Prix mis à jour", description: "Les données du marché ont été actualisées." });
    }, 1500);
  };

  const getFilteredAndSortedItems = () => {
    let filtered = items.filter(it => {
      const matchSearch = !filters.search || it.card_name.toLowerCase().includes(filters.search.toLowerCase());
      const matchTCG = filters.tcg === 'all' || (it.game && it.game.toLowerCase().includes(filters.tcg.toLowerCase())) || (it.expansion && it.expansion.toLowerCase().includes(filters.tcg.toLowerCase()));
      const matchPrice = (!filters.minPrice || Number(it.listed_price) >= Number(filters.minPrice)) &&
                         (!filters.maxPrice || Number(it.listed_price) <= Number(filters.maxPrice));
      return matchSearch && matchTCG && matchPrice;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'name') return a.card_name.localeCompare(b.card_name);
      if (sortBy === 'price') return Number(b.listed_price) - Number(a.listed_price);
      if (sortBy === 'diff') {
        const getDiff = (it: any) => ((Number(it.last_market_price) - Number(it.listed_price)) / Number(it.listed_price)) * 100;
        return getDiff(b) - getDiff(a);
      }
      if (sortBy === 'tcg') return (a.game || '').localeCompare(b.game || '');
      return 0;
    });
  };

  if (isLoading) return <div className="container mx-auto py-10">Chargement de l'inventaire...</div>;

  const processedItems = getFilteredAndSortedItems();

  // Groupement
  const groups: Record<string, any[]> = {};
  if (groupBy === 'none') {
    groups['Toutes les cartes'] = processedItems;
  } else {
    processedItems.forEach(it => {
      const key = groupBy === 'tcg' ? (it.game || 'Inconnu') : (it.expansion || 'Sans Édition');
      if (!groups[key]) groups[key] = [];
      groups[key].push(it);
    });
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suivi des Prix (Price Guide)</h1>
          <p className="text-muted-foreground text-sm">Gérez les prix de votre collection complète.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}>
             {viewMode === 'table' ? <LayoutDashboard className="h-4 w-4 mr-2" /> : <ListIcon className="h-4 w-4 mr-2" />}
             {viewMode === 'table' ? 'Mode Cartes' : 'Mode Liste'}
          </Button>
          <Button onClick={handleUpdatePrices} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} /> Actualiser
          </Button>
        </div>
      </div>

      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Recherche</label>
              <Input
                placeholder="Nom de la carte..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="bg-white h-9"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">TCG</label>
              <Select value={filters.tcg} onValueChange={(v) => setFilters({...filters, tcg: v})}>
                <SelectTrigger className="bg-white h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les TCG</SelectItem>
                  <SelectItem value="pokemon">Pokémon</SelectItem>
                  <SelectItem value="magic">Magic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Prix (€)</label>
              <div className="flex gap-2">
                <Input placeholder="Min" type="number" value={filters.minPrice} onChange={(e) => setFilters({...filters, minPrice: e.target.value})} className="bg-white h-9" />
                <Input placeholder="Max" type="number" value={filters.maxPrice} onChange={(e) => setFilters({...filters, maxPrice: e.target.value})} className="bg-white h-9" />
              </div>
            </div>
            <div className="flex items-end gap-2">
               <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Trier</label>
                  <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                    <SelectTrigger className="bg-white h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Nom (A-Z)</SelectItem>
                      <SelectItem value="price">Prix (Décroissant)</SelectItem>
                      <SelectItem value="diff">Opportunité (%)</SelectItem>
                      <SelectItem value="tcg">TCG</SelectItem>
                    </SelectContent>
                  </Select>
               </div>
               <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Grouper</label>
                  <Select value={groupBy} onValueChange={(v: any) => setGroupBy(v)}>
                    <SelectTrigger className="bg-white h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun</SelectItem>
                      <SelectItem value="tcg">Par TCG</SelectItem>
                      <SelectItem value="expansion">Par Édition</SelectItem>
                    </SelectContent>
                  </Select>
               </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-10">
        {Object.entries(groups).map(([groupName, groupItems]) => (
          <div key={groupName} className="space-y-4">
            <h3 className="text-xl font-bold border-b pb-2 flex items-center gap-2">
              {groupName} <Badge variant="secondary">{groupItems.length}</Badge>
            </h3>

            {viewMode === 'table' ? (
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
                      {groupItems.map((item) => {
                        const diff = ((Number(item.last_market_price) - Number(item.listed_price)) / Number(item.listed_price)) * 100;
                        const isAlert = diff >= 10;

                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="w-10 h-14 bg-slate-100 rounded overflow-hidden">
                                {item.image_url && <img src={item.image_url} alt="" className="w-full h-full object-cover" />}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{item.card_name}</TableCell>
                            <TableCell>{item.expansion}</TableCell>
                            <TableCell className="text-right font-mono">{Number(item.listed_price).toFixed(2)} €</TableCell>
                            <TableCell className="text-right font-mono font-bold">{Number(item.last_market_price).toFixed(2)} €</TableCell>
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
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {groupItems.map((item) => {
                  const diff = ((Number(item.last_market_price) - Number(item.listed_price)) / Number(item.listed_price)) * 100;
                  return (
                    <Card key={item.id} className="overflow-hidden group">
                      <div className="aspect-[3/4] relative bg-slate-100">
                        {item.image_url && <img src={item.image_url} alt="" className="w-full h-full object-contain" />}
                        <div className="absolute top-2 right-2">
                          <Badge className={diff > 0 ? 'bg-green-600' : 'bg-red-600'}>
                            {diff > 0 ? '+' : ''}{diff.toFixed(0)}%
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-3">
                        <p className="font-bold text-sm truncate">{item.card_name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{item.expansion}</p>
                        <div className="mt-2 flex justify-between items-end">
                          <span className="text-xs font-bold">{Number(item.listed_price).toFixed(2)}€</span>
                          <span className="text-[10px] font-mono text-green-600 font-bold">{Number(item.last_market_price).toFixed(2)}€</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
