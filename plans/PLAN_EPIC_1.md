# EPIC-01 Gameplay Core+ Plan

- [x] 1) Сформировать спецификацию уровня: структура состояния, критерий перехода `ToNextLevel = Level * 20`, события/хуки (где считать “сокращенные фигуры”), и минимальный debug-вывод.
- [x] 2) Реализовать Level state + переходы (с сохранением текущего MVP): счетчик уровня, прогресс до следующего уровня, сброс/инициализация при старте.
- [x] 3) Подключить рост количества цветов (старт 4, +1 каждые 5 уровней, max 7) и обновить генерацию фигур.
- [x] 4) Подключить правила поворота по уровню (L1–5: без поворота; L6+: случайный угол с расширением диапазона) и связать с уровнем.
- [x] 5) Привести chain-детекцию к канону: принято оставить текущую реализацию (1.8с, grace 250мс, reset по отсутствию контактов).
- [x] 6) Обновить/добавить debug-оверлей (уровень, прогресс, число цветов, текущий диапазон угла) — если нужно.

## Step 1 Spec (фиксировано)

### State
- `level`: старт 1
- `clearedThisLevel`: 0
- `toNextLevel`: L1 = 20, далее `floor(prev * 1.2)`
- `colorsCount` (derived): `min(4 + floor((level - 1) / 5), 7)`
- `rotationRange` (derived): `level <= 5 ? 0 : ramped range`

### Progress source
- Прогресс уровня считается по количеству удаленных фигур при сокращении цепочки (по факту `World.remove`).
- На удалении: `clearedThisLevel += removedCount`.
- Переход уровня: если `clearedThisLevel >= toNextLevel` → `level++`, пересчет derived-полей, `clearedThisLevel = 0`.

### Integration points
- `updateChains` возвращает `removedCount` или вызывает callback.
- `createRandomSpec` принимает `colorsCount` и `rotationRange` вместо глобальных констант.

### Rotation rule
- L1–5: `rotationRange = 0` (угол = 0).
- L6+: диапазон растет по формуле (нужна финальная договоренность).

### Debug
- Минимум: console.log на `levelUp` и на сокращении с `cleared / toNextLevel`.
- Опционально: overlay (уровень, прогресс, colorsCount, rotationRange).
