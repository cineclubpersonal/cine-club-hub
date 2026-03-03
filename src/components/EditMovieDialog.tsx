import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import type { Tables, Database } from "@/integrations/supabase/types";

type Pelicula = Tables<"peliculas">;
type Categoria = Database["public"]["Enums"]["categoria_type"];

const CATEGORIAS: { value: Categoria; label: string }[] = [
  { value: "peliculas", label: "Películas" },
  { value: "series", label: "Series" },
  { value: "conciertos", label: "Conciertos" },
];

interface EditMovieDialogProps {
  pelicula: Pelicula;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const EditMovieDialog = ({ pelicula, open, onOpenChange, onSaved }: EditMovieDialogProps) => {
  const [titulo, setTitulo] = useState(pelicula.titulo);
  const [descripcion, setDescripcion] = useState(pelicula.descripcion || "");
  const [portadaUrl, setPortadaUrl] = useState(pelicula.portada_url || "");
  const [categoria, setCategoria] = useState<Categoria>(pelicula.categoria);
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    if (!titulo.trim()) {
      toast.error("El título es obligatorio");
      return;
    }
    setSubmitting(true);

    const { error } = await supabase
      .from("peliculas")
      .update({
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
        portada_url: portadaUrl.trim() || null,
        categoria,
      })
      .eq("id", pelicula.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Cambios guardados");
      onSaved();
      onOpenChange(false);
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wider text-foreground">
            EDITAR CONTENIDO
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Título *</label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Descripción</label>
            <Textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="bg-secondary border-border resize-none"
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">URL de portada</label>
            <div className="relative">
              <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={portadaUrl}
                onChange={(e) => setPortadaUrl(e.target.value)}
                placeholder="https://..."
                className="bg-secondary border-border pl-9"
              />
            </div>
            {portadaUrl && (
              <div className="flex items-center gap-3 p-2 bg-secondary/50 rounded border border-border/50">
                <img
                  src={portadaUrl}
                  alt="Vista previa"
                  className="w-10 h-14 object-cover rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <span className="text-xs text-muted-foreground">Vista previa</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Categoría</label>
            <Select value={categoria} onValueChange={(v) => setCategoria(v as Categoria)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {CATEGORIAS.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditMovieDialog;
