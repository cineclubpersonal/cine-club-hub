import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Film, Play, Clapperboard, Tv, Music } from "lucide-react";
import MovieCard from "@/components/MovieCard";
import PublishBox from "@/components/PublishBox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { Tables, Database } from "@/integrations/supabase/types";

type Pelicula = Tables<"peliculas">;
type Categoria = Database["public"]["Enums"]["categoria_type"];

const CATEGORIAS: { value: Categoria; label: string; icon: React.ReactNode }[] = [
  { value: "peliculas", label: "Películas", icon: <Clapperboard className="h-4 w-4" /> },
  { value: "series", label: "Series", icon: <Tv className="h-4 w-4" /> },
  { value: "conciertos", label: "Conciertos", icon: <Music className="h-4 w-4" /> },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState<Categoria>("peliculas");
  const [items, setItems] = useState<Pelicula[]>([]);
  const [loading, setLoading] = useState(true);
  const [featured, setFeatured] = useState<Pelicula | null>(null);
  const navigate = useNavigate();

  const fetchFeatured = useCallback(() => {
    supabase
      .from("peliculas")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) setFeatured(data[0]);
      });
  }, []);

  const fetchByCategory = useCallback((cat: Categoria) => {
    setLoading(true);
    supabase
      .from("peliculas")
      .select("*")
      .eq("categoria", cat)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setItems(data ?? []);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchFeatured();
  }, [fetchFeatured]);

  useEffect(() => {
    fetchByCategory(activeTab);
  }, [activeTab, fetchByCategory]);

  const refetch = () => {
    fetchByCategory(activeTab);
    fetchFeatured();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Fixed Header ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-background via-background/80 to-transparent">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <Film className="h-6 w-6 text-primary" />
            <span className="text-2xl font-display text-foreground tracking-widest">CINE CLUB</span>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      {featured && (
        <section className="relative h-[82vh] min-h-[540px] flex items-end overflow-hidden">
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

          <div className="relative container mx-auto px-4 pb-20 max-w-screen-xl">
            <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em] mb-3">
              Destacado
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

      {!featured && !loading && (
        <div className="h-[50vh] flex flex-col items-center justify-center pt-20 text-center px-4">
          <Film className="h-20 w-20 text-muted-foreground/30 mb-6" />
          <h2 className="text-4xl font-display text-foreground mb-2 tracking-widest">CINE CLUB</h2>
          <p className="text-muted-foreground max-w-xs">
            Usa el panel de publicación para agregar tu primer contenido.
          </p>
        </div>
      )}

      {/* ── Main Content ── */}
      <main className="container mx-auto px-4 pt-10 pb-16 max-w-screen-xl">
        <div className="mb-8">
          <PublishBox onPublished={refetch} />
        </div>

        {/* ── Category Tabs ── */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Categoria)} className="w-full">
          <TabsList className="w-full justify-start gap-1 bg-card/60 backdrop-blur-sm border border-border/50 p-1.5 rounded-lg h-auto flex-wrap">
            {CATEGORIAS.map((cat) => (
              <TabsTrigger
                key={cat.value}
                value={cat.value}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md transition-all"
              >
                {cat.icon}
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {CATEGORIAS.map((cat) => (
            <TabsContent key={cat.value} value={cat.value} className="mt-6">
              {/* Count header */}
              {!loading && items.length > 0 && (
                <div className="flex items-center gap-4 mb-6">
                  <h3 className="text-2xl font-display text-foreground tracking-wide uppercase">{cat.label}</h3>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {items.length} {items.length === 1 ? "título" : "títulos"}
                  </span>
                </div>
              )}

              {/* Loading skeleton */}
              {loading && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="aspect-[2/3] bg-card rounded-lg animate-pulse border border-border" />
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!loading && items.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="bg-card border border-border/50 rounded-full p-6 mb-5">
                    {cat.icon && <span className="[&>svg]:h-10 [&>svg]:w-10 text-muted-foreground/40">{cat.icon}</span>}
                  </div>
                  <h4 className="text-lg font-semibold text-foreground mb-2">
                    No hay {cat.label.toLowerCase()} aún
                  </h4>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Sé el primero en agregar contenido a esta categoría usando el formulario de publicación.
                  </p>
                </div>
              )}

              {/* Grid */}
              {!loading && items.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {items.map((p, i) => (
                    <div key={p.id} className="animate-fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
                      <MovieCard pelicula={p} />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>

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
