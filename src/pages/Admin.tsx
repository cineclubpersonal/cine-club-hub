import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Film, Plus, Pencil, Trash2, ArrowLeft, Link, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Pelicula = Tables<"peliculas">;

const emptyForm = { titulo: "", descripcion: "", portada_url: "", video_url: "" };

const Admin = () => {
  const navigate = useNavigate();
  const [peliculas, setPeliculas] = useState<Pelicula[]>([]);
  const [editing, setEditing] = useState<Pelicula | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPeliculas();
  }, []);

  const fetchPeliculas = async () => {
    const { data } = await supabase
      .from("peliculas")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setPeliculas(data);
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (editing) {
      const { error } = await supabase.from("peliculas").update(form).eq("id", editing.id);
      if (error) toast.error(error.message);
      else toast.success("Película actualizada correctamente");
    } else {
      const { error } = await supabase.from("peliculas").insert(form);
      if (error) toast.error(error.message);
      else toast.success("Película agregada correctamente");
    }

    resetForm();
    fetchPeliculas();
    setSubmitting(false);
  };

  const handleEdit = (p: Pelicula) => {
    setEditing(p);
    setForm({
      titulo: p.titulo,
      descripcion: p.descripcion || "",
      portada_url: p.portada_url || "",
      video_url: p.video_url,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string, titulo: string) => {
    if (!window.confirm(`¿Eliminar "${titulo}"? Esta acción no se puede deshacer.`)) return;
    setDeletingId(id);
    const { error } = await supabase.from("peliculas").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Película eliminada");
      fetchPeliculas();
    }
    setDeletingId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Volver">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <Film className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-display text-foreground tracking-widest">PANEL DE ADMIN</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-10 max-w-4xl">
        {/* ── Form ── */}
        <div className="bg-card rounded-lg border border-border p-6 mb-10 animate-fade-in shadow-md">
          <h2 className="text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            {editing ? "Editar película" : "Agregar nueva película"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input placeholder="Título *" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required className="bg-secondary border-border" />
            <Textarea placeholder="Descripción (sinopsis, año, género...)" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} className="bg-secondary border-border resize-none" rows={3} />
            <div className="relative">
              <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="URL de la imagen de portada" value={form.portada_url} onChange={(e) => setForm({ ...form, portada_url: e.target.value })} className="bg-secondary border-border pl-9" />
            </div>
            <div className="relative">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="URL del video: YouTube, Google Drive, Vimeo, enlace directo... *" value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} required className="bg-secondary border-border pl-9" />
            </div>
            {form.portada_url && (
              <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-md border border-border/50">
                <img src={form.portada_url} alt="Vista previa" className="w-12 h-18 object-cover rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                <p className="text-xs text-muted-foreground">Vista previa de portada</p>
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <Button type="submit" disabled={submitting} className="min-w-[120px]">
                {submitting ? "Guardando..." : editing ? "Actualizar" : "Agregar película"}
              </Button>
              {editing && <Button type="button" variant="ghost" onClick={resetForm}>Cancelar</Button>}
            </div>
          </form>
        </div>

        {/* ── Movie List ── */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-display text-foreground tracking-wide">PELÍCULAS</h2>
            <div className="flex-1 h-px bg-border" />
            <span className="text-sm text-muted-foreground tabular-nums">{peliculas.length} {peliculas.length === 1 ? "entrada" : "entradas"}</span>
          </div>
          <div className="space-y-3">
            {peliculas.map((p, i) => (
              <div key={p.id} className="bg-card rounded-lg border border-border p-4 flex items-center gap-4 animate-fade-in hover:border-border/80 transition-colors" style={{ animationDelay: `${i * 0.04}s` }}>
                <div className="shrink-0 w-12 h-18">
                  {p.portada_url ? (
                    <img src={p.portada_url} alt={p.titulo} className="w-12 h-[4.5rem] object-cover rounded border border-border/50" loading="lazy" />
                  ) : (
                    <div className="w-12 h-[4.5rem] bg-secondary rounded flex items-center justify-center border border-border/50">
                      <Film className="h-5 w-5 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{p.titulo}</h3>
                  {p.descripcion && <p className="text-sm text-muted-foreground truncate mt-0.5">{p.descripcion}</p>}
                  <p className="text-xs text-muted-foreground/60 truncate mt-1">{p.video_url}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(p)} title="Editar" className="hover:bg-secondary"><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id, p.titulo)} disabled={deletingId === p.id} title="Eliminar" className="text-destructive hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
            {peliculas.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <Film className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No hay películas todavía. ¡Agrega la primera!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
