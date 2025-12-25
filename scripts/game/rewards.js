const SCORE_BASE = 10;
const MONEY_BASE = 1;

export function calcChainScore({
  count,
  level,
  multiplier = 1,
  pointCoef = 1,
  combo = 1,
}) {
  const bonus = 1 + Math.max(0, count - 4) * 0.1;
  return Math.round(
    SCORE_BASE * level * multiplier * count * pointCoef * combo * bonus
  );
}

export function calcLevelUpScore({ toNextLevel, multiplier = 1, pointCoef = 1 }) {
  return Math.round(SCORE_BASE * toNextLevel * multiplier * pointCoef);
}

export function calcBubbleScore({
  roll,
  level,
  multiplier = 1,
  pointCoef = 1,
}) {
  return Math.round(roll * SCORE_BASE * level * multiplier * pointCoef);
}

export function calcBubbleMoney({
  roll,
  level,
  multiplier = 1,
  moneyCoef = 1,
}) {
  return Math.round(roll * MONEY_BASE * level * multiplier * moneyCoef);
}

export function applyChainRewards(state, removedComponents) {
  let total = 0;
  const breakdown = [];
  const multiplier = state.gameMultiplier ?? 1;
  const pointCoef = state.scoreCoef ?? 1;
  const combo = state.comboMultiplier ?? 1;
  for (const component of removedComponents) {
    const count = component.ids.size;
    const score = calcChainScore({
      count,
      level: state.level,
      multiplier,
      pointCoef,
      combo,
    });
    const perShape = count ? Math.floor(score / count) : 0;
    total += score;
    breakdown.push({ count, score, perShape });
  }
  if (total) {
    state.score += total;
  }
  return { total, breakdown };
}

export function applyLevelUpReward(state, prevToNextLevel) {
  const multiplier = state.gameMultiplier ?? 1;
  const pointCoef = state.scoreCoef ?? 1;
  const total = calcLevelUpScore({
    toNextLevel: prevToNextLevel,
    multiplier,
    pointCoef,
  });
  if (total) {
    state.score += total;
  }
  return total;
}
