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
  Bug,
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
import Link from "next/link";
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
import { getEnglishName } from "@/lib/cardmarket/search";
import { getLanguageFlag, SUPPORTED_LANGUAGES } from "@/lib/utils/languages";

function CardDetailsContent({ item, history, onRefreshPrice }: { item: any, history: any[], onRefreshPrice?: (item: any) => Promise<void> }) {
  if (!item) return null;
  const [isRefreshing, setIsRefreshing] = useState(false);

  return (
    <div className="py-4 md:py-6 space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="w-40 h-56 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 self-center sm:self-start">
          {item.image_url && <img src={item.image_url} alt="" className="w-full h-full object-cover" />}
        </div>
        <div className="space-y-4 flex-1">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs uppercase font-bold">TCG</p>
              <p className="font-bold capitalize">{item.game}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase font-bold">Édition</p>
              <p className="font-bold truncate" title={item.expansion}>{item.expansion}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase font-bold">État / Langue</p>
              <p className="font-bold flex items-center gap-2">
                {item.condition} <span className="text-base">{getLanguageFlag(item.language)}</span>
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase font-bold">Stockage</p>
              <p className="font-bold">{item.storage_location || 'Non défini'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase font-bold">Prix Listé</p>
              <p className="font-bold text-lg">{Number(item.listed_price).toFixed(2)} €</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase font-bold">Prix Marché</p>
              <div className="flex items-center gap-2">
                <p className="font-bold text-lg text-green-600">{Number(item.last_market_price).toFixed(2)} €</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={isRefreshing}
                  onClick={async () => {
                    setIsRefreshing(true);
                    if (onRefreshPrice) await onRefreshPrice(item);
                    setIsRefreshing(false);
                  }}
                  title="Actualiser le prix Trend"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-bold border-b pb-2 text-base">Historique des Commandes</h4>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Aucune commande trouvée pour cette configuration exacte.</p>
        ) : (
          <div className="space-y-3">
            {history.map((h) => (
              <div
                key={h.id}
                className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => {
                  window.location.href = `/suivi?orderId=${h.orders.id}`;
                }}
              >
                <div className="space-y-1 min-w-0">
                  <p className="text-sm font-bold truncate">{h.orders.buyer_name}</p>
                  <p className="text-[10px] text-muted-foreground">#{h.orders.external_order_id} • {new Date(h.orders.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-sm">{Number(h.price).toFixed(2)} €</p>
                  <Badge variant="outline" className="text-[10px] h-5 px-1 capitalize">{h.orders.status}</Badge>
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
  const [isUpdatePriceDialogOpen, setIsUpdatePriceDialogOpen] = useState(false);
  const [isDeleteTrashDialogOpen, setIsDeleteTrashDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    card_name: '',
    card_name_en: '',
    expansion: '',
    game: 'magic',
    listed_price: '',
    quantity: '1',
    storage_location: '',
    condition: 'NM',
    language: 'Français',
    color: '',
    card_type: '',
    set_code: '',
  });
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingCard, setIsSearchingCard] = useState(false);
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
    fetchInventory().then(() => {
      // Check for item ID in URL to open details
      const params = new URLSearchParams(window.location.search);
      const itemId = params.get('id');
      if (itemId) {
        // Search in items first
        const item = items.find(i => i.id === itemId);
        if (item) {
          handleShowDetails(item);
        } else {
          // If not in current page, we might need to fetch it specifically
          supabase.from('inventory_items').select('*').eq('id', itemId).single().then(({ data }) => {
            if (data) handleShowDetails(data);
          });
        }
      }
    });
  }, [currentPage, pageSize, filters, sortBy, sortOrder]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortBy, sortOrder, pageSize]);

  const handleRefreshSinglePrice = async (item: any) => {
    try {
      let currentItem = item;
      if (item.game === 'magic' && (!item.set_code || !item.card_name_en)) {
        const match = await getEnglishName(item.card_name, 'magic', item.expansion);
        if (match && !Array.isArray(match)) {
          const { data: updatedItem } = await supabase
            .from('inventory_items')
            .update({
              set_code: match.set_code,
              card_name_en: match.name_en,
              expansion: match.expansion_en
            })
            .eq('id', item.id)
            .select()
            .single();
          if (updatedItem) currentItem = updatedItem;
        }
      }

      const price = await getCardPrice(
        currentItem.card_name,
        currentItem.game,
        currentItem.expansion,
        currentItem.is_foil,
        currentItem.card_name_en,
        currentItem.set_code
      );

      if (price !== null) {
        if (price !== item.last_market_price) {
          await supabase.from('price_history').insert({
            inventory_item_id: item.id,
            price: price
          });
        }

        const { data: finalItem } = await supabase
          .from('inventory_items')
          .update({
            last_market_price: price,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id)
          .select()
          .single();

        if (finalItem) {
          setSelectedItem(finalItem);
          setItems(prev => prev.map(i => i.id === finalItem.id ? finalItem : i));
        }
        toast({ title: "Prix actualisé", description: `${item.card_name}: ${price}€` });
      }
    } catch (err) {
      console.error(`Erreur maj prix pour ${item.card_name}:`, err);
    }
  };

  const handleUpdatePrices = async (mode: 'all' | 'displayed' | 'selected') => {
    setIsRefreshing(true);
    setIsUpdatePriceDialogOpen(false);
    let updatedCount = 0;
    let totalChecked = 0;

    let itemsToUpdate: any[] = [];

    if (mode === 'all') {
      const { data: allItems, error: fetchError } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('is_archived', false);

      if (fetchError || !allItems) {
        toast({ title: "Erreur", description: "Impossible de récupérer l'inventaire complet.", variant: "destructive" });
        setIsRefreshing(false);
        return;
      }
      itemsToUpdate = allItems;
    } else if (mode === 'displayed') {
      itemsToUpdate = items;
    } else if (mode === 'selected') {
      itemsToUpdate = items.filter(i => selectedIds.includes(i.id));
    }

    if (itemsToUpdate.length === 0) {
      setIsRefreshing(false);
      return;
    }

    toast({ title: "Mise à jour lancée", description: `Analyse de ${itemsToUpdate.length} cartes...` });

    for (const item of itemsToUpdate) {
      try {
        let currentItem = item;

        // Backfill set_code et card_name_en si manquants (Magic uniquement pour Scryfall)
        if (item.game === 'magic' && (!item.set_code || !item.card_name_en)) {
          const match = await getEnglishName(item.card_name, 'magic', item.expansion);
          if (match && !Array.isArray(match)) {
            const { data: updatedItem } = await supabase
              .from('inventory_items')
              .update({
                set_code: match.set_code,
                card_name_en: match.name_en,
                expansion: match.expansion_en
              })
              .eq('id', item.id)
              .select()
              .single();
            if (updatedItem) currentItem = updatedItem;
          }
        }

        const price = await getCardPrice(
          currentItem.card_name,
          currentItem.game,
          currentItem.expansion,
          currentItem.is_foil,
          currentItem.card_name_en,
          currentItem.set_code
        );

        totalChecked++;
        if (price !== null) {
          // Historisation du prix si différent du dernier prix marché
          if (price !== item.last_market_price) {
            await supabase.from('price_history').insert({
              inventory_item_id: item.id,
              price: price
            });
            updatedCount++;
          }

          const { error: updateError } = await supabase
            .from('inventory_items')
            .update({
              last_market_price: price,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id);

          if (updateError) {
            console.error(`Error updating price for ${item.id}:`, updateError);
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

  const handleSelectSearchResult = (res: any) => {
    setSearchResult(res);
    setSearchResults([]);
    setNewItem({
      ...newItem,
      card_name: res.name_en, // On met à jour le nom par le nom anglais trouvé
      card_name_en: res.name_en,
      expansion: res.expansion_en,
      set_code: res.set_code || '',
      color: res.color || '',
      card_type: res.card_type || '',
    });
    toast({ title: "Carte sélectionnée", description: `${res.name_en} (${res.expansion_en})` });
  };

  const handleSearchCard = async () => {
    if (!newItem.card_name) return;
    setIsSearchingCard(true);
    setSearchResults([]);
    setSearchResult(null);

    const result = await getEnglishName(newItem.card_name, newItem.game, newItem.expansion);

    if (Array.isArray(result)) {
      setSearchResults(result);
      toast({ title: "Plusieurs résultats", description: "Veuillez sélectionner la carte exacte dans la liste." });
    } else if (result) {
      handleSelectSearchResult(result);
    } else {
      toast({ title: "Non trouvé", description: "Impossible de trouver une correspondance exacte.", variant: "destructive" });
    }
    setIsSearchingCard(false);
  };

  const handleAddItem = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const finalNameEn = searchResult?.name_en || newItem.card_name_en || newItem.card_name;
    const finalExpansion = searchResult?.expansion_en || newItem.expansion;
    const finalSetCode = searchResult?.set_code || (newItem as any).set_code || '';
    const imageUrl = await getCardThumbnail(finalNameEn, newItem.game);

    const { error } = await supabase.from('inventory_items').insert([{
      user_id: user.id,
      card_name: newItem.card_name,
      card_name_en: finalNameEn,
      expansion: finalExpansion,
      set_code: finalSetCode,
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
      last_market_price: parseFloat(newItem.listed_price) || 0
    }]);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Carte ajoutée", description: `${newItem.card_name} a été ajouté à votre collection.` });
      setIsAddModalOpen(false);
      setSearchResult(null);
      setNewItem({
        card_name: '',
        card_name_en: '',
        expansion: '',
        game: 'magic',
        listed_price: '',
        quantity: '1',
        storage_location: '',
        condition: 'NM',
        language: 'Français',
        color: '',
        card_type: '',
        set_code: '',
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
      if (lines.length < 2) return;

      const headers = lines[0].split(';').map(h => h.replace(/^"(.*)"$/, '$1').trim());
      const productUrlIdx = headers.indexOf('ProductUrl');
      const nameIdx = headers.indexOf('Nom Article') !== -1 ? headers.indexOf('Nom Article') : 2;
      const expansionIdx = headers.indexOf('Expansion') !== -1 ? headers.indexOf('Expansion') : 6;
      const conditionIdx = headers.indexOf('État') !== -1 ? headers.indexOf('État') : 9;
      const priceIdx = headers.indexOf('Prix') !== -1 ? headers.indexOf('Prix') : 14;
      const quantityIdx = headers.indexOf('Quantité') !== -1 ? headers.indexOf('Quantité') : 16;
      const cmUrlIdx = headers.indexOf('Cardmarket URL') !== -1 ? headers.indexOf('Cardmarket URL') : headers.length - 2;
      const externalIdIdx = 0;
      const rarityIdx = 7;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      toast({ title: "Import en cours", description: "Récupération des illustrations et traitement des données..." });

      const itemsToInsert = [];

      // On commence à 1 pour sauter le header
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const parts = lines[i].match(/(".*?"|[^;]+)(?=\s*;|\s*$)/g) || [];
        const cleanParts = parts.map(p => p.replace(/^"=""(.*?)"""$/, '$1').replace(/^"(.*)"$/, '$1'));

        if (cleanParts.length < Math.max(...headers.map((_, idx) => idx))) continue;

        const name = cleanParts[nameIdx];
        const expansion = cleanParts[expansionIdx];
        const condition = cleanParts[conditionIdx];
        const price = parseFloat(cleanParts[priceIdx]?.replace(',', '.')) || 0;
        const quantity = parseInt(cleanParts[quantityIdx]) || 0;
        const cmUrl = cleanParts[cmUrlIdx];
        const productUrl = productUrlIdx !== -1 ? cleanParts[productUrlIdx] : cleanParts[cleanParts.length - 1];
        const externalId = cleanParts[externalIdIdx];
        const rarity = cleanParts[rarityIdx];

        // Détection simple du jeu via l'URL CardMarket ou l'extension
        let game = 'magic';
        if (cmUrl.toLowerCase().includes('/pokemon/') || expansion.toLowerCase().includes('poker') || name.toLowerCase().includes('pikachu')) {
          game = 'pokemon';
        }

        // Rapprochement API pour le nom anglais, set_code et l'illustration
        let nameEn = name;
        let expansionEn = expansion;
        let setCode = '';
        let imageUrl = null;

        try {
          const match = await getEnglishName(name, game, expansion);
          if (match && !Array.isArray(match)) {
            nameEn = match.name_en;
            expansionEn = match.expansion_en || expansion;
            setCode = match.set_code || '';
          } else if (Array.isArray(match)) {
            nameEn = match[0].name_en;
            expansionEn = match[0].expansion_en || expansion;
            setCode = match[0].set_code || '';
          }
          imageUrl = await getCardThumbnail(nameEn, game);
        } catch (err) {
          console.error("Erreur rapprochement import:", err);
        }

        itemsToInsert.push({
          user_id: user.id,
          card_name: name,
          card_name_en: nameEn,
          expansion: expansionEn,
          set_code: setCode,
          game: game,
          listed_price: price,
          last_market_price: price,
          quantity: quantity,
          condition: condition,
          cardmarket_url: cmUrl,
          product_url: productUrl,
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

    // On cherche les commandes correspondantes via le nom de la carte (localisé ou anglais)
    const { data, error } = await supabase
      .from('order_items')
      .select('*, orders!inner(external_order_id, buyer_name, status, created_at)')
      .or(`card_name.eq."${item.card_name}",card_name.eq."${item.card_name_en}"`)
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

  const handleDeletePermanently = async (ids: string | string[]) => {
    const idsToDelete = Array.isArray(ids) ? ids : [ids];

    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .in('id', idsToDelete);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "Suppression définitive",
        description: `${idsToDelete.length} carte(s) supprimée(s) définitivement.`
      });
      setSelectedIds([]);
      fetchInventory();
    }
  };

  const handleEmptyTrash = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('user_id', user.id)
      .eq('is_archived', true);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Corbeille vidée", description: "Toutes les cartes archivées ont été supprimées." });
      fetchInventory();
    }
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
    <div className="container mx-auto px-4 py-6 md:py-10 space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Ma Collection</h1>
            <p className="text-muted-foreground text-xs md:text-sm">Gérez votre stock et suivez les prix du marché.</p>
          </div>
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 animate-in fade-in slide-in-from-left-4 overflow-x-auto max-w-full">
              <span className="text-[10px] md:text-xs font-bold shrink-0">{selectedIds.length} sélectionnée(s)</span>
              <Button
                variant="destructive"
                size="sm"
                className="h-7 md:h-8 text-[10px] md:text-xs shrink-0"
                onClick={() => handleArchiveItem(selectedIds, !filters.showArchived)}
              >
                {filters.showArchived ? <Undo className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" /> : <Trash2 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />}
                {filters.showArchived ? 'Restaurer' : 'Archiver'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 md:h-8 text-[10px] md:text-xs shrink-0"
                onClick={() => setSelectedIds([])}
              >
                Annuler
              </Button>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Button variant="outline" size="sm" className="grow md:grow-0" onClick={() => setIsImportModalOpen(true)}>
             <Upload className="h-4 w-4 mr-1 md:mr-2" /> <span className="hidden sm:inline">Import CSV</span><span className="sm:hidden text-[10px]">Import</span>
          </Button>
          <Button variant="outline" size="sm" className="grow md:grow-0" onClick={() => setIsAddModalOpen(true)}>
             <Plus className="h-4 w-4 mr-1 md:mr-2" /> <span className="hidden sm:inline">Ajouter</span><span className="sm:hidden text-[10px]">Ajouter</span>
          </Button>
          {filters.showArchived && (
            <Button variant="destructive" size="sm" className="grow md:grow-0" onClick={() => setIsDeleteTrashDialogOpen(true)}>
              <Trash2 className="h-4 w-4 mr-1 md:mr-2" /> <span className="hidden sm:inline">Vider la corbeille</span><span className="sm:hidden text-[10px]">Vider</span>
            </Button>
          )}
          <Button variant="outline" size="sm" className="grow md:grow-0" onClick={() => setFilters({...filters, showArchived: !filters.showArchived})}>
             {filters.showArchived ? <LayoutDashboard className="h-4 w-4 mr-1 md:mr-2" /> : <Trash2 className="h-4 w-4 mr-1 md:mr-2" />}
             <span className="hidden sm:inline">{filters.showArchived ? 'Voir Collection' : 'Voir Corbeille'}</span>
             <span className="sm:hidden text-[10px]">{filters.showArchived ? 'Coll.' : 'Corb.'}</span>
          </Button>
          <Button variant="outline" size="sm" className="grow md:grow-0" onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}>
             {viewMode === 'table' ? <LayoutDashboard className="h-4 w-4 mr-1 md:mr-2" /> : <ListIcon className="h-4 w-4 mr-1 md:mr-2" />}
             <span className="hidden sm:inline">{viewMode === 'table' ? 'Mode Cartes' : 'Mode Liste'}</span>
             <span className="sm:hidden text-[10px]">{viewMode === 'table' ? 'Cartes' : 'Liste'}</span>
          </Button>
          <Button size="sm" className="grow md:grow-0" onClick={() => setIsUpdatePriceDialogOpen(true)} disabled={isRefreshing || items.length === 0}>
            <RefreshCw className={`mr-1 md:mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualiser Prix</span>
            <span className="sm:hidden text-[10px]">Prix</span>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild title="Debug APIs de prix">
             <Link href="/collection/debug-prices">
                <Bug className="h-4 w-4 text-muted-foreground" />
             </Link>
          </Button>
        </div>
      </div>

      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
                <Input placeholder="Min" type="number" value={filters.minPrice} onChange={(e) => setFilters({...filters, minPrice: e.target.value})} className="bg-white h-9 w-full" />
                <Input placeholder="Max" type="number" value={filters.maxPrice} onChange={(e) => setFilters({...filters, maxPrice: e.target.value})} className="bg-white h-9 w-full" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-end gap-2 pr-0 lg:pr-4">
               <div className="w-full space-y-1">
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
               <div className="w-full space-y-1">
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
               <Button variant="ghost" size="sm" onClick={() => setFilters(initialFilters)} className="h-9 shrink-0 text-muted-foreground hover:text-primary">
                  <RotateCcw className="h-4 w-4" />
               </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6 md:space-y-10">
        {Object.entries(groups).map(([groupName, groupItems]) => (
          <div key={groupName} className="space-y-4">
            <h3 className="text-lg md:text-xl font-bold border-b pb-2 flex items-center gap-2">
              {groupName} <Badge variant="secondary">{groupItems.length}</Badge>
            </h3>

            {viewMode === 'table' ? (
              <Card className="overflow-hidden">
                <CardContent className="p-0 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px]">
                          <Checkbox
                            checked={items.length > 0 && selectedIds.length === items.length}
                            onCheckedChange={toggleSelectAll}
                          />
                        </TableHead>
                        <TableHead className="w-[60px] md:w-[80px]">Image</TableHead>
                        <TableHead className="cursor-pointer hover:text-primary min-w-[150px]" onClick={() => handleSort('card_name')}>
                          Nom {sortBy === 'card_name' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead className="cursor-pointer hover:text-primary min-w-[120px]" onClick={() => handleSort('expansion')}>
                          Édition {sortBy === 'expansion' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead className="cursor-pointer hover:text-primary min-w-[100px] hidden sm:table-cell" onClick={() => handleSort('storage_location')}>
                          Stockage {sortBy === 'storage_location' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead className="text-right cursor-pointer hover:text-primary" onClick={() => handleSort('quantity')}>
                          Qté {sortBy === 'quantity' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead className="text-right cursor-pointer hover:text-primary hidden sm:table-cell" onClick={() => handleSort('listed_price')}>
                          Prix {sortBy === 'listed_price' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead className="text-right cursor-pointer hover:text-primary" onClick={() => handleSort('last_market_price')}>
                          Marché {sortBy === 'last_market_price' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead className="text-right w-[100px]">Actions</TableHead>
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
                              <div className="w-8 h-11 md:w-10 md:h-14 bg-slate-100 rounded overflow-hidden">
                                {item.image_url && <img src={item.image_url} alt="" className="w-full h-full object-cover" />}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              <div
                                className="flex flex-wrap items-center gap-2 cursor-pointer hover:text-primary group"
                                onClick={() => handleShowDetails(item)}
                              >
                                <span className="text-xs md:text-sm">{item.card_name}</span>
                                <span title={item.language} className="text-base">{getLanguageFlag(item.language)}</span>
                                {item.is_foil && <Badge className="bg-purple-100 text-purple-700 text-[8px] md:text-[10px] h-4 py-0 px-1">Foil</Badge>}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs md:text-sm max-w-[150px] truncate">{item.expansion}</TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <div className="flex items-center gap-1 text-muted-foreground text-xs md:text-sm">
                                <Box className="h-3 w-3" />
                                {item.storage_location || '-'}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              <Badge variant={item.quantity > 0 ? "secondary" : "destructive"} className="text-[10px] md:text-xs px-1 md:px-2">{item.quantity}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs md:text-sm hidden sm:table-cell">{Number(item.listed_price).toFixed(2)} €</TableCell>
                            <TableCell className="text-right">
                              <div className="flex flex-col items-end">
                                <span className="font-mono font-bold text-xs md:text-sm">{Number(item.last_market_price).toFixed(2)} €</span>
                                <div className={`flex items-center gap-1 text-[8px] md:text-[10px] font-bold ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {diff > 0 ? <TrendingUp className="h-2 w-2" /> : <TrendingDown className="h-2 w-2" />}
                                  {Math.abs(diff).toFixed(1)}%
                                  {isAlert && <AlertCircle className="h-3 w-3 text-orange-500 animate-pulse shrink-0" />}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                               <div className="flex justify-end gap-1">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 hidden md:inline-flex" asChild title="Voir sur CardMarket">
                                    <a
                                      href={item.product_url || getCardMarketUrl(item)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </a>
                                  </Button>

                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
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
                                      <DropdownMenuItem asChild className="md:hidden">
                                        <a href={item.product_url || getCardMarketUrl(item)} target="_blank" rel="noopener noreferrer">
                                          <ExternalLink className="h-4 w-4 mr-2" /> CardMarket
                                        </a>
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
                                      {item.is_archived && (
                                        <DropdownMenuItem
                                          className="text-destructive font-bold"
                                          onClick={() => handleDeletePermanently(item.id)}
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" /> Supprimer définitivement
                                        </DropdownMenuItem>
                                      )}
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-6">
                {groupItems.map((item) => {
                  const diff = item.listed_price > 0 ? ((Number(item.last_market_price) - Number(item.listed_price)) / Number(item.listed_price)) * 100 : 0;
                  return (
                    <Card key={item.id} className="overflow-hidden group">
                      <div className="aspect-[3/4] relative bg-slate-100">
                        {item.image_url && <img src={item.image_url} alt="" className="w-full h-full object-contain" />}
                        <div className="absolute top-1.5 left-1.5">
                          <Checkbox
                            checked={selectedIds.includes(item.id)}
                            onCheckedChange={() => toggleSelect(item.id)}
                            className="bg-white/90 data-[state=checked]:bg-primary h-4 w-4 md:h-5 md:w-5"
                          />
                        </div>
                        <div className="absolute top-1.5 right-1.5 flex flex-col gap-1 items-end">
                          <Badge className={`${diff > 0 ? 'bg-green-600' : 'bg-red-600'} text-[8px] md:text-[10px] px-1 py-0 h-4 md:h-5`}>
                            {diff > 0 ? '+' : ''}{diff.toFixed(0)}%
                          </Badge>
                          <Badge variant="secondary" className="bg-white/90 text-[8px] md:text-[10px] px-1 py-0 h-4 md:h-5">x{item.quantity}</Badge>
                        </div>
                        {item.storage_location && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] md:text-[10px] px-2 py-1 flex items-center gap-1">
                            <Box className="h-2 w-2 md:h-3 md:w-3" /> <span className="truncate">{item.storage_location}</span>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-2 md:p-3">
                        <p
                          className="font-bold text-xs md:text-sm truncate flex items-center gap-1 cursor-pointer hover:text-primary"
                          onClick={() => handleShowDetails(item)}
                        >
                          <span className="truncate flex-1">{item.card_name}</span>
                          <span className="text-base shrink-0">{getLanguageFlag(item.language)}</span>
                        </p>
                        <p className="text-[9px] md:text-[10px] text-muted-foreground truncate">{item.expansion}</p>
                        <div className="mt-2 flex justify-between items-end">
                          <span className="text-[10px] md:text-xs font-bold">{Number(item.listed_price).toFixed(2)}€</span>
                          <span className="text-[9px] md:text-[10px] font-mono text-green-600 font-bold">{Number(item.last_market_price).toFixed(2)}€</span>
                        </div>
                        <div className="mt-2 pt-2 border-t flex justify-between items-center">
                           <Button variant="ghost" size="sm" className="h-6 md:h-7 px-1 md:px-2 text-[9px] md:text-[10px]" asChild>
                              <a href={item.product_url || getCardMarketUrl(item)} target="_blank" rel="noopener noreferrer">
                                CM <ExternalLink className="ml-1 h-2.5 w-2.5 md:h-3 md:w-3" />
                              </a>
                           </Button>
                           <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 md:h-7 md:w-7">
                                  <MoreVertical className="h-3 w-3 md:h-4 md:w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleShowDetails(item)}>
                                  <Info className="h-3 w-3 md:h-4 md:w-4 mr-2" /> Détails
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditItem(item)}>
                                  <Edit className="h-3 w-3 md:h-4 md:w-4 mr-2" /> Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className={item.is_archived ? "text-green-600" : "text-destructive"}
                                  onClick={() => handleArchiveItem(item.id, !item.is_archived)}
                                >
                                  {item.is_archived ? (
                                    <><Undo className="h-3 w-3 md:h-4 md:w-4 mr-2" /> Restaurer</>
                                  ) : (
                                    <><Trash2 className="h-3 w-3 md:h-4 md:w-4 mr-2" /> Archiver</>
                                  )}
                                </DropdownMenuItem>
                                {item.is_archived && (
                                  <DropdownMenuItem
                                    className="text-destructive font-bold"
                                    onClick={() => handleDeletePermanently(item.id)}
                                  >
                                    <Trash2 className="h-3 w-3 md:h-4 md:w-4 mr-2" /> Supprimer définitivement
                                  </DropdownMenuItem>
                                )}
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pb-10">
        <p className="text-xs md:text-sm text-muted-foreground order-2 sm:order-1">
          Affichage de {(currentPage - 1) * pageSize + 1} à {Math.min(currentPage * pageSize, totalCount)} sur {totalCount} cartes
        </p>
        <div className="flex gap-1 md:gap-2 order-1 sm:order-2 overflow-x-auto max-w-full pb-2 sm:pb-0">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs px-2"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Précédent</span>
          </Button>
          <div className="flex items-center gap-1">
             {(() => {
               const totalPages = Math.ceil(totalCount / pageSize);
               let startPage = Math.max(1, currentPage - 1);
               let endPage = Math.min(totalPages, startPage + (totalPages > 5 ? 3 : totalPages));

               if (endPage - startPage < (totalPages > 5 ? 3 : totalPages - 1)) {
                 startPage = Math.max(1, endPage - (totalPages > 5 ? 3 : totalPages - 1));
               }

               const pages = [];
               for (let i = startPage; i <= endPage; i++) {
                 pages.push(
                   <Button
                     key={i}
                     variant={currentPage === i ? "default" : "outline"}
                     size="sm"
                     className="w-8 h-8 md:w-9 text-xs p-0"
                     onClick={() => setCurrentPage(i)}
                   >
                     {i}
                   </Button>
                 );
               }
               return pages;
             })()}
             {Math.ceil(totalCount / pageSize) > currentPage + 2 && <span className="px-1 md:px-2">...</span>}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs px-2"
            onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalCount / pageSize), p + 1))}
            disabled={currentPage >= Math.ceil(totalCount / pageSize)}
          >
            <span className="hidden sm:inline">Suivant</span> <ChevronRight className="h-4 w-4 ml-1 sm:ml-2" />
          </Button>
        </div>
      </div>

      {/* COMPOSANT DÉTAILS (MODAL OU SHEET) */}
      {userSettings?.card_view_mode === 'sheet' ? (
        <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <SheetContent className="sm:max-w-xl overflow-y-auto w-[95%] sm:w-full">
            <SheetHeader>
              <SheetTitle>{selectedItem?.card_name}</SheetTitle>
              <SheetDescription className="truncate">{selectedItem?.expansion}</SheetDescription>
            </SheetHeader>
            <CardDetailsContent item={selectedItem} history={orderHistory} onRefreshPrice={handleRefreshSinglePrice} />
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto w-[95%] sm:w-full p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg md:text-xl">{selectedItem?.card_name}</DialogTitle>
              <DialogDescription className="truncate">{selectedItem?.expansion}</DialogDescription>
            </DialogHeader>
            <CardDetailsContent item={selectedItem} history={orderHistory} onRefreshPrice={handleRefreshSinglePrice} />
          </DialogContent>
        </Dialog>
      )}

      {/* DIALOG VIDER CORBEILLE */}
      <Dialog open={isDeleteTrashDialogOpen} onOpenChange={setIsDeleteTrashDialogOpen}>
        <DialogContent className="w-[95%] sm:w-full">
          <DialogHeader>
            <DialogTitle>Vider la corbeille</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer définitivement toutes les cartes de la corbeille ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsDeleteTrashDialogOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={() => {
              handleEmptyTrash();
              setIsDeleteTrashDialogOpen(false);
            }}>Confirmer la suppression</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG ACTUALISATION PRIX */}
      <Dialog open={isUpdatePriceDialogOpen} onOpenChange={setIsUpdatePriceDialogOpen}>
        <DialogContent className="w-[95%] sm:w-full">
          <DialogHeader>
            <DialogTitle>Actualiser les prix</DialogTitle>
            <DialogDescription>
              Quelles cartes souhaitez-vous actualiser ? L'opération peut prendre du temps.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button variant="outline" onClick={() => handleUpdatePrices('all')}>
              Toutes les cartes ({totalCount})
            </Button>
            <Button variant="outline" onClick={() => handleUpdatePrices('displayed')}>
              Cartes affichées à l'écran ({items.length})
            </Button>
            <Button variant="outline" onClick={() => handleUpdatePrices('selected')} disabled={selectedIds.length === 0}>
              Cartes sélectionnées ({selectedIds.length})
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL ÉDITION */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px] w-[95%] sm:w-full overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Modifier la carte</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right text-xs md:text-sm">Nom</Label>
              <Input id="edit-name" value={newItem.card_name} onChange={e => setNewItem({...newItem, card_name: e.target.value})} className="col-span-3 h-9" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-expansion" className="text-right text-xs md:text-sm">Édition</Label>
              <Input id="edit-expansion" value={newItem.expansion} onChange={e => setNewItem({...newItem, expansion: e.target.value})} className="col-span-3 h-9" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-price" className="text-right text-xs md:text-sm">Prix (€)</Label>
              <Input id="edit-price" type="number" step="0.01" value={newItem.listed_price} onChange={e => setNewItem({...newItem, listed_price: e.target.value})} className="col-span-3 h-9" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-quantity" className="text-right text-xs md:text-sm">Qté</Label>
              <Input id="edit-quantity" type="number" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: e.target.value})} className="col-span-3 h-9" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-storage" className="text-right text-xs md:text-sm">Stockage</Label>
              <Input id="edit-storage" placeholder="Ex: Boite A1" value={newItem.storage_location} onChange={e => setNewItem({...newItem, storage_location: e.target.value})} className="col-span-3 h-9" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-foil" className="text-right text-xs md:text-sm">Foil</Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Checkbox
                  id="edit-foil"
                  checked={(newItem as any).is_foil}
                  onCheckedChange={(checked) => setNewItem({...newItem, is_foil: checked === true} as any)}
                />
                <label htmlFor="edit-foil" className="text-xs md:text-sm">Carte brillante</label>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-language" className="text-right text-xs md:text-sm">Langue</Label>
              <Select value={newItem.language} onValueChange={v => setNewItem({...newItem, language: v})}>
                <SelectTrigger className="col-span-3 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-condition" className="text-right text-xs md:text-sm">État</Label>
              <Select value={newItem.condition} onValueChange={v => setNewItem({...newItem, condition: v})}>
                <SelectTrigger className="col-span-3 h-9"><SelectValue /></SelectTrigger>
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
            <Button onClick={handleUpdateItem} className="w-full">Enregistrer les modifications</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL AJOUT MANUEL */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto w-[95%] sm:w-full">
          <DialogHeader>
            <DialogTitle>Ajouter une carte</DialogTitle>
            <DialogDescription className="text-xs">Saisissez les détails de la carte à ajouter.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 md:gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name" className="text-xs md:text-sm font-bold uppercase text-muted-foreground">Nom de la carte</Label>
              <div className="flex gap-2 w-full items-center">
                <Input id="name" className="grow h-9" value={newItem.card_name} onChange={e => setNewItem({...newItem, card_name: e.target.value})} placeholder="Nom (FR ou EN)" />
                <Button variant="outline" size="icon" className="shrink-0 h-9 w-9" onClick={handleSearchCard} disabled={isSearchingCard} title="Vérifier correspondance API">
                   <Search className={`h-4 w-4 ${isSearchingCard ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded border">
                <p className="text-[10px] font-bold uppercase text-muted-foreground px-1">Résultats ({searchResults.length}) :</p>
                {searchResults.map((res, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer border border-transparent hover:border-slate-200 transition-colors"
                    onClick={() => handleSelectSearchResult(res)}
                  >
                    <div className="w-8 h-12 bg-slate-200 rounded overflow-hidden flex-shrink-0">
                      {res.image_url && <img src={res.image_url} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className="text-xs font-bold truncate">{res.name_en}</p>
                       <p className="text-[10px] text-muted-foreground truncate">{res.expansion_en}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {searchResult && (
              <div className="flex items-center gap-3 bg-green-50 p-2 rounded border border-green-200">
                <div className="w-8 h-12 bg-slate-200 rounded overflow-hidden flex-shrink-0">
                  {searchResult.image_url && <img src={searchResult.image_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="text-xs text-green-700 min-w-0">
                  <strong className="truncate block">{searchResult.name_en}</strong>
                  <span className="opacity-80 truncate block">{searchResult.expansion_en}</span>
                </div>
                <Badge variant="outline" className="ml-auto bg-green-100 text-green-700 border-green-200 text-[8px] h-4">API Match</Badge>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="game" className="text-xs font-bold uppercase text-muted-foreground">TCG</Label>
                <Select value={newItem.game} onValueChange={v => setNewItem({...newItem, game: v})}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="magic">Magic</SelectItem>
                    <SelectItem value="pokemon">Pokémon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="expansion" className="text-xs font-bold uppercase text-muted-foreground">Édition</Label>
                {searchResult?.all_editions ? (
                  <Select
                    value={newItem.expansion}
                    onValueChange={v => {
                      const ed = searchResult.all_editions.find((e: any) => e.name === v);
                      setNewItem({
                        ...newItem,
                        expansion: v,
                        card_name_en: ed?.name_en || newItem.card_name_en,
                          set_code: ed?.code || (newItem as any).set_code || '',
                        color: ed?.color || newItem.color,
                        card_type: ed?.card_type || newItem.card_type
                        } as any);
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Choisir" />
                    </SelectTrigger>
                    <SelectContent>
                      {searchResult.all_editions.map((ed: any) => (
                        <SelectItem key={ed.name} value={ed.name}>
                          {ed.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input id="expansion" className="h-9" value={newItem.expansion} onChange={e => setNewItem({...newItem, expansion: e.target.value})} placeholder="Ex: Dominaria" />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="price" className="text-xs font-bold uppercase text-muted-foreground">Prix (€)</Label>
                <Input id="price" type="number" step="0.01" value={newItem.listed_price} onChange={e => setNewItem({...newItem, listed_price: e.target.value})} className="h-9" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="quantity" className="text-xs font-bold uppercase text-muted-foreground">Quantité</Label>
                <Input id="quantity" type="number" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: e.target.value})} className="h-9" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="storage" className="text-xs font-bold uppercase text-muted-foreground">Stockage</Label>
                <Input id="storage" placeholder="Ex: Boite A1" value={newItem.storage_location} onChange={e => setNewItem({...newItem, storage_location: e.target.value})} className="h-9" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="language" className="text-xs font-bold uppercase text-muted-foreground">Langue</Label>
                <Select value={newItem.language} onValueChange={v => setNewItem({...newItem, language: v})}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_LANGUAGES.map(lang => (
                      <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="add-foil"
                checked={(newItem as any).is_foil}
                onCheckedChange={(checked) => setNewItem({...newItem, is_foil: checked === true} as any)}
              />
              <label htmlFor="add-foil" className="text-xs font-bold uppercase text-muted-foreground cursor-pointer">Carte brillante (Foil)</label>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddItem} className="w-full">Ajouter à la collection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL IMPORT CSV */}
      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent className="w-[95%] sm:w-full">
          <DialogHeader>
            <DialogTitle>Importer depuis un CSV</DialogTitle>
            <DialogDescription className="text-xs">Format CardMarket semi-colon recommandé.</DialogDescription>
          </DialogHeader>
          <div className="py-6 md:py-8 flex flex-col items-center justify-center border-2 border-dashed rounded-lg bg-slate-50">
             <Upload className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground mb-3 md:mb-4" />
             <p className="text-xs md:text-sm text-muted-foreground mb-4 px-4 text-center">Sélectionnez votre fichier d'inventaire CardMarket</p>
             <input
               type="file"
               accept=".csv"
               className="hidden"
               ref={fileInputRef}
               onChange={handleImportCSV}
             />
             <Button size="sm" onClick={() => fileInputRef.current?.click()}>Choisir un fichier</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
