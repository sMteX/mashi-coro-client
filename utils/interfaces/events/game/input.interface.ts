import { Card, CardName } from '~/utils/cards';

// helper interfaces, possible refactor elsewhere
export interface CardCount {
    card: Card;
    count: number;
}
interface CardPairInput {
    card: CardName;
    count: number;
}
interface GameStartingPlayer {
    id: number;
    socketId: string;
    name: string;
    cards: CardPairInput[];
    money: number;
}
// event interfaces
export interface GameDataLoad {
    players: GameStartingPlayer[];
    cardDb: {[name in CardName]: Omit<Card, 'bought'>};
    buyableCards: CardPairInput[];
    winningCards: CardName[];
    bank: number;
    startingPlayerId: number;
}
export interface DiceRollOutput {
    player: number;
    dice: number[];
    sum: number;
    transmitter: boolean;
}
export interface RedCardEffects {
    fromPlayer: number;
    result: {
        [playerId: number]: {
            gains?: number;
            newMoney: number;
        }
    }
}
export interface BlueCardEffects {
    result: {
        [playerId: number]: {
            gains: number;
            newMoney: number;
        }
    }
}
export interface GreenCardEffects {
    player: number;
    newMoney: number;
    gains: number;
}
export interface PassivePurpleCardEffects {
    player: number;
    result: {
        [playerId: number]: {
            gains?: number;
            newMoney: number;
        }
    }
}
export interface ActivePurpleCardEffects {
    results: { [card in CardName]?: OfficeBuildingEffect|StadiumEffect; }
}
// subtypes for ActivePurpleCardEffects
export interface OfficeBuildingEffect {
    currentPlayerId: number;
    targetPlayerId: number;
    swapCardOwn: CardName;
    swapCardTarget: CardName;
}
export interface StadiumEffect {
    currentPlayerId: number;
    targetPlayerId: number;
    currentPlayerMoney: number;
    targetPlayerMoney: number;
    gain: number;
}
// TODO: Water Treatment Effects
export interface PlayerBoughtCard {
    player: number;
    card: CardName;
}
export interface AirportGain {
    player: number;
}
export interface AmusementParkNewTurn {
    player: number;
}
export interface NewTurn {
    oldPlayer: number;
    newPlayer: number;
}
export interface PlayerLeftGame {
    playerId: number;
}
export interface PlayerWonGame {
    playerId: number;
}
