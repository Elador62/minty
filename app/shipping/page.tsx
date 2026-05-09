"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Printer, AlertTriangle } from "lucide-react";

export default function ShippingPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  if (isLoading) return <div className="container mx-auto py-10">Chargement...</div>;

  return (
    <div className="container mx-auto py-10 space-y-8 print:p-0 print:m-0">
      <div className="flex justify-between items-center print:hidden">
        <h1 className="text-3xl font-bold tracking-tight">Expédition (Picking List)</h1>
        <Button onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" /> Imprimer le rapport
        </Button>
      </div>

      <div className="space-y-6">
        {orders.length === 0 && (
          <p className="text-center text-muted-foreground py-20">Aucune commande à préparer pour le moment.</p>
        )}

        {orders.map((order) => (
          <Card key={order.id} className={`overflow-hidden print:shadow-none print:border-b-2 print:rounded-none ${order.is_trust_service ? 'border-4 border-red-600 animate-pulse-slow' : ''}`}>
            <CardHeader className="bg-slate-50 flex flex-row items-center justify-between py-4 print:bg-white">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">Commande {order.external_order_id}</CardTitle>
                  {order.is_trust_service && (
                    <Badge variant="destructive" className="animate-bounce uppercase font-black text-xs">
                      TRUST SERVICE - SUIVI OBLIGATOIRE
                    </Badge>
                  )}
                </div>
                <CardDescription className="font-medium text-slate-900">{order.buyer_name}</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase">Mode d'envoi</p>
                <p className="font-bold">{order.shipping_method || 'Standard'}</p>
              </div>
            </CardHeader>
            <CardContent className="py-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="font-bold text-sm uppercase text-muted-foreground border-b pb-1">Adresse de livraison</h4>
                <pre className="whitespace-pre-wrap font-sans text-sm bg-slate-50 p-3 rounded border print:bg-white">
                  {order.buyer_address}
                </pre>
              </div>
              <div className="space-y-4">
                <h4 className="font-bold text-sm uppercase text-muted-foreground border-b pb-1">Articles à préparer</h4>
                <div className="space-y-3">
                  {order.order_items?.map((item: any) => (
                    <div key={item.id} className="flex gap-4 items-start border-b border-dashed pb-2 last:border-0">
                      <div className="w-12 h-16 bg-slate-200 rounded flex items-center justify-center text-[10px] text-muted-foreground shrink-0 overflow-hidden">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.card_name} className="w-full h-full object-cover" />
                        ) : (
                          "IMAGE"
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm leading-tight">
                          <span className="text-lg mr-2">{item.quantity}x</span> {item.card_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.expansion} • {item.condition} • {item.language}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            {order.is_trust_service && (
               <div className="bg-red-600 text-white text-center py-2 text-xs font-bold uppercase print:bg-red-600">
                ⚠️ ALERTE : TIERS DE CONFIANCE - VÉRIFIEZ LE NUMÉRO DE SUIVI ⚠️
               </div>
            )}
          </Card>
        ))}
      </div>

      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% { border-color: rgb(220 38 38); }
          50% { border-color: rgb(254 226 226); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @media print {
          .print\\:hidden { display: none !important; }
          body { background-color: white !important; }
          .container { max-width: 100% !important; width: 100% !important; }
        }
      `}</style>
    </div>
  );
}
