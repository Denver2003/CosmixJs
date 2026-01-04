# ADS_AND_REWARDS_SPEC — Cosmix (Yandex Games)

Спецификация монетизации и rewarded-механик для **Yandex Games**:  
- Rewarded Continue (3 попытки на run)  
- Interstitial (по cooldown, показывается при Retry)  
- Rewarded Shop Coins (лимит 5 раз в час, награда скейлится от прогресса)

---

## 0) Термины

- **Session** — одна игровая попытка от Start до GameOver (включая Continue).
- **Run** — серия одной попытки с возможностью Continue через rewarded (макс 3 Continue).
- **Interstitial** — реклама без награды.
- **Rewarded** — реклама за награду.

---

## 1) Rewarded Continue (3 попытки на Run)

### 1.1 Показ Continue
На экране **Game Over** показываем кнопку:

**`Continue (watch ad)`**, если:
- `continueCount < 3`
- SDK готов
- не показывается другая реклама

**continueCount** начинается с 0 при старте Run и увеличивается только после успешного rewarded.

---

### 1.2 Эффект Continue (после успешной рекламы)

Проценты очистки фигур:
- `continueCount == 0` → удалить **70%**
- `continueCount == 1` → удалить **50%**
- `continueCount == 2` → удалить **30%**
- `continueCount >= 3` → Continue больше не предлагаем

---

### 1.3 “Щит” после Continue (reset danger line)
После успешного continue:

- `DangerLineTimer.Reset()`:
  - сбросить состояние опасности
  - сбросить накопленный таймер контакта
  - скрыть countdown UI
  - остановить danger SFX
- Включить grace период:
  - `dangerGraceSeconds = 2.5`
  - во время grace DangerLineTimer игнорирует контакты (даёт физике стабилизироваться)

---

### 1.4 Алгоритм удаления фигур (рекомендуемый)
Удаляем фигуры в стиле игры — **цепочками**.

**Steps:**
1) `allShapes = ShapeRegistry.getAllInGlass()`
2) `groups = ChainFinder.findColorTouchGroups(allShapes)`
3) Отсортировать `groups` по размеру (desc)
4) `target = round(allShapes.length * percent)`
5) Удалять группы целиком, пока `removedCount < target`
6) Для каждой удаляемой группы:
   - VFX burst
   - SFX collapse
   - удалить bodies из Matter
7) Во время удаления:
   - freeze input на 0.4s
   - приостановить spawn новых фигур на 0.7–1.0s (опционально)

**Fallback:** если цепочек нет — удаляем рандомные фигуры по `target`.

---

### 1.5 UX правила
- Continue кнопка — самая заметная на GameOver.
- После 3-го Continue:
  - Continue скрывается
  - можно показать текст: `No more continues this run`.

---

## 2) Interstitial Ads (только на Retry)

### 2.1 Поведение
- Interstitial **никогда** не показывать сразу на GameOver.
- Показывать **только** после нажатия Retry:
  - `Retry → (Interstitial?) → Start New Session`

---

### 2.2 Ограничения
Требования:
- cooldown: **3 минуты** (180 сек)
- **не показывать первые 3 сессии**

**Условия показа Interstitial при Retry:**
- `sessionCount >= 3`
- `now - lastInterstitialAt >= 180s`
- `sdkReady`
- `notShowingAd`

Если условие не выполнено — стартуем игру без рекламы.

---

### 2.3 Edge cases
- Если interstitial fail/cancel → всё равно стартуем игру.
- Если SDK не готов → стартуем игру.

---

## 3) Rewarded Shop Coins (лимит 5 раз в час)

### 3.1 UI кнопка
В магазине:
**`Watch Ad → +X coins`**

где X считается по формуле ниже.

---

### 3.2 Лимит 5 раз в час (rolling window)
- `rewardedShopLimitPerHour = 5`
- rolling window: последние 60 минут

Храним:
- `rewardedShopWatchTimes[]` — массив timestamps

При проверке:
- очищаем записи старше 60 минут
- `count = rewardedShopWatchTimes.length`
- если `count >= 5` → кнопка disabled + текст `Try later`

Показываем прогресс:
- `3/5 this hour`

---

### 3.3 Формула награды (скейл от прогресса)
Данные:
- `totalSpentCoins` — сколько всего потрачено (накопительно)
- `MoneyCoef` — коэффициент монет из апгрейдов (пример: 1.0…3.0)

**Формула:**
`RewardCoins = round((100 + sqrt(totalSpentCoins) * 1.2) * (0.75 + 0.25 * MoneyCoef))`

---

### 3.4 Ограничения (anti-exploit)
Рекомендуется:
- минимальный cooldown между shop rewarded: **2 минуты** (опционально)
- сохранять прогресс после награды (cloud/local)

---

## 4) Persistence (сохранение данных)

### 4.1 Нужно сохранять
- `sessionCount`
- `lastInterstitialAt`
- `rewardedShopWatchTimes[]`
- `totalSpentCoins`
- `MoneyCoef`
- `coins`
- `upgrades` / `inventory`

### 4.2 Runtime only (не обязательно в cloud)
- `continueCount` (сбрасывается на новый run)

---

## 5) Псевдокод (готово под внедрение)

### 5.1 Retry Press Handler
```js
async function onRetryPressed() {
  if (shouldShowInterstitial()) {
    await showInterstitialSafe(); // fail-safe
    lastInterstitialAt = Date.now();
  }
  startNewSession(); // always
}
```

### 5.2 Continue Press Handler
```js
async function onContinuePressed() {
  if (continueCount >= 3) return;

  const ok = await showRewardedSafe();
  if (!ok) return;

  const percent = [0.70, 0.50, 0.30][continueCount];
  continueCount++;

  applyContinueCleanup(percent);
  dangerTimer.resetAndGrace(2.5);

  resumeFromGameOver();
}
```

### 5.3 Shop Reward Handler
```js
async function onShopRewardPressed() {
  if (!canWatchShopRewarded()) return;

  const ok = await showRewardedSafe();
  if (!ok) return;

  const reward = calcShopRewardCoins(totalSpentCoins, moneyCoef);
  coins += reward;

  rewardedShopWatchTimes.push(Date.now());
  saveProgress();
}
```

---

## 6) Требования к Yandex SDK wrapper (минимум)

Нужны безопасные обёртки:
- `showInterstitialSafe()`
- `showRewardedSafe()`

И глобальная защита:
- `notShowingAd` / `adLock`

Обработка onOpen / onClose / onError:
- game pause on ad open
- resume on close
- ошибки не ломают flow

---

**Конец документа.**
