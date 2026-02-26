import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Film, Shield } from "lucide-react";
import MovieCard from "@/components/MovieCard";
import type { Tables } from "@/integrations/supabase/types";

type Pelicula = Tables<"peliculas">;

const Index = () => {
  const [peliculas, setPeliculas] = useState<Pelicula[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    supabase
      .from("peliculas")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setPeliculas(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-display text-foreground tracking-wider">CINE CLUB</h1>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={() => navigate("/admin")}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Shield className="h-4 w-4" />
                Admin
              </button>
            )}
            {!user && (
              <button
                onClick={() => navigate("/login")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Iniciar sesión
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 pt-12 pb-4">
        <h2 className="text-5xl md:text-7xl font-display text-foreground mb-2">PELÍCULAS</h2>
        <p className="text-muted-foreground text-lg">Tu colección de cine privada</p>
      </section>

      {/* Grid */}
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-card rounded-lg animate-pulse border border-border" />
            ))}
          </div>
        ) : peliculas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Film className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2 font-sans">Sin películas</h3>
            <p className="text-muted-foreground">
              {isAdmin ? "Ve al panel de admin para agregar películas." : "Próximamente se agregarán películas."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {peliculas.map((p, i) => (
              <div key={p.id} className="animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                <MovieCard pelicula={p} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
