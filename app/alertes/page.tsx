"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getActiveAlerts } from "@/lib/utils/alerts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  ExternalLink,
  RotateCcw
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AlertType = 'price' | 'shipping' | 'reception' | 'stock' | 'all';

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
  const [filterType, setFilterType] = useState<AlertType>('all');
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Nouveaux filtres pour les alertes de prix
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [minEvolution, setMinEvolution] = useState<string>('');
  const [maxEvolution, setMaxEvolution] = useState<string>('');

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
    .filter(a => {
      // Filtre par type
      if (filterType !== 'all' && a.type !== filterType) return false;

      // Filtres spécifiques aux alertes de prix
      if (a.type === 'price') {
        const price = a.metadata.item.last_market_price;
        const evolution = a.metadata.diff;

        if (minPrice && price < parseFloat(minPrice)) return false;
        if (maxPrice && price > parseFloat(maxPrice)) return false;
        if (minEvolution && evolution < parseFloat(minEvolution)) return false;
        if (maxEvolution && evolution > parseFloat(maxEvolution)) return false;
      }

      return true;
    })
    .sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === 'type') {
        comparison = a.type.localeCompare(b.type);
      } else if (sortBy === 'severity') {
        const rank = { red: 3, orange: 2, none: 1 };
        comparison = rank[a.severity] - rank[b.severity];
      } else if (sortBy === 'price') {
        const priceA = a.type === 'price' ? a.metadata.item.last_market_price : 0;
        const priceB = b.type === 'price' ? b.metadata.item.last_market_price : 0;
        comparison = priceA - priceB;
      } else if (sortBy === 'evolution') {
        const evoA = a.type === 'price' ? a.metadata.diff : 0;
        const evoB = b.type === 'price' ? b.metadata.diff : 0;
        comparison = evoA - evoB;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const getAlertIcon = (alert: Alert) => {
    if (alert.type === 'price') {
      return alert.metadata.diff > 0 ? <TrendingUp className="h-5 w-5 text-green-600" /> : <TrendingDown className="h-5 w-5 text-red-600" />;
    }
    if (alert.type === 'shipping') return <Clock className="h-5 w-5 text-orange-600" />;
    if (alert.type === 'reception') return <Truck className="h-5 w-5 text-blue-600" />;
    return <AlertTriangle className="h-5 w-5 text-red-600" />;
  };

  const getSeverityBadge = (severity: string) => {
    if (severity === 'red') return <Badge className="bg-red-600">Critique</Badge>;
    if (severity === 'orange') return <Badge className="bg-orange-500">Retard</Badge>;
    return null;
  };

  const resetFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setMinEvolution('');
    setMaxEvolution('');
  };

  if (isLoading) return <div className="container mx-auto py-10">Chargement des alertes...</div>;

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-8 w-8" /> Alertes
          </h1>
          <p className="text-muted-foreground text-sm">Suivi des opportunités de prix et des retards logistiques.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <Tabs value={filterType} onValueChange={(v) => setFilterType(v as AlertType)} className="w-full sm:w-auto">
            <TabsList className="grid grid-cols-5 w-full sm:w-auto">
              <TabsTrigger value="all">Toutes</TabsTrigger>
              <TabsTrigger value="price">Prix</TabsTrigger>
              <TabsTrigger value="shipping">Envoi</TabsTrigger>
              <TabsTrigger value="reception">Réception</TabsTrigger>
              <TabsTrigger value="stock">Stock</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col lg:flex-row justify-between gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
              {filterType === 'price' || filterType === 'all' ? (
                <>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Prix (€)</Label>
                    <div className="flex gap-2">
                      <Input placeholder="Min" type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="bg-white h-9" />
                      <Input placeholder="Max" type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="bg-white h-9" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Évolution (%)</Label>
                    <div className="flex gap-2">
                      <Input placeholder="Min" type="number" value={minEvolution} onChange={(e) => setMinEvolution(e.target.value)} className="bg-white h-9" />
                      <Input placeholder="Max" type="number" value={maxEvolution} onChange={(e) => setMaxEvolution(e.target.value)} className="bg-white h-9" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="sm:col-span-2 lg:col-span-2 text-sm text-muted-foreground flex items-center italic">
                  Filtres de prix masqués pour ce type d'alerte.
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Trier par</Label>
                <div className="flex gap-2">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="bg-white h-9">
                      <SelectValue placeholder="Trier par" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="type">Type</SelectItem>
                      <SelectItem value="severity">Sévérité</SelectItem>
                      <SelectItem value="price">Prix</SelectItem>
                      <SelectItem value="evolution">Évolution</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 bg-white shrink-0"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-end">
              <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9 text-muted-foreground hover:text-primary">
                <RotateCcw className="h-4 w-4 mr-2" /> Réinitialiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <Card className="bg-slate-50 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
              <p className="font-medium text-slate-600">Aucune alerte correspondante.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredAlerts.map((alert) => (
              <Card key={alert.id} className={`overflow-hidden border-l-4 ${alert.severity === 'red' ? 'border-l-red-600' : alert.severity === 'orange' ? 'border-l-orange-500' : 'border-l-blue-400'}`}>
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row sm:items-center p-4 gap-4">
                    <div className={`p-3 rounded-full self-start sm:self-center ${alert.type === 'price' ? 'bg-green-50' : alert.type === 'shipping' ? 'bg-orange-50' : alert.type === 'reception' ? 'bg-blue-50' : 'bg-red-50'}`}>
                      {getAlertIcon(alert)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="font-bold truncate">{alert.title}</h4>
                        {getSeverityBadge(alert.severity)}
                        <Badge variant="outline" className="text-[10px] capitalize">{alert.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-2">
                        {new Date(alert.date).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2 self-end sm:self-center">
                      {alert.type === 'price' ? (
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/collection?id=${alert.metadata.item.id}`}>Voir collection</a>
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/suivi?orderId=${alert.metadata.order.id}`}>Voir commande</a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
