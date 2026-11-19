export const normalize = (text) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

export const sections = {
  "inicio": "/inicio",
  "cotizaciones": "/cotizaciones",
  "facturacion": "/facturacion",
  "trabajos": "/trabajos",
  "trabajos puntuales": "/trabajos",
  "clientes": "/clientes",
  "contrataciones y suscripciones": "/contrataciones",
  "contrataciones": "/contrataciones",
  "catalogo": "/catalogo",
  "gastos operativos": "/gastos",
  "finanzas y pagos": "/finanzas",
  "configuracion": "/configuracion",
  "mas": "/movil/menu",
};

const links = {
  "olvidaste tu contrasena": "/acceso/recuperar",
  "volver a iniciar sesion": "/acceso",
  "volver al inicio de sesion": "/acceso",
  "volver al acceso": "/acceso",
  "nueva cotizacion": "/cotizaciones/editor",
  "duplicar": "/cotizaciones/duplicar",
  "concretar": "/cotizaciones/concretar",
  "concretar cotizacion": "/cotizaciones/concretar",
  "importar desde catalogo": "/cotizaciones/editor/catalogo",
  "generar pdf": "/cotizaciones/generar-pdf",
  "nuevo trabajo": "/trabajos/nuevo",
  "nuevo trabajo puntual": "/trabajos/nuevo",
  "nuevo cliente": "/clientes/nuevo",
  "crear cliente": "/clientes/nuevo",
  "nueva contratacion": "/contrataciones/nueva",
  "renovar": "/contrataciones/renovar",
  "registrar gasto": "/gastos/nuevo",
  "nuevo gasto": "/gastos/nuevo",
  "empresa y formatos": "/configuracion",
  "plantillas": "/configuracion/plantillas/cotizacion",
  "usuarios y permisos": "/configuracion/usuarios",
  "categorias": "/configuracion/categorias",
  "auditoria": "/configuracion/auditoria",
  "ver historial completo": "/configuracion/auditoria",
  "respaldos": "/configuracion/respaldos",
  "metodos de pago": "/configuracion/metodos-pago",
  "agregar metodo": "/configuracion/metodos-pago/editar",
  "crear respaldo": "/configuracion/respaldos/completado",
  "restaurar": "/configuracion/respaldos/restaurar",
  "revelar": "/clientes/credenciales/revelar",
  "agregar credencial": "/clientes/credenciales/editar",
  "nuevo elemento": "/catalogo/compuesto",
  "exportar": "/catalogo/exportar",
  "ver todas las notificaciones": "/notificaciones",
  "cerrar sesion": "/acceso",
};

export const details = {
  cotizaciones: "/cotizaciones/editor",
  facturacion: "/facturacion/detalle",
  trabajos: "/trabajos/detalle",
  clientes: "/clientes/detalle",
  contrataciones: "/contrataciones/detalle",
  catalogo: "/catalogo/compuesto",
  gastos: "/gastos/detalle",
};

const steps = {
  "/cotizaciones/concretar": { continuar: "/cotizaciones/coincidencia-cliente" },
  "/cotizaciones/coincidencia-cliente": { continuar: "/cotizaciones", confirmar: "/cotizaciones" },
  "/cotizaciones/duplicar": { duplicar: "/cotizaciones/editor" },
  "/cotizaciones/generar-pdf": { "generar pdf": "/documentos/cotizacion", generar: "/documentos/cotizacion" },
  "/catalogo": { importar: "/catalogo/importar", archivar: "/catalogo/archivar" },
  "/catalogo/importar": { importar: "/catalogo/importar/resultado", "confirmar importacion": "/catalogo/importar/resultado" },
  "/configuracion/usuarios": { desactivar: "/configuracion/usuarios/desactivar" },
  "/facturacion/detalle": { "registrar pago": "/facturacion/registrar-pago", "ver pdf": "/documentos/factura" },
  "/trabajos/detalle": { "registrar pago": "/trabajos/primer-pago", "marcar como terminado": "/trabajos/finalizar" },
  "/movil/trabajo": { "registrar pago": "/movil/registrar-pago" },
};

export const dismissTo = {
  "/movil/menu": "/inicio",
  "/movil/trabajo": "/trabajos",
  "/movil/registrar-pago": "/trabajos/detalle",
  "/notificaciones": "/inicio",
  "/perfil": "/inicio",
  "/cotizaciones/editor/catalogo": "/cotizaciones/editor",
  "/facturacion/registrar-pago": "/facturacion/detalle",
  "/facturacion/metodos-desplegados": "/facturacion/registrar-pago",
  "/clientes/credenciales/revelar": "/clientes/detalle",
  "/configuracion/respaldos/restaurar": "/configuracion/respaldos",
  "/configuracion/usuarios/desactivar": "/configuracion/usuarios",
};

export function destination(path, label, layer) {
  const key = normalize(label).replace(/^[+＋]\s*/u, "").replace(/[¿?]/g, "");
  const section = path.split("/")[1];
  if (layer?.startsWith("Menú ·")) return sections[normalize(layer.split("·")[1])];
  if (layer?.startsWith("Subsección ·")) {
    if (key === "listado" || key === "resumen" || key === "facturas" || key === "elementos") return "/" + section;
    if (key === "importar") return "/catalogo/importar";
  }
  if (key === "abrir menu") return "/movil/menu";
  if (key === "notificaciones") return "/notificaciones";
  if (key === "menu de perfil") return "/perfil";
  if (key === "modo oscuro" || key === "tema oscuro") return "/inicio/oscuro";
  if (key === "modo claro" || key === "tema claro") return "/inicio";
  if (key === "abrir" || key === "ver detalle") return details[section] ?? "/trabajos/detalle";
  if (key === "ver todos" || key === "ver todas") return section === "inicio" ? "/trabajos" : "/" + section;
  if (key === "cancelar" || key === "cerrar" || key === "volver") return dismissTo[path] ?? (section === "acceso" ? "/acceso" : "/" + section);
  return steps[path]?.[key] ?? links[key] ?? sections[key];
}
