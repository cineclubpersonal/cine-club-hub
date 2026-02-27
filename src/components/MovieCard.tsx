import { useNavigate } from "react-router-dom";
import { Play } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Pelicula = Tables<"peliculas">;

const MovieCard = ({ pelicula }: { pelicula: Pelicula }) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/pelicula/${pelicula.id}`)}
      className="group relative rounded-md overflow-hidden bg-card border border-border/40 transition-all duration-300 hover:scale-[1.07] hover:border-primary/40 hover:shadow-[0_16px_48px_rgba(0,0,0,0.85)] hover:z-10 focus:outline-none focus:ring-2 focus:ring-primary text-left w-full"
    >
      {/* Poster */}
      <div className="aspect-[2/3] w-full overflow-hidden">
        {pelicula.portada_url ? (
          <img
            src={pelicula.portada_url}
            alt={pelicula.titulo}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-secondary flex flex-col items-center justify-center gap-3 px-3">
            <Play className="h-10 w-10 text-muted-foreground/60" />
            <span className="text-xs text-muted-foreground text-center line-clamp-3 leading-tight">
              {pelicula.titulo}
            </span>
          </div>
        )}
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/98 via-background/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="bg-primary rounded-full p-1.5 shadow-md">
            <Play className="h-3 w-3 text-primary-foreground fill-current" />
          </div>
          <span className="text-xs text-foreground font-semibold">Ver ahora</span>
        </div>
        {pelicula.descripcion && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {pelicula.descripcion}
          </p>
        )}
      </div>

      {/* Title bar – always visible, hides on hover */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent px-3 py-4 group-hover:opacity-0 transition-opacity duration-200">
        <h3 className="text-xs font-semibold text-foreground line-clamp-2 leading-snug">
          {pelicula.titulo}
        </h3>
      </div>
    </button>
  );
};

export default MovieCard;
