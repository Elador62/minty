"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    shipping_method: order?.shipping_method || "",
    status: order?.status || "paid",
    shipped_at: order?.shipped_at || ""
  });
  const [items, setItems] = useState<any[]>(order?.order_items || []);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  const handleAddItem = () => {
    setItems([...items, { card_name: "", expansion: "", quantity: 1, price: 0, condition: "NM", language: "Français", game: "pokemon" }]);
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

      if (orderId) {
        // Update
        const { error } = await supabase.from('orders').update({ ...formData }).eq('id', orderId);
        if (error) throw error;
        const { error: deleteError } = await supabase.from('order_items').delete().eq('order_id', orderId);
        if (deleteError) throw deleteError;
      } else {
        // Create
        const { data, error } = await supabase.from('orders').insert({ ...formData, user_id: user.id }).select().single();
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
            <Label>Date d'expédition</Label>
            <Input
              type="datetime-local"
              value={formData.shipped_at ? new Date(formData.shipped_at).toISOString().slice(0, 16) : ""}
              onChange={e => {
                const newVal = e.target.value;
                const oldVal = formData.shipped_at;

                if (oldVal && newVal) {
                  const confirmMsg = `Modifier la date d'expédition ?\nAncienne : ${new Date(oldVal).toLocaleString()}\nNouvelle : ${new Date(newVal).toLocaleString()}`;
                  if (!window.confirm(confirmMsg)) return;
                }

                setFormData({...formData, shipped_at: newVal ? new Date(newVal).toISOString() : null});
              }}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h4 className="font-bold">Items</h4>
            <Button size="sm" onClick={handleAddItem}><Plus className="h-4 w-4 mr-1" /> Ajouter</Button>
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
