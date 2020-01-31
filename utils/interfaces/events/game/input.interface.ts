import { Card } from '~/utils/cards';

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

export interface GameStarting {
    players: GameStartingPlayer[];
    buyableCards: CardCount[];
    winningCards: Card[];
    bank: number;
}