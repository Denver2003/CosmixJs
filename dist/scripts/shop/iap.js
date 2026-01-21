import { getSdk, initSdk } from "../sdk/index.js";
import { getAppState, setAppState } from "../shell/app_state.js";
import {
  addPurchaseToken,
  loadBonusInventory,
  loadCoins,
  loadPurchaseTokens,
  loadSkippers,
  saveCoins,
  saveSkippers,
} from "../game/storage.js";
import { buildCloudPayload } from "../cloud/state.js";
import { queueCloudSave } from "../cloud/index.js";
import { getShopProgress, updateShopProgress } from "./progression.js";
import { IAP_PRODUCTS, getIapProductById, getIapProductByKey } from "./iap_config.js";

let catalogPromise = null;

export function ensureIapCatalog() {
  const state = getAppState();
  if (state.sdkName !== "yandex") {
    return;
  }
  if (state.iap?.loading || (state.iap?.items?.length || 0) > 0) {
    return;
  }
  catalogPromise = loadIapCatalog();
}

export async function loadIapCatalog() {
  if (catalogPromise) {
    return catalogPromise;
  }
  catalogPromise = (async () => {
    await initSdk();
    const sdk = getSdk();
    if (!sdk?.payments?.isAvailable?.()) {
      setAppState({
        iap: {
          items: [],
          loading: false,
          updatedAt: Date.now(),
        },
      });
      return [];
    }
    setAppState({
      iap: {
        items: [],
        loading: true,
        updatedAt: Date.now(),
      },
    });
    const catalog = await sdk.payments.getCatalog();
    const mapped = mapCatalogToItems(catalog);
    setAppState({
      iap: {
        items: mapped,
        loading: false,
        updatedAt: Date.now(),
      },
    });
    return mapped;
  })();
  return catalogPromise;
}

export async function syncIapPurchases() {
  await initSdk();
  const sdk = getSdk();
  if (!sdk?.payments?.isAvailable?.()) {
    return [];
  }
  const purchases = await sdk.payments.getPurchases();
  if (!Array.isArray(purchases) || purchases.length === 0) {
    return [];
  }
  const processed = loadPurchaseTokens();
  const processedSet = new Set(processed);
  const results = [];
  for (const purchase of purchases) {
    const result = await processPurchase(purchase, processedSet);
    if (result) {
      results.push(result);
    }
  }
  return results;
}

export async function purchaseIapItem(itemId) {
  if (!itemId) {
    return false;
  }
  await initSdk();
  const sdk = getSdk();
  if (!sdk?.payments?.isAvailable?.()) {
    return false;
  }
  const config = getIapProductByKey(itemId);
  if (!config) {
    return false;
  }
  const purchase = await sdk.payments.purchase(config.productId);
  if (!purchase) {
    return false;
  }
  const processed = loadPurchaseTokens();
  const processedSet = new Set(processed);
  const result = await processPurchase(purchase, processedSet);
  return Boolean(result);
}

function mapCatalogToItems(catalog) {
  if (!Array.isArray(catalog)) {
    return [];
  }
  const byId = new Map();
  for (const item of catalog) {
    const id = item?.id;
    if (!id) {
      continue;
    }
    byId.set(String(id), item);
  }
  const items = [];
  for (const config of IAP_PRODUCTS) {
    const product = byId.get(config.productId);
    if (!product) {
      continue;
    }
    items.push({
      id: config.id,
      productId: config.productId,
      title: product.title || "",
      description: product.description || "",
      price: product.price || "",
      priceValue: product.priceValue || "",
      priceCurrencyCode: product.priceCurrencyCode || "",
      type: config.type,
      grant: config.grant,
    });
  }
  return items;
}

async function processPurchase(purchase, processedSet) {
  if (!purchase) {
    return null;
  }
  const productId = purchase.productID || purchase.productId;
  const token = purchase.purchaseToken;
  if (!productId || !token) {
    return null;
  }
  const config = getIapProductById(String(productId));
  if (!config) {
    return null;
  }
  const alreadyProcessed = processedSet.has(token);
  if (config.type === "entitlement") {
    applyEntitlement(config);
  } else {
    if (!alreadyProcessed) {
      applyConsumable(config);
      processedSet.add(token);
      addPurchaseToken(token);
    }
  }
  if (config.type === "consumable") {
    const sdk = getSdk();
    await sdk.payments.consumePurchase(token);
  }
  queueCloudSave(buildCloudPayload());
  return { productId, token };
}

function applyEntitlement(config) {
  if (!config?.grant?.key) {
    return;
  }
  if (config.grant.key === "remove_ads") {
    const progress = getShopProgress();
    if (!progress.removeAds) {
      updateShopProgress({ removeAds: true, upgrades: progress.upgrades });
      applyShopStateToGame();
    }
  }
}

function applyConsumable(config) {
  const key = config?.grant?.key;
  const amount = Math.max(0, Math.floor(config?.grant?.amount || 0));
  if (!key || !amount) {
    return;
  }
  if (key === "coins") {
    const next = loadCoins() + amount;
    saveCoins(next);
    setAppState({ coins: next });
    applyShopStateToGame();
    return;
  }
  if (key === "skippers") {
    const next = loadSkippers() + amount;
    saveSkippers(next);
    setAppState({ skippers: next });
    applyShopStateToGame();
  }
}

function applyShopStateToGame() {
  if (typeof window === "undefined") {
    return;
  }
  const progress = getShopProgress();
  const coins = loadCoins();
  const inventory = loadBonusInventory();
  if (typeof window.__applyShopState === "function") {
    window.__applyShopState({ coins, progress, inventory });
  }
}
