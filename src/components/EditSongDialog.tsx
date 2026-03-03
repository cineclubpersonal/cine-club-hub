import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import type { Tables } from "@/integrations/supabase/types";

type Song = Tables<"musica">;

interface EditSongDialogProps {
  song: Song;
  genres: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const EditSongDialog = ({ song, genres, open, onOpenChange, onSaved }: EditSongDialogProps) => {
  const [titulo, setTitulo] = useState(song.titulo);
  const [artista, setArtista] = useState(song.artista || "");
  const [album, setAlbum] = useState(song.album || "");
  const [anio, setAnio] = useState(song.anio?.toString() || "");
  const [duracion, setDuracion] = useState(song.duracion || "");
  const [genero, setGenero] = useState(song.genero);
  const [nuevoGenero, setNuevoGenero] = useState("");
  const [portadaUrl, setPortadaUrl] = useState(song.portada_url || "");
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    if (!titulo.trim()) { toast.error("El título es obligatorio"); return; }
    const finalGenero = genero === "__nuevo" ? nuevoGenero.trim() : genero;
    if (!finalGenero) { toast.error("Selecciona un género"); return; }

    setSubmitting(true);
    const { error } = await supabase.from("musica").update({
      titulo: titulo.trim(),
      artista: artista.trim() || null,
      album: album.trim() || null,
      anio: anio ? parseInt(anio) : null,
      duracion: duracion.trim() || null,
      genero: finalGenero,
      portada_url: portadaUrl.trim() || null,
    }).eq("id", song.id);

    if (error) { toast.error(error.message); }
    else { toast.success("Canción actualizada"); onSaved(); onOpenChange(false); }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wider text-foreground">EDITAR CANCIÓN</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">Modifica los datos de la canción.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Input placeholder="Título *" value={titulo} onChange={(e) => setTitulo(e.target.value)} className="bg-secondary border-border" />
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Artista" value={artista} onChange={(e) => setArtista(e.target.value)} className="bg-secondary border-border" />
            <Input placeholder="Álbum" value={album} onChange={(e) => setAlbum(e.target.value)} className="bg-secondary border-border" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Año" type="number" value={anio} onChange={(e) => setAnio(e.target.value)} className="bg-secondary border-border" />
            <Input placeholder="Duración" value={duracion} onChange={(e) => setDuracion(e.target.value)} className="bg-secondary border-border" />
          </div>
          <select value={genero} onChange={(e) => setGenero(e.target.value)}
            className="w-full rounded-md border border-border bg-secondary text-foreground px-3 py-2 text-sm">
            {genres.map((g) => <option key={g} value={g}>{g}</option>)}
            <option value="__nuevo">+ Crear nuevo género</option>
          </select>
          {genero === "__nuevo" && (
            <Input placeholder="Nuevo género" value={nuevoGenero} onChange={(e) => setNuevoGenero(e.target.value)} className="bg-secondary border-border" />
          )}
          <Input placeholder="URL de portada" value={portadaUrl} onChange={(e) => setPortadaUrl(e.target.value)} className="bg-secondary border-border" />
          {portadaUrl && (
            <img src={portadaUrl} alt="Preview" className="w-20 h-20 rounded object-cover border border-border" onError={(e) => (e.currentTarget.style.display = "none")} />
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={submitting}>Cancelar</Button>
          <Button onClick={handleSave} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditSongDialog;
