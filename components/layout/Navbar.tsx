"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, User, LogIn, Bell } from "lucide-react";
import Link from "next/link";

export function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [alertCount, setAlertCount] = useState(0);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    if (!supabase.auth) return;

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        // Simple alert count (needs logic from alerts page or a shared hook)
        // For simplicity, we query orders with delays and inventory with diffs
        const { data: settings } = await supabase.from('user_settings').select('*').single();
        const threshold = settings?.price_alert_threshold || 10;
        const shipOrange = settings?.shipping_delay_orange || 4;
        const recOrange = settings?.reception_delay_orange || 5;

        const { data: inventory } = await supabase.from('inventory_items').select('listed_price, last_market_price');
        const priceAlerts = inventory?.filter((i: any) => {
           const diff = i.listed_price > 0 ? ((Number(i.last_market_price) - Number(i.listed_price)) / Number(i.listed_price)) * 100 : 0;
           return Math.abs(diff) >= threshold;
        }).length || 0;

        const { data: orders } = await supabase.from('orders').select('status, created_at, shipped_at');
        const shipAlerts = orders?.filter((o: any) => ['paid', 'ready', 'preparing'].includes(o.status) && (new Date().getTime() - new Date(o.created_at).getTime()) / (1000 * 3600 * 24) > shipOrange).length || 0;
        const recAlerts = orders?.filter((o: any) => o.status === 'shipped' && o.shipped_at && (new Date().getTime() - new Date(o.shipped_at).getTime()) / (1000 * 3600 * 24) > recOrange).length || 0;

        setAlertCount(priceAlerts + shipAlerts + recAlerts);
      }
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4 h-32 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-bold text-xl text-primary">
            <img src="/logo.png" alt="Minty Logo" className="h-24 w-auto" />
          </Link>

          {user && (
            <div className="hidden md:flex items-center gap-4">
              <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
                Dashboard
              </Link>
              <Link href="/suivi" className="text-sm font-medium hover:text-primary transition-colors">
                Suivi
              </Link>
              <Link href="/import" className="text-sm font-medium hover:text-primary transition-colors">
                Import
              </Link>
              <Link href="/shipping" className="text-sm font-medium hover:text-primary transition-colors">
                Expédition
              </Link>
              <Link href="/collection" className="text-sm font-medium hover:text-primary transition-colors">
                Collection
              </Link>
              <Link href="/parametres" className="text-sm font-medium hover:text-primary transition-colors">
                Paramètres
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/alertes" className="relative p-2 text-muted-foreground hover:text-primary transition-colors">
                <Bell className="h-5 w-5" />
                {alertCount > 0 && (
                  <span className="absolute top-0 right-0 h-4 w-4 bg-red-600 text-white text-[10px] flex items-center justify-center rounded-full">
                    {alertCount}
                  </span>
                )}
              </Link>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mr-2">
                <User className="h-4 w-4" />
                <span className="hidden md:inline">{user.email}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Déconnexion
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button size="sm">
                <LogIn className="mr-2 h-4 w-4" /> Connexion
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
