export function formatCurrency(value: number, options?: { decimals?: number }): string {
  const decimals = options?.decimals ?? (Number.isInteger(value) ? 0 : 2);
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}
