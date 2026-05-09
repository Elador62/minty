"use client";

import { useState } from "react";
import { parseCardMarketEmail, ParsedOrder } from "@/lib/parser/emailParser";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Import, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function ImportPage() {
  const [emailText, setEmailText] = useState("");
  const [parsedData, setParsedData] = useState<ParsedOrder | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleParse = () => {
    const result = parseCardMarketEmail(emailText);
    setParsedData(result);
    if (!result) {
      toast({
        title: "Erreur d'analyse",
        description: "Le format de l'email n'a pas été reconnu.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!parsedData) return;

    setIsSaving(true);
    const supabase = createClient();
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Authentification requise",
          description: "Vous devez être connecté pour enregistrer une commande.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      // 1. Insérer la commande
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          external_order_id: parsedData.orderId,
          buyer_name: parsedData.buyer,
          buyer_address: parsedData.address,
          total_price: parsedData.totalValue,
          shipping_cost: parsedData.shippingCost,
          status: parsedData.status === 'Payée' ? 'paid' : 'preparing',
          source: 'email'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Insérer les items
      const itemsToInsert = parsedData.items.map(item => ({
        order_id: order.id,
        card_name: item.name,
        expansion: item.expansion,
        condition: item.condition,
        language: item.language,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast({
        title: "Commande enregistrée !",
        description: `La commande ${parsedData.orderId} a été ajoutée avec succès.`,
      });

      // Reset
      setParsedData(null);
      setEmailText("");

    } catch (error: any) {
      toast({
        title: "Erreur lors de l'enregistrement",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Importation de Commandes</h1>
        <p className="text-muted-foreground">
          Copiez et collez le contenu brut de l'email CardMarket ci-dessous.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email CardMarket</CardTitle>
          <CardDescription>Collez le texte brut ici</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Bonjour Nicolas, <buyer> t'a acheté des cartes..."
            className="min-h-[200px] font-mono text-sm"
            value={emailText}
            onChange={(e) => setEmailText(e.target.value)}
          />
          <Button onClick={handleParse} className="w-full">
            <Import className="mr-2 h-4 w-4" /> Analyser l'email
          </Button>
        </CardContent>
      </Card>

      {parsedData && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>ID Commande</CardDescription>
                <CardTitle className="text-xl">{parsedData.orderId}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Acheteur</CardDescription>
                <CardTitle className="text-xl">{parsedData.buyer}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Statut</CardDescription>
                <CardTitle className="text-xl">
                  <Badge variant={parsedData.status === "Payée" ? "default" : "secondary"}>
                    {parsedData.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Contenu de la commande</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Qté</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Édition</TableHead>
                    <TableHead>État</TableHead>
                    <TableHead>Langue</TableHead>
                    <TableHead className="text-right">Prix</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.quantity}x</TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.expansion}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.condition}</Badge>
                      </TableCell>
                      <TableCell>{item.language}</TableCell>
                      <TableCell className="text-right">{item.price.toFixed(2)} €</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={5} className="text-right font-medium">Frais de port</TableCell>
                    <TableCell className="text-right">{parsedData.shippingCost.toFixed(2)} €</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={5} className="text-right font-bold">Total</TableCell>
                    <TableCell className="text-right font-bold">{parsedData.totalValue.toFixed(2)} €</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {parsedData.address && (
            <Card>
              <CardHeader>
                <CardTitle>Adresse de livraison</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap font-sans text-sm p-4 bg-muted rounded-md">
                  {parsedData.address}
                </pre>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-4">
             <Button variant="outline" onClick={() => setParsedData(null)}>
              Annuler
            </Button>
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700" disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              {isSaving ? "Enregistrement..." : "Enregistrer la commande"}
            </Button>
          </div>
        </div>
      )}

      {!parsedData && emailText && (
        <div className="flex items-center justify-center p-8 text-muted-foreground border-2 border-dashed rounded-lg">
           <div className="text-center">
             <AlertCircle className="mx-auto h-12 w-12 opacity-20 mb-2" />
             <p>L'analyse n'a pas encore été lancée ou le format est invalide.</p>
           </div>
        </div>
      )}
    </div>
  );
}
