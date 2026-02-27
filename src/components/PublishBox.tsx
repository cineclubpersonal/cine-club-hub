import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Link, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Mode = "link" | "upload" | null;

const PublishBox = ({ onPublished }: { onPublished: () => void }) => {
  const [mode, setMode] = useState<Mode>(null);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [portadaUrl, setPortadaUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setMode(null);
    setTitulo("");
    setDescripcion("");
    setPortadaUrl("");
    setVideoUrl("");
    setFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    let finalVideoUrl = videoUrl;

    if (mode === "upload" && file) {
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("media").upload(path, file);

      if (uploadError) {
        toast.error("Error al subir archivo: " + uploadError.message);
        setSubmitting(false);
        return;
      }

      const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
      finalVideoUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from("peliculas").insert({
      titulo,
      descripcion: descripcion || null,
      portada_url: portadaUrl || null,
      video_url: finalVideoUrl,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("¡Publicado!");
      reset();
      onPublished();
    }
    setSubmitting(false);
  };

  if (!mode) {
    return (
      <div className="bg-card border border-border rounded-lg p-5 animate-fade-in">
        <p className="text-sm text-muted-foreground mb-3">Publicar nuevo contenido</p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setMode("upload")}>
            <Upload className="h-4 w-4 mr-2" />
            Subir archivo
          </Button>
          <Button variant="secondary" className="flex-1" onClick={() => setMode("link")}>
            <Link className="h-4 w-4 mr-2" />
            Pegar enlace
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-foreground flex items-center gap-2">
          {mode === "upload" ? <Upload className="h-4 w-4 text-primary" /> : <Link className="h-4 w-4 text-primary" />}
          {mode === "upload" ? "Subir archivo" : "Enlace externo"}
        </p>
        <button onClick={reset} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Input placeholder="Título *" value={titulo} onChange={(e) => setTitulo(e.target.value)} required className="bg-secondary border-border" />
        <Textarea placeholder="Descripción (opcional)" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="bg-secondary border-border resize-none" rows={2} />
        <Input placeholder="URL de portada (opcional)" value={portadaUrl} onChange={(e) => setPortadaUrl(e.target.value)} className="bg-secondary border-border" />

        {mode === "link" ? (
          <Input placeholder="URL del video (YouTube, Vimeo, Drive, etc.) *" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} required className="bg-secondary border-border" />
        ) : (
          <div>
            <input ref={fileInputRef} type="file" accept="video/*,audio/*" onChange={handleFileChange} className="hidden" />
            <Button type="button" variant="outline" className="w-full border-dashed" onClick={() => fileInputRef.current?.click()}>
              {file ? <span className="truncate">{file.name}</span> : <><Upload className="h-4 w-4 mr-2" />Seleccionar archivo de video</>}
            </Button>
            {mode === "upload" && !file && <p className="text-xs text-muted-foreground mt-1">Formatos: MP4, WebM, MOV, etc.</p>}
          </div>
        )}

        <Button type="submit" disabled={submitting || (mode === "upload" && !file)} className="w-full">
          {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          {submitting ? "Publicando..." : "Publicar"}
        </Button>
      </form>
    </div>
  );
};

export default PublishBox;
