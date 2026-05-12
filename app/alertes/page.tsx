"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getActiveAlerts } from "@/lib/utils/alerts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Bell,
  TrendingUp,
  TrendingDown,
  Clock,
  Truck,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getLanguageFlag } from "@/lib/utils/languages";

type AlertType = 'price' | 'shipping' | 'reception';

interface Alert {
  id: string;
  type: AlertType;
  title: string;
  description: string;
  date: string;
  severity: 'orange' | 'red' | 'none';
  metadata: any;
}

export default function AlertesPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const supabase = createClient();

  useEffect(() => {
    async function fetchAlerts() {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newAlerts = await getActiveAlerts(supabase);
      setAlerts(newAlerts);
      setIsLoading(false);
    }

    fetchAlerts();
  }, []);

  const filteredAlerts = alerts
    .filter(a => filterType === 'all' || a.type === filterType)
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      else if (sortBy === 'type') comparison = a.type.localeCompare(b.type);
      else if (sortBy === 'severity') {
        const rank = { red: 3, orange: 2, none: 1 };
        comparison = rank[a.severity] - rank[b.severity];
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const getAlertIcon = (alert: Alert) => {
    if (alert.type === 'price') {
      return alert.metadata.diff > 0 ? <TrendingUp className="h-5 w-5 text-green-600" /> : <TrendingDown className="h-5 w-5 text-red-600" />;
    }
    if (alert.type === 'shipping') return <Clock className="h-5 w-5 text-orange-600" />;
    return <Truck className="h-5 w-5 text-blue-600" />;
  };

  const getSeverityBadge = (severity: string) => {
    if (severity === 'red') return <Badge className="bg-red-600">Critique</Badge>;
    if (severity === 'orange') return <Badge className="bg-orange-500">Retard</Badge>;
    return null;
  };

  if (isLoading) return <div className="container mx-auto py-10">Chargement des alertes...</div>;

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-8 w-8" /> Alertes
          </h1>
          <p className="text-muted-foreground text-sm">Suivi des opportunités de prix et des retards logistiques.</p>
        </div>
        <div className="flex gap-4">
           <div className="flex items-center gap-2">
             <Filter className="h-4 w-4 text-muted-foreground" />
             <Select value={filterType} onValueChange={setFilterType}>
               <SelectTrigger className="w-[150px]">
                 <SelectValue placeholder="Type d'alerte" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">Toutes</SelectItem>
                 <SelectItem value="price">Prix</SelectItem>
                 <SelectItem value="shipping">Envoi</SelectItem>
                 <SelectItem value="reception">Réception</SelectItem>
               </SelectContent>
             </Select>
           </div>
           <div className="flex items-center gap-2">
             <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
             <Select value={sortBy} onValueChange={setSortBy}>
               <SelectTrigger className="w-[150px]">
                 <SelectValue placeholder="Trier par" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="date">Date</SelectItem>
                 <SelectItem value="type">Type</SelectItem>
                 <SelectItem value="severity">Sévérité</SelectItem>
               </SelectContent>
             </Select>
             <Button
                variant="ghost"
                size="icon"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
             >
                {sortOrder === 'asc' ? '↑' : '↓'}
             </Button>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredAlerts.length === 0 ? (
          <Card className="bg-slate-50 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
              <p className="font-medium text-slate-600">Aucune alerte active pour le moment.</p>
            </CardContent>
          </Card>
        ) : (
          filteredAlerts.map((alert) => (
            <Card key={alert.id} className={`overflow-hidden border-l-4 ${alert.severity === 'red' ? 'border-l-red-600' : alert.severity === 'orange' ? 'border-l-orange-500' : 'border-l-blue-400'}`}>
              <CardContent className="p-0">
                <div className="flex items-center p-4 gap-4">
                  <div className={`p-3 rounded-full ${alert.type === 'price' ? 'bg-green-50' : alert.type === 'shipping' ? 'bg-orange-50' : 'bg-blue-50'}`}>
                    {getAlertIcon(alert)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold truncate">{alert.title}</h4>
                      {getSeverityBadge(alert.severity)}
                      <Badge variant="outline" className="text-[10px] capitalize">{alert.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      {new Date(alert.date).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {alert.type === 'price' ? (
                       <Button variant="outline" size="sm" asChild>
                         <a href={`/collection?search=${encodeURIComponent(alert.title)}`}>Voir collection</a>
                       </Button>
                    ) : (
                       <Button variant="outline" size="sm" asChild>
                         <a href={`/suivi?search=${alert.metadata.order.external_order_id}`}>Voir commande</a>
                       </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
