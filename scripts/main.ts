import {
  world,
  Block,
  PlayerInteractWithBlockBeforeEvent,
  Player,
  ItemStartUseOnAfterEvent,
  PlayerBreakBlockBeforeEvent,
  system,
} from "@minecraft/server";

const lockedChests: { [location: string]: string } = {};
const PROPERTY_NAME = "lockedChestsData";

const lockableChestTypes = ["minecraft:chest", "minecraft:barrel"];

function saveLockedChests() {
  try {
    const jsonData = JSON.stringify(lockedChests);
    world.setDynamicProperty(PROPERTY_NAME, jsonData);
  } catch (error) {
    console.warn("Fehler beim Speichern der Kisten: " + error);
  }
}

function loadLockedChests() {
  try {
    const jsonData = world.getDynamicProperty(PROPERTY_NAME);

    if (typeof jsonData === "string" && jsonData.length > 0) {
      const savedChests = JSON.parse(jsonData);

      Object.keys(savedChests).forEach((key) => {
        lockedChests[key] = savedChests[key];
      });
    } else {
      console.warn("Keine gespeicherten Kisten gefunden.");
    }
  } catch (error) {
    console.warn("Fehler beim Laden der Kisten: " + error);
    world.setDynamicProperty(PROPERTY_NAME, "{}");
  }
}

function getStringifiedChestLocation(block: Block): string {
  const { x, y, z } = block.location;
  return `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
}

function canAccessChest(player: Player, block: Block): boolean {
  const chestKey = getStringifiedChestLocation(block);

  if (player.hasTag("operator") || player.hasTag("moderator")) {
    return true;
  }

  if (!lockedChests[chestKey]) {
    return true;
  }

  return lockedChests[chestKey] === player.name;
}

system.runInterval(() => {
  saveLockedChests();
}, 6000); // 6000 Ticks = 5 Minuten

system.run(() => {
  try {
    loadLockedChests();
    world.sendMessage("§aKistensicherungssystem wurde initialisiert.");
  } catch (error) {
    console.warn("Fehler beim Initialisieren: " + error);
  }
});

world.afterEvents.itemStartUseOn.subscribe(
  (event: ItemStartUseOnAfterEvent) => {
    const block = event.block;

    if (!lockableChestTypes.includes(block.typeId)) {
      return;
    }

    const item = event.itemStack;

    const player = event.source;

    player.sendMessage(`${item?.typeId}`);

    if (!item || item.typeId !== "lockables:key") {
      return;
    }

    const chestLocation = getStringifiedChestLocation(block);

    if (lockedChests[chestLocation] === player.name) {
      delete lockedChests[chestLocation];
      player.sendMessage("§aDu hast diese Kiste entsperrt.");
      saveLockedChests();
    } else if (!lockedChests[chestLocation]) {
      lockedChests[chestLocation] = player.name;
      player.sendMessage(
        "§aDu hast diese Kiste verschlossen. Nur du kannst sie jetzt öffnen oder zerstören.",
      );
      saveLockedChests();
    } else {
      player.sendMessage(
        `§cDiese Kiste gehört dem Spieler ${lockedChests[chestLocation]}.`,
      );
    }
  },
);

world.beforeEvents.playerInteractWithBlock.subscribe(
  (event: PlayerInteractWithBlockBeforeEvent) => {
    const player = event.player;
    const block = event.block;

    if (!lockableChestTypes.includes(block.typeId)) {
      return;
    }

    if (!canAccessChest(player, block)) {
      player.sendMessage(
        "§cDiese Kiste ist verschlossen und gehört dir nicht.",
      );
      event.cancel = true;
      return;
    }
  },
);

world.beforeEvents.playerBreakBlock.subscribe(
  (event: PlayerBreakBlockBeforeEvent) => {
    const player = event.player;
    const block = event.block;

    if (!lockableChestTypes.includes(block.typeId)) {
      return;
    }

    const chestLocation = getStringifiedChestLocation(block);

    if (
      !lockedChests[chestLocation] ||
      lockedChests[chestLocation] === player.name
    ) {
      if (lockedChests[chestLocation]) {
        delete lockedChests[chestLocation];
        saveLockedChests();
      }
      return;
    }

    player.sendMessage(
      "§cDiese Kiste ist verschlossen und kann nicht zerstört werden.",
    );
    event.cancel = true;
  },
);
