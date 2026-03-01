import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Link, X, Loader2, CheckCircle2, Film } from "lucide-react";
import { toast } from "sonner";
import Uppy from "@uppy/core";
import AwsS3Multipart from "@uppy/aws-s3";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";

type Mode = "link" | "upload" | null;

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const EDGE_FN_URL = `${SUPABASE_URL}/functions/v1/s3-multipart`;

const PublishBox = ({ onPublished }: { onPublished: () => void }) => {
  const [mode, setMode] = useState<Mode>(null);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [portadaUrl, setPortadaUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Upload state
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uppyRef = useRef<Uppy | null>(null);

  // Initialize Uppy once
  useEffect(() => {
    async function edgeFetch(action: string, body: Record<string, unknown>) {
      const res = await fetch(`${EDGE_FN_URL}?action=${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }

    const uppy = new Uppy({
      restrictions: {
        maxNumberOfFiles: 1,
        allowedFileTypes: ["video/*", "audio/*"],
      },
      autoProceed: true,
    });

    uppy.use(AwsS3Multipart, {
      shouldUseMultipart: true,
      createMultipartUpload: async (file) => {
        const { key, uploadId } = await edgeFetch("createMultipartUpload", {
          filename: file.name || "video.mp4",
          contentType: file.type || "video/mp4",
        });
        return { key, uploadId };
      },
      listParts: async (_file, { key, uploadId }) => {
        const { parts } = await edgeFetch("listParts", { key, uploadId });
        return parts;
      },
      signPart: async (_file, { key, uploadId, partNumber }) => {
        const { url } = await edgeFetch("signPart", { key, uploadId, partNumber });
        return { url };
      },
      completeMultipartUpload: async (_file, { key, uploadId, parts }) => {
        const { location } = await edgeFetch("completeMultipartUpload", { key, uploadId, parts });
        return { location };
      },
      abortMultipartUpload: async (_file, { key, uploadId }) => {
        await edgeFetch("abortMultipartUpload", { key, uploadId });
      },
    } as any);

    uppy.on("file-added", (file) => {
      setSelectedFileName(file.name || "archivo");
      setUploading(true);
      setUploadProgress(0);
      setUploadedUrl(null);
    });

    uppy.on("progress", (progress) => {
      setUploadProgress(progress ?? 0);
    });

    uppy.on("upload-success", (file) => {
      if (file) {
        const key = (file as any).s3Multipart?.key || (file.meta as any).key;
        // Build public S3 URL from the key
        const publicUrl = key
          ? `https://${import.meta.env.VITE_S3_BUCKET_DOMAIN || "s3.amazonaws.com"}/${key}`
          : (file.response as any)?.uploadURL || "";
        setUploadedUrl(publicUrl);
        setUploading(false);
        setUploadProgress(100);
        toast.success("Archivo subido correctamente a S3");
      }
    });

    uppy.on("upload-error", (_file, error) => {
      setUploading(false);
      toast.error("Error al subir: " + (error?.message || "Error desconocido"));
    });

    uppyRef.current = uppy;

    return () => {
      uppy.cancelAll();
      uppy.logout();
    };
  }, []);

  const reset = useCallback(() => {
    setMode(null);
    setTitulo("");
    setDescripcion("");
    setPortadaUrl("");
    setVideoUrl("");
    setUploadProgress(0);
    setUploadedUrl(null);
    setUploading(false);
    setSelectedFileName(null);
    uppyRef.current?.cancelAll();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uppyRef.current) return;

    // Clear previous files
    uppyRef.current.cancelAll();

    try {
      uppyRef.current.addFile({
        name: file.name,
        type: file.type,
        data: file,
        source: "local",
      });
    } catch (err: any) {
      toast.error(err.message || "No se pudo agregar el archivo");
    }

    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const finalVideoUrl = mode === "upload" ? uploadedUrl : videoUrl;

    if (!finalVideoUrl) {
      toast.error("Falta la URL del video");
      setSubmitting(false);
      return;
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

  // ── Mode selector ──
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

  // ── Form ──
  return (
    <div className="bg-card border border-border rounded-lg p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-foreground flex items-center gap-2">
          {mode === "upload" ? <Upload className="h-4 w-4 text-primary" /> : <Link className="h-4 w-4 text-primary" />}
          {mode === "upload" ? "Subir archivo (reanudable)" : "Enlace externo"}
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
          <div className="space-y-2">
            <input ref={fileInputRef} type="file" accept="video/*,audio/*" onChange={handleFileSelect} className="hidden" />

            {/* Upload zone */}
            {!uploadedUrl && !uploading && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center gap-3 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-all"
              >
                <Film className="h-10 w-10 text-primary/60" />
                <span className="text-sm font-medium">Arrastra o selecciona un archivo de video</span>
                <span className="text-xs text-muted-foreground/70">Soporta archivos grandes (GB) con subida reanudable</span>
              </button>
            )}

            {/* Uploading progress */}
            {uploading && (
              <div className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground font-medium truncate">{selectedFileName}</p>
                    <p className="text-xs text-muted-foreground">Subiendo… {uploadProgress}%</p>
                  </div>
                </div>
                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground/70">
                  La subida es reanudable. Si se interrumpe, vuelve a seleccionar el mismo archivo.
                </p>
              </div>
            )}

            {/* Upload complete */}
            {uploadedUrl && !uploading && (
              <div className="border border-primary/30 bg-primary/5 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground font-medium truncate">{selectedFileName}</p>
                  <p className="text-xs text-muted-foreground">Subido correctamente</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUploadedUrl(null);
                    setSelectedFileName(null);
                    setUploadProgress(0);
                    uppyRef.current?.cancelAll();
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

        <Button
          type="submit"
          disabled={submitting || (mode === "upload" && !uploadedUrl) || uploading}
          className="w-full"
        >
          {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          {submitting ? "Publicando..." : "Publicar"}
        </Button>
      </form>
    </div>
  );
};

export default PublishBox;
