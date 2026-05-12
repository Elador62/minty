"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, User, LogIn, Bell, Menu, X } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getActiveAlerts } from "@/lib/utils/alerts";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [alertCount, setAlertCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();

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

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/suivi", label: "Suivi" },
    { href: "/import", label: "Import" },
    { href: "/shipping", label: "Expédition" },
    { href: "/collection", label: "Collection" },
    { href: "/parametres", label: "Paramètres" },
  ];

  const activeLinkClass = "text-primary font-bold";
  const inactiveLinkClass = "text-muted-foreground hover:text-primary transition-colors font-medium";

  return (
    <nav className="border-b bg-white print:hidden sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-8">
          <Link href="/" className="font-bold text-xl text-primary shrink-0">
            <img src="/logo.png" alt="Minty Logo" className="h-10 md:h-12 w-auto" />
          </Link>

          {user && (
            <div className="hidden lg:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm ${pathname === link.href ? activeLinkClass : inactiveLinkClass}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {user ? (
            <>
              <Link href="/alertes" className="relative">
                <Button variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10">
                  <Bell className="h-5 w-5" />
                  {alertCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 md:h-5 md:w-5 flex items-center justify-center p-0 bg-red-600 text-white border-white text-[10px]">
                      {alertCount > 99 ? '99+' : alertCount}
                    </Badge>
                  )}
                </Button>
              </Link>

              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="hidden md:inline max-w-[150px] truncate">{user.email}</span>
              </div>

              <div className="hidden lg:block">
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" /> Déconnexion
                </Button>
              </div>

              {/* Mobile Menu */}
              <div className="lg:hidden">
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                    <SheetHeader className="mb-8">
                      <SheetTitle className="text-left">Menu</SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-2 px-2 py-4 border-b">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span className="text-sm font-bold truncate max-w-[220px]">{user.email}</span>
                          <span className="text-xs text-muted-foreground italic">Connecté</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {navLinks.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`flex items-center px-2 py-3 rounded-md text-base ${
                              pathname === link.href
                                ? "bg-primary/10 text-primary font-bold"
                                : "hover:bg-slate-100 transition-colors"
                            }`}
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                      <div className="mt-8 pt-4 border-t">
                        <Button variant="destructive" className="w-full justify-start" onClick={handleLogout}>
                          <LogOut className="mr-2 h-4 w-4" /> Déconnexion
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
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
