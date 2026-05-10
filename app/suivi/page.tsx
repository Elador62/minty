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
  Pencil,
  CheckCircle,
  LayoutDashboard,
  List as ListIcon,
  Filter,
  ArrowUpDown
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type OrderStatus = 'paid' | 'ready' | 'preparing' | 'shipped' | 'completed';

interface Order {
  id: string;
  external_order_id: string;
  buyer_name: string;
  total_price: number;
  shipping_cost: number;
  status: OrderStatus;
  is_trust_service: boolean;
  created_at: string;
  order_items?: any[];
}

const COLUMNS: { id: OrderStatus; label: string; icon: any; color: string }[] = [
  { id: 'paid', label: 'À Préparer', icon: Clock, color: 'bg-orange-100 text-orange-700' },
  { id: 'ready', label: 'Prête', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
  { id: 'preparing', label: 'En cours', icon: Package, color: 'bg-blue-100 text-blue-700' },
  { id: 'shipped', label: 'Expédié', icon: Truck, color: 'bg-purple-100 text-purple-700' },
  { id: 'completed', label: 'Terminé', icon: CheckCircle2, color: 'bg-green-100 text-green-700' },
];

export default function SuiviPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [groupBy, setGroupBy] = useState<'status' | 'year' | 'month' | 'tcg'>('status');
  const [sortBy, setSortBy] = useState<'status' | 'date' | 'price' | 'tcg'>('date');
  const [settings, setSettings] = useState<any>(null);

  const supabase = createClient();
  const { toast } = useToast();

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('id, external_order_id, buyer_name, total_price, shipping_cost, status, is_trust_service, created_at, order_items(*)')
      .order('created_at', { ascending: false });

    setOrders(data || []);
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from('user_settings').select('*').single();
    if (data) setSettings(data);
  };

  useEffect(() => {
    Promise.all([fetchOrders(), fetchSettings()]).then(() => setIsLoading(false));
  }, []);

  const updateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    // Si on passe à "ready", on coche tous les items
    if (nextStatus === 'ready') {
      await supabase
        .from('order_items')
        .update({ is_picked: true })
        .eq('order_id', orderId);
    }

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
    const statusOrder: OrderStatus[] = ['paid', 'ready', 'preparing', 'shipped', 'completed'];
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

  const getSortedOrders = (ordersToSort: Order[]) => {
    return [...ordersToSort].sort((a, b) => {
      if (sortBy === 'date') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'price') return Number(b.total_price) - Number(a.total_price);
      if (sortBy === 'status') {
        const order = ['paid', 'ready', 'preparing', 'shipped', 'completed'];
        return order.indexOf(a.status) - order.indexOf(b.status);
      }
      if (sortBy === 'tcg') {
        const getTCG = (o: Order) => o.order_items?.[0]?.game || '';
        return getTCG(a).localeCompare(getTCG(b));
      }
      return 0;
    });
  };

  const renderKanban = () => (
    <ScrollArea className="w-full whitespace-nowrap rounded-md border bg-slate-50/50">
      <div className="flex w-max space-x-6 p-6 min-h-[700px]">
        {COLUMNS.map((col) => {
          const colOrders = getSortedOrders(orders.filter(o => o.status === col.id));
          const customColor = settings?.kanban_colors?.[col.id];

          return (
            <div key={col.id} className="flex flex-col gap-4 w-[320px] shrink-0">
              <div
                className="flex items-center justify-between px-3 py-2 rounded-t-lg font-semibold border-b-2"
                style={{
                  backgroundColor: customColor || '',
                  borderColor: customColor ? 'rgba(0,0,0,0.1)' : ''
                }}
              >
                <div className="flex items-center gap-2">
                  <col.icon className="h-4 w-4" />
                  <span>{col.label}</span>
                </div>
                <Badge variant="secondary" className="bg-white/80">
                  {colOrders.length}
                </Badge>
              </div>

              <div className="flex flex-col gap-3 whitespace-normal">
                {colOrders.map((order) => (
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
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );

  const renderList = () => {
    // Logique de groupement
    const groups: Record<string, Order[]> = {};
    const sortedOrders = getSortedOrders(orders);

    sortedOrders.forEach(o => {
      let groupKey = "Autre";
      if (groupBy === 'status') groupKey = COLUMNS.find(c => c.id === o.status)?.label || o.status;
      else if (groupBy === 'year') groupKey = new Date(o.created_at).getFullYear().toString();
      else if (groupBy === 'month') {
        const d = new Date(o.created_at);
        groupKey = d.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
      }
      else if (groupBy === 'tcg') groupKey = o.order_items?.[0]?.game === 'pokemon' ? 'Pokémon' : 'Magic';

      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(o);
    });

    return (
      <div className="space-y-8">
        {Object.entries(groups).map(([groupName, groupOrders]) => (
          <div key={groupName} className="space-y-4">
            <h3 className="text-lg font-bold border-b pb-2 flex items-center gap-2">
              {groupName} <Badge variant="outline">{groupOrders.length}</Badge>
            </h3>
            <div className="border rounded-lg overflow-hidden bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Acheteur</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>TCG</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">{order.external_order_id}</TableCell>
                      <TableCell className="font-medium">
                        {order.buyer_name}
                        {order.is_trust_service && <Badge className="ml-2 bg-red-100 text-red-700 border-red-200">TRUST</Badge>}
                      </TableCell>
                      <TableCell className="text-xs">{new Date(order.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="font-bold">{Number(order.total_price).toFixed(2)}€</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={COLUMNS.find(c => c.id === order.status)?.color}>
                          {COLUMNS.find(c => c.id === order.status)?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize text-xs">
                         {order.order_items?.[0]?.game || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(order)}><Pencil className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) return <div className="container mx-auto py-10">Chargement du suivi...</div>;

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suivi des commandes</h1>
          <p className="text-muted-foreground">Gérez vos ventes et le cycle de vie des commandes</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex bg-slate-100 p-1 rounded-lg mr-2">
            <Button
              variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
              size="sm"
              className={viewMode === 'kanban' ? 'bg-white shadow-sm hover:bg-white' : ''}
              onClick={() => setViewMode('kanban')}
            >
              <LayoutDashboard className="h-4 w-4 mr-2" /> Kanban
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className={viewMode === 'list' ? 'bg-white shadow-sm hover:bg-white' : ''}
              onClick={() => setViewMode('list')}
            >
              <ListIcon className="h-4 w-4 mr-2" /> Liste
            </Button>
          </div>
          <Button onClick={handleCreate}><Plus className="h-4 w-4 mr-2" /> Nouvelle commande</Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Trier par :</span>
          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="w-[140px] bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date (Récents)</SelectItem>
              <SelectItem value="price">Prix (Décroissant)</SelectItem>
              <SelectItem value="status">Statut</SelectItem>
              <SelectItem value="tcg">TCG</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {viewMode === 'list' && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground ml-2" />
            <span className="text-sm font-medium">Grouper par :</span>
            <Select value={groupBy} onValueChange={(v: any) => setGroupBy(v)}>
              <SelectTrigger className="w-[140px] bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="status">Statut</SelectItem>
                <SelectItem value="year">Année</SelectItem>
                <SelectItem value="month">Mois</SelectItem>
                <SelectItem value="tcg">TCG</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {viewMode === 'kanban' ? renderKanban() : renderList()}

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
