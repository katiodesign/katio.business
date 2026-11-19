import { PageHeader } from "@/components/app-chrome";
import Link from "next/link";
import {requirePermission} from "@/lib/access";
import ImportForm from "./import-form";
export default async function ImportCatalog(){await requirePermission("catalog.create");await requirePermission("catalog.update");await requirePermission("finance.read");return <><PageHeader><div><small>Inicio / Catálogo / Importar</small><h1>Importar catálogo</h1></div></PageHeader><div className="card form-card"><p>Selecciona un CSV o XLSX de hasta 500 filas. Revisa altas, actualizaciones y errores antes de confirmar.</p><p style={{marginTop:12}}><a href="/api/catalogo/exportar?format=xlsx">Descargar plantilla XLSX actual</a></p><ImportForm/></div><p style={{marginTop:16}}><Link href="/catalogo">← Volver</Link></p></>}
