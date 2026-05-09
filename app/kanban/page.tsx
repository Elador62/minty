"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRight,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Plus,
  Pencil
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OrderModal } from "@/components/orders/OrderModal";

type OrderStatus = 'paid' | 'preparing' | 'shipped' | 'completed';

interface Order {
  id: string;
  external_order_id: string;
  buyer_name: string;
  total_price: number;
  status: OrderStatus;
  is_trust_service: boolean;
  created_at: string;
  order_items?: any[];
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
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('id, external_order_id, buyer_name, total_price, shipping_cost, status, is_trust_service, created_at, order_items(*)')
      .order('created_at', { ascending: false });

    setOrders(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (orderId: string, nextStatus: OrderStatus) => {
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
  };

  const moveOrderNext = (orderId: string, currentStatus: OrderStatus) => {
    const statusOrder: OrderStatus[] = ['paid', 'preparing', 'shipped', 'completed'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    if (currentIndex < statusOrder.length - 1) {
      updateStatus(orderId, statusOrder[currentIndex + 1]);
    }
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
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

  const handleEdit = (order: any) => {
    setEditingOrder(order);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingOrder(null);
    setIsModalOpen(true);
  };

  if (isLoading) return <div className="container mx-auto py-10">Chargement du Kanban...</div>;

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Suivi des commandes (Kanban)</h1>
        <Button onClick={handleCreate}><Plus className="h-4 w-4 mr-2" /> Nouvelle commande</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full items-start">
        {COLUMNS.map((col) => (
          <div key={col.id} className="flex flex-col gap-4 bg-slate-50 p-4 rounded-lg min-h-[600px]">
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
                  <Card key={order.id} className={`shadow-sm border-none transition-all ${order.is_trust_service ? 'ring-2 ring-red-500 ring-offset-2' : ''}`}>
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs font-mono text-muted-foreground">{order.external_order_id}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-bold">{Number(order.total_price).toFixed(2)}€</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-6 w-6 p-0">
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleEdit(order)}>
                                <Pencil className="mr-2 h-4 w-4" /> Modifier
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground">Colonnes</DropdownMenuLabel>
                              {COLUMNS.map(c => (
                                <DropdownMenuItem key={c.id} onClick={() => updateStatus(order.id, c.id)}>
                                  <c.icon className="mr-2 h-4 w-4" /> {c.label}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => toggleTrustService(order.id, order.is_trust_service)}>
                                <ShieldAlert className={`mr-2 h-4 w-4 ${order.is_trust_service ? 'text-red-600' : ''}`} />
                                {order.is_trust_service ? 'Retirer Trust Service' : 'Marquer Trust Service'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <CardTitle className="text-sm leading-tight">{order.buyer_name}</CardTitle>
                    </CardHeader>

                    <CardContent className="p-4 pt-0 space-y-3">
                      <div className="flex justify-between items-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-[10px] text-muted-foreground"
                          onClick={() => toggleExpand(order.id)}
                        >
                          {expandedOrders[order.id] ? (
                            <><ChevronUp className="h-3 w-3 mr-1" /> Masquer items</>
                          ) : (
                            <><ChevronDown className="h-3 w-3 mr-1" /> Voir items ({order.order_items?.length})</>
                          )}
                        </Button>

                        {col.id !== 'completed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[10px] hover:bg-slate-100"
                            onClick={() => moveOrderNext(order.id, order.status)}
                          >
                            Suivant <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        )}
                      </div>

                      {expandedOrders[order.id] && (
                        <div className="pt-2 border-t text-[11px] space-y-1">
                          {order.order_items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between gap-2 border-b border-dashed border-slate-100 pb-1 last:border-0">
                              <span className="font-medium truncate">{item.quantity}x {item.card_name}</span>
                              <span className="text-muted-foreground shrink-0">{item.condition}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <OrderModal
          order={editingOrder}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onRefresh={fetchOrders}
        />
      )}
    </div>
  );
}
