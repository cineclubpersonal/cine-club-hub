import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Film } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: ruta no encontrada:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4 text-center px-4">
      <Film className="h-12 w-12 text-primary/60" />
      <h1 className="text-9xl font-display text-foreground/80">404</h1>
      <p className="text-muted-foreground text-lg">Página no encontrada</p>
      <a href="/" className="text-sm text-primary hover:underline mt-2">
        Volver al inicio
      </a>
    </div>
  );
};

export default NotFound;
