import { useNavigate } from "react-router-dom";
import { Play } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Pelicula = Tables<"peliculas">;

const MovieCard = ({ pelicula }: { pelicula: Pelicula }) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/pelicula/${pelicula.id}`)}
      className="group relative rounded-lg overflow-hidden bg-card border border-border transition-all duration-300 hover:scale-105 hover:border-primary/40 hover:shadow-[0_8px_32px_hsla(0,0%,0%,0.6)] focus:outline-none focus:ring-2 focus:ring-primary text-left w-full"
    >
      <div className="aspect-[2/3] w-full overflow-hidden">
        {pelicula.portada_url ? (
          <img
            src={pelicula.portada_url}
            alt={pelicula.titulo}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-secondary flex items-center justify-center">
            <Play className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="bg-primary rounded-full p-2">
            <Play className="h-4 w-4 text-primary-foreground fill-current" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{pelicula.descripcion}</p>
      </div>

      {/* Title always visible */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background to-transparent p-3 group-hover:opacity-0 transition-opacity duration-300">
        <h3 className="text-sm font-semibold text-foreground truncate">{pelicula.titulo}</h3>
      </div>
    </button>
  );
};

export default MovieCard;
