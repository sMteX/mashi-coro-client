<template lang="pug">
    div
        // - dialogs - really need to figure out a better way to do it
        a-modal(v-if="loaded"
            title="Televizní studio"
            :visible="tvStudioModalVisible"
            :closable="false"
            :maskClosable="false"
            :cancelButtonProps="{ props: { disabled: true } }"
            :keyboard="false"
            okText="Potvrdit"
            cancelText="Zrušit"
            @ok="tvStudioModalOk")
            p Vyberte hráče, kterému vezmete 5 mincí:
            a-radio-group(v-model="tvStudioTarget")
                a-radio(v-for="(player, index) in tvStudioModalTargets"
                        :key="index"
                        :value="player.id")
                    | {{ player.name }} - {{ player.money }} mincí
        a-modal(v-if="loaded"
            title="Kancelářská budova"
            :visible="officeBuildingModalVisible"
            okText="Potvrdit"
            cancelText="Zrušit"
            @ok="officeBuildingModalOk"
            @cancel="officeBuildingModalCancel")
            p Vyberte svoji kartu a pak hráče a jeho kartu, které si navzájem vyměníte. Pokud kartu hrát nechcete, zrušte dialog:
            a-select(size="large" placeholder="Vyberte svoji kartu" @change="onOfficeBuildingSelectChange" style="width: 300px; margin-bottom: 20px")
                a-select-option(v-for="(cardCount, index) in officeBuildingPlayerCards" :key="index" :value="cardCount.card.cardName")
                    | {{ cardCount.card.name }} ({{ cardCount.count }})
            // - TODO: popover? for both?
            a-cascader(size="large" placeholder="Vyberte hráče a jeho kartu" :options="officeBuildingItems" @change="onOfficeBuildingCascaderChange" style="width: 300px")
                // - template(slot="displayRender" slot-scope="{labels, selectedOptions}")

        a-col.game-container(span=18, offset=3)
            a-row(type="flex" justify="center")
                MachiKoroLogo
            a-row
                h1 Hra
                a-row
                    h3 Hráči:
                    ul
                        li(v-for="player in players")
                            span {{ player.name }}
                a-row(v-if="messages.length > 0")
                    h3 Zprávy:
                    ul
                        li(v-for="message in lastMessages") {{ message }}
                a-row.delimiter
                a-row.game(v-if="loaded")
                    a-row
                        h2(v-show="isPlayerOnTurn") Jste na tahu.
                        h2(v-show="!isPlayerOnTurn") Právě je na tahu hráč {{ currentPlayer.name }}
                        p Fáze tahu: {{ turnPhases[currentTurnPhase] }}
                    a-row
                        h3 Akce
                        a-button.action-button(v-for="(button, index) in buttons" v-show="button.isVisible()" :key="index" :disabled="!button.isActive()" @click="button.handler") {{ button.text }}
                    a-row
                        h3 Kostky
                        div(:style="{ height: '50px' }")
                            div(v-show="currentTurnPhase >= 2 && chosenAmountOfDice === 1")
                                p Kostka: {{ dice.first }}
                            div(v-show="currentTurnPhase >= 2 && chosenAmountOfDice === 2")
                                p První kostka: {{ dice.first }}
                                p Druhá kostka: {{ dice.second }}
                                p Součet: {{ dice.sum }}
                    a-row.delimiter
                    a-row
                        a-col(span=12)
                            a-row
                                a-row
                                    h2 Vy
                                a-row
                                    p Peníze: {{ thisPlayer.money }}
                                a-row
                                    // - dominants
                                    a-row(type="flex" justify="start" :gutter=16)
                                        Card(v-for="(card, index) in playerCards(thisPlayer)[0]" :info="card" :key="index" :clickable="isCardClickable(card)" :clickEvent="buyCard" :location="cardLocation.Player")
                                    // - normal cards
                                    a-row(type="flex" justify="start" :gutter=16 v-for="(row, rowIndex) in playerCards(thisPlayer).slice(1)" :key="rowIndex")
                                        Card(v-for="(card, index) in row" :info="card" :key="index" :location="cardLocation.Player")
                            a-row.delimiter
                            a-row
                                a-row
                                    h3 Dostupné karty:
                                a-row
                                    a-row(type="flex" justify="space-around" v-for="(row, rowIndex) in buyableCardsTable" :key="rowIndex")
                                        Card(v-for="(card, index) in row" :info="card" :key="index" :clickable="isCardClickable(card)" :clickEvent="buyCard" :location="cardLocation.Table")
                        a-col(span=11 offset=1)
                            PlayerCards(v-for="(player, index) in otherPlayers" :key="index" :player="player")

</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import * as _ from 'lodash';
import Logo from '~/components/Logo.vue';
import MachiKoroLogo from '~/components/MachiKoroLogo.vue';
import { events as eventConstants } from '~/utils/constants';
import {
    ActivePurpleCardEffects,
    AirportGain,
    AmusementParkNewTurn,
    BlueCardEffects,
    CardCount,
    DiceRollOutput,
    GameDataLoad,
    GreenCardEffects,
    NewTurn, OfficeBuildingEffect,
    PassivePurpleCardEffects,
    PlayerBoughtCard,
    PlayerLeftGame,
    PlayerWonGame,
    RedCardEffects, StadiumEffect
} from '~/utils/interfaces/events/game/input.interface';
import PlayerCards from '~/components/PlayerCards.vue';
import Card from '~/components/Card.vue';
import { Card as CardInterface, CardColor, CardLocation, CardName, CardSymbol } from '~/utils/cards';

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
    isVisible: () => boolean;
    handler: () => void;
    isActive: () => boolean;
}

const dominants = [CardName.Station, CardName.ShoppingCenter, CardName.AmusementPark, CardName.Transmitter];

@Component({
    components: {
        MachiKoroLogo,
        Logo,
        Card,
        PlayerCards
    },
    head: {
        title: 'Game'
    }
})
export default class GamePage extends Vue {
    private activePurpleResults: { [card in CardName]?: any } = {};
    // dialog stuff
    private tvStudioModalVisible = false;
    private tvStudioTarget = -1;
    private officeBuildingModalVisible = false;
    private officeBuildingTarget = {
        targetPlayerId: -1,
        swapCardOwn: -1,
        swapCardTarget: -1
    };

    private cardDb!: {
        [name in CardName]: Omit<CardInterface, 'bought'>;
    };

    private cardLocation = CardLocation;
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

    private _buttons: ActionButton[] = [];

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
        // this.dummySetup = true;
        // without it is temporarily allowed through dummy data
        // this.useDummyData();
        // TODO: redirect if player didn't come from lobby (or maybe just don't use pages for this, but instead giant components that just get switched?)
        this.socket = io.connect(
            `${process.env.serverUrl}/${events.namespaceName}`
        );
        this.gameSlug = this.$route.query.id as string;
        this.setupHandlers();
        this.socket.emit(events.output.PLAYER_CONNECT, {
            game: this.gameSlug,
            id: Number(this.$route.query.playerId)
        });
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
        let purpleCheck = true;
        if (card.color === CardColor.Purple) {
            purpleCheck = !this.playerHasCard(this.thisPlayer, card.cardName);
        }
        return this.isPlayerOnTurn &&
                purpleCheck &&
                this.currentTurnPhase === TurnPhase.Build &&
                !this.alreadyBought &&
                this.thisPlayer.money >= card.cost;
    }

    // <editor-fold desc="Action buttons">
    // <editor-fold desc="button handlers">
    rollOneDice () {
        this.log('Hozeno jednou kostkou.');
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
        this.log('Hozeno dvěma kostkami.');
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
        this.log('Kostky ponechány.');
        if (!this.dummySetup) {
            this.alreadyUsedTransmitter = true; // technically "used", we used the CHOICE to not roll again
            this.socket.emit(events.output.END_ROLL, {
                game: this.gameSlug,
                playerId: this.thisPlayer.id
            });
        }
    }

    rollAgain () {
        this.log('Hozeno znovu.');
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
        this.log('Tah ukončen.');
        if (!this.dummySetup) {
            // TODO: check for IT Center if player has it and has money (just a simple confirm - do you want to add a coin to this card before ending turn?)
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
        return this.isPlayerOnTurn && this.currentTurnPhase === TurnPhase.DiceChoice;
        // return true;
    }

    get isRollTwoDiceActive (): boolean {
        return this.isPlayerOnTurn && this.currentTurnPhase === TurnPhase.DiceChoice; // technically a check for Station but the button should be already hidden without Station
        // return true;
    }

    get isKeepDiceActive (): boolean {
        return this.isPlayerOnTurn && this.currentTurnPhase === TurnPhase.PostRoll && !this.alreadyUsedTransmitter;
        // return true;
    }

    get isRollAgainActive (): boolean {
        return this.isPlayerOnTurn && this.currentTurnPhase === TurnPhase.PostRoll && !this.alreadyUsedTransmitter;
        // return true;
    }

    get isAddTwoToRollActive (): boolean {
        // TODO: active in PostRoll phase (after check for second roll and 10 - 12 in roll value)
        return false;
    }

    get isEndTurnActive (): boolean {
        return this.isPlayerOnTurn && this.currentTurnPhase > TurnPhase.PurpleCards;
        // return this.currentTurnPhase === TurnPhase.PostBuild || this.currentTurnPhase === TurnPhase.EndTurn;
        // return true;
    }
    // </editor-fold>

    get buttons () {
        return this.$data._buttons
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

    private avg (dice: number[]): number {
        return dice.reduce((acc, cur) => acc + cur, 0) / (dice.length || 1);
    }

    get buyableCardsTable (): CardCount[][] {
        return _.chunk(this.table.buyableCards.sort((a, b) => this.avg(a.card.triggerNumbers) - this.avg(b.card.triggerNumbers)), 5);
    }

    playerCards (player: Player): CardCount[][] {
        const cards: CardCount[][] = [];
        cards.push([...player.winningCards]);
        cards.push([...player.cards.filter(({ card }) => card.color === CardColor.Red || card.color === CardColor.Blue).sort((a, b) => this.avg(a.card.triggerNumbers) - this.avg(b.card.triggerNumbers))]);
        cards.push([...player.cards.filter(({ card }) => card.color === CardColor.Green || card.color === CardColor.Purple).sort((a, b) => this.avg(a.card.triggerNumbers) - this.avg(b.card.triggerNumbers))]);
        return cards;
    }

    get lastMessages (): string[] {
        return this.messages.slice(-5);
    }

    log (message: string, display: boolean = false) {
        this.messages.push(message);
        if (display) {
            this.$message.info(message, 5);
        }
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

    playerName (id: number|string) {
        const _id = typeof id === 'string' ? Number(id) : id;
        return this.findPlayer(_id).name;
    }

    cardName (card: CardName) {
        return this.cardDb[card].name;
    }

    get currentPlayer (): Player {
        if (this.dummySetup) {
            return this.players[0];
        }
        return this.findPlayer(this.activePlayerId);
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
            // cardDb
            cardDb: {
                [CardName.WheatField]: {
                    cardName: 0,
                    name: 'Pšeničné pole',
                    cost: 1,
                    description: 'Vezměte si 1 minci z banku',
                    symbol: 0,
                    color: 1,
                    triggerNumbers: [
                        1
                    ]
                },
                [CardName.Farm]: {
                    cardName: 1,
                    name: 'Statek',
                    cost: 1,
                    description: 'Vezměte si 1 minci z banku',
                    symbol: 2,
                    color: 1,
                    triggerNumbers: [
                        2
                    ]
                },
                [CardName.Bakery]: {
                    cardName: 2,
                    name: 'Pekárna',
                    cost: 1,
                    description: 'Vezměte si 1 minci z banku',
                    symbol: 1,
                    color: 0,
                    triggerNumbers: [
                        2,
                        3
                    ]
                },
                [CardName.CoffeeShop]: {
                    cardName: 3,
                    name: 'Kavárna',
                    cost: 2,
                    description: 'Dostanete 1 minci od hráče na tahu',
                    symbol: 3,
                    color: 2,
                    triggerNumbers: [
                        3
                    ]
                },
                [CardName.Shop]: {
                    cardName: 4,
                    name: 'Samoobsluha',
                    cost: 2,
                    description: 'Vezměte si 3 mince z banku',
                    symbol: 1,
                    color: 0,
                    triggerNumbers: [
                        4
                    ]
                },
                [CardName.Forest]: {
                    cardName: 5,
                    name: 'Les',
                    cost: 3,
                    description: 'Vezměte si 1 minci z banku',
                    symbol: 4,
                    color: 1,
                    triggerNumbers: [
                        5
                    ]
                },
                [CardName.Stadium]: {
                    cardName: 6,
                    name: 'Stadión',
                    cost: 6,
                    description: 'Dostanete 2 mince od každého soupeře',
                    symbol: 5,
                    color: 3,
                    triggerNumbers: [
                        6
                    ]
                },
                [CardName.TelevisionStudio]: {
                    cardName: 7,
                    name: 'Televizní studio',
                    cost: 7,
                    description: 'Dostanete 5 mincí od zvoleného soupeře',
                    symbol: 5,
                    color: 3,
                    triggerNumbers: [
                        6
                    ]
                },
                [CardName.OfficeBuilding]: {
                    cardName: 8,
                    name: 'Kancelářská budova',
                    cost: 8,
                    description: `Můžete vyměnit jednu svoji kartu objektu za soupeřovu (nelze měnit #SYMBOL_${CardSymbol.Tower})`,
                    symbol: 5,
                    color: 3,
                    triggerNumbers: [
                        6
                    ]
                },
                [CardName.DairyShop]: {
                    cardName: 9,
                    name: 'Mlékárna',
                    cost: 5,
                    description: `Za každý svůj objekt #SYMBOL_${CardSymbol.Pig} si vezměte 3 mince z banku.`,
                    symbol: 6,
                    color: 0,
                    triggerNumbers: [
                        7
                    ]
                },
                [CardName.FurnitureFactory]: {
                    cardName: 10,
                    name: 'Továrna na nábytek',
                    cost: 3,
                    description: `Za každý svůj objekt #SYMBOL_${CardSymbol.Cog} si vezměte 3 mince z banku`,
                    symbol: 6,
                    color: 0,
                    triggerNumbers: [
                        8
                    ]
                },
                [CardName.Mine]: {
                    cardName: 11,
                    name: 'Důl',
                    cost: 6,
                    description: 'Vezměte si 5 mincí z banku',
                    symbol: 4,
                    color: 1,
                    triggerNumbers: [
                        9
                    ]
                },
                [CardName.ApplePark]: {
                    cardName: 12,
                    name: 'Jabloňový sad',
                    cost: 3,
                    description: 'Vezměte si 3 mince z banku',
                    symbol: 0,
                    color: 1,
                    triggerNumbers: [
                        10
                    ]
                },
                [CardName.Restaurant]: {
                    cardName: 13,
                    name: 'Restaurace',
                    cost: 3,
                    description: 'Dostanete 2 minci od hráče na tahu',
                    symbol: 3,
                    color: 2,
                    triggerNumbers: [
                        9,
                        10
                    ]
                },
                [CardName.Mall]: {
                    cardName: 14,
                    name: 'Obchodní dům',
                    cost: 2,
                    description: `Za každý svůj objekt #SYMBOL_${CardSymbol.Wheat} si vezměte 2 mince z banku`,
                    symbol: 8,
                    color: 0,
                    triggerNumbers: [
                        11,
                        12
                    ]
                },
                [CardName.Station]: {
                    cardName: 15,
                    name: 'Nádraží',
                    cost: 4,
                    description: 'Můžete házet jednou nebo dvěma kostkami.',
                    symbol: 5,
                    color: 4,
                    triggerNumbers: []
                },
                [CardName.ShoppingCenter]: {
                    cardName: 16,
                    name: 'Nákupní centrum',
                    cost: 10,
                    description: `Dostáváte-li příjmy za objekty #SYMBOL_${CardSymbol.Coffee} nebo #SYMBOL_${CardSymbol.Box}, dostanete za každý z nich o 1 minci více.`,
                    symbol: 5,
                    color: 4,
                    triggerNumbers: []
                },
                [CardName.AmusementPark]: {
                    cardName: 17,
                    name: 'Zábavní park',
                    cost: 16,
                    description: 'Pokud vám při hodu dvěma kostkami padnou stejná čísla, máte tah navíc.',
                    symbol: 5,
                    color: 4,
                    triggerNumbers: []
                },
                [CardName.Transmitter]: {
                    cardName: 18,
                    name: 'Vysílač',
                    cost: 22,
                    description: 'Jednou v každém tahu smíte znovu hodit kostkami.',
                    symbol: 5,
                    color: 4,
                    triggerNumbers: []
                }
            },
            players: [
                {
                    id: 9,
                    socketId: 'blah',
                    name: 'Chizu',
                    cards: [
                        { card: CardName.WheatField, count: 1 },
                        { card: CardName.Bakery, count: 1 }
                    ],
                    money: 3
                },
                {
                    id: 10,
                    socketId: 'blah2',
                    name: 'Gieen',
                    cards: [
                        { card: CardName.WheatField, count: 1 },
                        { card: CardName.Bakery, count: 1 }
                    ],
                    money: 3
                }
            ],
            buyableCards: [
                { card: CardName.WheatField, count: 6 },
                { card: CardName.Farm, count: 6 },
                { card: CardName.Bakery, count: 6 },
                { card: CardName.CoffeeShop, count: 6 },
                { card: CardName.Shop, count: 6 },
                { card: CardName.Forest, count: 6 },
                { card: CardName.Stadium, count: 4 },
                { card: CardName.TelevisionStudio, count: 4 },
                { card: CardName.OfficeBuilding, count: 4 },
                { card: CardName.DairyShop, count: 6 },
                { card: CardName.FurnitureFactory, count: 6 },
                { card: CardName.Mine, count: 6 },
                { card: CardName.ApplePark, count: 6 },
                { card: CardName.Restaurant, count: 6 },
                { card: CardName.Mall, count: 6 }
            ],
            winningCards: [
                ...dominants
            ],
            bank: 204
        };

        this.cardDb = Object.assign({}, data.cardDb);
        this.table.bank = data.bank;
        this.table.buyableCards = data.buyableCards.map(pair => ({
            card: {
                ...this.cardDb[pair.card],
                bought: false
            },
            count: pair.count
        }));
        this.activePlayerId = data.startingPlayerId;
        this.players.push(...data.players.map(player => ({
            id: player.id,
            socketId: player.socketId,
            name: player.name,
            money: player.money,
            cards: player.cards.map(pair => ({
                card: {
                    ...this.cardDb[pair.card],
                    bought: true
                },
                count: pair.count
            })),
            winningCards: data.winningCards.map(name => ({
                card: {
                    ...this.cardDb[name],
                    bought: false
                },
                count: 1
            }))
        })));
        this.setupActionButtons();
        this.loaded = true;
        this.started = true;
    }

    setupActionButtons () {
        this.$data._buttons = [
            {
                order: 0,
                text: 'Hod 1 kostkou',
                isVisible: () => this.isRollOneDiceVisible,
                handler: this.rollOneDice,
                isActive: () => this.isRollOneDiceActive
            },
            {
                order: 1,
                text: 'Hod 2 kostkami',
                isVisible: () => this.isRollTwoDiceVisible,
                handler: this.rollTwoDice,
                isActive: () => this.isRollTwoDiceActive
            },
            {
                order: 2,
                text: 'Nechat si kostky',
                isVisible: () => this.isKeepDiceVisible,
                handler: this.keepDice,
                isActive: () => this.isKeepDiceActive
            },
            {
                order: 3,
                text: 'Hodit znovu',
                isVisible: () => this.isRollAgainVisible,
                handler: this.rollAgain,
                isActive: () => this.isRollAgainActive
            },
            {
                order: 4,
                text: 'Přidat k hodu 2',
                isVisible: () => this.isAddTwoToRollVisible,
                handler: this.addTwoToRoll,
                isActive: () => this.isAddTwoToRollActive
            },
            {
                order: 5,
                text: 'Ukončit tah',
                isVisible: () => this.isEndTurnVisible,
                handler: this.endTurn,
                isActive: () => this.isEndTurnActive
            }
        ];
    }

    get tvStudioModalTargets () {
        return this.otherPlayers.map(({ id, name, money }) => ({ id, name, money }));
    }

    sendActivePurpleCardsResult () {
        this.socket.emit(events.output.ACTIVE_PURPLE_CARDS_INPUT, {
            game: this.gameSlug,
            playerId: this.thisPlayer.id,
            inputs: this.activePurpleResults
        });

        // reset all related values!
        this.activePurpleResults = {};
        this.tvStudioTarget = -1;
        this.officeBuildingTarget = {
            targetPlayerId: -1,
            swapCardOwn: -1,
            swapCardTarget: -1
        };
    }

    tvStudioModalOk () {
        if (this.tvStudioTarget === -1) {
            return;
        }
        this.activePurpleResults[CardName.TelevisionStudio] = this.tvStudioTarget;
        this.tvStudioModalVisible = false;

        // dice check probably unnecessary but it doesn't hurt to check again
        if (this.dice.sum === 6 && this.playerHasCard(this.thisPlayer, CardName.OfficeBuilding)) {
            this.officeBuildingModalVisible = true;
        } else {
            this.sendActivePurpleCardsResult();
        }
    }

    get officeBuildingPlayerCards () {
        return this.thisPlayer.cards.filter(cc => cc.card.color !== CardColor.Purple);
    }

    get officeBuildingItems () {
        return this.otherPlayers.map(player => ({
            value: player.id,
            label: player.name,
            children: player.cards
                .filter(cc => cc.card.color !== CardColor.Purple)
                .map(cc => ({
                    value: cc.card.cardName,
                    label: `${cc.card.name} (${cc.count})`
                }))
        }));
    }

    onOfficeBuildingSelectChange (value: number) {
        this.officeBuildingTarget.swapCardOwn = value as CardName;
    }

    onOfficeBuildingCascaderChange (value: number[]) {
        if (value.length !== 2) {
            return;
        }
        const [playerId, cardId] = value;
        this.officeBuildingTarget.targetPlayerId = playerId;
        this.officeBuildingTarget.swapCardTarget = cardId as CardName;
    }

    officeBuildingModalOk () {
        // TODO: do we need a more rigorous validity check?
        const valid = this.officeBuildingTarget.targetPlayerId !== -1 && this.officeBuildingTarget.swapCardTarget !== -1 && this.officeBuildingTarget.swapCardOwn !== -1;
        if (!valid) {
            return;
        }
        this.officeBuildingModalVisible = false;

        this.activePurpleResults[CardName.OfficeBuilding] = {
            // currentPlayerId is sent in the event itself
            targetPlayerId: this.officeBuildingTarget.targetPlayerId, // TODO: somehow from the cascader
            swapCardOwn: this.officeBuildingTarget.swapCardOwn, // TODO: somehow from the select
            swapCardTarget: this.officeBuildingTarget.swapCardTarget // TODO: somehow from the cascader
            // or ...this.officeBuildingTarget ?
        };
        this.sendActivePurpleCardsResult();
    }

    officeBuildingModalCancel () {
        this.officeBuildingModalVisible = false;
        this.sendActivePurpleCardsResult();
    }

    onActivePurpleCardWait () {
        /*
            this will get ugly
            The way AntDesign Modals work pretty much fucks us a lot. We can't implement a "wait" mechanic as usual prompt()
            so we must chain callbacks and send the results to the server in the very last callback instead of gathering the results nicely here

            let's recap cards that need user input:
                6 - Television Studio - current player gets 5 coins from selected player
                6 - Office Building - current player and selected player swap a card
                8 - Waste Water Plant - current player names a card, all players disable that card

            so in short, it's either:
                1 modal => send message to server
                    - open respective dialog, upon callback send message
                2 modals => open one => in callback open second => in callback send message to server
                    - this can happen only in 6, and TV studio is NOT OPTIONAL
                    - it's probably better to open TV studio first, since you can't dismiss this one
                        - in callback, if player ALSO has Office Building:
                            open Office Building dialog
                        - else:
                            send message
                    - in Office Building dialog:
                        - upon both OK and CANCEL - send message
        */
        const hasTv = this.playerHasCard(this.thisPlayer, CardName.TelevisionStudio);
        const hasOffice = this.playerHasCard(this.thisPlayer, CardName.OfficeBuilding);
        if (this.dice.sum === 6) {
            if (hasTv) {
                // TODO: show TV dialog FIRST, in its callback MAYBE Office Building dialog
                this.tvStudioModalVisible = true;
            } else if (hasOffice) {
                // TODO: show only Office Building dialog
                this.officeBuildingModalVisible = true;
            }
        }
        // TODO: else - waste water plant (8)
    }

    setupHandlers () {
        this.socket
            .on(events.input.GAME_DATA_LOAD, (data: GameDataLoad) => {
                console.log('Game starting soon, received data:', data);
                this.cardDb = Object.assign({}, data.cardDb);
                this.table.bank = data.bank;
                this.table.buyableCards = data.buyableCards.map(pair => ({
                    card: {
                        ...this.cardDb[pair.card],
                        bought: false
                    },
                    count: pair.count
                }));
                this.activePlayerId = data.startingPlayerId;
                this.players.push(...data.players.map(player => ({
                    id: player.id,
                    socketId: player.socketId,
                    name: player.name,
                    money: player.money,
                    cards: player.cards.map(pair => ({
                        card: {
                            ...this.cardDb[pair.card],
                            bought: true
                        },
                        count: pair.count
                    })),
                    winningCards: data.winningCards.map(name => ({
                        card: {
                            ...this.cardDb[name],
                            bought: false
                        },
                        count: 1
                    }))
                })));
                // has to be defined here, because getters are called before mounted()
                // get buttons() iterates through _buttons and calls isVisible(), which puts us back at the start
                this.setupActionButtons();
                this.loaded = true;
            })
            .on(events.input.GAME_STARTING, () => {
                this.log('Hra začíná.', true);
                this.started = true;
            })
            .on(events.input.DICE_ROLL_OUTPUT, (data: DiceRollOutput) => {
                this.log(`${this.playerName(data.player)} hodil ${data.transmitter ? 'znovu ' : ''}tyto kostky: ${data.dice.join(', ')}`);
                this.currentTurnPhase = TurnPhase.PostRoll;
                const [first, second] = data.dice;
                this.dice.first = first;
                this.dice.second = second;
                this.dice.sum = data.sum;

                if (this.isPlayerOnTurn && !this.playerHasCard(this.thisPlayer, CardName.Transmitter)) {
                    // TODO: handle Port
                    this.socket.emit(events.output.END_ROLL, {
                        game: this.gameSlug,
                        playerId: this.thisPlayer.id
                    });
                }
            })
            .on(events.input.FINAL_DICE_ROLL, (data: DiceRollOutput) => {
                if (this.playerHasCard(this.findPlayer(data.player), CardName.Transmitter)) {
                    // only if player has Transmitter and actually CAN change their mind, show this message
                    this.log(`Konečný hod hráče ${this.playerName(data.player)} je ${data.dice.join(', ')}`, true);
                }
                const [first, second] = data.dice;
                this.dice.first = first;
                this.dice.second = second;
                this.dice.sum = data.sum;
                this.currentTurnPhase = TurnPhase.RedCards;
            })
            .on(events.input.RED_CARD_EFFECTS, (data: RedCardEffects) => {
                const strings: string[] = [];
                Object.entries(data.result).forEach(([id, result]) => {
                    if (result.gains !== undefined && result.gains > 0) {
                        // someone stole something from player, show
                        strings.push(`${this.playerName(id)} získává ${result.gains} mincí od ${this.playerName(data.fromPlayer)} a má nyní ${result.newMoney} mincí.`);
                    }
                    const p = this.findPlayer(Number(id));
                    p.money = result.newMoney;
                });
                if (strings.length > 0) {
                    this.log('Červené karty: ' + strings.join(' '), true);
                }
                this.currentTurnPhase = TurnPhase.BlueGreenCards;
            })
            .on(events.input.BLUE_CARD_EFFECTS, (data: BlueCardEffects) => {
                const strings: string[] = [];
                Object.entries(data.result).forEach(([id, result]) => {
                    if (result.gains > 0) {
                        // someone stole something from player, show
                        strings.push(`${this.playerName(id)} získává ${result.gains} mincí a má nyní ${result.newMoney} mincí.`);
                    }
                    const p = this.findPlayer(Number(id));
                    p.money = result.newMoney;
                });
                if (strings.length > 0) {
                    this.log('Modré karty: ' + strings.join(' '), true);
                }
            })
            .on(events.input.GREEN_CARD_EFFECTS, (data: GreenCardEffects) => {
                if (data.gains > 0) {
                    this.log(`${this.playerName(data.player)} získává ${data.gains} mincí a má nyní ${data.newMoney} mincí.`, true);
                }
                const p = this.findPlayer(data.player);
                p.money = data.newMoney;
                this.currentTurnPhase = TurnPhase.PurpleCards;

                /* server side: after green cards are done, check if player has some purple cards that NEED user input (and are actually triggered)
                        exactly 50:50, 4 cards active, 4 cards passive
                        active: Office Building, Water Treatment Plant, TV Studio, IT Center
                        passive: Stadium, Financial Office, Park, Publishing House

                    after looking at the cards - if passive and active cards are activated (6 and 8 rolls), doesn't matter in which order they're activated
                    so just check for passive purple cards, trigger them if possible, then check for active cards, and possibly wait for player action
                */
            })
            .on(events.input.PASSIVE_PURPLE_CARD_EFFECTS, (data: PassivePurpleCardEffects) => {
                Object.entries(data.result).forEach(([id, result]) => {
                    if (result.gains !== undefined && result.gains > 0) {
                        // someone stole something from player, show
                        this.log(`Fialové karty: ${this.playerName(data.player)} získává ${result.gains} mincí od ostatních hráčů a má nyní ${result.newMoney} mincí.`, true);
                    }
                    const p = this.findPlayer(Number(id));
                    p.money = result.newMoney;
                });
                // still purple cards
            })
            // following event is separated because it's dealing with modals and I'd like to have the handlers somewhat "near" each other
            .on(events.input.ACTIVE_PURPLE_CARD_WAIT, this.onActivePurpleCardWait)
            .on(events.input.ACTIVE_PURPLE_CARD_RESULT, (data: ActivePurpleCardEffects) => {
                console.log('active purple card results', data);
                Object.entries(data.results).forEach(([cardName, result]) => {
                    const cardEnum = Number(cardName) as CardName;
                    if (cardEnum === CardName.OfficeBuilding) {
                        const typedResult = result as OfficeBuildingEffect;
                        // remove card from player, add to target player and vice versa
                        const sourcePlayer = this.findPlayer(typedResult.currentPlayerId);
                        const targetPlayer = this.findPlayer(typedResult.targetPlayerId);

                        this.removeCardFromPlayer(sourcePlayer, typedResult.swapCardOwn);
                        this.addCardToPlayer(targetPlayer, typedResult.swapCardOwn, false);

                        this.removeCardFromPlayer(targetPlayer, typedResult.swapCardTarget);
                        this.addCardToPlayer(sourcePlayer, typedResult.swapCardTarget, false);
                        this.log(`${sourcePlayer.name} vyměnil svoji kartu ${this.cardName(typedResult.swapCardOwn)} za ${this.cardName(typedResult.swapCardTarget)} od ${targetPlayer.name}.`, true);
                    } else if (cardEnum === CardName.Stadium) {
                        const typedResult = result as StadiumEffect;
                        this.findPlayer(typedResult.currentPlayerId).money = typedResult.currentPlayerMoney;
                        this.findPlayer(typedResult.targetPlayerId).money = typedResult.targetPlayerMoney;
                        this.log(`${this.playerName(typedResult.currentPlayerId)} získává ${typedResult.gain} mincí od ${this.playerName(typedResult.targetPlayerId)} a má nyní ${typedResult.currentPlayerMoney} mincí.`, true);
                    }
                });
            })
            .on(events.input.BUILDING_POSSIBLE, () => {
                if (this.isPlayerOnTurn) {
                    this.log('Nyní můžete stavět.', true);
                }
                this.currentTurnPhase = TurnPhase.Build;
            })
            .on(events.input.PLAYER_BOUGHT_CARD, (data: PlayerBoughtCard) => {
                this.log(`${this.playerName(data.player)} si koupil kartu ${this.cardName(data.card)}.`, true);

                const player = this.findPlayer(data.player);
                this.addCardToPlayer(player, data.card, true);

                // remove from table
                const card = this.table.buyableCards.find(cc => cc.card.cardName === data.card)!;
                card.count -= 1;
                if (card.count === 0) {
                    this.table.buyableCards = this.table.buyableCards.filter(cc => cc.card.cardName !== data.card);
                }

                this.currentTurnPhase = TurnPhase.EndTurn;
            })
            .on(events.input.AIRPORT_GAIN, ({ player }: AirportGain) => {
                this.log(`${this.playerName(player)} nic nepostavil, dostane 10 mincí za Letiště.`, true);
                const p = this.findPlayer(player);
                p.money += 10;
            })
            .on(events.input.AMUSEMENT_PARK_NEW_TURN, ({ player }: AmusementParkNewTurn) => {
                this.log(`${this.playerName(player)} hodil 2 stejné kostky, získává nový tah díky Zábavnímu parku.`, true);
                this.resetDefaultValues();
            })
            .on(events.input.NEW_TURN, ({ oldPlayer, newPlayer }: NewTurn) => {
                this.log(`${this.playerName(oldPlayer)} ukončil tah, nový hráč: ${this.playerName(newPlayer)}.`, true);
                this.activePlayerId = newPlayer;
                this.resetDefaultValues();
            })
            .on(events.input.PLAYER_LEFT_GAME, ({ playerId, newPlayer }: PlayerLeftGame) => {
                this.log(`${this.playerName(playerId)} opustil hru.`, true);
                // TODO: fix? broken?
                if (newPlayer !== undefined) {
                    this.log(`${this.playerName(playerId)} opustil hru. Jelikož byl právě na tahu, novým hráčem je ${this.playerName(newPlayer)}.`, true);
                    this.activePlayerId = newPlayer;
                }
                this.players = this.players.filter(p => p.id !== playerId);
            })
            .on(events.input.PLAYER_WON_GAME, ({ playerId }: PlayerWonGame) => {
                alert(`${this.playerName(playerId)} vyhrál hru!`);
                // TODO: something
            })
            .on(events.input.GAME_ENDED_EMPTY, () => {
                alert('Všichni ostatní hráči odešli, hra končí.');
                // TODO: something
            });
    }

    addCardToPlayer (player: Player, card: CardName, buying: boolean) {
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
            player.cards.push({ card: { ...cardObj, bought: true }, count: 1 });
            cost = cardObj.cost;
        }
        if (buying) {
            player.money -= cost;
            this.table.bank += cost;
        }
    }

    removeCardFromPlayer (player: Player, card: CardName) {
        // assumes player has this card
        const cardObj = player.cards.find(cc => cc.card.cardName === card)!;
        cardObj.count -= 1;

        if (cardObj.count === 0) {
            player.cards = player.cards.filter(cc => cc.card.cardName !== card);
        }
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
.action-button {
    margin-left: 10px;
}
.delimiter {
    margin-top: 15px;
    margin-bottom: 15px;
    /*border-bottom: 1px lightgray solid;*/
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
