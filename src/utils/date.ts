export function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(value);
}

export function isoDate(value: Date): string {
  return value.toISOString();
}
