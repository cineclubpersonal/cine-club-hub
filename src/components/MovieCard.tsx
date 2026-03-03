import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Pencil, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import EditMovieDialog from "@/components/EditMovieDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Pelicula = Tables<"peliculas">;

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const EDGE_FN_URL = `${SUPABASE_URL}/functions/v1/s3-multipart`;

/** Extract S3 key from a full S3/CloudFront URL */
function extractS3Key(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    // e.g. /uploads/uuid-file.mkv → uploads/uuid-file.mkv
    const key = parsed.pathname.startsWith("/") ? parsed.pathname.slice(1) : parsed.pathname;
    return key || null;
  } catch {
    return null;
  }
}

interface MovieCardProps {
  pelicula: Pelicula;
  onUpdated?: () => void;
}

const MovieCard = ({ pelicula, onUpdated }: MovieCardProps) => {
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);

    // 1. Collect S3 keys to delete
    const keys = [
      extractS3Key(pelicula.video_url),
      extractS3Key(pelicula.portada_url),
    ].filter(Boolean) as string[];

    // 2. Delete from S3
    if (keys.length > 0) {
      try {
        const res = await fetch(`${EDGE_FN_URL}?action=deleteObjects`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ keys }),
        });
        if (!res.ok) {
          const text = await res.text();
          console.error("S3 delete error:", text);
        }
      } catch (err) {
        console.error("S3 delete error:", err);
      }
    }

    // 3. Delete from database
    const { error } = await supabase.from("peliculas").delete().eq("id", pelicula.id);

    if (error) {
      toast.error("Error al eliminar: " + error.message);
    } else {
      toast.success(`"${pelicula.titulo}" eliminado correctamente`);
      onUpdated?.();
    }

    setDeleting(false);
    setDeleteOpen(false);
  };

  return (
    <>
      <div className="group relative rounded-md overflow-hidden bg-card border border-border/40 transition-all duration-300 hover:scale-[1.07] hover:border-primary/40 hover:shadow-[0_16px_48px_rgba(0,0,0,0.85)] hover:z-10">
        {/* Action buttons */}
        <div className="absolute top-2 right-2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); setEditOpen(true); }}
            className="bg-background/80 backdrop-blur-sm border border-border rounded-md p-1.5 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
            aria-label="Editar"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteOpen(true); }}
            className="bg-background/80 backdrop-blur-sm border border-border rounded-md p-1.5 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
            aria-label="Eliminar"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

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

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display tracking-wider text-foreground">
              ELIMINAR ARCHIVO
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              ¿Estás seguro de que deseas eliminar <strong className="text-foreground">"{pelicula.titulo}"</strong> de forma permanente? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {deleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MovieCard;
