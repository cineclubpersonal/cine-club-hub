import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Film, Music, ArrowLeft } from "lucide-react";
import SongCard from "@/components/SongCard";
import MusicPublishBox from "@/components/MusicPublishBox";
import type { Tables } from "@/integrations/supabase/types";

type Song = Tables<"musica">;

const Musica = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGenre, setActiveGenre] = useState<string>("__all");
  const navigate = useNavigate();

  const fetchSongs = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("musica").select("*").order("created_at", { ascending: false });
    setSongs(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchSongs(); }, [fetchSongs]);

  // Dynamic genres derived from data
  const genres = useMemo(() => {
    const set = new Set(songs.map((s) => s.genero));
    return Array.from(set).sort();
  }, [songs]);

  const filtered = activeGenre === "__all" ? songs : songs.filter((s) => s.genero === activeGenre);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-background via-background/80 to-transparent">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
              <Film className="h-5 w-5 text-primary" />
              <span className="text-lg font-display text-foreground tracking-widest">CINE CLUB</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-24 pb-16 max-w-screen-xl">
        {/* Title */}
        <div className="flex items-center gap-3 mb-8">
          <Music className="h-8 w-8 text-primary" />
          <h1 className="text-5xl md:text-6xl font-display text-foreground tracking-wide">MÚSICA</h1>
        </div>

        {/* Publish box */}
        <div className="mb-8">
          <MusicPublishBox onPublished={fetchSongs} genres={genres} />
        </div>

        {/* Genre filter pills */}
        {genres.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveGenre("__all")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeGenre === "__all"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
              }`}
            >
              Todos ({songs.length})
            </button>
            {genres.map((g) => {
              const count = songs.filter((s) => s.genero === g).length;
              return (
                <button
                  key={g}
                  onClick={() => setActiveGenre(g)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    activeGenre === g
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                  }`}
                >
                  {g} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Count */}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center gap-4 mb-6">
            <h3 className="text-2xl font-display text-foreground tracking-wide uppercase">
              {activeGenre === "__all" ? "Todas las canciones" : activeGenre}
            </h3>
            <div className="flex-1 h-px bg-border" />
            <span className="text-sm text-muted-foreground tabular-nums">
              {filtered.length} {filtered.length === 1 ? "canción" : "canciones"}
            </span>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square bg-card rounded-lg animate-pulse border border-border" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-card border border-border/50 rounded-full p-6 mb-5">
              <Music className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h4 className="text-lg font-semibold text-foreground mb-2">
              {activeGenre === "__all" ? "No hay canciones aún" : `No hay canciones en "${activeGenre}"`}
            </h4>
            <p className="text-sm text-muted-foreground max-w-xs">
              Usa el formulario de publicación para agregar tu primera canción.
            </p>
          </div>
        )}

        {/* Grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filtered.map((s, i) => (
              <div key={s.id} className="animate-fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
                <SongCard song={s} genres={genres} onUpdated={fetchSongs} />
              </div>
            ))}
          </div>
        )}
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

export default Musica;
