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
    <div className="container mx-auto px-4 py-6 md:py-10 space-y-6 md:space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Importation de Commandes</h1>
        <p className="text-xs md:text-sm text-muted-foreground">Importez vos ventes CardMarket via email ou export CSV.</p>
      </div>

      <Tabs defaultValue="email" className="w-full" onValueChange={(v: any) => setImportMode(v)}>
        <TabsList className="grid w-full grid-cols-2 max-w-md h-9 md:h-10">
          <TabsTrigger value="email" className="text-xs md:text-sm"><Mail className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-2" /> Email</TabsTrigger>
          <TabsTrigger value="csv" className="text-xs md:text-sm"><FileSpreadsheet className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-2" /> CSV</TabsTrigger>
        </TabsList>

        <Card className="mt-6 overflow-hidden">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-lg md:text-xl">{importMode === 'email' ? 'Email CardMarket' : 'CSV CardMarket'}</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              {importMode === 'email'
                ? 'Collez le texte brut de l\'email de confirmation de vente.'
                : 'Collez le contenu de votre export CSV CardMarket (Sold Orders).'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 space-y-4">
            {importMode === 'email' && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 md:gap-4 p-3 md:p-4 bg-slate-50 rounded-lg border border-slate-200">
                <label className="text-[10px] md:text-sm font-bold uppercase text-muted-foreground whitespace-nowrap">Date commande :</label>
                <Input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="bg-white h-9 w-full sm:max-w-[200px]"
                />
              </div>
            )}
            <Textarea
              placeholder={importMode === 'email' ? "Bonjour Nicolas, <buyer> t'a acheté..." : "OrderID;Username;Name;..."}
              className="min-h-[150px] md:min-h-[200px] font-mono text-[10px] md:text-xs"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <Button onClick={handleParse} className="w-full h-9 md:h-10 text-xs md:text-sm">
              <Import className="mr-1 md:mr-2 h-4 w-4" /> Analyser les données
            </Button>
          </CardContent>
        </Card>
      </Tabs>

      {parsedOrders.length > 0 && (
        <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <Card className="overflow-hidden">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-lg md:text-xl">{parsedOrders.length} Commande(s) détectée(s)</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <div className="max-h-[300px] md:max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">ID</TableHead>
                    <TableHead className="text-xs">Acheteur</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">Articles</TableHead>
                    <TableHead className="text-right text-xs">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedOrders.map((order, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-[10px] md:text-xs">{order.orderId}</TableCell>
                      <TableCell className="text-xs md:text-sm truncate max-w-[100px] md:max-w-none">{order.buyer || order.name}</TableCell>
                      <TableCell className="text-xs hidden sm:table-cell">{order.items.length} lignes</TableCell>
                      <TableCell className="text-right font-bold text-xs md:text-sm">{order.totalValue.toFixed(2)} €</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row justify-end gap-2 md:gap-4">
            <Button variant="outline" size="sm" className="w-full sm:w-auto h-9 md:h-10 text-xs md:text-sm" onClick={() => setParsedOrders([])}>Annuler</Button>
            <Button onClick={() => Object.keys(existingOrdersMap).length > 0 ? setShowConfirmModal(true) : executeSave()} className="w-full sm:w-auto h-9 md:h-10 text-xs md:text-sm bg-green-600 hover:bg-green-700" disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Enregistrer
            </Button>
          </div>
        </div>
      )}

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="w-[95%] sm:w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
              <AlertTriangle className="text-yellow-500 h-5 w-5" /> Commande(s) existante(s)
            </DialogTitle>
            <DialogDescription className="py-2 md:py-4 text-xs md:text-sm">
              {Object.keys(existingOrdersMap).length} commande(s) sont déjà présentes. Voulez-vous les mettre à jour ou ignorer les doublons ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="ghost" size="sm" className="h-9 md:h-10 text-xs" onClick={() => executeSave(false)}>Ignorer doublons</Button>
            <Button variant="outline" size="sm" className="h-9 md:h-10 text-xs" onClick={() => setShowConfirmModal(false)}>Annuler</Button>
            <Button size="sm" className="h-9 md:h-10 text-xs" onClick={() => executeSave(true)} disabled={isSaving}>Mettre à jour</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
