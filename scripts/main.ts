import {
  world,
  PlayerInteractWithBlockBeforeEvent,
  ItemStartUseOnAfterEvent,
  PlayerBreakBlockBeforeEvent,
  system,
} from "@minecraft/server";
import config from "./config";
import {
  loadLockedContainers,
  lockContainer,
  saveLockedContainers,
  unlockContainer,
} from "./services/locked-containers.service";
import {
  ContainerOwnerStatus,
  getContainerOwnerStatus,
  isModerator,
  isOperator,
} from "./services/permissions.service";

// save locked containers every 6000 ticks (5 minutes)
system.runInterval(() => {
  saveLockedContainers();
}, 6000);

system.run(() => {
  try {
    loadLockedContainers();
  } catch (error) {
    console.warn("Fehler beim Initialisieren: " + error);
  }
});

world.afterEvents.itemStartUseOn.subscribe(
  (event: ItemStartUseOnAfterEvent) => {
    const { block, source: player, itemStack: item } = event;

    if (!config.lockableContainerTypes.includes(block.typeId)) {
      return;
    }

    if (!item || item.typeId !== config.keyType) {
      return;
    }

    const chestLocation = block.location;

    if (isOperator(player) || isModerator(player)) {
      return;
    }

    const containerOwnerStatus = getContainerOwnerStatus(player, chestLocation);

    if (containerOwnerStatus.status === ContainerOwnerStatus.Owner) {
      unlockContainer(chestLocation);

      player.sendMessage("§eDu hast diese Kiste entsperrt.");

      return;
    }

    if (containerOwnerStatus.status === ContainerOwnerStatus.Nobody) {
      lockContainer(player, chestLocation);

      player.sendMessage(
        "§aDu hast diese Kiste verschlossen. Nur du kannst sie jetzt öffnen oder zerstören.",
      );

      return;
    }

    if (containerOwnerStatus.status === ContainerOwnerStatus.SomeoneElse) {
      player.sendMessage(
        `§cDiese Kiste gehört dem Spieler ${containerOwnerStatus.playerName}.`,
      );
      return;
    }
  },
);

world.beforeEvents.playerInteractWithBlock.subscribe(
  (event: PlayerInteractWithBlockBeforeEvent) => {
    const { player, block } = event;

    const containerOwnerStatus = getContainerOwnerStatus(
      player,
      block.location,
    );

    if (
      !config.lockableContainerTypes.includes(block.typeId) ||
      containerOwnerStatus.status === ContainerOwnerStatus.Owner ||
      containerOwnerStatus.status === ContainerOwnerStatus.Nobody
    ) {
      return;
    }

    player.sendMessage("§cDiese Kiste ist verschlossen und gehört dir nicht.");
    event.cancel = true;
  },
);

world.beforeEvents.playerBreakBlock.subscribe(
  (event: PlayerBreakBlockBeforeEvent) => {
    const { player, block } = event;

    if (!config.lockableContainerTypes.includes(block.typeId)) {
      return;
    }

    const containerOwnerStatus = getContainerOwnerStatus(
      player,
      block.location,
    );

    if (
      containerOwnerStatus.status === ContainerOwnerStatus.Owner ||
      containerOwnerStatus.status === ContainerOwnerStatus.Nobody
    ) {
      unlockContainer(block.location);
      return;
    }

    player.sendMessage(
      "§cDiese Kiste ist verschlossen und kann nicht zerstört werden.",
    );
    event.cancel = true;
  },
);
