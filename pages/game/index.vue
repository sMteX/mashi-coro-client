<template lang="pug">
    div
        a-col.game-container(span=18, offset=3)
            a-row(type="flex" justify="center")
                logo
            a-row
                h1 Game
                a-row
                    h3 Players:
                    ul
                        li(v-for="player in players")
                            span {{ player.name }} - {{ player.id }}
                a-row
                    ul
                        li(v-for="message in lastMessages") {{ message }}
                a-row.game(v-if="loaded")
                    a-row
                        h3 Turn phases
                        div
                            a-radio-group(:defaultValue="currentTurnPhase" button-style="solid")
                                a-radio-button(v-for="(value, name, index) in turnPhases" :value="Number(name)" :key="index") {{ value }}
                    a-row(v-if="isPlayerOnTurn")
                        h3 Actions
                        a-button(v-for="(button, index) in buttons" :key="index" :disabled="!button.isActive" @click="button.handler") {{ button.text }}
                    a-row
                        h3 Dice
                        p Die #1: {{ dice.first }}
                        p(v-if="chosenAmountOfDice === 2") Die #2: {{ dice.second }}
                        p Sum: {{ dice.sum }}
                    a-row
                        a-col(span=12)
                            a-row
                                a-row
                                    h3 You
                                a-row
                                    p Money: {{ thisPlayer.money }}
                                a-row
                                    // - dominants
                                    a-row(type="flex" justify="start" :gutter=16)
                                        Card(v-for="(card, index) in playerCards(thisPlayer)[0]" :info="card" :key="index" :clickable="isCardClickable(card)")
                                    // - normal cards
                                    a-row(type="flex" justify="start" :gutter=16 v-for="(row, rowIndex) in playerCards(thisPlayer).slice(1)" :key="rowIndex")
                                        Card(v-for="(card, index) in row" :info="card" :key="index")
                            a-row
                                a-row
                                    h3 Table
                                a-row
                                    // - probably not even needed
                                    p Bank: {{ table.bank }}
                                a-row
                                    a-row(type="flex" justify="space-around" v-for="(row, rowIndex) in buyableCardsTable" :key="rowIndex")
                                        Card(v-for="(card, index) in row" :info="card" :key="index" :clickable="isCardClickable(card)" :clickEvent="buyCard")
                        a-col(span=11 offset=1)
                            PlayerCards(v-for="(player, index) in otherPlayers" :key="index" :player="player")

</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import * as _ from 'lodash';
import Logo from '~/components/Logo.vue';
import { events as eventConstants } from '~/utils/constants';
import {
    AirportGain, AmusementParkNewTurn,
    BlueCardEffects,
    CardCount,
    DiceRollOutput,
    GameDataLoad, GreenCardEffects, NewTurn, PlayerBoughtCard, PlayerLeftGame,
    RedCardEffects
} from '~/utils/interfaces/events/game/input.interface';
import PlayerCards from '~/components/PlayerCards.vue';
import Card from '~/components/Card.vue';
import { CardName } from '~/utils/cards';

const io = require('socket.io-client');
const { game: events } = eventConstants;

enum TurnPhase {
    DiceChoice,
    DiceRoll,
    PostRoll,
    RedCards,
    BlueGreenCards,
    PurpleCards,
    Build,
    PostBuild,
    EndTurn
}
/*
Poradi efektu dominant behem tahu:
- Nadrazi - zvoleni 1 nebo 2 kostek
- Vysilac - moznost noveho hodu
- Pristav - pricteni +2 k hodu 10 a vic
- Nakupni centrum - bonus k prijmum z cervenych karet a beden
- Radnice - 1 mince pokud nemam zadne penize pred stavbou
- Letiste - 10 minci pokud jsem nic nepostavil
- Zabavni park - novy tah pokud padly stejne kostky
 */
interface Player {
    id: number;
    socketId: string;
    name: string;

    cards: CardCount[];
    money: number;
    winningCards: CardCount[];
}

interface Table {
    bank: number;
    buyableCards: CardCount[];
}
interface ActionButton {
    order: number;
    text: string;
    isVisible: boolean;
    handler: () => void;
    isActive: boolean;
}

const dominants = [CardName.Station, CardName.ShoppingCenter, CardName.AmusementPark, CardName.Transmitter];

@Component({
    components: {
        Logo,
        Card,
        PlayerCards
    },
    head: {
        title: 'Game'
    }
})
export default class GamePage extends Vue {
    private turnPhases = {
        [TurnPhase.DiceChoice]: 'Výběr počtu kostek',
        [TurnPhase.DiceRoll]: 'Hod kostkou',
        [TurnPhase.PostRoll]: 'Po hodu kostkou',
        [TurnPhase.RedCards]: 'Červené karty',
        [TurnPhase.BlueGreenCards]: 'Zelené a modré karty',
        [TurnPhase.PurpleCards]: 'Fialové karty',
        [TurnPhase.Build]: 'Stavba/nákup',
        [TurnPhase.PostBuild]: 'Po stavbě',
        [TurnPhase.EndTurn]: 'Konec tahu'
    };

    private _buttons: ActionButton[] = [
        {
            order: 0,
            text: 'Hod 1 kostkou',
            isVisible: this.isRollOneDiceVisible,
            handler: this.rollOneDice,
            isActive: this.isRollOneDiceActive
        },
        {
            order: 1,
            text: 'Hod 2 kostkami',
            isVisible: this.isRollTwoDiceVisible,
            handler: this.rollTwoDice,
            isActive: this.isRollTwoDiceActive
        },
        {
            order: 2,
            text: 'Nechat si kostky',
            isVisible: this.isKeepDiceVisible,
            handler: this.keepDice,
            isActive: this.isKeepDiceActive
        },
        {
            order: 3,
            text: 'Hodit znovu',
            isVisible: this.isRollAgainVisible,
            handler: this.rollAgain,
            isActive: this.isRollAgainActive
        },
        {
            order: 4,
            text: 'Přidat k hodu 2',
            isVisible: this.isAddTwoToRollVisible,
            handler: this.addTwoToRoll,
            isActive: this.isAddTwoToRollActive
        },
        {
            order: 5,
            text: 'Ukončit tah',
            isVisible: this.isEndTurnVisible,
            handler: this.endTurn,
            isActive: this.isEndTurnActive
        }
    ];

    private currentTurnPhase: TurnPhase = TurnPhase.DiceChoice;

    private table: Table = {
        bank: 0,
        buyableCards: []
    };

    private dummySetup: boolean = false;
    private players: Player[] = [];
    private messages: string[] = [];
    private loaded: boolean = false;
    private started: boolean = false;
    private gameSlug: string = '';

    private socket!: SocketIOClient.Socket;

    private chosenAmountOfDice: number = 1;
    private activePlayerId: number = -1;
    private alreadyUsedTransmitter: boolean = false;
    private alreadyBought: boolean = false;

    private dice = {
        first: -1,
        second: -1,
        sum: 0
    };

    resetDefaultValues () {
        this.chosenAmountOfDice = 1;
        this.alreadyBought = false;
        this.alreadyUsedTransmitter = false;
        this.currentTurnPhase = TurnPhase.DiceChoice;
    }

    mounted () {
        this.dummySetup = true;
        // without it is temporarily allowed through dummy data
        this.useDummyData();
        // TODO: redirect if player didn't come from lobby (or maybe just don't use pages for this, but instead giant components that just get switched?)
        // this.socket = io.connect(
        //     `${process.env.serverUrl}/${events.namespaceName}`
        // );
        // this.setupHandlers();
        // this.gameSlug = this.$route.query.id;
        // this.socket.emit(events.output.PLAYER_CONNECT, {
        //     game: this.gameSlug,
        //     id: Number(this.$route.query.playerId)
        // });
        this.loaded = true;
    }

    get isPlayerOnTurn (): boolean {
        return this.started && this.thisPlayer.id === this.activePlayerId;
    }

    buyCard (card: CardName) {
        // this shouldn't get called in wrong times, no need for checks?
        this.socket.emit(events.output.BUY_CARD, {
            card,
            game: this.gameSlug,
            playerId: this.thisPlayer.id
        });
        this.alreadyBought = true;
    }

    isCardClickable ({ card }: CardCount): boolean {
        return this.isPlayerOnTurn &&
                this.currentTurnPhase === TurnPhase.Build &&
                !this.alreadyBought &&
                this.thisPlayer.money >= card.cost;
    }

    // <editor-fold desc="Action buttons">
    // <editor-fold desc="button handlers">
    rollOneDice () {
        this.log('1 dice rolled');
        if (!this.dummySetup) {
            this.chosenAmountOfDice = 1;
            this.currentTurnPhase = TurnPhase.DiceRoll;
            this.socket.emit(events.output.DICE_ROLL, {
                game: this.gameSlug,
                diceCount: 1,
                playerId: this.thisPlayer.id,
                transmitter: false
            });
        }
    }

    rollTwoDice () {
        this.log('2 dice rolled');
        if (!this.dummySetup) {
            this.chosenAmountOfDice = 2;
            this.currentTurnPhase = TurnPhase.DiceRoll;
            this.socket.emit(events.output.DICE_ROLL, {
                game: this.gameSlug,
                diceCount: 2,
                playerId: this.thisPlayer.id,
                transmitter: false
            });
        }
    }

    keepDice () {
        this.log('Kept the dice');
        if (!this.dummySetup) {
            this.alreadyUsedTransmitter = true; // technically "used", we used the CHOICE to not roll again
            this.socket.emit(events.output.END_ROLL, {
                game: this.gameSlug,
                playerId: this.thisPlayer.id
            });
        }
    }

    rollAgain () {
        this.log('Rolled again');
        if (!this.dummySetup) {
            this.alreadyUsedTransmitter = true;
            this.socket.emit(events.output.DICE_ROLL, {
                game: this.gameSlug,
                diceCount: this.chosenAmountOfDice,
                playerId: this.thisPlayer.id,
                transmitter: true
            });
        }
    }

    addTwoToRoll () {
        this.log('Added 2 to roll');
        // TODO: implement
    }

    endTurn () {
        this.log('Ended turn');
        if (!this.dummySetup) {
            this.socket.emit(events.output.END_TURN, {
                game: this.gameSlug,
                playerId: this.thisPlayer.id
            });
        }
    }
    // </editor-fold>

    // <editor-fold desc="is visible getters">
    get isRollOneDiceVisible (): boolean {
        return true;
    }

    get isRollTwoDiceVisible (): boolean {
        return this.playerHasCard(this.thisPlayer, CardName.Station);
        // return true;
    }

    get isKeepDiceVisible (): boolean {
        return this.playerHasCard(this.thisPlayer, CardName.Transmitter);
        // return true;
    }

    get isRollAgainVisible (): boolean {
        return this.playerHasCard(this.thisPlayer, CardName.Transmitter);
        // return true;
    }

    get isAddTwoToRollVisible (): boolean {
        // TODO: if player has Dock dominant
        return false;
    }

    get isEndTurnVisible (): boolean {
        return true;
    }
    // </editor-fold>

    // <editor-fold desc="is active getters">
    get isRollOneDiceActive (): boolean {
        return this.currentTurnPhase === TurnPhase.DiceChoice;
        // return true;
    }

    get isRollTwoDiceActive (): boolean {
        return this.currentTurnPhase === TurnPhase.DiceChoice; // technically a check for Station but the button should be already hidden without Station
        // return true;
    }

    get isKeepDiceActive (): boolean {
        return this.currentTurnPhase === TurnPhase.PostRoll && !this.alreadyUsedTransmitter;
        // return true;
    }

    get isRollAgainActive (): boolean {
        return this.currentTurnPhase === TurnPhase.PostRoll && !this.alreadyUsedTransmitter;
        // return true;
    }

    get isAddTwoToRollActive (): boolean {
        // TODO: active in PostRoll phase (after check for second roll and 10 - 12 in roll value)
        return true;
    }

    get isEndTurnActive (): boolean {
        return this.currentTurnPhase > TurnPhase.PurpleCards;
        // return this.currentTurnPhase === TurnPhase.PostBuild || this.currentTurnPhase === TurnPhase.EndTurn;
        // return true;
    }
    // </editor-fold>

    get buttons () {
        return this.$data._buttons
            .filter((button: ActionButton) => button.isVisible)
            .sort((a: ActionButton, b: ActionButton) => a.order - b.order);
    }
    // </editor-fold>

    playerHasCard (player: Player, card: CardName): boolean {
        if (dominants.includes(card)) {
            // we always have winning cards, but they might not be bought
            const dominant = player.winningCards.map(wc => wc.card).find(wc => wc.cardName === card);
            // first ! because we know the dominant exists (just find() returns |undefined)
            // second ! because dominants always have the bought flag
            return dominant!.bought!;
        }
        return player.cards.filter(cc => cc.card.cardName === card).length > 0;
    }

    get buyableCardsTable (): CardCount[][] {
        return _.chunk(this.table.buyableCards, 5);
    }

    playerCards (player: Player): CardCount[][] {
        const cards: CardCount[][] = [];
        cards.push([...player.winningCards]);
        cards.push([...player.cards.filter(({ card }) => card.canBeTriggeredByOthers)]);
        cards.push([...player.cards.filter(({ card }) => !card.canBeTriggeredByOthers)]);
        return cards;
    }

    get lastMessages (): string[] {
        return this.messages.slice(-3);
    }

    log (message: string) {
        this.messages.push(message);
        console.log(message);
    }

    findPlayer (id: number|string) {
        return this.players.find(p => p.socketId === id || p.id === id)!;
    }

    get thisPlayer (): Player {
        if (this.dummySetup) {
            return this.players[0];
        }
        return this.findPlayer(this.socket.id);
    }

    get otherPlayers (): Player[] {
        if (this.dummySetup) {
            return this.players.slice(1);
        }
        return this.players.filter(p => p.socketId !== this.socket.id);
    }

    useDummyData () {
        // mimics real data returned
        const data: GameDataLoad = {
            startingPlayerId: 9,
            players: [
                {
                    id: 9,
                    socketId: 'blah',
                    name: 'Chizu',
                    cards: [
                        {
                            card: {
                                cardName: 0,
                                name: 'Pšeničné pole',
                                cost: 1,
                                description: 'Vezměte si 1 minci z banku',
                                symbol: 0,
                                color: 1,
                                triggerNumbers: [
                                    1
                                ],
                                canBeTriggeredByOthers: true,
                                canBeTriggeredBySelf: true
                            },
                            count: 1
                        },
                        {
                            card: {
                                cardName: 2,
                                name: 'Pekárna',
                                cost: 1,
                                description: 'Vezměte si 1 minci z banku',
                                symbol: 1,
                                color: 0,
                                triggerNumbers: [
                                    2,
                                    3
                                ],
                                canBeTriggeredByOthers: false,
                                canBeTriggeredBySelf: true
                            },
                            count: 1
                        }
                    ],
                    money: 3
                },
                {
                    id: 10,
                    socketId: 'blah2',
                    name: 'Gieen',
                    cards: [
                        {
                            card: {
                                cardName: 0,
                                name: 'Pšeničné pole',
                                cost: 1,
                                description: 'Vezměte si 1 minci z banku',
                                symbol: 0,
                                color: 1,
                                triggerNumbers: [
                                    1
                                ],
                                canBeTriggeredByOthers: true,
                                canBeTriggeredBySelf: true
                            },
                            count: 1
                        },
                        {
                            card: {
                                cardName: 2,
                                name: 'Pekárna',
                                cost: 1,
                                description: 'Vezměte si 1 minci z banku',
                                symbol: 1,
                                color: 0,
                                triggerNumbers: [
                                    2,
                                    3
                                ],
                                canBeTriggeredByOthers: false,
                                canBeTriggeredBySelf: true
                            },
                            count: 1
                        }
                    ],
                    money: 3
                }
            ],
            buyableCards: [
                {
                    card: {
                        cardName: 0,
                        name: 'Pšeničné pole',
                        cost: 1,
                        description: 'Vezměte si 1 minci z banku',
                        symbol: 0,
                        color: 1,
                        triggerNumbers: [
                            1
                        ],
                        canBeTriggeredByOthers: true,
                        canBeTriggeredBySelf: true
                    },
                    count: 6
                },
                {
                    card: {
                        cardName: 1,
                        name: 'Statek',
                        cost: 1,
                        description: 'Vezměte si 1 minci z banku',
                        symbol: 2,
                        color: 1,
                        triggerNumbers: [
                            2
                        ],
                        canBeTriggeredByOthers: true,
                        canBeTriggeredBySelf: true
                    },
                    count: 6
                },
                {
                    card: {
                        cardName: 2,
                        name: 'Pekárna',
                        cost: 1,
                        description: 'Vezměte si 1 minci z banku',
                        symbol: 1,
                        color: 0,
                        triggerNumbers: [
                            2,
                            3
                        ],
                        canBeTriggeredByOthers: false,
                        canBeTriggeredBySelf: true
                    },
                    count: 6
                },
                {
                    card: {
                        cardName: 3,
                        name: 'Kavárna',
                        cost: 2,
                        description: 'Dostanete 1 minci od hráče na tahu',
                        symbol: 3,
                        color: 2,
                        triggerNumbers: [
                            3
                        ],
                        canBeTriggeredByOthers: true,
                        canBeTriggeredBySelf: false
                    },
                    count: 6
                },
                {
                    card: {
                        cardName: 4,
                        name: 'Samoobsluha',
                        cost: 2,
                        description: 'Vezměte si 3 mince z banku',
                        symbol: 1,
                        color: 0,
                        triggerNumbers: [
                            4
                        ],
                        canBeTriggeredByOthers: false,
                        canBeTriggeredBySelf: true
                    },
                    count: 6
                },
                {
                    card: {
                        cardName: 5,
                        name: 'Les',
                        cost: 3,
                        description: 'Vezměte si 1 minci z banku',
                        symbol: 4,
                        color: 1,
                        triggerNumbers: [
                            5
                        ],
                        canBeTriggeredByOthers: true,
                        canBeTriggeredBySelf: true
                    },
                    count: 6
                },
                {
                    card: {
                        cardName: 6,
                        name: 'Stadión',
                        cost: 6,
                        description: 'Dostanete 2 mince od každého soupeře',
                        symbol: 5,
                        color: 3,
                        triggerNumbers: [
                            6
                        ],
                        canBeTriggeredByOthers: false,
                        canBeTriggeredBySelf: true
                    },
                    count: 4
                },
                {
                    card: {
                        cardName: 7,
                        name: 'Televizní studio',
                        cost: 7,
                        description: 'Dostanete 5 mincí od zvoleného soupeře',
                        symbol: 5,
                        color: 3,
                        triggerNumbers: [
                            6
                        ],
                        canBeTriggeredByOthers: false,
                        canBeTriggeredBySelf: true
                    },
                    count: 4
                },
                {
                    card: {
                        cardName: 8,
                        name: 'Kancelářská budova',
                        cost: 8,
                        description: 'Můžete vyměnit jednu svoji kartu objektu za soupeřovu (nelze měnit Věže)',
                        symbol: 5,
                        color: 3,
                        triggerNumbers: [
                            6
                        ],
                        canBeTriggeredByOthers: false,
                        canBeTriggeredBySelf: true
                    },
                    count: 4
                },
                {
                    card: {
                        cardName: 9,
                        name: 'Mlékárna',
                        cost: 5,
                        description: 'Za každý svůj objekt Prase si vezměte 3 mince z banku',
                        symbol: 6,
                        color: 0,
                        triggerNumbers: [
                            7
                        ],
                        canBeTriggeredByOthers: false,
                        canBeTriggeredBySelf: true
                    },
                    count: 6
                },
                {
                    card: {
                        cardName: 10,
                        name: 'Továrna na nábytek',
                        cost: 3,
                        description: 'Za každý svůj objekt Kolečko si vezměte 3 mince z banku',
                        symbol: 6,
                        color: 0,
                        triggerNumbers: [
                            8
                        ],
                        canBeTriggeredByOthers: false,
                        canBeTriggeredBySelf: true
                    },
                    count: 6
                },
                {
                    card: {
                        cardName: 11,
                        name: 'Důl',
                        cost: 6,
                        description: 'Vezměte si 5 mincí z banku',
                        symbol: 4,
                        color: 1,
                        triggerNumbers: [
                            9
                        ],
                        canBeTriggeredByOthers: true,
                        canBeTriggeredBySelf: true
                    },
                    count: 6
                },
                {
                    card: {
                        cardName: 12,
                        name: 'Jabloňový sad',
                        cost: 3,
                        description: 'Vezměte si 3 mince z banku',
                        symbol: 0,
                        color: 1,
                        triggerNumbers: [
                            10
                        ],
                        canBeTriggeredByOthers: true,
                        canBeTriggeredBySelf: true
                    },
                    count: 6
                },
                {
                    card: {
                        cardName: 13,
                        name: 'Restaurace',
                        cost: 3,
                        description: 'Dostanete 2 minci od hráče na tahu',
                        symbol: 3,
                        color: 2,
                        triggerNumbers: [
                            9,
                            10
                        ],
                        canBeTriggeredByOthers: true,
                        canBeTriggeredBySelf: false
                    },
                    count: 6
                },
                {
                    card: {
                        cardName: 14,
                        name: 'Obchodní dům',
                        cost: 2,
                        description: 'Za každý svůj objekt Obilí si vezměte 2 mince z banku',
                        symbol: 7,
                        color: 0,
                        triggerNumbers: [
                            11,
                            12
                        ],
                        canBeTriggeredByOthers: false,
                        canBeTriggeredBySelf: true
                    },
                    count: 6
                }
            ],
            winningCards: [
                {
                    cardName: 15,
                    name: 'Nádraží',
                    cost: 4,
                    description: 'Můžete házet jednou nebo dvěma kostkami.',
                    symbol: 5,
                    color: 4,
                    triggerNumbers: [],
                    canBeTriggeredByOthers: false,
                    canBeTriggeredBySelf: false
                },
                {
                    cardName: 16,
                    name: 'Nákupní centrum',
                    cost: 10,
                    description: 'Dostáváte-li příjmy za objekty Kafe nebo Toast, dostanete za každý z nich o 1 minci více.',
                    symbol: 5,
                    color: 4,
                    triggerNumbers: [],
                    canBeTriggeredByOthers: false,
                    canBeTriggeredBySelf: false
                },
                {
                    cardName: 17,
                    name: 'Zábavní park',
                    cost: 16,
                    description: 'Pokud vám při hodu dvěma kostkami padnou stejná čísla, máte tah navíc.',
                    symbol: 5,
                    color: 4,
                    triggerNumbers: [],
                    canBeTriggeredByOthers: false,
                    canBeTriggeredBySelf: false
                },
                {
                    cardName: 18,
                    name: 'Vysílač',
                    cost: 22,
                    description: 'Jednou v každém tahu smíte znovu hodit kostkami.',
                    symbol: 5,
                    color: 4,
                    triggerNumbers: [],
                    canBeTriggeredByOthers: false,
                    canBeTriggeredBySelf: false
                }
            ],
            bank: 204
        };
        this.table.bank = data.bank;
        this.table.buyableCards = [...data.buyableCards];
        this.activePlayerId = data.startingPlayerId;
        this.players.push(...data.players.map(player => ({
            id: player.id,
            socketId: player.socketId,
            name: player.name,
            money: player.money,
            cards: [...player.cards],
            winningCards: data.winningCards.map(card => ({
                card: {
                    ...card,
                    bought: false
                },
                count: 1
            }))
        })));
    }

    setupHandlers () {
        this.socket
            .on(events.input.GAME_DATA_LOAD, (data: GameDataLoad) => {
                console.log('Game starting soon, received data:', data);
                this.table.bank = data.bank;
                this.table.buyableCards = [...data.buyableCards];
                this.activePlayerId = data.startingPlayerId;
                this.players.push(...data.players.map(player => ({
                    id: player.id,
                    socketId: player.socketId,
                    name: player.name,
                    money: player.money,
                    cards: [...player.cards],
                    winningCards: data.winningCards.map(card => ({
                        card: {
                            ...card,
                            bought: false
                        },
                        count: 1
                    }))
                })));
                this.loaded = true;
            })
            .on(events.input.GAME_STARTING, () => {
                this.log('Game starting now');
                this.started = true;
            })
            .on(events.input.DICE_ROLL_OUTPUT, (data: DiceRollOutput) => {
                this.log(`Player ${data.player} rolled ${data.transmitter ? 'again ' : ''}these dice: ${data.dice}`);
                this.currentTurnPhase = TurnPhase.PostRoll;
                const [first, second] = data.dice;
                this.dice.first = first;
                this.dice.second = second;
                this.dice.sum = data.sum;

                if (!this.playerHasCard(this.thisPlayer, CardName.Transmitter)) {
                    // TODO: handle Port
                    this.socket.emit(events.output.END_ROLL, {
                        game: this.gameSlug,
                        playerId: this.thisPlayer.id
                    });
                }
            })
            .on(events.input.FINAL_DICE_ROLL, (data: DiceRollOutput) => {
                this.log(`Final roll of player ${data.player} is ${data.dice}`);
                const [first, second] = data.dice;
                this.dice.first = first;
                this.dice.second = second;
                this.dice.sum = data.sum;
                this.currentTurnPhase = TurnPhase.RedCards;
            })
            .on(events.input.RED_CARD_EFFECTS, (data: RedCardEffects) => {
                const gainStrings = Object.entries(data.gains).map(([id, gain]) => `Player ${id} gains ${gain} coins from player ${data.fromPlayer}.`);
                const newMoneyStrings = Object.entries(data.newMoney).map(([id, money]) => {
                    const p = this.findPlayer(id);
                    p.money = money;
                    return `Player ${id} now has ${money} coins.`;
                });
                this.log(gainStrings.join() + newMoneyStrings.join());
                this.currentTurnPhase = TurnPhase.BlueGreenCards;
            })
            .on(events.input.BLUE_CARD_EFFECTS, (data: BlueCardEffects) => {
                const gainStrings = Object.entries(data.gains).map(([id, gain]) => `Player ${id} gains ${gain} coins.`);
                const newMoneyStrings = Object.entries(data.newMoney).map(([id, money]) => {
                    const p = this.findPlayer(id);
                    p.money = money;
                    return `Player ${id} now has ${money} coins.`;
                });
                this.log(gainStrings.join() + newMoneyStrings.join());
            })
            .on(events.input.GREEN_CARD_EFFECTS, (data: GreenCardEffects) => {
                this.log(`Player ${data.player} gets ${data.gains} coins and now has ${data.newMoney} coins.`);
                const p = this.findPlayer(data.player);
                p.money = data.newMoney;
                this.currentTurnPhase = TurnPhase.PurpleCards;
            })
            .on(events.input.BUILDING_POSSIBLE, () => {
                this.log('You can build now');
                this.currentTurnPhase = TurnPhase.Build;
            })
            .on(events.input.PLAYER_BOUGHT_CARD, (data: PlayerBoughtCard) => {
                this.log(`Player ${data.player} bought card ${data.card}`);

                const player = this.findPlayer(data.player);
                this.addCardToPlayer(player, data.card);

                // remove from table
                const card = this.table.buyableCards.find(cc => cc.card.cardName === data.card)!;
                card.count -= 1;
                if (card.count === 0) {
                    this.table.buyableCards = this.table.buyableCards.filter(cc => cc.card.cardName !== data.card);
                }

                this.currentTurnPhase = TurnPhase.EndTurn;
            })
            .on(events.input.AIRPORT_GAIN, ({ player }: AirportGain) => {
                this.log(`Player ${player} didn't build anything, they get 10 coins from Airport.`);
                const p = this.findPlayer(player);
                p.money += 10;
            })
            .on(events.input.AMUSEMENT_PARK_NEW_TURN, ({ player }: AmusementParkNewTurn) => {
                this.log(`Player ${player} gets a new turn because of Amusement Park`);
                this.resetDefaultValues();
            })
            .on(events.input.NEW_TURN, ({ oldPlayer, newPlayer }: NewTurn) => {
                this.log(`Player ${oldPlayer} finished turn, new player: ${newPlayer}`);
                this.activePlayerId = newPlayer;
                this.resetDefaultValues();
            })
            .on(events.input.PLAYER_LEFT_GAME, ({ playerId }: PlayerLeftGame) => {
                this.log(`Player ${playerId} has left the game.`);
                this.players = this.players.filter(p => p.id !== playerId);
            });
    }

    addCardToPlayer (player: Player, card: CardName) {
        let cost = -1;
        if (dominants.includes(card)) {
            const cardObj = player.winningCards.map(cc => cc.card).find(c => c.cardName === card)!;
            cardObj.bought = true;
            cost = cardObj.cost;
        } else if (this.playerHasCard(player, card)) {
            const cardObj = player.cards.find(cc => cc.card.cardName === card)!;
            cardObj.count += 1;
            cost = cardObj.card.cost;
        } else {
            const cardObj = this.table.buyableCards.map(cc => cc.card).find(c => c.cardName === card)!;
            player.cards.push({ card: cardObj, count: 1 });
            cost = cardObj.cost;
        }
        player.money -= cost;
        this.table.bank += cost;
    }
}
</script>

<style lang="scss">
.game {
    /*text-align: left;*/
}
.game-container {
    margin-bottom: 50px;
}

.container {
    margin: 0 auto;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
}

.title {
    font-family: 'Quicksand', 'Source Sans Pro', -apple-system,
        BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
        sans-serif;
    display: block;
    font-weight: 300;
    font-size: 100px;
    color: $base-color;
    letter-spacing: 1px;
}

.subtitle {
    font-weight: 300;
    font-size: 42px;
    color: #526488;
    word-spacing: 5px;
    padding-bottom: 15px;
}

.links {
    padding-top: 15px;
}
</style>
