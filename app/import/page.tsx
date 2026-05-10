"use client";

import { useState } from "react";
import { parseCardMarketEmail, ParsedOrder } from "@/lib/parser/emailParser";
import { parseCardMarketCSV, ParsedCSVOrder } from "@/lib/parser/csvParser";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle2, Import, Loader2, AlertTriangle, FileSpreadsheet, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getCardThumbnail } from "@/lib/cardmarket/images";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const STATUS_RANK: Record<string, number> = {
  'paid': 2,
  'preparing': 3,
  'shipped': 4,
  'completed': 5
};

export default function ImportPage() {
  const [inputText, setInputText] = useState("");
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [importMode, setImportMode] = useState<"email" | "csv">("email");
  const [parsedOrders, setParsedOrders] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [existingOrdersMap, setExistingOrdersMap] = useState<Record<string, any>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { toast } = useToast();

  const handleParse = async () => {
    let results: any[] = [];
    if (importMode === "email") {
      const result = parseCardMarketEmail(inputText);
      if (result) results = [result];
    } else {
      results = parseCardMarketCSV(inputText);
    }

    if (results.length === 0) {
      toast({
        title: "Erreur d'analyse",
        description: "Le format n'a pas été reconnu.",
        variant: "destructive",
      });
      return;
    }

    setParsedOrders(results);

    // Vérifier les doublons
    const supabase = createClient();
    const orderIds = results.map(r => r.orderId);
    const { data } = await supabase
      .from('orders')
      .select('*')
      .in('external_order_id', orderIds);

    if (data && data.length > 0) {
      const map: Record<string, any> = {};
      data.forEach((o: any) => map[o.external_order_id] = o);
      setExistingOrdersMap(map);
      setShowConfirmModal(true);
    }
  };

  const executeSave = async (isUpdate = false) => {
    if (parsedOrders.length === 0) return;

    setIsSaving(true);
    const supabase = createClient();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      for (const order of parsedOrders) {
        const orderData = {
          user_id: user.id,
          external_order_id: order.orderId,
          buyer_name: order.buyer || order.name,
          buyer_address: order.address,
          total_price: order.totalValue,
          shipping_cost: order.shippingCost,
          status: 'paid', // Par défaut pour un import
          source: importMode,
          created_at: importMode === 'csv' ? order.date : manualDate
        };

        const existing = existingOrdersMap[order.orderId];
        let orderId = "";

        if (existing && isUpdate) {
          const { error: updateError } = await supabase
            .from('orders')
            .update(orderData)
            .eq('id', existing.id);
          if (updateError) throw updateError;
          orderId = existing.id;
          await supabase.from('order_items').delete().eq('order_id', orderId);
        } else if (!existing) {
          const { data: newOrder, error: orderError } = await supabase
            .from('orders')
            .insert(orderData)
            .select()
            .single();
          if (orderError) throw orderError;
          orderId = newOrder.id;
        } else {
          continue; // On ne fait rien si existant et qu'on ne demande pas d'update
        }

        const itemsToInsert: any[] = [];
        for (const item of order.items) {
          const game = item.expansion?.toLowerCase().includes('magic') || item.details === 'R' ? 'magic' : 'pokemon';
          const imageUrl = await getCardThumbnail(item.name, game);

          for (let i = 0; i < item.quantity; i++) {
            itemsToInsert.push({
              order_id: orderId,
              card_name: item.name,
              expansion: item.expansion,
              game,
              condition: item.condition,
              language: item.language,
              quantity: 1,
              price: item.price,
              image_url: imageUrl
            });
          }
        }
        await supabase.from('order_items').insert(itemsToInsert);
      }

      toast({ title: "Importation réussie", description: `${parsedOrders.length} commande(s) traitée(s).` });
      setParsedOrders([]);
      setInputText("");
      setExistingOrdersMap({});
      setShowConfirmModal(false);
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Importation de Commandes</h1>
        <p className="text-muted-foreground">Importez vos ventes CardMarket via email ou export CSV.</p>
      </div>

      <Tabs defaultValue="email" onValueChange={(v: any) => setImportMode(v)}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="email"><Mail className="h-4 w-4 mr-2" /> Email</TabsTrigger>
          <TabsTrigger value="csv"><FileSpreadsheet className="h-4 w-4 mr-2" /> Export CSV</TabsTrigger>
        </TabsList>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{importMode === 'email' ? 'Email CardMarket' : 'CSV CardMarket'}</CardTitle>
            <CardDescription>
              {importMode === 'email'
                ? 'Collez le texte brut de l\'email de confirmation de vente.'
                : 'Collez le contenu de votre export CSV CardMarket (Sold Orders).'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {importMode === 'email' && (
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <label className="text-sm font-bold uppercase text-muted-foreground whitespace-nowrap">Date commande :</label>
                <Input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="bg-white max-w-[200px]"
                />
              </div>
            )}
            <Textarea
              placeholder={importMode === 'email' ? "Bonjour Nicolas, <buyer> t'a acheté..." : "OrderID;Username;Name;..."}
              className="min-h-[200px] font-mono text-sm"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <Button onClick={handleParse} className="w-full">
              <Import className="mr-2 h-4 w-4" /> Analyser les données
            </Button>
          </CardContent>
        </Card>
      </Tabs>

      {parsedOrders.length > 0 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <Card>
            <CardHeader>
              <CardTitle>{parsedOrders.length} Commande(s) détectée(s)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Acheteur</TableHead>
                    <TableHead>Articles</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedOrders.map((order, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-xs">{order.orderId}</TableCell>
                      <TableCell>{order.buyer || order.name}</TableCell>
                      <TableCell>{order.items.length} lignes</TableCell>
                      <TableCell className="text-right font-bold">{order.totalValue.toFixed(2)} €</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setParsedOrders([])}>Annuler</Button>
            <Button onClick={() => Object.keys(existingOrdersMap).length > 0 ? setShowConfirmModal(true) : executeSave()} className="bg-green-600 hover:bg-green-700" disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Enregistrer
            </Button>
          </div>
        </div>
      )}

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-yellow-500" /> Commande(s) déjà existante(s)
            </DialogTitle>
            <DialogDescription className="py-4">
              {Object.keys(existingOrdersMap).length} commande(s) sont déjà présentes en base de données. Voulez-vous les mettre à jour ou ignorer les doublons ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => executeSave(false)}>Ignorer les doublons</Button>
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>Annuler</Button>
            <Button onClick={() => executeSave(true)} disabled={isSaving}>Confirmer la mise à jour</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
