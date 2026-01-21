export function formatNumber(value) {
  if (value === null || value === undefined) {
    return "0";
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return String(value);
  }
  const sign = numeric < 0 ? "-" : "";
  const abs = Math.floor(Math.abs(numeric));
  return `${sign}${abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")}`;
}
