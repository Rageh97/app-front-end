export const NL_EURO = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPrice(price: number) {
  return NL_EURO.format(price);
}
