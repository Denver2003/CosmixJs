export function getPercent(table, value) {
  for (const [threshold, percent] of table) {
    if (threshold >= value) {
      return percent;
    }
  }
  return 0;
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

