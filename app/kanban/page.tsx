"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Package, Truck, CheckCircle2, Clock, ShieldAlert } from "lucide-react";

type OrderStatus = 'paid' | 'preparing' | 'shipped' | 'completed';

interface Order {
  id: string;
  external_order_id: string;
  buyer_name: string;
  total_price: number;
  status: OrderStatus;
  is_trust_service: boolean;
  created_at: string;
}

const COLUMNS: { id: OrderStatus; label: string; icon: any; color: string }[] = [
  { id: 'paid', label: 'À Préparer', icon: Clock, color: 'bg-orange-100 text-orange-700' },
  { id: 'preparing', label: 'En cours', icon: Package, color: 'bg-blue-100 text-blue-700' },
  { id: 'shipped', label: 'Expédié', icon: Truck, color: 'bg-purple-100 text-purple-700' },
  { id: 'completed', label: 'Terminé', icon: CheckCircle2, color: 'bg-green-100 text-green-700' },
];

export default function KanbanPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const { toast } = useToast();

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('id, external_order_id, buyer_name, total_price, status, is_trust_service, created_at')
      .order('created_at', { ascending: false });

    setOrders(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const moveOrder = async (orderId: string, currentStatus: OrderStatus) => {
    const statusOrder: OrderStatus[] = ['paid', 'preparing', 'shipped', 'completed'];
    const currentIndex = statusOrder.indexOf(currentStatus);

    if (currentIndex < statusOrder.length - 1) {
      const nextStatus = statusOrder[currentIndex + 1];

      const { error } = await supabase
        .from('orders')
        .update({ status: nextStatus })
        .eq('id', orderId);

      if (error) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Statut mis à jour" });
        fetchOrders();
      }
    }
  };

  const toggleTrustService = async (orderId: string, current: boolean) => {
    const { error } = await supabase
      .from('orders')
      .update({ is_trust_service: !current })
      .eq('id', orderId);

    if (error) {
       toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
       toast({ title: "Trust Service mis à jour" });
       fetchOrders();
    }
  };

  if (isLoading) return <div className="container mx-auto py-10">Chargement du Kanban...</div>;

  return (
    <div className="container mx-auto py-10 space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Suivi des commandes (Kanban)</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full items-start">
        {COLUMNS.map((col) => (
          <div key={col.id} className="flex flex-col gap-4 bg-slate-50 p-4 rounded-lg min-h-[500px]">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2 font-semibold">
                <col.icon className="h-4 w-4" />
                <span>{col.label}</span>
              </div>
              <Badge variant="secondary" className="bg-white">
                {orders.filter(o => o.status === col.id).length}
              </Badge>
            </div>

            <div className="flex flex-col gap-3">
              {orders
                .filter((o) => o.status === col.id)
                .map((order) => (
                  <Card key={order.id} className={`shadow-sm border-none ${order.is_trust_service ? 'ring-2 ring-red-500 ring-offset-2' : ''}`}>
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs font-mono text-muted-foreground">{order.external_order_id}</span>
                        <span className="text-sm font-bold">{Number(order.total_price).toFixed(2)}€</span>
                      </div>
                      <CardTitle className="text-sm">{order.buyer_name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-3">
                      <div className="flex justify-between items-center">
                         <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${order.is_trust_service ? 'text-red-600' : 'text-muted-foreground opacity-30'}`}
                          onClick={() => toggleTrustService(order.id, order.is_trust_service)}
                          title="Marquer comme Trust Service"
                        >
                          <ShieldAlert className="h-4 w-4" />
                        </Button>

                        {col.id !== 'completed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs hover:bg-slate-200"
                            onClick={() => moveOrder(order.id, order.status)}
                          >
                            Suivant <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
