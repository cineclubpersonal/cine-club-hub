import { useState } from "react";
import { Music, Pencil, Trash2, Loader2, Play, User, Disc } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import EditSongDialog from "@/components/EditSongDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Song = Tables<"musica">;

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const EDGE_FN_URL = `${SUPABASE_URL}/functions/v1/s3-multipart`;

function extractS3Key(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const key = parsed.pathname.startsWith("/") ? parsed.pathname.slice(1) : parsed.pathname;
    return key || null;
  } catch { return null; }
}

interface SongCardProps {
  song: Song;
  genres: string[];
  onUpdated?: () => void;
}

const SongCard = ({ song, genres, onUpdated }: SongCardProps) => {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const keys = [extractS3Key(song.audio_url), extractS3Key(song.portada_url)].filter(Boolean) as string[];

    if (keys.length > 0) {
      try {
        const res = await fetch(`${EDGE_FN_URL}?action=deleteObjects`, {
          method: "POST",
          headers: { "Content-Type": "application/json", authorization: `Bearer ${SUPABASE_ANON_KEY}` },
          body: JSON.stringify({ keys }),
        });
        if (!res.ok) console.error("S3 delete error:", await res.text());
      } catch (err) { console.error("S3 delete error:", err); }
    }

    const { error } = await supabase.from("musica").delete().eq("id", song.id);
    if (error) { toast.error("Error al eliminar: " + error.message); }
    else { toast.success(`"${song.titulo}" eliminado`); onUpdated?.(); }

    setDeleting(false);
    setDeleteOpen(false);
  };

  return (
    <>
      <div className="group relative bg-card border border-border/40 rounded-lg overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
        {/* Action buttons */}
        <div className="absolute top-2 right-2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setEditOpen(true)}
            className="bg-background/80 backdrop-blur-sm border border-border rounded-md p-1.5 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
            aria-label="Editar">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setDeleteOpen(true)}
            className="bg-background/80 backdrop-blur-sm border border-border rounded-md p-1.5 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
            aria-label="Eliminar">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Cover */}
        <div className="aspect-square w-full overflow-hidden relative">
          {song.portada_url ? (
            <img src={song.portada_url} alt={song.titulo} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
          ) : (
            <div className="w-full h-full bg-secondary flex items-center justify-center">
              <Music className="h-12 w-12 text-muted-foreground/40" />
            </div>
          )}
          {/* Play overlay */}
          <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <a href={song.audio_url} target="_blank" rel="noopener noreferrer"
              className="bg-primary rounded-full p-3 shadow-lg hover:scale-110 transition-transform">
              <Play className="h-5 w-5 text-primary-foreground fill-current" />
            </a>
          </div>
        </div>

        {/* Info */}
        <div className="p-3 space-y-1">
          <h3 className="text-sm font-semibold text-foreground line-clamp-1">{song.titulo}</h3>
          {song.artista && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 line-clamp-1">
              <User className="h-3 w-3 shrink-0" /> {song.artista}
            </p>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground/70">
            {song.album && (
              <span className="flex items-center gap-1 line-clamp-1">
                <Disc className="h-3 w-3 shrink-0" /> {song.album}
              </span>
            )}
            {song.duracion && <span>{song.duracion}</span>}
          </div>
          {song.anio && <span className="text-[10px] text-muted-foreground/50">{song.anio}</span>}
        </div>
      </div>

      <EditSongDialog song={song} genres={genres} open={editOpen} onOpenChange={setEditOpen} onSaved={() => onUpdated?.()} />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display tracking-wider text-foreground">ELIMINAR CANCIÓN</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              ¿Estás seguro de que deseas eliminar <strong className="text-foreground">"{song.titulo}"</strong> de forma permanente? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleDelete(); }} disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {deleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SongCard;
