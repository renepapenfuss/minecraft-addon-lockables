import { Player, Vector3, world } from "@minecraft/server";
import config from "../config";
import { ObservableMap } from "../lib/observable-map";

export const lockedContainers = new ObservableMap<string, string>();
lockedContainers.onChange(() => {
  saveLockedContainers();
});

export function loadLockedContainers() {
  try {
    const jsonData = world.getDynamicProperty(config.dynamicPropertyName);

    if (typeof jsonData === "string" && jsonData.length > 0) {
      const storedLockedContainers = JSON.parse(jsonData);

      for (const [locationStr, containerName] of storedLockedContainers) {
        const location = JSON.parse(locationStr);
        lockedContainers.set(JSON.stringify(location), containerName);
      }
    } else {
      console.warn("Keine gespeicherten Kisten gefunden.");
    }
  } catch (error) {
    console.warn("Fehler beim Laden der Kisten: " + error);
    world.setDynamicProperty(config.dynamicPropertyName, JSON.stringify({}));
  }
}

export function saveLockedContainers() {
  try {
    const jsonData = JSON.stringify(Array.from(lockedContainers.entries()));
    world.setDynamicProperty(config.dynamicPropertyName, jsonData);
  } catch (error) {
    console.warn("Fehler beim Speichern der Kisten: " + error);
  }
}

export function getLockedContainerAtLocation(
  location: Vector3,
): string | undefined {
  return lockedContainers.get(JSON.stringify(location));
}

export function lockContainer(player: Player, location: Vector3) {
  lockedContainers.set(JSON.stringify(location), player.name);
}

export function unlockContainer(location: Vector3) {
  lockedContainers.delete(JSON.stringify(location));
}
