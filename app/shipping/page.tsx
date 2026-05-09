"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Printer, CheckCircle2, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ShippingPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [zoomedImage, setZoomedImage] = useState<{ url: string, name: string } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchShippingOrders() {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .in('status', ['paid', 'preparing']);

      setOrders(data || []);
      setIsLoading(false);
    }
    fetchShippingOrders();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const toggleCheck = (itemId: string) => {
    setCheckedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

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

        {orders.map((order) => (
          <div key={order.id} className="print:page-break-after-always print:min-h-screen print:flex print:flex-col">
            <Card className={`overflow-hidden print:shadow-none print:border-none print:rounded-none h-full flex flex-col ${order.is_trust_service ? 'border-4 border-red-600' : ''}`}>
              <CardHeader className="bg-slate-50 flex flex-row items-center justify-between py-4 print:bg-white print:border-b-2 print:border-black">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl">Commande {order.external_order_id}</CardTitle>
                    {order.is_trust_service && (
                      <Badge variant="destructive" className="animate-pulse uppercase font-black text-xs print:bg-red-600">
                        TRUST SERVICE
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="font-bold text-lg text-slate-900">{order.buyer_name}</CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase">Mode d'envoi</p>
                  <p className="font-black text-lg">{order.shipping_method || 'Standard'}</p>
                  <p className="text-xs font-mono">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
              </CardHeader>

              <CardContent className="flex-1 py-8 grid grid-cols-1 md:grid-cols-2 gap-12 print:grid-cols-1">
                <div className="space-y-4">
                  <h4 className="font-bold text-sm uppercase text-muted-foreground border-b pb-1 print:text-black print:border-black">Adresse de livraison</h4>
                  <pre className="whitespace-pre-wrap font-sans text-lg bg-slate-50 p-6 rounded border print:bg-white print:border-black print:p-4">
                    {order.buyer_address}
                  </pre>
                </div>

                <div className="space-y-4 print:mt-auto">
                  <h4 className="font-bold text-sm uppercase text-muted-foreground border-b pb-1 print:text-black print:border-black">Articles à préparer</h4>
                  <div className="space-y-4">
                    {order.order_items?.map((item: any) => (
                      <div key={item.id} className={`flex gap-4 items-center border-b border-dashed pb-3 last:border-0 ${checkedItems[item.id] ? 'opacity-40 grayscale' : ''}`}>
                        <div className="print:hidden">
                          <Checkbox
                            id={item.id}
                            checked={checkedItems[item.id]}
                            onCheckedChange={() => toggleCheck(item.id)}
                          />
                        </div>

                        <div
                          className="w-14 h-20 bg-slate-100 rounded border flex items-center justify-center text-[10px] text-muted-foreground shrink-0 overflow-hidden cursor-zoom-in group relative print:border-black"
                          onClick={() => item.image_url && setZoomedImage({ url: item.image_url, name: item.card_name })}
                        >
                          {item.image_url ? (
                            <>
                              <img src={item.image_url} alt={item.card_name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                                <Search className="text-white h-4 w-4" />
                              </div>
                            </>
                          ) : (
                            <div className="text-center p-1">SANS PHOTO</div>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <p className="font-black text-xl leading-tight">
                              <span className="bg-slate-900 text-white px-2 py-0.5 rounded mr-2 print:border print:border-black print:text-black print:bg-white">{item.quantity}x</span>
                              {item.card_name}
                            </p>
                            {checkedItems[item.id] && <CheckCircle2 className="h-5 w-5 text-green-600 print:hidden" />}
                          </div>
                          <p className="text-sm font-medium mt-1">
                            {item.expansion} • <span className="uppercase">{item.condition}</span> • {item.language}
                          </p>
                        </div>
                      </div>
                    ))}
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
        ))}
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
            margin: 0;
          }
          .print\\:hidden { display: none !important; }
          .print\\:page-break-after-always { page-break-after: always; }
          body { background-color: white !important; -webkit-print-color-adjust: exact; }
          .container { max-width: 100% !important; width: 100% !important; padding: 0 !important; }
          CardHeader { border-bottom: 2px solid black !important; }
          pre { font-size: 1.2rem !important; }
        }
      `}</style>
    </div>
  );
}
