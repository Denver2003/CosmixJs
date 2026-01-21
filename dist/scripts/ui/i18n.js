const STORAGE_KEY = "cosmix.lang";
const DEFAULT_LANGUAGE = "en";
const SUPPORTED_LANGUAGES = ["en", "ru"];
const listeners = new Set();

const STRINGS = {
  en: {
    "app.title": "COSMIX",
    "app.page_title": "Falling Blocks: Physics Puzzle",
    "user.guest": "Guest",
    "nav.back": "BACK",
    "nav.home": "HOME",
    "nav.shop": "SHOP",
    "nav.leaders": "LEADERS",
    "nav.settings": "SETTINGS",
    "nav.leaderboards": "LEADERBOARDS",
    "nav.play": "PLAY",
    "home.subtitle": "Tap • Stack • Combo",
    "home.subtitle_alt": "Tap bubbles • Make combos",
    "label.best": "Best",
    "label.coins": "Coins",
    "label.audio": "Audio",
    "label.audio_caps": "AUDIO",
    "label.music": "Music",
    "label.music_caps": "MUSIC",
    "label.sfx": "SFX",
    "label.sfx_caps": "SFX",
    "label.mute": "Mute",
    "label.mute_caps": "MUTE",
    "label.status": "Status",
    "label.login": "Login",
    "label.account": "Account",
    "label.data": "Data",
    "label.reset_progress": "Reset progress",
    "label.restore_purchases": "Restore purchases",
    "label.reset_tutorial": "Reset tutorial",
    "label.language": "Language",
    "label.refresh": "Refresh",
    "label.all_time": "ALL-TIME",
    "label.weekly": "WEEKLY",
    "label.all_time_title": "All-time",
    "label.week_01": "Week #01",
    "label.watch_ad": "Watch Ad",
    "label.remove_ads": "Remove Ads",
    "label.coins_pack": "Coins Pack",
    "label.skippers_pack": "30 Skippers",
    "label.skippers": "Skippers",
    "label.all_ads": "All ads",
    "label.continue_skipper": "Continue (1 skipper)",
    "label.coins_amount": "{amount} coins",
    "label.consumable": "Consumable",
    "label.owned": "Owned",
    "label.owned_prefix": "Owned: {count}",
    "label.reward_meta": "+{reward} coins",
    "label.reward_owned": "{count}/{limit} this hour",
    "label.bonus_drop": "Bonus Drop Chance",
    "label.bonus_upgrades": "Bonus Upgrades",
    "label.coin_multiplier": "Coin Multiplier",
    "label.score_multiplier": "Score Multiplier",
    "label.level": "Level {level}",
    "label.next": "Next",
    "label.no_more_continues": "No more continues",
    "button.watch_ad_reward": "WATCH AD +{reward}",
    "button.try_later": "TRY LATER",
    "button.buy": "BUY {price}",
    "button.buy_currency": "BUY {price} YAN",
    "button.buy_price": "BUY {price}",
    "button.buy_now": "BUY",
    "button.upgrade": "UPGRADE {price}",
    "button.open": "OPEN",
    "button.max": "MAX",
    "button.owned": "OWNED",
    "button.login": "LOGIN",
    "button.reset": "RESET",
    "button.restore": "RESTORE",
    "button.resume": "RESUME",
    "button.restart": "RESTART",
    "button.retry": "RETRY",
    "button.home": "HOME",
    "button.shop": "SHOP",
    "button.continue_ad": "Continue (watch ad)",
    "button.cancel": "CANCEL",
    "button.confirm": "CONFIRM",
    "pause.title": "PAUSED",
    "pause.auto": "PAUSED (AUTO)",
    "pause.resuming_in": "RESUMING IN {seconds}",
    "game_over.title": "GAME OVER",
    "confirm.title": "Confirm",
    "confirm.reset_title": "Reset progress?",
    "confirm.reset_body": "This will clear local progress.",
    "confirm.reset_tutorial_title": "Reset tutorial?",
    "confirm.reset_tutorial_body": "The tutorial will show again on a new game.",
    "loading": "Loading…",
    "shop.title": "SHOP",
    "settings.title": "SETTINGS",
    "leaderboards.title": "LEADERBOARDS",
    "shop.section.upgrades": "UPGRADES",
    "shop.section.bonuses": "BONUSES",
    "shop.section.inapps": "IN-APP",
    "shop.section.ads": "ADS",
    "shop.tab.upgrades": "UPGRADES",
    "shop.tab.items": "ITEMS",
    "item.touch": "Touch to Kill",
    "item.gun": "Machine Gun",
    "bonus_upgrade.level_0": "Base",
    "bonus_upgrade.level_1": "Instant 15%",
    "bonus_upgrade.level_2": "Instant 20%",
    "bonus_upgrade.level_3": "Grenade 40%",
    "bonus_upgrade.level_4": "Bubble on drop 5%",
    "bonus_upgrade.level_5": "Cooldown 2 min",
    "bonus_upgrade.level_6": "Instant always in bubble",
    "bonus_upgrade.level_7": "Consumables x5 no limit",
    "tutorial.controls": "Hold LMB and move left/right,\nor use [A] / [D]\nor [←] / [→].\nRelease LMB or press [S] / [↓] to drop.",
    "tutorial.controls_touch": "Hold and drag\nleft/right,\nmove the piece,\nrelease to drop it.",
    "tutorial.praise_controls": "Nice, you're doing great.",
    "tutorial.bubble": "Click the bubble\nor press [W] / [↑]\nto get a bonus.",
    "tutorial.bubble_touch": "Tap the bubble\nto get\na bonus.",
    "tutorial.praise_bubble": "Great! You can pop bubbles! Enjoy.",
  },
  ru: {
    "app.title": "COSMIX",
    "app.page_title": "Падающие Блоки: Физическая Головоломка",
    "user.guest": "Гость",
    "nav.back": "НАЗАД",
    "nav.home": "ГЛАВНАЯ",
    "nav.shop": "МАГАЗИН",
    "nav.leaders": "ЛИДЕРЫ",
    "nav.settings": "НАСТРОЙКИ",
    "nav.leaderboards": "ЛИДЕРБОРДЫ",
    "nav.play": "ИГРАТЬ",
    "home.subtitle": "Тап • Стакай • Комбо",
    "home.subtitle_alt": "Тапай пузыри • Делай комбо",
    "label.best": "Рекорд",
    "label.coins": "Монеты",
    "label.audio": "Аудио",
    "label.audio_caps": "АУДИО",
    "label.music": "Музыка",
    "label.music_caps": "МУЗЫКА",
    "label.sfx": "Эффекты",
    "label.sfx_caps": "ЭФФЕКТЫ",
    "label.mute": "Без звука",
    "label.mute_caps": "БЕЗ ЗВУКА",
    "label.status": "Статус",
    "label.login": "Войти",
    "label.account": "Аккаунт",
    "label.data": "Данные",
    "label.reset_progress": "Сброс прогресса",
    "label.restore_purchases": "Восстановить покупки",
    "label.reset_tutorial": "Сбросить обучение",
    "label.language": "Язык",
    "label.refresh": "Обновить",
    "label.all_time": "ВСЁ ВРЕМЯ",
    "label.weekly": "НЕДЕЛЯ",
    "label.all_time_title": "Все время",
    "label.week_01": "Неделя #01",
    "label.watch_ad": "Смотреть рекламу",
    "label.remove_ads": "Убрать рекламу",
    "label.coins_pack": "Пак монет",
    "label.skippers_pack": "30 скипперсов",
    "label.skippers": "Скипперсы",
    "label.all_ads": "Все объявления",
    "label.continue_skipper": "Продолжить за 1 скипперс",
    "label.coins_amount": "{amount} монет",
    "label.consumable": "Расходуемое",
    "label.owned": "Куплено",
    "label.owned_prefix": "В наличии: {count}",
    "label.reward_meta": "+{reward} монет",
    "label.reward_owned": "{count}/{limit} за час",
    "label.bonus_drop": "Шанс бонусов",
    "label.bonus_upgrades": "Улучшения бонусов",
    "label.coin_multiplier": "Множитель монет",
    "label.score_multiplier": "Множитель очков",
    "label.level": "Уровень {level}",
    "label.next": "Далее",
    "label.no_more_continues": "Продолжения закончились",
    "button.watch_ad_reward": "РЕКЛАМА +{reward}",
    "button.try_later": "ПОЗЖЕ",
    "button.buy": "КУПИТЬ {price}",
    "button.buy_currency": "КУПИТЬ {price} YAN",
    "button.buy_price": "КУПИТЬ {price}",
    "button.buy_now": "КУПИТЬ",
    "button.upgrade": "УЛУЧШИТЬ {price}",
    "button.open": "ОТКРЫТЬ",
    "button.max": "МАКС",
    "button.owned": "КУПЛЕНО",
    "button.login": "ВОЙТИ",
    "button.reset": "СБРОС",
    "button.restore": "ВОССТАНОВИТЬ",
    "button.resume": "ПРОДОЛЖИТЬ",
    "button.restart": "ЗАНОВО",
    "button.retry": "ЕЩЁ РАЗ",
    "button.home": "ГЛАВНАЯ",
    "button.shop": "МАГАЗИН",
    "button.continue_ad": "Продолжить (реклама)",
    "button.cancel": "ОТМЕНА",
    "button.confirm": "ПОДТВЕРДИТЬ",
    "pause.title": "ПАУЗА",
    "pause.auto": "ПАУЗА (АВТО)",
    "pause.resuming_in": "ВОЗОБНОВЛЕНИЕ ЧЕРЕЗ {seconds}",
    "game_over.title": "КОНЕЦ ИГРЫ",
    "confirm.title": "Подтверждение",
    "confirm.reset_title": "Сбросить прогресс?",
    "confirm.reset_body": "Это очистит локальный прогресс.",
    "confirm.reset_tutorial_title": "Сбросить обучение?",
    "confirm.reset_tutorial_body": "Обучение снова покажется при новой игре.",
    "loading": "Загрузка…",
    "shop.title": "МАГАЗИН",
    "settings.title": "НАСТРОЙКИ",
    "leaderboards.title": "ЛИДЕРБОРДЫ",
    "shop.section.upgrades": "УЛУЧШЕНИЯ",
    "shop.section.bonuses": "БОНУСЫ",
    "shop.section.inapps": "ПОКУПКИ",
    "shop.section.ads": "РЕКЛАМА",
    "shop.tab.upgrades": "УЛУЧШЕНИЯ",
    "shop.tab.items": "ПРЕДМЕТЫ",
    "item.touch": "Уничтожение по тапу",
    "item.gun": "Пулемет",
    "bonus_upgrade.level_0": "База",
    "bonus_upgrade.level_1": "Мгновенные 15%",
    "bonus_upgrade.level_2": "Мгновенные 20%",
    "bonus_upgrade.level_3": "Граната 40%",
    "bonus_upgrade.level_4": "Пузыри при дропе 5%",
    "bonus_upgrade.level_5": "Кулдаун 2 мин",
    "bonus_upgrade.level_6": "Мгновенные всегда в пузыре",
    "bonus_upgrade.level_7": "Расходники x5 без лимита",
    "tutorial.controls": "Зажми ЛКМ и двигай мышью\nвлево/вправо, или [A] / [D]\nили [←] / [→].\nОтпусти ЛКМ или нажми [S] / [↓], чтобы сбросить фигуру.",
    "tutorial.controls_touch": "Зажми и веди\nвлево/вправо,\nдвигай фигуру,\nотпусти, чтобы сбросить.",
    "tutorial.praise_controls": "Молодец, у тебя получается.",
    "tutorial.bubble": "Нажми ЛКМ на пузырь\nили [W] / [↑],\nчтобы получить бонус.",
    "tutorial.bubble_touch": "Нажми на пузырь,\nчтобы получить\nбонус.",
    "tutorial.praise_bubble": "Молодец! Ты умеешь лопать пузыри! Наслаждайся.",
  },
};

let currentLanguage = resolveInitialLanguage();

export function getLanguage() {
  return currentLanguage;
}

export function getSupportedLanguages() {
  return [...SUPPORTED_LANGUAGES];
}

export function setLanguage(nextLanguage) {
  const normalized = normalizeLanguage(nextLanguage);
  if (normalized === currentLanguage) {
    return currentLanguage;
  }
  currentLanguage = normalized;
  persistLanguage(currentLanguage);
  for (const listener of listeners) {
    listener(currentLanguage);
  }
  return currentLanguage;
}

export function subscribeLanguage(listener) {
  if (typeof listener !== "function") {
    return () => {};
  }
  listeners.add(listener);
  listener(currentLanguage);
  return () => {
    listeners.delete(listener);
  };
}

export function t(key, params = {}) {
  const langTable = STRINGS[currentLanguage] || STRINGS[DEFAULT_LANGUAGE];
  const fallbackTable = STRINGS[DEFAULT_LANGUAGE] || {};
  let value = langTable?.[key] ?? fallbackTable[key];
  if (value === undefined || value === null) {
    return key;
  }
  return interpolate(value, params);
}

function interpolate(text, params) {
  if (!params) {
    return text;
  }
  return String(text).replace(/\{(\w+)\}/g, (match, token) => {
    if (Object.prototype.hasOwnProperty.call(params, token)) {
      return String(params[token]);
    }
    return match;
  });
}

function normalizeLanguage(value) {
  if (!value) {
    return DEFAULT_LANGUAGE;
  }
  const lowered = String(value).toLowerCase();
  if (SUPPORTED_LANGUAGES.includes(lowered)) {
    return lowered;
  }
  if (lowered.startsWith("ru")) {
    return "ru";
  }
  if (lowered.startsWith("en")) {
    return "en";
  }
  return DEFAULT_LANGUAGE;
}

function resolveInitialLanguage() {
  if (typeof window === "undefined") {
    return DEFAULT_LANGUAGE;
  }
  try {
    const stored = window.localStorage?.getItem(STORAGE_KEY);
    if (stored) {
      return normalizeLanguage(stored);
    }
  } catch (error) {
    return DEFAULT_LANGUAGE;
  }
  return DEFAULT_LANGUAGE;
}

function persistLanguage(language) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage?.setItem(STORAGE_KEY, language);
  } catch (error) {
    return;
  }
}
