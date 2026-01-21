export const IAP_PRODUCTS = [
  {
    id: "remove_ads",
    productId: "66601",
    type: "entitlement",
    grant: { key: "remove_ads" },
  },
  {
    id: "coins_500",
    productId: "666500",
    type: "consumable",
    grant: { key: "coins", amount: 500 },
  },
  {
    id: "skippers_30",
    productId: "66602",
    type: "consumable",
    grant: { key: "skippers", amount: 30 },
  },
];

export function getIapProductById(productId) {
  if (!productId) {
    return null;
  }
  return IAP_PRODUCTS.find((item) => item.productId === productId) || null;
}

export function getIapProductByKey(id) {
  if (!id) {
    return null;
  }
  return IAP_PRODUCTS.find((item) => item.id === id) || null;
}
