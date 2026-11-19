export function safeDestination(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\r\n]/.test(value)) return "/inicio";
  const url = new URL(value, "http://localhost");
  if (url.pathname.startsWith("/acceso") || url.pathname.startsWith("/api")) return "/inicio";
  return `${url.pathname}${url.search}${url.hash}`;
}
