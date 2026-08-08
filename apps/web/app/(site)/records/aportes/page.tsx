import { redirect } from "next/navigation";

/**
 * Cargar plata vivía acá, en una página aparte del panel. La separación buscaba
 * transmitir que la operación es sensible, pero el único acceso era un link
 * chico enterrado en la barra de estado del panel: en la práctica no se llegaba.
 *
 * La fricción que importa vive en `AporteForm` — revisar el reparto completo y
 * re-tipear el monto — y esa se conserva dentro del panel. La ruta queda como
 * redirect para no romper links ni marcadores.
 */
export default function AportesPage() {
  redirect("/records/panel");
}
