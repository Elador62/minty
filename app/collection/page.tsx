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
  Box,
  Trash2,
  Undo,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Edit,
  Info
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { getCardThumbnail } from "@/lib/cardmarket/images";
import { getCardPrice } from "@/lib/cardmarket/prices";
import { getCardMarketUrl } from "@/lib/cardmarket/urls";

function CardDetailsContent({ item, history }: { item: any, history: any[] }) {
  if (!item) return null;

  return (
    <div className="py-6 space-y-8">
      <div className="flex gap-6">
        <div className="w-40 h-56 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
          {item.image_url && <img src={item.image_url} alt="" className="w-full h-full object-cover" />}
        </div>
        <div className="space-y-4 flex-1">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">TCG</p>
              <p className="font-bold capitalize">{item.game}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Édition</p>
              <p className="font-bold">{item.expansion}</p>
            </div>
            <div>
              <p className="text-muted-foreground">État / Langue</p>
              <p className="font-bold">{item.condition} / {item.language}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Stockage</p>
              <p className="font-bold">{item.storage_location || 'Non défini'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Prix Listé</p>
              <p className="font-bold text-lg">{Number(item.listed_price).toFixed(2)} €</p>
            </div>
            <div>
              <p className="text-muted-foreground">Prix Marché</p>
              <p className="font-bold text-lg text-green-600">{Number(item.last_market_price).toFixed(2)} €</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-bold border-b pb-2">Historique des Commandes</h4>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Aucune commande trouvée pour cette configuration exacte.</p>
        ) : (
          <div className="space-y-3">
            {history.map((h) => (
              <div key={h.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border">
                <div className="space-y-1">
                  <p className="text-sm font-bold">{h.orders.buyer_name}</p>
                  <p className="text-[10px] text-muted-foreground">#{h.orders.external_order_id} • {new Date(h.orders.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{Number(h.price).toFixed(2)} €</p>
                  <Badge variant="outline" className="text-[10px] h-5">{h.orders.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CollectionPage() {
  const [items, setItems] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [allStorages, setAllStorages] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [sortBy, setSortBy] = useState<string>('card_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [groupBy, setGroupBy] = useState<'none' | 'tcg' | 'expansion' | 'storage_location'>('none');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const initialFilters = {
    search: '',
    tcg: 'all',
    minPrice: '',
    maxPrice: '',
    storage: 'all',
    showArchived: false,
  };
  const [filters, setFilters] = useState(initialFilters);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [userSettings, setUserSettings] = useState<any>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    card_name: '',
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

  const fetchSettings = async () => {
    const { data } = await supabase.from('user_settings').select('*').single();
    if (data) setUserSettings(data);
  };

  const fetchInventory = async () => {
    setIsLoading(true);

    // Fetch all storage locations for the filter
    const { data: storageData } = await supabase
      .from('inventory_items')
      .select('storage_location')
      .not('storage_location', 'is', null);

    if (storageData) {
      const uniqueStorages = Array.from(new Set(storageData.map((s: any) => s.storage_location)))
        .filter(s => typeof s === 'string' && s.trim() !== '');
      setAllStorages(uniqueStorages as string[]);
    }

    let query = supabase
      .from('inventory_items')
      .select('*', { count: 'exact' });

    // Filtres
    if (filters.search) query = query.ilike('card_name', `%${filters.search}%`);
    if (filters.tcg !== 'all') query = query.eq('game', filters.tcg);
    if (filters.storage !== 'all') query = query.eq('storage_location', filters.storage);
    if (filters.minPrice) query = query.gte('listed_price', parseFloat(filters.minPrice));
    if (filters.maxPrice) query = query.lte('listed_price', parseFloat(filters.maxPrice));

    query = query.eq('is_archived', filters.showArchived);

    // Tri
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Pagination
    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setItems(data || []);
      setTotalCount(count || 0);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchSettings();
    fetchInventory();
  }, [currentPage, pageSize, filters, sortBy, sortOrder]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortBy, sortOrder, pageSize]);

  const handleUpdatePrices = async () => {
    setIsRefreshing(true);
    let updatedCount = 0;
    let totalChecked = 0;

    toast({ title: "Mise à jour lancée", description: `Analyse de ${items.length} cartes...` });

    for (const item of items) {
      try {
        const price = await getCardPrice(item.card_name, item.game, item.expansion, item.is_foil);
        totalChecked++;
        if (price !== null) {
          const { error } = await supabase
            .from('inventory_items')
            .update({
              last_market_price: price,
              updated_at: new Date().toISOString() // On force l'update du timestamp si possible
            })
            .eq('id', item.id);

          if (!error && price !== item.last_market_price) {
            updatedCount++;
          }
        }
      } catch (err) {
        console.error(`Erreur maj prix pour ${item.card_name}:`, err);
      }
    }

    setIsRefreshing(false);
    toast({
      title: "Mise à jour terminée",
      description: `${updatedCount} prix modifiés sur ${totalChecked} cartes vérifiées.`
    });
    fetchInventory();
  };

  const handleAddItem = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const imageUrl = await getCardThumbnail(newItem.card_name, newItem.game);

    const { error } = await supabase.from('inventory_items').insert([{
      user_id: user.id,
      card_name: newItem.card_name,
      expansion: newItem.expansion,
      game: newItem.game,
      listed_price: parseFloat(newItem.listed_price) || 0,
      quantity: parseInt(newItem.quantity) || 1,
      storage_location: newItem.storage_location,
      condition: newItem.condition,
      language: newItem.language,
      color: newItem.color,
      card_type: newItem.card_type,
      image_url: imageUrl,
      is_foil: (newItem as any).is_foil || false,
      last_market_price: parseFloat(newItem.listed_price) || 0 // Initialiser avec le prix listé
    }]);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Carte ajoutée", description: `${newItem.card_name} a été ajouté à votre collection.` });
      setIsAddModalOpen(false);
      setNewItem({
        card_name: '',
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

        // Récupération de l'illustration
        let imageUrl = null;
        try {
          imageUrl = await getCardThumbnail(name, game);
        } catch (err) {
          console.error("Erreur fetch image import:", err);
        }

        itemsToInsert.push({
          user_id: user.id,
          card_name: name,
          expansion: expansion,
          game: game,
          listed_price: price,
          last_market_price: price,
          quantity: quantity,
          condition: condition,
          cardmarket_url: cmUrl,
          external_id: externalId,
          rarity: rarity,
          image_url: imageUrl,
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

  const handleArchiveItem = async (ids: string | string[], archive: boolean = true) => {
    const idsToUpdate = Array.isArray(ids) ? ids : [ids];

    const { error } = await supabase
      .from('inventory_items')
      .update({ is_archived: archive })
      .in('id', idsToUpdate);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: idsToUpdate.length > 1 ? "Cartes traitées" : (archive ? "Carte archivée" : "Carte restaurée"),
        description: idsToUpdate.length > 1
          ? `${idsToUpdate.length} cartes ont été ${archive ? 'archivées' : 'restaurées'}.`
          : (archive ? "La carte a été déplacée vers la corbeille." : "La carte a été restaurée dans votre collection.")
      });
      setSelectedIds([]);
      fetchInventory();
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(it => it.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const fetchOrderHistory = async (item: any) => {
    if (!item) return;
    const { data, error } = await supabase
      .from('order_items')
      .select('*, orders(external_order_id, buyer_name, status, created_at)')
      .eq('card_name', item.card_name)
      .eq('expansion', item.expansion)
      .eq('condition', item.condition)
      .eq('language', item.language)
      .order('created_at', { ascending: false });

    if (!error) {
      setOrderHistory(data || []);
    }
  };

  const handleShowDetails = (item: any) => {
    setSelectedItem(item);
    fetchOrderHistory(item);
    setIsDetailOpen(true);
  };

  const handleEditItem = (item: any) => {
    setSelectedItem(item);
    setNewItem({
      card_name: item.card_name,
      expansion: item.expansion || '',
      game: item.game || 'magic',
      listed_price: item.listed_price.toString(),
      quantity: item.quantity.toString(),
      storage_location: item.storage_location || '',
      condition: item.condition || 'NM',
      language: item.language || 'Français',
      color: item.color || '',
      card_type: item.card_type || '',
      is_foil: item.is_foil || false,
    } as any);
    setIsEditModalOpen(true);
  };

  const handleUpdateItem = async () => {
    if (!selectedItem) return;

    const { error } = await supabase
      .from('inventory_items')
      .update({
        card_name: newItem.card_name,
        expansion: newItem.expansion,
        game: newItem.game,
        listed_price: parseFloat(newItem.listed_price) || 0,
        quantity: parseInt(newItem.quantity) || 0,
        storage_location: newItem.storage_location,
        condition: newItem.condition,
        language: newItem.language,
        color: newItem.color,
        card_type: newItem.card_type,
        is_foil: (newItem as any).is_foil || false,
      })
      .eq('id', selectedItem.id);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Carte modifiée", description: "Les modifications ont été enregistrées." });
      setIsEditModalOpen(false);
      fetchInventory();
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  if (isLoading && items.length === 0) return <div className="container mx-auto py-10">Chargement de la collection...</div>;

  const processedItems = items;

  const storages = allStorages;

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
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ma Collection</h1>
            <p className="text-muted-foreground text-sm">Gérez votre stock et suivez les prix du marché.</p>
          </div>
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 animate-in fade-in slide-in-from-left-4">
              <span className="text-xs font-bold">{selectedIds.length} sélectionnée(s)</span>
              <Button
                variant="destructive"
                size="sm"
                className="h-8"
                onClick={() => handleArchiveItem(selectedIds, !filters.showArchived)}
              >
                {filters.showArchived ? <Undo className="h-4 w-4 mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                {filters.showArchived ? 'Restaurer' : 'Archiver'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() => setSelectedIds([])}
              >
                Annuler
              </Button>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
             <Upload className="h-4 w-4 mr-2" /> Import CSV
          </Button>
          <Button variant="outline" onClick={() => setIsAddModalOpen(true)}>
             <Plus className="h-4 w-4 mr-2" /> Ajouter
          </Button>
          <Button variant="outline" onClick={() => setFilters({...filters, showArchived: !filters.showArchived})}>
             {filters.showArchived ? <ListIcon className="h-4 w-4 mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
             {filters.showArchived ? 'Voir Collection' : 'Voir Corbeille'}
          </Button>
          <Button variant="outline" onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}>
             {viewMode === 'table' ? <LayoutDashboard className="h-4 w-4 mr-2" /> : <ListIcon className="h-4 w-4 mr-2" />}
             {viewMode === 'table' ? 'Mode Cartes' : 'Mode Liste'}
          </Button>
          <Button onClick={handleUpdatePrices} disabled={isRefreshing || items.length === 0}>
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
                  {storages.map(s => (
                    <SelectItem key={s} value={s || "unnamed"}>
                      {s}
                    </SelectItem>
                  ))}
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
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Affichage</label>
                  <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(parseInt(v))}>
                    <SelectTrigger className="bg-white h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25 / page</SelectItem>
                      <SelectItem value="50">50 / page</SelectItem>
                      <SelectItem value="100">100 / page</SelectItem>
                      <SelectItem value="200">200 / page</SelectItem>
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
                        <TableHead className="w-[40px]">
                          <Checkbox
                            checked={items.length > 0 && selectedIds.length === items.length}
                            onCheckedChange={toggleSelectAll}
                          />
                        </TableHead>
                        <TableHead className="w-[80px]">Image</TableHead>
                        <TableHead className="cursor-pointer hover:text-primary" onClick={() => handleSort('card_name')}>
                          Nom {sortBy === 'card_name' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead className="cursor-pointer hover:text-primary" onClick={() => handleSort('expansion')}>
                          Édition {sortBy === 'expansion' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead className="cursor-pointer hover:text-primary" onClick={() => handleSort('storage_location')}>
                          Stockage {sortBy === 'storage_location' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead className="text-right cursor-pointer hover:text-primary" onClick={() => handleSort('quantity')}>
                          Qté {sortBy === 'quantity' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead className="text-right cursor-pointer hover:text-primary" onClick={() => handleSort('listed_price')}>
                          Votre Prix {sortBy === 'listed_price' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead className="text-right cursor-pointer hover:text-primary" onClick={() => handleSort('last_market_price')}>
                          Marché {sortBy === 'last_market_price' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead className="text-right w-[120px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupItems.map((item) => {
                        const diff = item.listed_price > 0 ? ((Number(item.last_market_price) - Number(item.listed_price)) / Number(item.listed_price)) * 100 : 0;
                        const isAlert = diff >= 10;

                        return (
                          <TableRow key={item.id} className={selectedIds.includes(item.id) ? "bg-slate-50" : ""}>
                            <TableCell>
                              <Checkbox
                                checked={selectedIds.includes(item.id)}
                                onCheckedChange={() => toggleSelect(item.id)}
                              />
                            </TableCell>
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
                               <div className="flex justify-end gap-1">
                                  <Button variant="ghost" size="sm" asChild title="Voir sur CardMarket">
                                    <a
                                      href={getCardMarketUrl(item)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </a>
                                  </Button>

                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleShowDetails(item)}>
                                        <Info className="h-4 w-4 mr-2" /> Détails
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleEditItem(item)}>
                                        <Edit className="h-4 w-4 mr-2" /> Modifier
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className={item.is_archived ? "text-green-600" : "text-destructive"}
                                        onClick={() => handleArchiveItem(item.id, !item.is_archived)}
                                      >
                                        {item.is_archived ? (
                                          <><Undo className="h-4 w-4 mr-2" /> Restaurer</>
                                        ) : (
                                          <><Trash2 className="h-4 w-4 mr-2" /> Archiver</>
                                        )}
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
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
                  const diff = item.listed_price > 0 ? ((Number(item.last_market_price) - Number(item.listed_price)) / Number(item.listed_price)) * 100 : 0;
                  return (
                    <Card key={item.id} className="overflow-hidden group">
                      <div className="aspect-[3/4] relative bg-slate-100">
                        {item.image_url && <img src={item.image_url} alt="" className="w-full h-full object-contain" />}
                        <div className="absolute top-2 left-2">
                          <Checkbox
                            checked={selectedIds.includes(item.id)}
                            onCheckedChange={() => toggleSelect(item.id)}
                            className="bg-white/90 data-[state=checked]:bg-primary"
                          />
                        </div>
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
                        <div className="mt-2 pt-2 border-t flex justify-between items-center">
                           <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px]" asChild>
                              <a href={getCardMarketUrl(item)} target="_blank" rel="noopener noreferrer">
                                CM <ExternalLink className="ml-1 h-3 w-3" />
                              </a>
                           </Button>
                           <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleShowDetails(item)}>
                                  <Info className="h-3 w-3 mr-2" /> Détails
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditItem(item)}>
                                  <Edit className="h-3 w-3 mr-2" /> Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className={item.is_archived ? "text-green-600" : "text-destructive"}
                                  onClick={() => handleArchiveItem(item.id, !item.is_archived)}
                                >
                                  {item.is_archived ? (
                                    <><Undo className="h-3 w-3 mr-2" /> Restaurer</>
                                  ) : (
                                    <><Trash2 className="h-3 w-3 mr-2" /> Archiver</>
                                  )}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                           </DropdownMenu>
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

      {/* PAGINATION */}
      <div className="flex items-center justify-between mt-8 pb-10">
        <p className="text-sm text-muted-foreground">
          Affichage de {(currentPage - 1) * pageSize + 1} à {Math.min(currentPage * pageSize, totalCount)} sur {totalCount} cartes
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" /> Précédent
          </Button>
          <div className="flex items-center gap-1">
             {(() => {
               const totalPages = Math.ceil(totalCount / pageSize);
               let startPage = Math.max(1, currentPage - 2);
               let endPage = Math.min(totalPages, startPage + 4);

               if (endPage - startPage < 4) {
                 startPage = Math.max(1, endPage - 4);
               }

               const pages = [];
               for (let i = startPage; i <= endPage; i++) {
                 pages.push(
                   <Button
                     key={i}
                     variant={currentPage === i ? "default" : "outline"}
                     size="sm"
                     className="w-9"
                     onClick={() => setCurrentPage(i)}
                   >
                     {i}
                   </Button>
                 );
               }
               return pages;
             })()}
             {Math.ceil(totalCount / pageSize) > currentPage + 2 && <span className="px-2">...</span>}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalCount / pageSize), p + 1))}
            disabled={currentPage >= Math.ceil(totalCount / pageSize)}
          >
            Suivant <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* COMPOSANT DÉTAILS (MODAL OU SHEET) */}
      {userSettings?.card_view_mode === 'sheet' ? (
        <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <SheetContent className="sm:max-w-xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{selectedItem?.card_name}</SheetTitle>
              <SheetDescription>{selectedItem?.expansion}</SheetDescription>
            </SheetHeader>
            <CardDetailsContent item={selectedItem} history={orderHistory} />
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedItem?.card_name}</DialogTitle>
              <DialogDescription>{selectedItem?.expansion}</DialogDescription>
            </DialogHeader>
            <CardDetailsContent item={selectedItem} history={orderHistory} />
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL ÉDITION */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifier la carte</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">Nom</Label>
              <Input id="edit-name" value={newItem.card_name} onChange={e => setNewItem({...newItem, card_name: e.target.value})} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-expansion" className="text-right">Édition</Label>
              <Input id="edit-expansion" value={newItem.expansion} onChange={e => setNewItem({...newItem, expansion: e.target.value})} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-price" className="text-right">Prix (€)</Label>
              <Input id="edit-price" type="number" step="0.01" value={newItem.listed_price} onChange={e => setNewItem({...newItem, listed_price: e.target.value})} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-quantity" className="text-right">Quantité</Label>
              <Input id="edit-quantity" type="number" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: e.target.value})} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-storage" className="text-right">Stockage</Label>
              <Input id="edit-storage" placeholder="Ex: Boite A1" value={newItem.storage_location} onChange={e => setNewItem({...newItem, storage_location: e.target.value})} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-foil" className="text-right">Foil</Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Checkbox
                  id="edit-foil"
                  checked={(newItem as any).is_foil}
                  onCheckedChange={(checked) => setNewItem({...newItem, is_foil: checked === true} as any)}
                />
                <label htmlFor="edit-foil" className="text-sm">Cette carte est brillante (Foil)</label>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-condition" className="text-right">État</Label>
              <Select value={newItem.condition} onValueChange={v => setNewItem({...newItem, condition: v})}>
                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MT">Mint (MT)</SelectItem>
                  <SelectItem value="NM">Near Mint (NM)</SelectItem>
                  <SelectItem value="EX">Excellent (EX)</SelectItem>
                  <SelectItem value="GD">Good (GD)</SelectItem>
                  <SelectItem value="LP">Light Played (LP)</SelectItem>
                  <SelectItem value="PL">Played (PL)</SelectItem>
                  <SelectItem value="PO">Poor (PO)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateItem}>Enregistrer les modifications</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-foil" className="text-right">Foil</Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Checkbox
                  id="add-foil"
                  checked={(newItem as any).is_foil}
                  onCheckedChange={(checked) => setNewItem({...newItem, is_foil: checked === true} as any)}
                />
                <label htmlFor="add-foil" className="text-sm">Cette carte est brillante (Foil)</label>
              </div>
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
