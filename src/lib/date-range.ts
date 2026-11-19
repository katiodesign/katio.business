export function bogotaRange(from: string | undefined, to: string | undefined) {
  const parse = (value: string | undefined) => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
    const date = new Date(`${value}T00:00:00-05:00`);
    return !Number.isNaN(date.getTime()) && new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit" }).format(date) === value ? date : undefined;
  };
  const start = parse(from), end = parse(to);
  if (end) end.setUTCDate(end.getUTCDate() + 1);
  return start || end ? { ...(start ? { gte: start } : {}), ...(end ? { lt: end } : {}) } : undefined;
}
