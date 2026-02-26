import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Film, Plus, Pencil, Trash2, LogOut, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Pelicula = Tables<"peliculas">;

const Admin = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [peliculas, setPeliculas] = useState<Pelicula[]>([]);
  const [editing, setEditing] = useState<Pelicula | null>(null);
  const [form, setForm] = useState({ titulo: "", descripcion: "", portada_url: "", video_url: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/login");
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    fetchPeliculas();
  }, []);

  const fetchPeliculas = async () => {
    const { data } = await supabase.from("peliculas").select("*").order("created_at", { ascending: false });
    if (data) setPeliculas(data);
  };

  const resetForm = () => {
    setForm({ titulo: "", descripcion: "", portada_url: "", video_url: "" });
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (editing) {
      const { error } = await supabase.from("peliculas").update(form).eq("id", editing.id);
      if (error) toast.error(error.message);
      else toast.success("Película actualizada");
    } else {
      const { error } = await supabase.from("peliculas").insert(form);
      if (error) toast.error(error.message);
      else toast.success("Película agregada");
    }

    resetForm();
    fetchPeliculas();
    setSubmitting(false);
  };

  const handleEdit = (p: Pelicula) => {
    setEditing(p);
    setForm({ titulo: p.titulo, descripcion: p.descripcion || "", portada_url: p.portada_url || "", video_url: p.video_url });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("peliculas").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Película eliminada");
      fetchPeliculas();
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Cargando...</div>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <Film className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-display text-foreground">PANEL DE ADMIN</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4 mr-2" /> Salir
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Form */}
        <div className="bg-card rounded-lg border border-border p-6 mb-8 animate-fade-in">
          <h2 className="text-lg font-semibold text-foreground mb-4 font-sans flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            {editing ? "Editar película" : "Agregar película"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Título"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              required
              className="bg-secondary border-border"
            />
            <Textarea
              placeholder="Descripción"
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              className="bg-secondary border-border resize-none"
              rows={3}
            />
            <Input
              placeholder="URL de la imagen de portada"
              value={form.portada_url}
              onChange={(e) => setForm({ ...form, portada_url: e.target.value })}
              className="bg-secondary border-border"
            />
            <Input
              placeholder="URL del video (YouTube, Drive, Vimeo, etc.)"
              value={form.video_url}
              onChange={(e) => setForm({ ...form, video_url: e.target.value })}
              required
              className="bg-secondary border-border"
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Guardando..." : editing ? "Actualizar" : "Agregar"}
              </Button>
              {editing && (
                <Button type="button" variant="ghost" onClick={resetForm}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* List */}
        <div className="space-y-3">
          {peliculas.map((p, i) => (
            <div
              key={p.id}
              className="bg-card rounded-lg border border-border p-4 flex items-center gap-4 animate-fade-in"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              {p.portada_url && (
                <img
                  src={p.portada_url}
                  alt={p.titulo}
                  className="w-16 h-24 object-cover rounded"
                  loading="lazy"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{p.titulo}</h3>
                <p className="text-sm text-muted-foreground truncate">{p.descripcion}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {peliculas.length === 0 && (
            <p className="text-center text-muted-foreground py-12">No hay películas aún. ¡Agrega la primera!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
