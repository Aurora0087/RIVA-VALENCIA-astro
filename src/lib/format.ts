/** Pure formatting utilities — safe to import in client-side React components. */

export function formatPrice(amount: string, currencyCode: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(parseFloat(amount));
}

export function isOnSale(
  priceAmount: string,
  compareAtAmount: string
): boolean {
  const price     = parseFloat(priceAmount);
  const compareAt = parseFloat(compareAtAmount);
  return compareAt > 0 && compareAt > price;
}
