import { Card, CardName } from '~/utils/cards';

// helper interfaces, possible refactor elsewhere
export interface CardCount {
    card: Card;
    count: number;
}

interface GameStartingPlayer {
    id: number;
    socketId: string;
    name: string;
    cards: CardCount[];
    money: number;
}
// event interfaces
export interface GameDataLoad {
    players: GameStartingPlayer[];
    buyableCards: CardCount[];
    winningCards: Card[];
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
    // TODO: playerId might turn into string during sending the events
    gains: { [playerId: number]: number };
    newMoney: { [playerId: number]: number };
}
export interface BlueCardEffects {
    // TODO: playerId might turn into string during sending the events
    gains: { [playerId: number]: number };
    newMoney: { [playerId: number]: number };
}
export interface GreenCardEffects {
    player: number;
    newMoney: number;
    gains: number;
}
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
