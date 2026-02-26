import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Film } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Pelicula = Tables<"peliculas">;

function getEmbedUrl(url: string): { type: "iframe" | "video"; src: string } {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return { type: "iframe", src: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0` };

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return { type: "iframe", src: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1` };

  // Google Drive
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) return { type: "iframe", src: `https://drive.google.com/file/d/${driveMatch[1]}/preview` };

  // Direct video
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
    return <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">Cargando...</div>;
  }

  if (!pelicula) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground">Película no encontrada</p>
        <button onClick={() => navigate("/")} className="text-primary hover:underline">Volver al inicio</button>
      </div>
    );
  }

  const embed = getEmbedUrl(pelicula.video_url);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-background to-transparent">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <Film className="h-5 w-5 text-primary" />
            <span className="font-display text-xl">CINE CLUB</span>
          </button>
        </div>
      </header>

      {/* Player */}
      <div className="pt-16">
        <div className="w-full aspect-video bg-card">
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

      {/* Info */}
      <div className="container mx-auto px-4 py-8 max-w-4xl animate-fade-in">
        <h1 className="text-5xl font-display text-foreground mb-4">{pelicula.titulo}</h1>
        {pelicula.descripcion && (
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
            {pelicula.descripcion}
          </p>
        )}
      </div>
    </div>
  );
};

export default Movie;
