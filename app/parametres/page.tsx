"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, Palette, BarChart3, Bell, Eye, Truck, Plus, Trash2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const PRICE_SOURCES = [
  "Trend CardMarket",
  "Avg Sell CardMarket",
  "Scryfall (Magic)",
  "PokémonTCG API"
];

const STATUS_LABELS: Record<string, string> = {
  paid: "À Préparer",
  ready: "Prête",
  preparing: "En cours",
  shipped: "Expédié",
  completed: "Terminé"
};

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<any>({
    kanban_colors: {
      paid: "#ffedd5",
      ready: "#dcfce7",
      preparing: "#dbeafe",
      shipped: "#f3e8ff",
      completed: "#f0fdf4"
    },
    price_sources: ["Trend CardMarket", "Avg Sell CardMarket"],
    price_alert_threshold: 10,
    price_alert_period_days: 30,
    delay_shipping_orange: 4,
    delay_shipping_red: 7,
    delay_reception_orange: 5,
    delay_reception_red: 7,
    card_view_mode: 'modal',
    shipping_methods: [
      "Lettre Internationale (Priority Letter)(max. 20g)",
      "Lettre Verte(max. 20g)",
      "Lettre Verte Suivi(max. 20g)"
    ]
  });

  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchSettings() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .single();

      if (data) {
        setSettings(data);
      } else if (error && error.code === 'PGRST116') {
        // No settings yet, create them
        const { data: newData } = await supabase
          .from('user_settings')
          .insert({ user_id: user.id })
          .select()
          .single();
        if (newData) setSettings(newData);
      }
      setIsLoading(false);
    }

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        kanban_colors: settings.kanban_colors,
        price_sources: settings.price_sources,
        price_alert_threshold: settings.price_alert_threshold,
        price_alert_period_days: settings.price_alert_period_days,
        delay_shipping_orange: settings.delay_shipping_orange,
        delay_shipping_red: settings.delay_shipping_red,
        delay_reception_orange: settings.delay_reception_orange,
        delay_reception_red: settings.delay_reception_red,
        card_view_mode: settings.card_view_mode,
        shipping_methods: settings.shipping_methods
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Paramètres enregistrés", description: "Vos modifications ont été appliquées." });
    }
    setIsSaving(false);
  };

  const updateColor = (status: string, color: string) => {
    setSettings({
      ...settings,
      kanban_colors: { ...settings.kanban_colors, [status]: color }
    });
  };

  const toggleSource = (source: string) => {
    const current = settings.price_sources;
    const next = current.includes(source)
      ? current.filter((s: string) => s !== source)
      : [...current, source];
    setSettings({ ...settings, price_sources: next });
  };

  if (isLoading) return <div className="container mx-auto py-10 text-center">Chargement des paramètres...</div>;

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" /> {isSaving ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* COULEURS KANBAN */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" /> Couleurs du Kanban
            </CardTitle>
            <CardDescription>Personnalisez le fond des colonnes par statut</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.keys(STATUS_LABELS).map((status) => (
              <div key={status} className="flex items-center justify-between">
                <Label htmlFor={`color-${status}`}>{STATUS_LABELS[status]}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id={`color-${status}`}
                    type="color"
                    className="w-12 h-8 p-1"
                    value={settings.kanban_colors[status]}
                    onChange={(e) => updateColor(status, e.target.value)}
                  />
                  <Input
                    type="text"
                    className="w-24 h-8 text-xs font-mono"
                    value={settings.kanban_colors[status]}
                    onChange={(e) => updateColor(status, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* SOURCES DE PRIX */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" /> Sources de données (Prix)
            </CardTitle>
            <CardDescription>Sélectionnez les sources utilisées pour le suivi de prix</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {PRICE_SOURCES.map((source) => (
              <div key={source} className="flex items-center space-x-2">
                <Checkbox
                  id={source}
                  checked={settings.price_sources.includes(source)}
                  onCheckedChange={() => toggleSource(source)}
                />
                <label
                  htmlFor={source}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {source}
                </label>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ALERTES PRIX */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" /> Alertes de prix
            </CardTitle>
            <CardDescription>Seuil de variation pour les alertes de rentabilité</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="threshold">Seuil d'alerte (%)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="threshold"
                  type="number"
                  value={settings.price_alert_threshold}
                  onChange={(e) => setSettings({ ...settings, price_alert_threshold: parseFloat(e.target.value) })}
                  className="max-w-[120px]"
                />
                <span className="text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Une alerte sera générée si le prix du marché dépasse votre prix de vente de ce pourcentage.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="period">Période d'analyse (jours)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="period"
                  type="number"
                  value={settings.price_alert_period_days}
                  onChange={(e) => setSettings({ ...settings, price_alert_period_days: parseInt(e.target.value) })}
                  className="max-w-[120px]"
                />
                <span className="text-muted-foreground">jours</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Délai pour le calcul de l'évolution des prix.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ALERTES RETARDS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" /> Alertes de retard
            </CardTitle>
            <CardDescription>Seuils de déclenchement des alertes (en jours)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-sm font-bold border-b pb-1">Retard d'envoi</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ship_orange">Orange (jours)</Label>
                  <Input
                    id="ship_orange"
                    type="number"
                    value={settings.delay_shipping_orange}
                    onChange={(e) => setSettings({ ...settings, delay_shipping_orange: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ship_red">Rouge (jours)</Label>
                  <Input
                    id="ship_red"
                    type="number"
                    value={settings.delay_shipping_red}
                    onChange={(e) => setSettings({ ...settings, delay_shipping_red: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold border-b pb-1">Retard de réception</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rec_orange">Orange (jours)</Label>
                  <Input
                    id="rec_orange"
                    type="number"
                    value={settings.delay_reception_orange}
                    onChange={(e) => setSettings({ ...settings, delay_reception_orange: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rec_red">Rouge (jours)</Label>
                  <Input
                    id="rec_red"
                    type="number"
                    value={settings.delay_reception_red}
                    onChange={(e) => setSettings({ ...settings, delay_reception_red: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AFFICHAGE COLLECTION */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" /> Affichage Collection
            </CardTitle>
            <CardDescription>Préférences de visualisation des détails d'une carte</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={settings.card_view_mode || 'modal'}
              onValueChange={(v) => setSettings({ ...settings, card_view_mode: v })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="modal" id="mode-modal" />
                <Label htmlFor="mode-modal">Fenêtre modale (Centre)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sheet" id="mode-sheet" />
                <Label htmlFor="mode-sheet">Volet latéral (Droite)</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* MÉTHODES D'ENVOI */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" /> Méthodes d'envoi
            </CardTitle>
            <CardDescription>Configurez vos options de livraison pour les commandes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2">
                {settings.shipping_methods?.map((method: string, i: number) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={method}
                      onChange={(e) => {
                        const next = [...settings.shipping_methods];
                        next[i] = e.target.value;
                        setSettings({ ...settings, shipping_methods: next });
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => {
                        const next = settings.shipping_methods.filter((_: any, idx: number) => idx !== i);
                        setSettings({ ...settings, shipping_methods: next });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => {
                    setSettings({
                      ...settings,
                      shipping_methods: [...(settings.shipping_methods || []), "Nouvelle méthode"]
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" /> Ajouter une méthode
                </Button>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
