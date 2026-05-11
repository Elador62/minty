"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCardPrice } from "@/lib/cardmarket/prices";

export default function DebugPricesPage() {
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [expansion, setExpansion] = useState("");
  const [game, setGame] = useState("magic");
  const [isFoil, setIsFoil] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  const testSync = async () => {
    setIsLoading(true);
    setLogs([]);
    addLog(`Démarrage du test pour : ${name || nameEn} (${expansion}) - ${game} ${isFoil ? '(Foil)' : ''}`);

    try {
      // Monkey patch global fetch to log requests
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        addLog(`🌐 API Request: ${args[0]}`);
        const res = await originalFetch(...args);
        addLog(`✅ API Response Status: ${res.status}`);
        return res;
      };

      const price = await getCardPrice(name, game, expansion, isFoil, nameEn);

      addLog(`💰 PRIX FINAL RÉCUPÉRÉ : ${price !== null ? `${price} €` : 'NON TROUVÉ'}`);

      // Restore fetch
      window.fetch = originalFetch;

    } catch (err: any) {
      addLog(`❌ ERREUR : ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 space-y-8">
      <h1 className="text-3xl font-bold">Debug Prix API</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader><CardTitle>Paramètres de test</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
               <label className="text-xs font-bold">Nom (FR)</label>
               <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Ball Lightning" />
            </div>
            <div className="grid gap-2">
               <label className="text-xs font-bold">Nom (EN - Optionnel)</label>
               <Input value={nameEn} onChange={e => setNameEn(e.target.value)} placeholder="Ex: Ball Lightning" />
            </div>
            <div className="grid gap-2">
               <label className="text-xs font-bold">Édition (Nom ou Code)</label>
               <Input value={expansion} onChange={e => setExpansion(e.target.value)} placeholder="Ex: 30th Anniversary Celebration" />
            </div>
            <div className="grid gap-2">
               <label className="text-xs font-bold">Jeu</label>
               <Select value={game} onValueChange={setGame}>
                 <SelectTrigger><SelectValue /></SelectTrigger>
                 <SelectContent>
                   <SelectItem value="magic">Magic</SelectItem>
                   <SelectItem value="pokemon">Pokémon</SelectItem>
                 </SelectContent>
               </Select>
            </div>
            <div className="flex items-center space-x-2">
               <Checkbox id="foil-debug" checked={isFoil} onCheckedChange={(v) => setIsFoil(!!v)} />
               <label htmlFor="foil-debug" className="text-sm font-medium">Foil</label>
            </div>
            <Button onClick={testSync} disabled={isLoading} className="w-full">
               {isLoading ? "Test en cours..." : "Lancer le test"}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-950 text-slate-50 font-mono text-[10px]">
           <CardHeader className="border-b border-slate-800">
             <CardTitle className="text-sm">Logs d'exécution</CardTitle>
           </CardHeader>
           <CardContent className="p-4 h-[400px] overflow-y-auto space-y-1">
              {logs.length === 0 && <p className="text-slate-500 italic">Aucun log pour le moment.</p>}
              {logs.map((log, i) => (
                <div key={i} className="border-b border-slate-900 pb-1">{log}</div>
              ))}
           </CardContent>
        </Card>
      </div>
    </div>
  );
}
