"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  RefreshCw,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  LayoutDashboard,
  List as ListIcon,
  ArrowUpDown,
  Filter,
  Plus,
  Upload,
  ExternalLink,
  Search,
  Box
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { getCardThumbnail } from "@/lib/cardmarket/images";

export default function CollectionPage() {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'diff' | 'tcg' | 'quantity'>('name');
  const [groupBy, setGroupBy] = useState<'none' | 'tcg' | 'expansion' | 'storage_location'>('none');
  const initialFilters = {
    search: '',
    tcg: 'all',
    minPrice: '',
    maxPrice: '',
    storage: 'all',
  };
  const [filters, setFilters] = useState(initialFilters);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    card_name: '',
    card_name_en: '',
    set_code: '',
    expansion: '',
    game: 'magic',
    listed_price: '',
    quantity: '1',
    storage_location: '',
    condition: 'NM',
    language: 'Français',
    color: '',
    card_type: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const { getScryfallPrice } = await import('@/lib/cardmarket/images');

    let updatedCount = 0;
    const historyToInsert = [];

    for (const item of items) {
      if (item.game === 'magic' && item.card_name_en && item.set_code) {
        const newPrice = await getScryfallPrice(item.card_name_en, item.set_code);
        if (newPrice) {
          const priceNum = parseFloat(newPrice);

          // Mise à jour de l'item
          await supabase
            .from('inventory_items')
            .update({ last_market_price: priceNum })
            .eq('id', item.id);

          // Ajout à l'historique
          historyToInsert.push({
            inventory_item_id: item.id,
            price: priceNum
          });

          updatedCount++;
        }
      }
    }

    if (historyToInsert.length > 0) {
      await supabase.from('price_history').insert(historyToInsert);
    }

    setIsRefreshing(false);
    toast({
      title: "Prix mis à jour",
      description: `${updatedCount} prix ont été actualisés via Scryfall.`
    });
    fetchInventory();
  };

  const handleAddItem = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Tentative de récupération des métadonnées
    const metadata = await (await import('@/lib/cardmarket/images')).fetchCardMetadata(newItem.card_name, newItem.game, newItem.expansion);

    const { error } = await supabase.from('inventory_items').insert([{
      user_id: user.id,
      card_name: newItem.card_name,
      card_name_en: newItem.card_name_en || metadata?.card_name_en || newItem.card_name,
      set_code: newItem.set_code || metadata?.set_code || '',
      expansion: newItem.expansion,
      game: newItem.game,
      listed_price: parseFloat(newItem.listed_price) || 0,
      quantity: parseInt(newItem.quantity) || 1,
      storage_location: newItem.storage_location,
      condition: newItem.condition,
      language: newItem.language,
      color: newItem.color,
      card_type: newItem.card_type,
      image_url: metadata?.image_url || null,
      last_market_price: parseFloat(newItem.listed_price) || 0 // Initialiser avec le prix listé
    }]);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Carte ajoutée", description: `${newItem.card_name} a été ajouté à votre collection.` });
      setIsAddModalOpen(false);
      setNewItem({
        card_name: '',
        card_name_en: '',
        set_code: '',
        expansion: '',
        game: 'magic',
        listed_price: '',
        quantity: '1',
        storage_location: '',
        condition: 'NM',
        language: 'Français',
        color: '',
        card_type: '',
      });
      fetchInventory();
    }
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      toast({ title: "Import en cours", description: "Récupération des illustrations et traitement des données..." });

      const itemsToInsert = [];

      // On commence à 1 pour sauter le header
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const parts = lines[i].match(/(".*?"|[^;]+)(?=\s*;|\s*$)/g) || [];
        const cleanParts = parts.map(p => p.replace(/^"=""(.*?)"""$/, '$1').replace(/^"(.*)"$/, '$1'));

        if (cleanParts.length < 17) continue;

        const name = cleanParts[2];
        const expansion = cleanParts[6];
        const condition = cleanParts[9];
        const price = parseFloat(cleanParts[14].replace(',', '.')) || 0;
        const quantity = parseInt(cleanParts[16]) || 0;
        const cmUrl = cleanParts[cleanParts.length - 2];
        const externalId = cleanParts[0];
        const rarity = cleanParts[7];

        // Détection simple du jeu via l'URL CardMarket ou l'extension
        let game = 'magic';
        if (cmUrl.toLowerCase().includes('/pokemon/') || expansion.toLowerCase().includes('poker') || name.toLowerCase().includes('pikachu')) {
          game = 'pokemon';
        }

        // Récupération des métadonnées (nom anglais et set code)
        let metadata = null;
        try {
          metadata = await (await import('@/lib/cardmarket/images')).fetchCardMetadata(name, game, expansion);
        } catch (err) {
          console.error("Erreur fetch metadata import:", err);
        }

        itemsToInsert.push({
          user_id: user.id,
          card_name: name,
          card_name_en: metadata?.card_name_en || name,
          set_code: metadata?.set_code || '',
          expansion: expansion,
          game: game,
          listed_price: price,
          last_market_price: price,
          quantity: quantity,
          condition: condition,
          cardmarket_url: cmUrl,
          external_id: externalId,
          rarity: rarity,
          image_url: metadata?.image_url || null,
          created_at: new Date().toISOString()
        });
      }

      if (itemsToInsert.length > 0) {
        const { error } = await supabase.from('inventory_items').insert(itemsToInsert);
        if (error) {
          toast({ title: "Erreur lors de l'import", description: error.message, variant: "destructive" });
        } else {
          toast({ title: "Import réussi", description: `${itemsToInsert.length} cartes ont été ajoutées.` });
          fetchInventory();
          setIsImportModalOpen(false);
        }
      }
    };
    reader.readAsText(file);
  };

  const getFilteredAndSortedItems = () => {
    let filtered = items.filter(it => {
      const matchSearch = !filters.search || it.card_name.toLowerCase().includes(filters.search.toLowerCase());
      const matchTCG = filters.tcg === 'all' || (it.game && it.game.toLowerCase() === filters.tcg.toLowerCase());
      const matchPrice = (!filters.minPrice || Number(it.listed_price) >= Number(filters.minPrice)) &&
                         (!filters.maxPrice || Number(it.listed_price) <= Number(filters.maxPrice));
      const matchStorage = filters.storage === 'all' || it.storage_location === filters.storage;
      return matchSearch && matchTCG && matchPrice && matchStorage;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'name') return a.card_name.localeCompare(b.card_name);
      if (sortBy === 'price') return Number(b.listed_price) - Number(a.listed_price);
      if (sortBy === 'quantity') return Number(b.quantity) - Number(a.quantity);
      if (sortBy === 'diff') {
        const getDiff = (it: any) => it.listed_price > 0 ? ((Number(it.last_market_price) - Number(it.listed_price)) / Number(it.listed_price)) * 100 : 0;
        return getDiff(b) - getDiff(a);
      }
      if (sortBy === 'tcg') return (a.game || '').localeCompare(b.game || '');
      return 0;
    });
  };

  if (isLoading) return <div className="container mx-auto py-10">Chargement de la collection...</div>;

  const processedItems = getFilteredAndSortedItems();

  const storages = Array.from(new Set(items.map(it => it.storage_location).filter(Boolean)));

  // Groupement
  const groups: Record<string, any[]> = {};
  if (groupBy === 'none') {
    groups['Toutes les cartes'] = processedItems;
  } else {
    processedItems.forEach(it => {
      let key = 'Inconnu';
      if (groupBy === 'tcg') key = it.game || 'Inconnu';
      else if (groupBy === 'expansion') key = it.expansion || 'Sans Édition';
      else if (groupBy === 'storage_location') key = it.storage_location || 'Non rangé';

      if (!groups[key]) groups[key] = [];
      groups[key].push(it);
    });
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ma Collection</h1>
          <p className="text-muted-foreground text-sm">Gérez votre stock et suivez les prix du marché.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
             <Upload className="h-4 w-4 mr-2" /> Import CSV
          </Button>
          <Button variant="outline" onClick={() => setIsAddModalOpen(true)}>
             <Plus className="h-4 w-4 mr-2" /> Ajouter
          </Button>
          <Button variant="outline" onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}>
             {viewMode === 'table' ? <LayoutDashboard className="h-4 w-4 mr-2" /> : <ListIcon className="h-4 w-4 mr-2" />}
             {viewMode === 'table' ? 'Mode Cartes' : 'Mode Liste'}
          </Button>
          <Button onClick={handleUpdatePrices} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} /> Actualiser Prix
          </Button>
        </div>
      </div>

      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Stockage</label>
              <Select value={filters.storage} onValueChange={(v) => setFilters({...filters, storage: v})}>
                <SelectTrigger className="bg-white h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les lieux</SelectItem>
                  {storages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
            <div className="flex items-end gap-2 pr-4">
               <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Trier</label>
                  <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                    <SelectTrigger className="bg-white h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Nom (A-Z)</SelectItem>
                      <SelectItem value="price">Prix</SelectItem>
                      <SelectItem value="quantity">Quantité</SelectItem>
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
                      <SelectItem value="storage_location">Par Stockage</SelectItem>
                    </SelectContent>
                  </Select>
               </div>
               <Button variant="ghost" size="sm" onClick={() => setFilters(initialFilters)} className="h-9 text-muted-foreground hover:text-primary">
                  <RotateCcw className="h-4 w-4" />
               </Button>
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
                        <TableHead>Stockage</TableHead>
                        <TableHead className="text-right">Quantité</TableHead>
                        <TableHead className="text-right">Votre Prix</TableHead>
                        <TableHead className="text-right">Marché (Trend)</TableHead>
                        <TableHead className="text-right w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupItems.map((item) => {
                        const diff = item.listed_price > 0 ? ((Number(item.last_market_price) - Number(item.listed_price)) / Number(item.listed_price)) * 100 : 0;
                        const isAlert = diff >= 10;

                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="w-10 h-14 bg-slate-100 rounded overflow-hidden">
                                {item.image_url && <img src={item.image_url} alt="" className="w-full h-full object-cover" />}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {item.card_name}
                              {item.is_foil && <Badge className="ml-2 bg-purple-100 text-purple-700">Foil</Badge>}
                            </TableCell>
                            <TableCell>{item.expansion}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Box className="h-3 w-3" />
                                {item.storage_location || '-'}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              <Badge variant={item.quantity > 0 ? "secondary" : "destructive"}>{item.quantity}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono">{Number(item.listed_price).toFixed(2)} €</TableCell>
                            <TableCell className="text-right">
                              <div className="flex flex-col items-end">
                                <span className="font-mono font-bold">{Number(item.last_market_price).toFixed(2)} €</span>
                                <div className={`flex items-center gap-1 text-[10px] font-bold ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {diff > 0 ? <TrendingUp className="h-2 w-2" /> : <TrendingDown className="h-2 w-2" />}
                                  {diff.toFixed(1)}%
                                  {isAlert && <AlertCircle className="h-3 w-3 text-orange-500 animate-pulse" />}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                               {item.cardmarket_url && (
                                 <Button variant="ghost" size="sm" asChild>
                                   <a href={item.cardmarket_url} target="_blank" rel="noopener noreferrer">
                                     <ExternalLink className="h-4 w-4" />
                                   </a>
                                 </Button>
                               )}
                               {!item.cardmarket_url && (
                                 <Button variant="ghost" size="sm" asChild>
                                   <a href={`https://www.cardmarket.com/fr/Magic/Products/Search?searchString=${encodeURIComponent(item.card_name)}`} target="_blank" rel="noopener noreferrer">
                                     <Search className="h-4 w-4" />
                                   </a>
                                 </Button>
                               )}
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
                  const diff = item.listed_price > 0 ? ((Number(item.last_market_price) - Number(item.listed_price)) / Number(item.listed_price)) * 100 : 0;
                  return (
                    <Card key={item.id} className="overflow-hidden group">
                      <div className="aspect-[3/4] relative bg-slate-100">
                        {item.image_url && <img src={item.image_url} alt="" className="w-full h-full object-contain" />}
                        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                          <Badge className={diff > 0 ? 'bg-green-600' : 'bg-red-600'}>
                            {diff > 0 ? '+' : ''}{diff.toFixed(0)}%
                          </Badge>
                          <Badge variant="secondary" className="bg-white/90">x{item.quantity}</Badge>
                        </div>
                        {item.storage_location && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-2 py-1 flex items-center gap-1">
                            <Box className="h-3 w-3" /> {item.storage_location}
                          </div>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <p className="font-bold text-sm truncate">{item.card_name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{item.expansion}</p>
                        <div className="mt-2 flex justify-between items-end">
                          <span className="text-xs font-bold">{Number(item.listed_price).toFixed(2)}€</span>
                          <span className="text-[10px] font-mono text-green-600 font-bold">{Number(item.last_market_price).toFixed(2)}€</span>
                        </div>
                        <div className="mt-2 pt-2 border-t flex justify-center">
                           <Button variant="ghost" size="sm" className="h-7 w-full text-[10px]" asChild>
                              <a href={item.cardmarket_url || `https://www.cardmarket.com/fr/Magic/Products/Search?searchString=${encodeURIComponent(item.card_name)}`} target="_blank" rel="noopener noreferrer">
                                CM <ExternalLink className="ml-1 h-3 w-3" />
                              </a>
                           </Button>
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

      {/* MODAL AJOUT MANUEL */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Ajouter une carte</DialogTitle>
            <DialogDescription>Saisissez les détails de la carte à ajouter à votre collection.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Nom</Label>
              <Input id="name" value={newItem.card_name} onChange={e => setNewItem({...newItem, card_name: e.target.value})} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="game" className="text-right">TCG</Label>
              <Select value={newItem.game} onValueChange={v => setNewItem({...newItem, game: v})}>
                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="magic">Magic</SelectItem>
                  <SelectItem value="pokemon">Pokémon</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="expansion" className="text-right">Édition</Label>
              <Input id="expansion" value={newItem.expansion} onChange={e => setNewItem({...newItem, expansion: e.target.value})} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name_en" className="text-right">Nom (EN)</Label>
              <Input id="name_en" value={newItem.card_name_en} onChange={e => setNewItem({...newItem, card_name_en: e.target.value})} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="set_code" className="text-right">Set Code</Label>
              <Input id="set_code" placeholder="ex: M10" value={newItem.set_code} onChange={e => setNewItem({...newItem, set_code: e.target.value})} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">Prix (€)</Label>
              <Input id="price" type="number" step="0.01" value={newItem.listed_price} onChange={e => setNewItem({...newItem, listed_price: e.target.value})} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">Quantité</Label>
              <Input id="quantity" type="number" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: e.target.value})} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="storage" className="text-right">Stockage</Label>
              <Input id="storage" placeholder="Ex: Boite A1" value={newItem.storage_location} onChange={e => setNewItem({...newItem, storage_location: e.target.value})} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="color" className="text-right">Couleur</Label>
              <Input id="color" placeholder="Ex: Rouge, Psy" value={newItem.color} onChange={e => setNewItem({...newItem, color: e.target.value})} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">Type</Label>
              <Input id="type" placeholder="Ex: Créature, Pokémon" value={newItem.card_type} onChange={e => setNewItem({...newItem, card_type: e.target.value})} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddItem}>Ajouter à la collection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL IMPORT CSV */}
      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importer depuis un CSV</DialogTitle>
            <DialogDescription>Sélectionnez votre fichier d'inventaire personnel (format CardMarket semi-colon).</DialogDescription>
          </DialogHeader>
          <div className="py-8 flex flex-col items-center justify-center border-2 border-dashed rounded-lg bg-slate-50">
             <Upload className="h-10 w-10 text-muted-foreground mb-4" />
             <p className="text-sm text-muted-foreground mb-4">Glissez-déposez votre fichier ici ou cliquez pour parcourir</p>
             <input
               type="file"
               accept=".csv"
               className="hidden"
               ref={fileInputRef}
               onChange={handleImportCSV}
             />
             <Button onClick={() => fileInputRef.current?.click()}>Choisir un fichier</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
