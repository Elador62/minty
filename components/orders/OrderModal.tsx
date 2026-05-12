"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getLanguageFlag, SUPPORTED_LANGUAGES } from "@/lib/utils/languages";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface OrderModalProps {
  order?: any;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export function OrderModal({ order, isOpen, onClose, onRefresh }: OrderModalProps) {
  const [formData, setFormData] = useState({
    external_order_id: order?.external_order_id || "",
    buyer_name: order?.buyer_name || "",
    buyer_address: order?.buyer_address || "",
    total_price: order?.total_price || 0,
    shipping_cost: order?.shipping_cost || 0,
    shipping_method: order?.shipping_method || "Lettre Verte(max. 20g)",
    status: order?.status || "paid",
    is_trust_service: order?.is_trust_service || false,
    shipped_at: order?.shipped_at ? new Date(order.shipped_at).toISOString().split('T')[0] : "",
    delivered_at: order?.delivered_at ? new Date(order.delivered_at).toISOString().split('T')[0] : ""
  });
  const [items, setItems] = useState<any[]>(order?.order_items || []);
  const [inventorySearch, setInventorySearch] = useState("");
  const [inventoryResults, setInventoryResults] = useState<any[]>([]);
  const [userSettings, setUserSettings] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    async function fetchSettings() {
      const { data } = await supabase.from('user_settings').select('*').single();
      if (data) setUserSettings(data);
    }
    fetchSettings();
  }, []);

  const handleAddItem = (inventoryItem?: any) => {
    if (inventoryItem) {
      setItems([...items, {
        card_name: inventoryItem.card_name,
        expansion: inventoryItem.expansion,
        quantity: 1,
        price: inventoryItem.listed_price,
        condition: inventoryItem.condition,
        language: inventoryItem.language,
        game: inventoryItem.game,
        image_url: inventoryItem.image_url
      }]);
      setInventoryResults([]);
      setInventorySearch("");
    } else {
      setItems([...items, { card_name: "", expansion: "", quantity: 1, price: 0, condition: "NM", language: "Français", game: "pokemon" }]);
    }
  };

  const searchInventory = async (query: string) => {
    setInventorySearch(query);
    if (query.length < 2) {
      setInventoryResults([]);
      return;
    }

    const { data } = await supabase
      .from('inventory_items')
      .select('*')
      .ilike('card_name', `%${query}%`)
      .eq('is_archived', false)
      .limit(5);

    setInventoryResults(data || []);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Auth required");

      let orderId = order?.id;

      const submissionData = {
        ...formData,
        shipped_at: formData.shipped_at ? new Date(formData.shipped_at).toISOString() : null,
        delivered_at: formData.delivered_at ? new Date(formData.delivered_at).toISOString() : null,
      };

      if (orderId) {
        // Update
        const { error } = await supabase.from('orders').update(submissionData).eq('id', orderId);
        if (error) throw error;
        const { error: deleteError } = await supabase.from('order_items').delete().eq('order_id', orderId);
        if (deleteError) throw deleteError;
      } else {
        // Create
        const { data, error } = await supabase.from('orders').insert({ ...submissionData, user_id: user.id }).select().single();
        if (error) throw error;
        orderId = data.id;
      }

      // Division par unité
      const itemsToInsert: any[] = [];
      for (const item of items) {
        for (let i = 0; i < (item.quantity || 1); i++) {
          const { id, quantity, ...rest } = item;
          itemsToInsert.push({ ...rest, quantity: 1, order_id: orderId });
        }
      }
      const { error: itemError } = await supabase.from('order_items').insert(itemsToInsert);
      if (itemError) throw itemError;

      toast({ title: "Succès", description: "Commande enregistrée" });
      onRefresh();
      onClose();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{order ? "Modifier la commande" : "Nouvelle commande"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label>ID Commande</Label>
            <Input value={formData.external_order_id} onChange={e => setFormData({...formData, external_order_id: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>Acheteur</Label>
            <Input value={formData.buyer_name} onChange={e => setFormData({...formData, buyer_name: e.target.value})} />
          </div>
          <div className="col-span-2 space-y-2">
            <Label>Adresse</Label>
            <Input value={formData.buyer_address} onChange={e => setFormData({...formData, buyer_address: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>Prix Total (€)</Label>
            <Input type="number" value={formData.total_price} onChange={e => setFormData({...formData, total_price: parseFloat(e.target.value)})} />
          </div>
          <div className="space-y-2">
            <Label>Frais de port (€)</Label>
            <Input type="number" value={formData.shipping_cost} onChange={e => setFormData({...formData, shipping_cost: parseFloat(e.target.value)})} />
          </div>
          <div className="space-y-2">
            <Label>Méthode d'envoi</Label>
            <Select
              value={formData.shipping_method}
              onValueChange={v => setFormData({...formData, shipping_method: v})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {userSettings?.shipping_methods?.map((m: string) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                )) || (
                  <>
                    <SelectItem value="Lettre Internationale (Priority Letter)(max. 20g)">Lettre Internationale (Priority Letter)(max. 20g)</SelectItem>
                    <SelectItem value="Lettre Verte(max. 20g)">Lettre Verte(max. 20g)</SelectItem>
                    <SelectItem value="Lettre Verte Suivi(max. 20g)">Lettre Verte Suivi(max. 20g)</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2 pt-8">
            <Checkbox
              id="trust"
              checked={formData.is_trust_service}
              onCheckedChange={(checked) => setFormData({...formData, is_trust_service: !!checked})}
            />
            <Label htmlFor="trust" className="font-bold text-red-600">TIERS DE CONFIANCE (THRUST)</Label>
          </div>
          <div className="space-y-2">
            <Label>Date d'expédition</Label>
            <Input type="date" value={formData.shipped_at} onChange={e => setFormData({...formData, shipped_at: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>Date de réception</Label>
            <Input type="date" value={formData.delivered_at} onChange={e => setFormData({...formData, delivered_at: e.target.value})} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h4 className="font-bold">Items</h4>
            <div className="flex gap-2 items-center relative">
               <div className="relative">
                  <Input
                    placeholder="Chercher dans la collection..."
                    className="h-8 text-xs w-64"
                    value={inventorySearch}
                    onChange={e => searchInventory(e.target.value)}
                  />
                  {inventoryResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 bg-white border rounded shadow-lg mt-1 overflow-hidden">
                       {inventoryResults.map(item => (
                         <div
                           key={item.id}
                           className="flex items-center gap-2 p-2 hover:bg-slate-50 cursor-pointer border-b last:border-0"
                           onClick={() => handleAddItem(item)}
                         >
                            <img src={item.image_url} className="w-6 h-8 object-cover rounded" alt="" />
                            <div className="flex-1 min-w-0">
                               <p className="text-[10px] font-bold truncate">{item.card_name}</p>
                               <p className="text-[8px] text-muted-foreground truncate">{item.expansion} ({item.quantity} en stock)</p>
                            </div>
                         </div>
                       ))}
                    </div>
                  )}
               </div>
               <Button size="sm" variant="outline" className="h-8" onClick={() => handleAddItem()}><Plus className="h-4 w-4 mr-1" /> Manuel</Button>
            </div>
          </div>
          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-6 gap-2 items-end border-b pb-3">
              <div className="col-span-2 space-y-1">
                <Label className="text-[10px]">Nom</Label>
                <Input size={1} className="h-8 text-xs" value={item.card_name} onChange={e => {
                  const newItems = [...items];
                  newItems[idx].card_name = e.target.value;
                  setItems(newItems);
                }} />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Qté</Label>
                <Input type="number" className="h-8 text-xs" value={item.quantity} onChange={e => {
                  const newItems = [...items];
                  newItems[idx].quantity = parseInt(e.target.value);
                  setItems(newItems);
                }} />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Prix (€)</Label>
                <Input type="number" className="h-8 text-xs" value={item.price} onChange={e => {
                  const newItems = [...items];
                  newItems[idx].price = parseFloat(e.target.value);
                  setItems(newItems);
                }} />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Jeu</Label>
                <select className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm" value={item.game} onChange={e => {
                   const newItems = [...items];
                   newItems[idx].game = e.target.value;
                   setItems(newItems);
                }}>
                  <option value="pokemon">Pokémon</option>
                  <option value="magic">Magic</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Langue</Label>
                <select className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm" value={item.language} onChange={e => {
                   const newItems = [...items];
                   newItems[idx].language = e.target.value;
                   setItems(newItems);
                }}>
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <option key={lang} value={lang}>{getLanguageFlag(lang)} {lang}</option>
                  ))}
                </select>
              </div>
              <Button variant="ghost" size="sm" className="text-red-500 h-8" onClick={() => handleRemoveItem(idx)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSave} disabled={isSaving}>{isSaving ? "Enregistrement..." : "Enregistrer"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
