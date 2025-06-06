import { Player, Vector3 } from "@minecraft/server";
import config from "../config";
import { getLockedContainerAtLocation } from "./locked-containers.service";

export function isOperator(player: Player): boolean {
  return player.hasTag(config.operatorTag);
}

export function isModerator(player: Player): boolean {
  return player.hasTag(config.moderatorTag);
}

export enum ContainerOwnerStatus {
  Owner,
  SomeoneElse,
  Nobody,
}

interface ContainerOwnerStatusType {
  status: ContainerOwnerStatus;
  playerName: string;
}

export function getContainerOwnerStatus(
  player: Player,
  location: Vector3,
): ContainerOwnerStatusType {
  const lockedContainer = getLockedContainerAtLocation(location);

  if (!lockedContainer) {
    return {
      status: ContainerOwnerStatus.Nobody,
      playerName: "",
    };
  }

  if (lockedContainer === player.name) {
    return {
      status: ContainerOwnerStatus.Owner,
      playerName: player.name,
    };
  }

  return {
    status: ContainerOwnerStatus.SomeoneElse,
    playerName: lockedContainer,
  };
}
