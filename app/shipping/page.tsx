"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Printer, Search, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ShippingPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [zoomedImage, setZoomedImage] = useState<{ url: string, name: string } | null>(null);
  const supabase = createClient();

  const fetchShippingOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .in('status', ['paid', 'preparing']);

    setOrders(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchShippingOrders();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const togglePicked = async (itemId: string, current: boolean) => {
    const { error } = await supabase
      .from('order_items')
      .update({ is_picked: !current })
      .eq('id', itemId);

    if (!error) {
       // Mise à jour locale optimiste ou re-fetch
       fetchShippingOrders();
    }
  };

  // Fonction pour dé-agréger les items (ex: 1 ligne de 4x -> 4 lignes de 1x)
  // Note: Comme on veut persister le check par UNITÉ, la DB devrait idéalement
  // stocker chaque unité séparément. Mais pour le Sprint 3, on va simuler
  // l'affichage si quantity > 1 tout en gardant à l'esprit que le check s'applique
  // techniquement à la ligne entière.
  // MISE À JOUR : Pour un vrai picking à l'unité persistant, il faudrait diviser
  // les lignes en DB. Ici on va rester sur la persistance par ligne pour l'instant
  // mais afficher visuellement les lignes si besoin.
  // ATTENTION : Si le client veut un check par UNITE persistant, il faut que
  // chaque ligne soit unique en DB.

  if (isLoading) return <div className="container mx-auto py-10 text-center">Chargement...</div>;

  return (
    <div className="container mx-auto py-10 space-y-8 print:p-0 print:m-0 print:space-y-0">
      <div className="flex justify-between items-center print:hidden">
        <h1 className="text-3xl font-bold tracking-tight">Expédition (Picking List)</h1>
        <Button onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" /> Imprimer le rapport
        </Button>
      </div>

      <div className="space-y-6 print:space-y-0">
        {orders.length === 0 && (
          <p className="text-center text-muted-foreground py-20 print:hidden">Aucune commande à préparer pour le moment.</p>
        )}

        {orders.map((order) => {
          const allPicked = order.order_items?.every((it: any) => it.is_picked);

          return (
            <div key={order.id} className="print:page-break-after-always print:min-h-screen print:flex print:flex-col">
              <Card className={`overflow-hidden print:shadow-none print:border-none print:rounded-none h-full flex flex-col transition-colors ${allPicked ? 'border-green-500 bg-green-50/30' : ''} ${order.is_trust_service ? 'border-4 border-red-600' : ''}`}>

                {/* ENTETE : Devient Vert si tout est pické */}
                <CardHeader className={`flex flex-row items-center justify-between py-4 print:bg-white print:border-b-2 print:border-black transition-colors ${allPicked ? 'bg-green-500 text-white print:text-black' : 'bg-slate-50'}`}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl">Commande {order.external_order_id}</CardTitle>
                      {order.is_trust_service && (
                        <Badge variant="destructive" className="animate-pulse uppercase font-black text-xs print:bg-red-600">
                          TRUST SERVICE
                        </Badge>
                      )}
                      {allPicked && <Badge className="bg-white text-green-600 border-green-600 font-bold">PRÊT</Badge>}
                    </div>
                    <CardDescription className={`font-bold text-lg ${allPicked ? 'text-green-50' : 'text-slate-900'}`}>{order.buyer_name}</CardDescription>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs uppercase ${allPicked ? 'text-green-100' : 'text-muted-foreground'}`}>Mode d'envoi</p>
                    <p className="font-black text-lg">{order.shipping_method || 'Standard'}</p>
                    <p className="text-xs font-mono">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 py-8 grid grid-cols-1 md:grid-cols-2 gap-12 print:grid-cols-1 print:py-4">
                  {/* ADRESSE */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm uppercase text-muted-foreground border-b pb-1 print:text-black print:border-black">Adresse de livraison</h4>
                    <pre className="whitespace-pre-wrap font-sans text-lg bg-slate-50 p-6 rounded border print:bg-white print:border-black print:p-4 print:text-xl">
                      {order.buyer_address}
                    </pre>
                  </div>

                  {/* ITEMS */}
                  <div className="space-y-4 print:mt-auto">
                    <h4 className="font-bold text-sm uppercase text-muted-foreground border-b pb-1 print:text-black print:border-black">Articles à préparer</h4>
                    <div className="space-y-4 print:space-y-2">
                      {order.order_items?.map((item: any) => {
                        // On crée un tableau virtuel pour afficher 1 ligne par quantité demandée par l'utilisateur
                        const units = Array.from({ length: item.quantity || 1 });

                        return units.map((_, uIdx) => (
                          <div key={`${item.id}-${uIdx}`} className={`flex gap-4 items-center border-b border-dashed pb-3 last:border-0 print:pb-1 ${item.is_picked ? 'opacity-40 grayscale' : ''}`}>
                            <div>
                              <Checkbox
                                id={`${item.id}-${uIdx}`}
                                checked={item.is_picked}
                                onCheckedChange={() => togglePicked(item.id, item.is_picked)}
                              />
                            </div>

                            <div
                              className="w-14 h-20 bg-slate-100 rounded border flex items-center justify-center text-[10px] text-muted-foreground shrink-0 overflow-hidden cursor-zoom-in group relative print:hidden"
                              onClick={() => item.image_url && setZoomedImage({ url: item.image_url, name: item.card_name })}
                            >
                              {item.image_url ? (
                                <>
                                  <img src={item.image_url} alt={item.card_name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Search className="text-white h-4 w-4" />
                                  </div>
                                </>
                              ) : (
                                <div className="text-center p-1 text-[8px]">SANS PHOTO</div>
                              )}
                            </div>

                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <p className="font-black text-xl leading-tight print:text-lg">
                                  <span className="text-slate-400 mr-2">1x</span>
                                  {item.card_name}
                                </p>
                                {item.is_picked && <CheckCircle2 className="h-5 w-5 text-green-600 print:hidden" />}
                              </div>
                              <p className="text-sm font-medium mt-1 print:text-xs">
                                {item.expansion} • <span className="uppercase">{item.condition}</span> • {item.language}
                              </p>
                            </div>
                          </div>
                        ));
                      })}
                    </div>
                  </div>
                </CardContent>

                {order.is_trust_service && (
                   <div className="bg-red-600 text-white text-center py-3 text-sm font-black uppercase print:bg-black print:text-white">
                    ⚠️ ALERTE : TIERS DE CONFIANCE - SUIVI OBLIGATOIRE ⚠️
                   </div>
                )}
              </Card>
            </div>
          );
        })}
      </div>

      <Dialog open={!!zoomedImage} onOpenChange={() => setZoomedImage(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none bg-transparent shadow-none">
          {zoomedImage && (
            <div className="flex flex-col items-center">
              <img
                src={zoomedImage.url}
                alt={zoomedImage.name}
                className="w-full h-auto rounded-lg shadow-2xl"
                referrerPolicy="no-referrer"
              />
              <p className="mt-4 text-white font-bold bg-black/50 px-4 py-2 rounded-full">{zoomedImage.name}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0.5cm;
          }
          .print\\:hidden { display: none !important; }
          .print\\:page-break-after-always { page-break-after: always; }
          body { background-color: white !important; -webkit-print-color-adjust: exact; color-adjust: exact; }
          .container { max-width: 100% !important; width: 100% !important; padding: 0 !important; }
          pre { white-space: pre-wrap !important; }
        }
      `}</style>
    </div>
  );
}
