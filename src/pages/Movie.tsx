import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Film } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Pelicula = Tables<"peliculas">;

function getEmbedUrl(url: string): { type: "iframe" | "video"; src: string } {
  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/
  );
  if (ytMatch)
    return {
      type: "iframe",
      src: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0&modestbranding=1`,
    };

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch)
    return {
      type: "iframe",
      src: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&color=e53e3e`,
    };

  // Google Drive
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch)
    return {
      type: "iframe",
      src: `https://drive.google.com/file/d/${driveMatch[1]}/preview`,
    };

  // Fallback: direct video URL
  return { type: "video", src: url };
}

const Movie = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pelicula, setPelicula] = useState<Pelicula | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("peliculas")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setPelicula(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="w-full aspect-video bg-card animate-pulse" />
        <div className="container mx-auto px-4 py-10 max-w-5xl space-y-4">
          <div className="h-14 w-2/3 bg-card animate-pulse rounded" />
          <div className="h-4 w-full bg-card animate-pulse rounded" />
          <div className="h-4 w-5/6 bg-card animate-pulse rounded" />
          <div className="h-4 w-4/6 bg-card animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (!pelicula) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Film className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-muted-foreground">Película no encontrada</p>
        <button
          onClick={() => navigate("/")}
          className="text-sm text-primary hover:underline"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  const embed = getEmbedUrl(pelicula.video_url);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Subtle blurred backdrop */}
      {pelicula.portada_url && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center scale-110 blur-3xl opacity-[0.07]"
            style={{ backgroundImage: `url(${pelicula.portada_url})` }}
          />
        </div>
      )}

      {/* ── Sticky header ── */}
      <header className="relative z-20 sticky top-0 bg-background/90 backdrop-blur-md border-b border-border/30">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            aria-label="Volver"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
            <span className="text-sm hidden sm:inline">Inicio</span>
          </button>

          <div className="flex items-center gap-2 ml-1">
            <Film className="h-5 w-5 text-primary" />
            <span className="font-display text-lg tracking-widest text-foreground">CINE CLUB</span>
          </div>
        </div>
      </header>

      {/* ── Video Player ── */}
      <div className="relative z-10 bg-black w-full">
        <div className="w-full aspect-video max-h-[80vh]">
          {embed.type === "iframe" ? (
            <iframe
              src={embed.src}
              className="w-full h-full"
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowFullScreen
              title={pelicula.titulo}
            />
          ) : (
            <video
              src={embed.src}
              controls
              autoPlay
              className="w-full h-full"
              controlsList="nodownload"
            >
              Tu navegador no soporta video HTML5.
            </video>
          )}
        </div>
      </div>

      {/* ── Movie Info ── */}
      <div className="relative z-10 container mx-auto px-4 py-10 max-w-5xl animate-fade-in">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Poster thumbnail (desktop only) */}
          {pelicula.portada_url && (
            <div className="hidden md:block shrink-0">
              <img
                src={pelicula.portada_url}
                alt={pelicula.titulo}
                className="w-44 h-64 object-cover rounded-md shadow-2xl border border-border/30"
              />
            </div>
          )}

          {/* Text info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-5xl md:text-7xl font-display text-foreground leading-none mb-5">
              {pelicula.titulo}
            </h1>
            {pelicula.descripcion && (
              <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
                {pelicula.descripcion}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-border/30 py-6 text-center mt-8">
        <div className="flex items-center justify-center gap-2 text-muted-foreground/50">
          <Film className="h-3.5 w-3.5 text-primary/60" />
          <span className="font-display tracking-widest text-xs">CINE CLUB</span>
        </div>
      </footer>
    </div>
  );
};

export default Movie;
