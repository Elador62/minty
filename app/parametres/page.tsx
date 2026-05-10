"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, Palette, BarChart3, Bell } from "lucide-react";

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
    price_alert_period_days: 30
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
        price_alert_period_days: settings.price_alert_period_days
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
      </div>
    </div>
  );
}
