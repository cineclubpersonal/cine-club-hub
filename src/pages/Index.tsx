import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Film, Shield, Play, LogIn } from "lucide-react";
import MovieCard from "@/components/MovieCard";
import type { Tables } from "@/integrations/supabase/types";

type Pelicula = Tables<"peliculas">;

const Index = () => {
  const [peliculas, setPeliculas] = useState<Pelicula[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const fetchPeliculas = useCallback(() => {
    supabase
      .from("peliculas")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setPeliculas(data);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchPeliculas();
  }, [fetchPeliculas]);

  const featured = peliculas[0];

  return (
    <div className="min-h-screen bg-background">
      {/* ── Fixed Header ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-background via-background/80 to-transparent">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <Film className="h-6 w-6 text-primary" />
            <span className="text-2xl font-display text-foreground tracking-widest">CINE CLUB</span>
          </div>

          <nav className="flex items-center gap-3">
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
                className="flex items-center gap-1.5 text-sm px-4 py-1.5 border border-border rounded text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-all"
              >
                <LogIn className="h-4 w-4" />
                Iniciar sesión
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* ── Hero Section ── */}
      {loading && (
        <div className="h-[82vh] min-h-[520px] bg-card animate-pulse" />
      )}

      {!loading && featured && (
        <section className="relative h-[82vh] min-h-[540px] flex items-end overflow-hidden">
          {/* Backdrop image */}
          {featured.portada_url ? (
            <div
              className="absolute inset-0 bg-cover bg-top scale-105"
              style={{ backgroundImage: `url(${featured.portada_url})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-card to-background" />
          )}

          {/* Hero content */}
          <div className="relative container mx-auto px-4 pb-20 max-w-screen-xl">
            <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em] mb-3">
              Película destacada
            </p>
            <h2 className="text-6xl md:text-8xl font-display text-foreground mb-5 leading-none drop-shadow-lg">
              {featured.titulo}
            </h2>
            {featured.descripcion && (
              <p className="text-muted-foreground text-sm md:text-base max-w-lg mb-8 line-clamp-3 leading-relaxed">
                {featured.descripcion}
              </p>
            )}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/pelicula/${featured.id}`)}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-7 py-3 rounded font-semibold hover:bg-primary/90 active:scale-95 transition-all shadow-lg"
              >
                <Play className="h-5 w-5 fill-current" />
                Reproducir
              </button>
              <button
                onClick={() => navigate(`/pelicula/${featured.id}`)}
                className="flex items-center gap-2 bg-secondary/80 text-secondary-foreground px-7 py-3 rounded font-semibold hover:bg-secondary transition-all backdrop-blur-sm"
              >
                Más info
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Empty state hero (no movies yet) */}
      {!loading && peliculas.length === 0 && (
        <div className="h-[70vh] flex flex-col items-center justify-center pt-20 text-center px-4">
          <Film className="h-20 w-20 text-muted-foreground/30 mb-6" />
          <h2 className="text-4xl font-display text-foreground mb-2 tracking-widest">CINE CLUB</h2>
          <p className="text-muted-foreground max-w-xs">
            {isAdmin
              ? "Ve al panel de admin para agregar tu primera película."
              : "La colección de películas se actualizará pronto."}
          </p>
        </div>
      )}

      {/* ── Movie Grid ── */}
      {(loading || peliculas.length > 0) && (
        <main className="container mx-auto px-4 pt-10 pb-16 max-w-screen-xl">
          {/* Section header */}
          {!loading && (
            <div className="flex items-center gap-4 mb-6">
              <h3 className="text-2xl font-display text-foreground tracking-wide">CATÁLOGO</h3>
              <div className="flex-1 h-px bg-border" />
              <span className="text-sm text-muted-foreground tabular-nums">
                {peliculas.length} {peliculas.length === 1 ? "película" : "películas"}
              </span>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-card rounded-lg animate-pulse border border-border" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {peliculas.map((p, i) => (
                <div key={p.id} className="animate-fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
                  <MovieCard pelicula={p} />
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {/* ── Footer ── */}
      <footer className="border-t border-border/50 py-8 text-center">
        <div className="flex items-center justify-center gap-2 text-muted-foreground/60">
          <Film className="h-4 w-4 text-primary/70" />
          <span className="font-display tracking-widest text-xs">CINE CLUB</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
