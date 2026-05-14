"use client";

import { useEffect, useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmailSyncTrigger({ user }: { user: any }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();
  const hasSynced = useRef(false);

  const performSync = async (isManual = false) => {
    if (isSyncing) return;

    setIsSyncing(true);
    if (!isManual) {
        toast({
            title: "Recherche de commandes",
            description: "Minty vérifie vos emails de vente...",
            duration: 3000,
        });
    }

    try {
      const response = await fetch('/api/import/email-sync', { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        if (data.count > 0) {
          toast({
            title: "Nouvelles commandes !",
            description: `${data.count} commande(s) ont été importées automatiquement.`,
            variant: "default",
          });
          // On rafraîchit la page si on est sur le dashboard ou suivi pour voir les nouveautés
          if (window.location.pathname === '/dashboard' || window.location.pathname === '/suivi') {
            window.location.reload();
          }
        } else if (isManual) {
          toast({
            title: "À jour",
            description: "Aucune nouvelle commande trouvée dans vos emails.",
          });
        }
      } else if (isManual && data.error) {
         toast({
            title: "Erreur de synchro",
            description: data.error,
            variant: "destructive"
         });
      }
    } catch (error) {
      console.error("Sync error:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (user && !hasSynced.current) {
      hasSynced.current = true;
      // Petit délai pour laisser l'interface se charger
      const timer = setTimeout(() => {
        performSync();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  return (
    <Button
      id="sync-trigger-btn"
      variant="ghost"
      size="icon"
      className="h-9 w-9 md:h-10 md:w-10 relative"
      onClick={() => performSync(true)}
      disabled={isSyncing}
      title="Synchroniser les emails"
    >
      {isSyncing ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      ) : (
        <Mail className="h-5 w-5" />
      )}
    </Button>
  );
}
