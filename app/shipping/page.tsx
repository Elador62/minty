"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getLanguageFlag } from "@/lib/utils/languages";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Printer, Search, CheckCircle2, ChevronDown, ChevronRight, AlertCircle, Box, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ShippingPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [zoomedImage, setZoomedImage] = useState<{ url: string, name: string } | null>(null);
  const [collapsedOrders, setCollapsedOrders] = useState<Record<string, boolean>>({});
  const supabase = createClient();

  const fetchShippingOrders = async () => {
    const { data: ordersData } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .in('status', ['paid', 'ready', 'preparing']);

    const { data: invData } = await supabase.from('inventory_items').select('card_name, expansion, quantity, storage_location');

    setOrders(ordersData || []);
    setInventory(invData || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchShippingOrders();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const toggleCollapse = (orderId: string) => {
    setCollapsedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const togglePicked = async (orderId: string, itemId: string, current: boolean) => {
    const { error } = await supabase
      .from('order_items')
      .update({ is_picked: !current })
      .eq('id', itemId);

    if (!error) {
       // Recharger pour vérifier si toute la commande est prête
       const { data: updatedOrder } = await supabase
         .from('orders')
         .select('status, order_items(is_picked)')
         .eq('id', orderId)
         .single();

       if (updatedOrder) {
          const allPicked = updatedOrder.order_items.every((it: any) => it.is_picked);
          // Si tout est pické et qu'on était en 'paid', on passe en 'ready'
          if (allPicked && updatedOrder.status === 'paid') {
            await supabase.from('orders').update({ status: 'ready' }).eq('id', orderId);
          }
          // Si on dé-picke un item et qu'on était en 'ready', on repasse en 'paid'
          else if (!allPicked && updatedOrder.status === 'ready') {
            await supabase.from('orders').update({ status: 'paid' }).eq('id', orderId);
          }
       }
       fetchShippingOrders();
    }
  };

  if (isLoading) return <div className="container mx-auto py-10 text-center">Chargement...</div>;

  return (
    <div className="container mx-auto py-10 space-y-8 print:block print:p-0 print:m-0 print:space-y-0 print:static">
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
            <div key={order.id} className="print:break-after-page print:block print:w-full">
              <Card className={`overflow-hidden print:shadow-none print:border-none print:rounded-none h-full flex flex-col transition-colors ${allPicked ? 'border-green-500 bg-green-50/30' : ''} ${order.is_trust_service ? 'border-4 border-red-600' : ''}`}>

                {/* ENTETE : Devient Vert si tout est pické */}
                <CardHeader className={`flex flex-row items-center justify-between py-4 print:bg-white print:border-b-2 print:border-black transition-colors ${allPicked ? 'bg-green-500 text-white print:text-black' : 'bg-slate-50'}`}>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`print:hidden ${allPicked ? 'text-white hover:text-white hover:bg-green-600' : ''}`}
                      onClick={() => toggleCollapse(order.id)}
                    >
                      {collapsedOrders[order.id] ? <ChevronRight className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </Button>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl">Commande {order.external_order_id}</CardTitle>
                        <Button variant="ghost" size="icon" className="h-6 w-6 p-0 print:hidden" asChild title="Voir sur CardMarket">
                          <a
                            href={`https://www.cardmarket.com/fr/${order.order_items?.[0]?.game === 'pokemon' ? 'Pokemon' : 'Magic'}/Orders/${order.external_order_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                        {order.is_trust_service && (
                          <div className="border-2 border-red-600 px-2 py-0.5 rounded animate-pulse uppercase font-black text-xs print:border-black print:text-black print:bg-white">
                            TRUST SERVICE
                          </div>
                        )}
                        {allPicked && <Badge className="bg-white text-green-600 border-green-600 font-bold">PRÊT</Badge>}
                      </div>
                      <CardDescription className={`font-bold text-lg ${allPicked ? 'text-green-50' : 'text-slate-900'}`}>{order.buyer_name}</CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs uppercase ${allPicked ? 'text-green-100' : 'text-muted-foreground'}`}>Mode d'envoi</p>
                    <p className="font-black text-lg uppercase">{order.shipping_method || 'Standard'}</p>
                    <p className="text-xs font-mono">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                </CardHeader>

                {!collapsedOrders[order.id] && (
                  <CardContent className="flex-1 py-8 grid grid-cols-1 md:grid-cols-2 gap-12 print:grid-cols-1 print:py-2">
                    {/* ADRESSE */}
                    <div className="space-y-4 print:space-y-1">
                      <h4 className="font-bold text-sm uppercase text-muted-foreground border-b pb-1 print:text-black print:border-black print:text-[10px]">Adresse de livraison</h4>
                      <pre className="whitespace-pre-wrap font-sans text-lg bg-slate-50 p-6 rounded border print:bg-white print:border-black print:p-2 print:text-sm">
                        {order.buyer_address}
                      </pre>
                    </div>

                    {/* ITEMS */}
                    <div className="space-y-4 print:mt-auto print:space-y-1">
                      <h4 className="font-bold text-sm uppercase text-muted-foreground border-b pb-1 print:text-black print:border-black print:text-[10px]">Articles à préparer</h4>
                      <div className="space-y-4 print:space-y-1">
                        {order.order_items?.map((item: any, idx: number) => (
                        <div key={item.id} className={`flex gap-4 items-center border-b border-dashed pb-3 last:border-0 print:pb-1 ${item.is_picked ? 'opacity-40 grayscale print:opacity-100 print:grayscale-0' : ''}`}>
                            <div>
                              <Checkbox
                                id={item.id}
                                checked={item.is_picked}
                                onCheckedChange={() => togglePicked(order.id, item.id, item.is_picked)}
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
                                <div className="flex flex-col">
                                  <p className="font-black text-xl leading-tight print:text-sm flex items-center gap-2">
                                    <span className="text-slate-400">1x</span>
                                    {item.card_name}
                                    <span className="text-sm font-normal opacity-70">{getLanguageFlag(item.language)}</span>
                                  </p>
                                  {(() => {
                                    const inv = inventory.find(i => i.card_name === item.card_name && i.expansion === item.expansion);
                                    if (!inv || inv.quantity < item.quantity) {
                                      return (
                                        <Badge variant="destructive" className="w-fit mt-1 text-[10px] h-5 py-0">
                                          <AlertCircle className="h-3 w-3 mr-1" /> STOCK INSUFFISANT ({inv?.quantity || 0} dispo)
                                        </Badge>
                                      );
                                    }
                                    if (inv.storage_location) {
                                      return (
                                        <div className="flex items-center gap-1 text-[11px] text-blue-600 font-bold mt-1">
                                          <Box className="h-3 w-3" /> {inv.storage_location}
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>
                                {item.is_picked && <CheckCircle2 className="h-5 w-5 text-green-600 print:hidden" />}
                              </div>
                              <p className="text-sm font-medium mt-1 print:text-[10px]">
                                {item.expansion} • <span className="uppercase">{item.condition}</span> • {item.language}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {order.is_trust_service && (
                       <div className="col-span-full bg-red-600 text-white text-center py-3 text-sm font-black uppercase print:bg-white print:text-black print:border-2 print:border-black print:m-4 print:py-1">
                        ⚠️ TIERS DE CONFIANCE - SUIVI OBLIGATOIRE ⚠️
                       </div>
                    )}
                  </CardContent>
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
            margin: 0mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
          }
          .print\\:hidden { display: none !important; }
          .print\\:page-break-after-always { page-break-after: always; break-after: page; }
          body { background-color: white !important; -webkit-print-color-adjust: exact; color-adjust: exact; }
          .container {
            max-width: 100% !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
            position: static !important;
          }
          pre { white-space: pre-wrap !important; }
          /* Suppression des fonds colorés à l'impression */
          * { -webkit-print-color-adjust: economy !important; print-color-adjust: economy !important; background-color: transparent !important; color: black !important; border-color: black !important; }
          .bg-red-600, .bg-green-500, .bg-green-50\\/30, .bg-slate-50, .bg-white { background-color: transparent !important; }
          .text-white, .text-green-600, .text-green-50, .text-green-100, .text-slate-400 { color: black !important; }
          .border-green-500, .border-red-600 { border-color: black !important; }
        }
      `}</style>
    </div>
  );
}
