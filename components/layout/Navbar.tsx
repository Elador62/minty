"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, User, LogIn, Bell } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getActiveAlerts } from "@/lib/utils/alerts";

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
      if (user) fetchAlertCount();
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      if (newUser) fetchAlertCount();
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const fetchAlertCount = async () => {
    const alerts = await getActiveAlerts(supabase);
    setAlertCount(alerts.length);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <nav className="border-b bg-white print:hidden">
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
              <Link href="/alertes" className="relative mr-2">
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <Bell className="h-5 w-5" />
                  {alertCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-600 text-white border-white">
                      {alertCount > 99 ? '99+' : alertCount}
                    </Badge>
                  )}
                </Button>
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
