import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Pencil } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import EditMovieDialog from "@/components/EditMovieDialog";

type Pelicula = Tables<"peliculas">;

interface MovieCardProps {
  pelicula: Pelicula;
  onUpdated?: () => void;
}

const MovieCard = ({ pelicula, onUpdated }: MovieCardProps) => {
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <div className="group relative rounded-md overflow-hidden bg-card border border-border/40 transition-all duration-300 hover:scale-[1.07] hover:border-primary/40 hover:shadow-[0_16px_48px_rgba(0,0,0,0.85)] hover:z-10">
        {/* Edit button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setEditOpen(true);
          }}
          className="absolute top-2 right-2 z-20 bg-background/80 backdrop-blur-sm border border-border rounded-md p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary hover:text-primary-foreground hover:border-primary"
          aria-label="Editar"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>

        {/* Clickable area */}
        <button
          onClick={() => navigate(`/pelicula/${pelicula.id}`)}
          className="w-full text-left focus:outline-none focus:ring-2 focus:ring-primary"
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
          <div className="absolute inset-0 bg-gradient-to-t from-background/98 via-background/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 pointer-events-none">
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

          {/* Title bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent px-3 py-4 group-hover:opacity-0 transition-opacity duration-200 pointer-events-none">
            <h3 className="text-xs font-semibold text-foreground line-clamp-2 leading-snug">
              {pelicula.titulo}
            </h3>
          </div>
        </button>
      </div>

      <EditMovieDialog
        pelicula={pelicula}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={() => onUpdated?.()}
      />
    </>
  );
};

export default MovieCard;
