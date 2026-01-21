import { updateChainDetect } from "./detect.js";
import {
  applyChainFillStyles,
  startBurst,
  updateBurst,
  updateImpactFlash,
} from "./effects.js";

export function updateChains(state, deltaMs) {
  updateImpactFlash(state);
  updateBurst(state);

  const { bodies, components, bodyById, removeComponents, removedCount } =
    updateChainDetect(state, deltaMs);

  applyChainFillStyles(state, bodies, components, deltaMs);

  const removedComponentBodies = [];
  if (removedCount) {
    for (const component of removeComponents) {
      const componentBodies = [];
      for (const id of component.ids) {
        const body = bodyById.get(id);
        if (body) {
          componentBodies.push(body);
        }
      }
      startBurst(state, componentBodies);
      removedComponentBodies.push(componentBodies);
    }
  }

  return {
    removedCount,
    removedComponents: removeComponents,
    removedComponentBodies,
  };
}
