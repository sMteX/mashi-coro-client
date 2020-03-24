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
            width="400px"
            @ok="tvStudioModalOk")
            p Vyberte hráče, kterému vezmete 5 mincí:
            a-select(v-model="tvStudioTarget" size="large" style="width: 250px" placeholder="Vyberte hráče")
                a-select-option(:value="-1" disabled hidden) Vyberte hráče
                a-select-option(v-for="(player, index) in tvStudioModalTargets" :key="index" :value="player.id")
                    | {{ player.name }} - {{ formatCoins(player.money, true) }}
        a-modal(v-if="loaded"
            title="Kancelářská budova"
            :visible="officeBuildingModalVisible"
            okText="Potvrdit"
            cancelText="Zrušit"
            @ok="officeBuildingModalOk"
            @cancel="officeBuildingModalCancel"
            width="500px")
            p Vyberte svoji kartu a pak hráče a jeho kartu, které si navzájem vyměníte. Pokud kartu hrát nechcete, zrušte dialog:
            a-select(v-model="officeBuildingTarget.swapCardOwn" size="large" placeholder="Vyberte svoji kartu" style="width: 300px; margin-bottom: 20px")
                a-select-option(:value="-1" disabled hidden) Vyberte svoji kartu
                a-select-option(v-for="(cardCount, index) in officeBuildingPlayerCards" :key="index" :value="cardCount.card.cardName")
                    | {{ cardCount.card.name }} ({{ cardCount.count }})
            // - TODO: popover? for both?
            a-cascader(size="large" placeholder="Vyberte hráče a jeho kartu" :options="officeBuildingItems" @change="onOfficeBuildingCascaderChange" style="width: 300px")
                // - template(slot="displayRender" slot-scope="{labels, selectedOptions}")
        a-modal(v-if="loaded"
            title="Čistička"
            :visible="waterTreatmentPlantModalVisible"
            okText="Potvrdit"
            cancelText="Zrušit"
            :closable="false"
            :maskClosable="false"
            :cancelButtonProps="{ props: { disabled: true } }"
            :keyboard="false"
            @ok="waterTreatmentPlantModalOk"
            width="500px")
            p Určete název objektu, který všichni hráči (i vy) postaví mimo provoz. Vy si vezmete 1 minci z banku za každý takto vyřazený objekt. Číslo v závorce udává, kolik takových objektů je právě ve hře u všech hráčů.
            a-select(v-model="waterTreatmentPlantCard" size="large" style="width: 300px")
                a-select-option(:value="-1" disabled hidden) Vyberte název objektu
                a-select-option(v-for="(cardCount, index) in waterTreatmentPlantItems" :key="index" :value="cardCount.card")
                    | {{ cardCount.name }} ({{ cardCount.count }})
        a-modal(v-if="loaded"
            title="Přepravní firma"
            :visible="logisticsCompanyModalVisible"
            okText="Potvrdit"
            cancelText="Zrušit"
            :closable="false"
            :maskClosable="false"
            :cancelButtonProps="{ props: { disabled: true } }"
            :keyboard="false"
            @ok="logisticsCompanyModalOk"
            width="550px")
            p Pro každou svoji kartu Přepravní firma určete protihráče, a jakou svoji kartu mu odevzdáte (můžete odevzdat i samotnou Přepravní firmu). Za každou takto odevzdanou kartu získáte 4 mince z banku.
            div.ant-row(v-for="selectIndex in logisticsCompanyCount" :key="selectIndex" style="margin-bottom: 10px")
                a-select(v-model="logisticsCompanyTargets[selectIndex - 1].player" size="large" style="width: 200px; margin-right: 10px")
                    a-select-option(:value="-1" disabled hidden) Vyberte protihráče
                    a-select-option(v-for="(player, index) in logisticCompanyPlayers" :key="index" :value="player.id")
                        | {{ player.name }}
                a-select(v-model="logisticsCompanyTargets[selectIndex - 1].card" size="large" style="width: 250px")
                    a-select-option(:value="-1" disabled hidden) Vyberte svoji kartu
                    a-select-option(v-for="(cardCount, index) in logisticCompanyCards" :key="index" :value="cardCount.id")
                        | {{ cardCount.name }} ({{ cardCount.count }})

        div.ant-col-4.sidebar-container(v-if="loaded")
            div.sidebar(:class="{ 'sidebar-blue': isPlayerOnTurn, 'sidebar-gray': !isPlayerOnTurn }")
                div.sidebar-content
                    div.ant-row
                        h2(v-show="isPlayerOnTurn") Jste na tahu.
                        h2(v-show="!isPlayerOnTurn") Hráč: {{ currentPlayer.name }}
                        p Fáze tahu: {{ turnPhases[currentTurnPhase] }}
                    div.ant-row
                        h3 Akce
                        div.ant-row-flex.ant-row-flex-center
                            button.action-button.ant-btn(v-for="(button, index) in buttons" :key="index" v-show="button.isVisible()" :disabled="!button.isActive()" @click="button.handler") {{ button.text }}
                    div.ant-row.delimiter
                    div.ant-row
                        h3 Kostky
                        div.ant-row-flex.ant-row-flex-start.gutter-16(:style="{ height: '50px' }")
                            Dice(ref="dice1" v-show="currentTurnPhase >= 1")
                            Dice(ref="dice2" v-show="currentTurnPhase >= 1 && chosenAmountOfDice === 2" second)
                    div.ant-row.delimiter
                    div.ant-row
                        h3 Peníze
                        ul
                            li Vy: {{ thisPlayer.money }}
                            li(v-for="(player, i) in otherPlayers" :key="i") {{ player.name }}: {{ player.money }}
        div.game-container.ant-col-18(:class="{ 'ant-col-offset-4': !loaded }")
            div.ant-row
                MachiKoroLogo.logo
            div.ant-row
                h1 Hra
                div.ant-row
                    h3 Hráči:
                    ul
                        li(v-for="player in players")
                            span {{ player.name }}
                div.ant-row(v-if="messages.length > 0")
                    h3 Zprávy:
                    ul
                        li(v-for="message in lastMessages") {{ message }}
                div.delimiter.ant-row
                div.game.ant-row(v-if="loaded")
                    div.ant-row
                        div.ant-row
                            h2 Vy
                        div.ant-row
                            p Peníze: {{ thisPlayer.money }}
                        div.ant-row
                            div.ant-row-flex.ant-row-flex-start.gutter-16(v-for="(row, rowIndex) in playerCards(thisPlayer)" :key="rowIndex")
                                // - dominants
                                template(v-if="rowIndex === 0")
                                    Card(v-for="(card, index) in row" :info="card" :key="index" :clickable="isCardClickable(card)" :clickEvent="buyCard" :location="cardLocation.Player")
                                // - normal cards
                                template(v-else)
                                    Card(v-for="(card, index) in row" :info="card" :key="index" :location="cardLocation.Player" :itCenter="thisPlayer.itCenterCoins")
                        div.delimiter.ant-row
                        div.ant-row
                            div.ant-row
                                h3 Dostupné karty:
                            TableCards(:cards="table.buyableCards" :clickableCheck="isCardClickable" :clickEvent="buyCard")
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
    AddedTwo,
    AirportGain,
    AmusementParkNewTurn,
    BlueCardEffects,
    CardCount,
    DiceRollOutput,
    GameDataLoad,
    GreenCardEffects,
    ItCenterCoin,
    LogisticsCompanyResult,
    NewTurn,
    OfficeBuildingEffect,
    PassivePurpleCardEffects,
    PlayerBoughtCard,
    PlayerLeftGame,
    PlayerWonGame,
    RedCardEffects,
    TelevisionStudioEffect,
    TownHallGain,
    WaterTreatmentPlantEffect
} from '~/utils/interfaces/events/game/input.interface';
import PlayerCards from '~/components/PlayerCards.vue';
import Card from '~/components/Card.vue';
import { Card as CardInterface, CardColor, CardLocation, CardName } from '~/utils/cards';
import Dice from '~/components/Dice.vue';
import TableCards from '~/components/TableCards.vue';

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
    itCenterCoins: number;
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

const dominants = [CardName.TownHall, CardName.Port, CardName.Station, CardName.ShoppingCenter, CardName.AmusementPark, CardName.Transmitter, CardName.Airport];

@Component({
    components: {
        MachiKoroLogo,
        Logo,
        Card,
        PlayerCards,
        Dice,
        TableCards
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

    private waterTreatmentPlantModalVisible = false;
    private waterTreatmentPlantCard = -1;
    private logisticsCompanyModalVisible = false;
    // in order for the selects to v-model to it, the array must exist and be filled
    // one can't have more than 6 cards, so pre-populate with 6 "empty" objects - those are reset after sending the event
    private logisticsCompanyTargets = [
        { player: -1, card: -1 },
        { player: -1, card: -1 },
        { player: -1, card: -1 },
        { player: -1, card: -1 },
        { player: -1, card: -1 },
        { player: -1, card: -1 }
    ];

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
    private alreadyUsedPort: boolean = false;
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
        this.alreadyUsedPort = false;
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

    formatCoins (coins: number, nominative: boolean = false) {
        if (coins === 1) {
            if (nominative) {
                return `${coins} mince`;
            }
            return `${coins} minci`;
        }
        if (coins >= 2 && coins <= 4) {
            return `${coins} mince`;
        }
        return `${coins} mincí`;
    }

    get isPlayerOnTurn (): boolean {
        return this.started && this.thisPlayer.id === this.activePlayerId;
    }

    rollDices (result1: number, result2?: number) {
        // @ts-ignore
        this.$refs.dice1.changeValue(result1);
        if (result2) {
            // @ts-ignore
            this.$refs.dice2.changeValue(result2);
        }
    }

    buyCard (card: CardName) {
        // this shouldn't get called in wrong times, no need for checks?
        this.alreadyBought = true;
        this.socket.emit(events.output.BUY_CARD, {
            card,
            game: this.gameSlug,
            playerId: this.thisPlayer.id
        });
    }

    toggleCardActive (player: Player, card: CardName, newState?: boolean) {
        const cc = player.cards.find(c => c.card.cardName === card);
        if (cc) {
            if (newState === undefined) {
                cc.active = !cc.active;
            } else {
                cc.active = newState;
            }
        }
    }

    isCardClickable ({ card }: CardCount): boolean {
        let purpleDominantCheck = true;
        if (card.color === CardColor.Purple || card.color === CardColor.Dominant) {
            purpleDominantCheck = !this.playerHasCard(this.thisPlayer, card.cardName);
        }
        return this.isPlayerOnTurn &&
                purpleDominantCheck &&
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
            this.alreadyUsedPort = true;
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
        this.log('Přidáno 2 k hodu.');
        if (!this.dummySetup) {
            this.alreadyUsedPort = true;
            this.socket.emit(events.output.ADD_TWO, {
                game: this.gameSlug,
                playerId: this.thisPlayer.id
            });
        }
    }

    endTurn () {
        this.log('Tah ukončen.');
        if (!this.dummySetup) {
            this.emitEndTurn();
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
        return this.playerHasCard(this.thisPlayer, CardName.Transmitter) ||
            (this.playerHasCard(this.thisPlayer, CardName.Port) && this.playerHasCard(this.thisPlayer, CardName.Station));
        // return true;
    }

    get isRollAgainVisible (): boolean {
        return this.playerHasCard(this.thisPlayer, CardName.Transmitter);
        // return true;
    }

    get isAddTwoToRollVisible (): boolean {
        return this.playerHasCard(this.thisPlayer, CardName.Port) && this.playerHasCard(this.thisPlayer, CardName.Station);
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
        // TODO: something with Transmitter?
        return this.isPlayerOnTurn && this.currentTurnPhase === TurnPhase.PostRoll && this.dice.sum >= 10 && !this.alreadyUsedPort;
    }

    get isEndTurnActive (): boolean {
        return this.isPlayerOnTurn && this.currentTurnPhase > TurnPhase.PurpleCards && !this.alreadyBought;
    }
    // </editor-fold>

    get buttons () {
        return this.$data._buttons
            .sort((a: ActionButton, b: ActionButton) => a.order - b.order);
    }
    // </editor-fold>

    emitEndTurn () {
        if (this.playerHasCard(this.thisPlayer, CardName.ItCenter) && this.thisPlayer.money > 0) {
            this.$confirm({
                title: 'IT centrum',
                content: `Chcete přidat jednu minci na IT centrum? Právě máte ${this.formatCoins(this.thisPlayer.money)}. Na kartě máte momentálně ${this.formatCoins(this.thisPlayer.itCenterCoins)}.`,
                keyboard: true,
                maskClosable: true,
                onOk: () => {
                    this.socket.emit(events.output.END_TURN, {
                        useItCenter: true,
                        game: this.gameSlug,
                        playerId: this.thisPlayer.id
                    });
                },
                onCancel: () => {
                    this.socket.emit(events.output.END_TURN, {
                        useItCenter: false,
                        game: this.gameSlug,
                        playerId: this.thisPlayer.id
                    });
                }
            });
        } else {
            this.socket.emit(events.output.END_TURN, {
                useItCenter: false,
                game: this.gameSlug,
                playerId: this.thisPlayer.id
            });
        }
    }

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
        if (process.env.NODE_ENV === 'development') {
            console.log(message);
        }
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
            players: [
                {
                    id: 91,
                    socketId: '/game#9qoWZnXfL5k37ByDAAAD',
                    name: 'Chizu',
                    cards: [
                        {
                            card: 0,
                            count: 1
                        },
                        {
                            card: 4,
                            count: 1
                        }
                    ],
                    money: 3
                },
                {
                    id: 92,
                    socketId: '/game#qM64zPg90XWAbP9FAAAE',
                    name: 'Gieen',
                    cards: [
                        {
                            card: 0,
                            count: 1
                        },
                        {
                            card: 4,
                            count: 1
                        }
                    ],
                    money: 3
                }
            ],
            cardDb: {
                0: {
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
                1: {
                    cardName: 1,
                    name: 'Sushi Bar',
                    cost: 2,
                    description: 'Máte-li přístav, dostanete 3 mince od hráče na tahu.',
                    symbol: 3,
                    color: 2,
                    triggerNumbers: [
                        1
                    ]
                },
                2: {
                    cardName: 2,
                    name: 'Statek',
                    cost: 1,
                    description: 'Vezměte si 1 minci z banku',
                    symbol: 2,
                    color: 1,
                    triggerNumbers: [
                        2
                    ]
                },
                3: {
                    cardName: 3,
                    name: 'Hokynářství',
                    cost: 0,
                    description: 'Máte-li postavenou nejvýše 1 dominantu (kromě radnice), vezměte si 2 mince z banku.',
                    symbol: 1,
                    color: 0,
                    triggerNumbers: [
                        2
                    ]
                },
                4: {
                    cardName: 4,
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
                5: {
                    cardName: 5,
                    name: 'Kavárna',
                    cost: 2,
                    description: 'Dostanete 1 minci od hráče na tahu',
                    symbol: 3,
                    color: 2,
                    triggerNumbers: [
                        3
                    ]
                },
                6: {
                    cardName: 6,
                    name: 'Kukuřičné pole',
                    cost: 2,
                    description: 'Máte-li postavenou nejvýše 1 dominantu (kromě radnice), vezměte si 1 mince z banku.',
                    symbol: 0,
                    color: 1,
                    triggerNumbers: [
                        3,
                        4
                    ]
                },
                7: {
                    cardName: 7,
                    name: 'Květinová zahrada',
                    cost: 2,
                    description: 'Vezměte si 1 mince z banku.',
                    symbol: 0,
                    color: 1,
                    triggerNumbers: [
                        4
                    ]
                },
                8: {
                    cardName: 8,
                    name: 'Samoobsluha',
                    cost: 2,
                    description: 'Vezměte si 3 mince z banku',
                    symbol: 1,
                    color: 0,
                    triggerNumbers: [
                        4
                    ]
                },
                9: {
                    cardName: 9,
                    name: 'Luxusní restaurace',
                    cost: 3,
                    description: 'Má-li hráč na tahu postavené alespoň 2 dominanty (kromě radnice), dostanete od něj 5 mincí.',
                    symbol: 3,
                    color: 2,
                    triggerNumbers: [
                        5
                    ]
                },
                10: {
                    cardName: 10,
                    name: 'Les',
                    cost: 3,
                    description: 'Vezměte si 1 minci z banku',
                    symbol: 4,
                    color: 1,
                    triggerNumbers: [
                        5
                    ]
                },
                11: {
                    cardName: 11,
                    name: 'Květinářství',
                    cost: 2,
                    description: 'Za každou svoji květinovou zahradu si vezměte 1 minci z banku.',
                    symbol: 1,
                    color: 0,
                    triggerNumbers: [
                        6
                    ]
                },
                12: {
                    cardName: 12,
                    name: 'Stadión',
                    cost: 6,
                    description: 'Dostanete 2 mince od každého soupeře',
                    symbol: 5,
                    color: 3,
                    triggerNumbers: [
                        6
                    ]
                },
                13: {
                    cardName: 13,
                    name: 'Televizní studio',
                    cost: 7,
                    description: 'Dostanete 5 mincí od zvoleného soupeře',
                    symbol: 5,
                    color: 3,
                    triggerNumbers: [
                        6
                    ]
                },
                14: {
                    cardName: 14,
                    name: 'Kancelářská budova',
                    cost: 8,
                    description: 'Můžete vyměnit jednu svoji kartu objektu za soupeřovu (nelze měnit #SYMBOL_5)',
                    symbol: 5,
                    color: 3,
                    triggerNumbers: [
                        6
                    ]
                },
                15: {
                    cardName: 15,
                    name: 'Nakladatelství',
                    cost: 5,
                    description: 'Dostanete po 1 minci od každého soupeře za každý jeho objekt #SYMBOL_3 a #SYMBOL_1.',
                    symbol: 5,
                    color: 3,
                    triggerNumbers: [
                        7
                    ]
                },
                16: {
                    cardName: 16,
                    name: 'Vinohrad',
                    cost: 3,
                    description: 'Vezměte si 3 mincí z banku',
                    symbol: 0,
                    color: 1,
                    triggerNumbers: [
                        7
                    ]
                },
                17: {
                    cardName: 17,
                    name: 'Pizzerie',
                    cost: 1,
                    description: 'Dostanete 1 minci od hráče na tahu',
                    symbol: 3,
                    color: 2,
                    triggerNumbers: [
                        7
                    ]
                },
                18: {
                    cardName: 18,
                    name: 'Mlékárna',
                    cost: 5,
                    description: 'Za každý svůj objekt #SYMBOL_2 si vezměte 3 mince z banku',
                    symbol: 6,
                    color: 0,
                    triggerNumbers: [
                        7
                    ]
                },
                19: {
                    cardName: 19,
                    name: 'Čistička',
                    cost: 4,
                    description: 'Určete název objektu (ne však #SYMBOL_5). Každý hráč (i vy) všechny tyto objekty postaví mimo provoz. Vy si za každý z nich vezměte po 1 minci z banku.',
                    symbol: 5,
                    color: 3,
                    triggerNumbers: [
                        8
                    ]
                },
                20: {
                    cardName: 20,
                    name: 'Burger grill',
                    cost: 1,
                    description: 'Dostanete 1 minci od hráče na tahu',
                    symbol: 3,
                    color: 2,
                    triggerNumbers: [
                        8
                    ]
                },
                21: {
                    cardName: 21,
                    name: 'Továrna na nábytek',
                    cost: 3,
                    description: 'Za každý svůj objekt #SYMBOL_4 si vezměte 3 mince z banku',
                    symbol: 6,
                    color: 0,
                    triggerNumbers: [
                        8
                    ]
                },
                22: {
                    cardName: 22,
                    name: 'Rybářský člun',
                    cost: 2,
                    description: 'Máte-li přístav, vezměte si 3 mince z banku',
                    symbol: 7,
                    color: 1,
                    triggerNumbers: [
                        8
                    ]
                },
                23: {
                    cardName: 23,
                    name: 'Finanční úřad',
                    cost: 4,
                    description: 'Dostanete polovinu mincí (zaokrouhleno dolů od každého soupeře, který má aktuálně 10 a více mincí.',
                    symbol: 5,
                    color: 3,
                    triggerNumbers: [
                        8,
                        9
                    ]
                },
                24: {
                    cardName: 24,
                    name: 'Důl',
                    cost: 6,
                    description: 'Vezměte si 5 mincí z banku',
                    symbol: 4,
                    color: 1,
                    triggerNumbers: [
                        9
                    ]
                },
                25: {
                    cardName: 25,
                    name: 'Vinařství',
                    cost: 3,
                    description: 'Vezměte si z banku 6 mincí za každý svůj vinohrad. Vinařství poté postavte mimo provoz.',
                    symbol: 6,
                    color: 0,
                    triggerNumbers: [
                        9
                    ]
                },
                26: {
                    cardName: 26,
                    name: 'Přepravní firma',
                    cost: 2,
                    description: 'Odevzdejte libovolnému soupeři svůj libovolný objekt (ne však #SYMBOL_5). Za to si vezměte 4 mince z banku.',
                    symbol: 9,
                    color: 0,
                    triggerNumbers: [
                        9,
                        10
                    ]
                },
                27: {
                    cardName: 27,
                    name: 'Jabloňový sad',
                    cost: 3,
                    description: 'Vezměte si 3 mince z banku',
                    symbol: 0,
                    color: 1,
                    triggerNumbers: [
                        10
                    ]
                },
                28: {
                    cardName: 28,
                    name: 'IT centrum',
                    cost: 1,
                    description: 'Na konci svého tahu můžete na tuto kartu přidat 1 svou minci. Pokud padne "10", dostanete od každého soupeře tolik mincí, kolik jich na této kartě leží.',
                    symbol: 5,
                    color: 3,
                    triggerNumbers: [
                        10
                    ]
                },
                29: {
                    cardName: 29,
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
                30: {
                    cardName: 30,
                    name: 'Sodovkárna',
                    cost: 5,
                    description: 'Vezměte si po 1 minci z banku za každý objekt #SYMBOL_3 každého hráče (i svůj).',
                    symbol: 6,
                    color: 0,
                    triggerNumbers: [
                        11
                    ]
                },
                31: {
                    cardName: 31,
                    name: 'Park',
                    cost: 3,
                    description: 'Vezměte a nově rozdělte všechny mince všech hráčů mezi všechny hráče rovným dílem. Případné chybějící mince doplňte z banku.',
                    symbol: 5,
                    color: 3,
                    triggerNumbers: [
                        11,
                        12,
                        13
                    ]
                },
                32: {
                    cardName: 32,
                    name: 'Obchodní dům',
                    cost: 2,
                    description: 'Za každý svůj objekt #SYMBOL_0 si vezměte 2 mince z banku',
                    symbol: 8,
                    color: 0,
                    triggerNumbers: [
                        11,
                        12
                    ]
                },
                33: {
                    cardName: 33,
                    name: 'Velkoobchod s potravinami',
                    cost: 2,
                    description: 'Za každý svůj objekt #SYMBOL_3 si vezměte 2 mince z banku.',
                    symbol: 6,
                    color: 0,
                    triggerNumbers: [
                        12,
                        13
                    ]
                },
                34: {
                    cardName: 34,
                    name: 'Noční klub',
                    cost: 4,
                    description: 'Má-li hráč na tahu postavené alespoň 3 dominanty (kromě radnice), dostanete všechny jeho mince.',
                    symbol: 3,
                    color: 2,
                    triggerNumbers: [
                        12,
                        13,
                        14
                    ]
                },
                35: {
                    cardName: 35,
                    name: 'Rybářská loď',
                    cost: 5,
                    description: 'Máte-li přístav, hodí hráč na tahu dvěma kostkami. Vezměte si tolik mincí z banku, kolik na kostkách padlo.',
                    symbol: 7,
                    color: 1,
                    triggerNumbers: [
                        12,
                        13,
                        14
                    ]
                },
                36: {
                    cardName: 36,
                    name: 'Radnice',
                    cost: 0,
                    description: 'Nemáte-li před krokem Stavba ve svém tahu žádné peníze, vezměte si 1 minci z banku.',
                    symbol: 5,
                    color: 4,
                    triggerNumbers: []
                },
                37: {
                    cardName: 37,
                    name: 'Přístav',
                    cost: 2,
                    description: 'Padne-li vám na kostkách 10 a více, smíte k výsledku hodu přičíst 2.',
                    symbol: 5,
                    color: 4,
                    triggerNumbers: []
                },
                38: {
                    cardName: 38,
                    name: 'Nádraží',
                    cost: 4,
                    description: 'Můžete házet jednou nebo dvěma kostkami.',
                    symbol: 5,
                    color: 4,
                    triggerNumbers: []
                },
                39: {
                    cardName: 39,
                    name: 'Nákupní centrum',
                    cost: 10,
                    description: 'Dostáváte-li příjmy za objekty #SYMBOL_3 nebo #SYMBOL_1, dostanete za každý z nich o 1 minci více.',
                    symbol: 5,
                    color: 4,
                    triggerNumbers: []
                },
                40: {
                    cardName: 40,
                    name: 'Zábavní park',
                    cost: 16,
                    description: 'Pokud vám při hodu dvěma kostkami padnou stejná čísla, máte tah navíc.',
                    symbol: 5,
                    color: 4,
                    triggerNumbers: []
                },
                41: {
                    cardName: 41,
                    name: 'Vysílač',
                    cost: 22,
                    description: 'Jednou v každém tahu smíte znovu hodit kostkami.',
                    symbol: 5,
                    color: 4,
                    triggerNumbers: []
                },
                42: {
                    cardName: 42,
                    name: 'Letiště',
                    cost: 30,
                    description: 'Nepostavíte-li ve svém tahu žádný objekt ani dominantu, vezměte si 10 mincí z banku.',
                    symbol: 5,
                    color: 4,
                    triggerNumbers: []
                }
            },
            buyableCards: [
                {
                    count: 1,
                    card: 1
                },
                {
                    count: 1,
                    card: 2
                },
                {
                    count: 1,
                    card: 3
                },
                {
                    count: 1,
                    card: 8
                },
                {
                    count: 1,
                    card: 9
                },
                {
                    count: 1,
                    card: 18
                },
                {
                    count: 1,
                    card: 24
                },
                {
                    count: 1,
                    card: 27
                },
                {
                    count: 1,
                    card: 32
                },
                {
                    count: 1,
                    card: 33
                },
                {
                    count: 1,
                    card: 13
                },
                {
                    count: 1,
                    card: 14
                }
            ],
            winningCards: [
                36,
                37,
                38,
                39,
                40,
                41,
                42
            ],
            bank: 204,
            startingPlayerId: 92
        };

        this.cardDb = Object.assign({}, data.cardDb);
        this.table.bank = data.bank;
        this.table.buyableCards = data.buyableCards.map(pair => ({
            card: {
                ...this.cardDb[pair.card],
                bought: false
            },
            count: pair.count,
            active: true
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
                count: pair.count,
                active: true
            })),
            winningCards: data.winningCards.map(name => ({
                card: {
                    ...this.cardDb[name],
                    bought: (name === CardName.TownHall) // everyone starts with Town Hall
                },
                count: 1,
                active: true
            })),
            itCenterCoins: 0
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
        this.waterTreatmentPlantCard = -1;
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
                .filter(({ card, active }) => card.color !== CardColor.Purple && active)
                .map(({ card, count }) => ({
                    value: card.cardName,
                    label: `${card.name} (${count})`
                }))
        }));
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
        const valid = this.officeBuildingTarget.targetPlayerId !== -1 && this.officeBuildingTarget.swapCardTarget !== -1 && this.officeBuildingTarget.swapCardOwn !== -1;
        if (!valid) {
            return;
        }
        this.officeBuildingModalVisible = false;

        this.activePurpleResults[CardName.OfficeBuilding] = {
            // currentPlayerId is sent in the event itself
            targetPlayerId: this.officeBuildingTarget.targetPlayerId,
            swapCardOwn: this.officeBuildingTarget.swapCardOwn,
            swapCardTarget: this.officeBuildingTarget.swapCardTarget
            // or ...this.officeBuildingTarget ?
        };
        this.sendActivePurpleCardsResult();
    }

    officeBuildingModalCancel () {
        this.officeBuildingModalVisible = false;
        this.officeBuildingTarget = {
            targetPlayerId: -1,
            swapCardOwn: -1,
            swapCardTarget: -1
        };
        this.sendActivePurpleCardsResult();
    }

    get waterTreatmentPlantItems () {
        // cards and how many are there active? (how many coins we can get from them)
        const counts: {[card in CardName]?: number} = {};
        // Object.values(this.cardDb).forEach((card) => {
        //     if (card.color !== CardColor.Dominant && card.color !== CardColor.Purple) {
        //         // technically we can pick any object, not only those that someone has (it makes no sense but that's not our problem)
        //         counts[card.cardName] = 0;
        //     }
        // });
        this.players.flatMap(player => player.cards).forEach(({ card, count, active }) => {
            if (card.color !== CardColor.Purple && active) {
                counts[card.cardName] = (counts[card.cardName] || 0) + count;
            }
        });
        return Object.entries(counts).map(([cardName, count]) => {
            const card = this.cardDb[Number(cardName) as CardName];
            return {
                count,
                card: card.cardName,
                name: card.name
            };
        });
    }

    waterTreatmentPlantModalOk () {
        if (this.waterTreatmentPlantCard === -1) {
            return;
        }
        this.activePurpleResults[CardName.WaterTreatmentPlant] = this.waterTreatmentPlantCard;
        this.waterTreatmentPlantModalVisible = false;

        this.sendActivePurpleCardsResult();
    }

    get logisticsCompanyCount () {
        return this.thisPlayer.cards.find(cc => cc.card.cardName === CardName.LogisticsCompany)?.count || 0;
    }

    logisticsCompanyModalOk () {
        const count = this.logisticsCompanyCount;
        // in the first {count} entries of logisticsCompanyTargets, there can't be any -1 (the other are pre-populated and are supposed to be empty - it's for v-model binding)
        // and the player must have enough of those cards selected
        const cardCounts: {[card: number]: number} = {};
        let valid = true;
        // first, check for -1, save which cards are we giving away
        for (let i = 0; i < count; i += 1) {
            const { player, card } = this.logisticsCompanyTargets[i];
            if (player === -1 || card === -1) {
                valid = false;
                break;
            }
            cardCounts[card] = (cardCounts[card] || 0) + 1;
        }
        if (!valid) {
            return;
        }
        // make sure we have enough of selected cards (the card selects are independent)
        Object.entries(cardCounts).forEach(([cardIndex, count]) => {
            const realCount = this.thisPlayer.cards.find(({ card }) => card.cardName === Number(cardIndex))!.count;
            if (count > realCount) {
                valid = false;
                return false;
            }
        });
        if (!valid) {
            return;
        }
        this.logisticsCompanyModalVisible = false;

        // filter only first {count} targets from the array
        this.socket.emit(events.output.LOGISTIC_COMPANY_INPUT, {
            game: this.gameSlug,
            playerId: this.thisPlayer.id,
            args: this.logisticsCompanyTargets.slice(0, count)
        });

        // reset all values (technically first {count} but who cares)
        for (let i = 0; i < 6; i += 1) {
            this.logisticsCompanyTargets[i] = { player: -1, card: -1 };
        }
    }

    get logisticCompanyPlayers () {
        return this.otherPlayers.map(({ id, name }) => ({ id, name }));
    }

    get logisticCompanyCards () {
        return this.thisPlayer.cards
            .filter(({ card, active }) => card.color !== CardColor.Purple && active)
            .map(cc => ({ id: cc.card.cardName, name: cc.card.name, count: cc.count }));
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
                this.tvStudioModalVisible = true;
            } else if (hasOffice) {
                this.officeBuildingModalVisible = true;
            }
        } else {
            this.waterTreatmentPlantModalVisible = true;
        }
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
                    count: pair.count,
                    active: true
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
                        count: pair.count,
                        active: true
                    })),
                    winningCards: data.winningCards.map(name => ({
                        card: {
                            ...this.cardDb[name],
                            bought: (name === CardName.TownHall) // everyone starts with Town Hall
                        },
                        count: 1,
                        active: true
                    })),
                    itCenterCoins: 0
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
                this.currentTurnPhase = TurnPhase.DiceRoll;
                this.chosenAmountOfDice = data.dice.length;
                const [first, second] = data.dice;
                this.dice.first = first;
                this.dice.second = second;
                this.dice.sum = data.sum;
                this.rollDices(this.dice.first, this.dice.second);

                setTimeout(() => {
                    // roll animation should take around 1 second, show things AFTER the animation ends
                    this.currentTurnPhase = TurnPhase.PostRoll;
                    this.log(`${this.playerName(data.player)} hodil/a ${data.transmitter ? 'znovu ' : ''}tyto kostky: ${data.dice.join(', ')}`);

                    const hasTransmitter = this.playerHasCard(this.thisPlayer, CardName.Transmitter);
                    const hasPort = this.playerHasCard(this.thisPlayer, CardName.Port);
                    const canUsePort = hasPort && this.dice.sum >= 10;
                    if (this.isPlayerOnTurn && ((!hasTransmitter && !canUsePort) || (hasTransmitter && this.alreadyUsedTransmitter && !canUsePort))) {
                        // automatically ends turn if player rolled dice and either:
                        //  - doesn't have Transmitter and can't use (or doesn't have) Port
                        //  - has Transmitter, already used it, and can't use (or doesn't have) Port

                        this.socket.emit(events.output.END_ROLL, {
                            game: this.gameSlug,
                            playerId: this.thisPlayer.id
                        });
                    }
                }, 1100);
            })
            .on(events.input.ADDED_TWO, (data: AddedTwo) => {
                this.log(`${this.playerName(data.player)} přidal/a ke svému hodu 2, nyní je jeho/její hod ${data.sum}.`, true);
            })
            .on(events.input.FINAL_DICE_ROLL, (data: DiceRollOutput) => {
                if (this.playerHasCard(this.findPlayer(data.player), CardName.Transmitter)) {
                    // only if player has Transmitter and actually CAN change their mind, show this message
                    this.log(`Konečný hod ${this.playerName(data.player)} je ${data.dice.join(', ')} (${data.sum}).`, true);
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
                        strings.push(`${this.playerName(id)} získává ${this.formatCoins(result.gains)} od ${this.playerName(data.fromPlayer)} a má nyní ${this.formatCoins(result.newMoney)}.`);
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
                        strings.push(`${this.playerName(id)} získává ${this.formatCoins(result.gains)} a má nyní ${this.formatCoins(result.newMoney)}.`);
                    }
                    const p = this.findPlayer(Number(id));
                    p.money = result.newMoney;
                });
                if (strings.length > 0) {
                    this.log('Modré karty: ' + strings.join(' '), true);
                }
            })
            .on(events.input.GREEN_CARD_EFFECTS, (data: GreenCardEffects) => {
                // TODO: Logistics Company
                if (data.gains > 0) {
                    this.log(`Zelené karty: ${this.playerName(data.player)} získává ${this.formatCoins(data.gains)} a má nyní ${this.formatCoins(data.newMoney)}.`, true);
                }
                const p = this.findPlayer(data.player);
                p.money = data.newMoney;
                if (data.wineryToggled) {
                    this.toggleCardActive(p, CardName.Winery);
                }
                if (!this.playerHasCard(this.thisPlayer, CardName.LogisticsCompany)) {
                    this.currentTurnPhase = TurnPhase.PurpleCards;
                }

                /* server side: after green cards are done, check if player has some purple cards that NEED user input (and are actually triggered)
                        exactly 50:50, 4 cards active, 4 cards passive
                        active: Office Building, Water Treatment Plant, TV Studio, IT Center
                        passive: Stadium, Financial Office, Park, Publishing House

                    after looking at the cards - if passive and active cards are activated (6 and 8 rolls), doesn't matter in which order they're activated
                    so just check for passive purple cards, trigger them if possible, then check for active cards, and possibly wait for player action
                */
            })
            .on(events.input.LOGISTICS_COMPANY_WAIT, () => {
                this.logisticsCompanyModalVisible = true;
            })
            .on(events.input.LOGISTICS_COMPANY_RESULT, (data: LogisticsCompanyResult) => {
                // TODO: remove given cards from player, give them to target player
                const sourcePlayer = this.findPlayer(data.sourcePlayer);
                const strings: string[] = [];
                data.playersAndCards.forEach(({ player, card }) => {
                    const targetPlayer = this.findPlayer(player);

                    this.removeCardFromPlayer(sourcePlayer, card);
                    this.addCardToPlayer(targetPlayer, card, false);

                    sourcePlayer.money += 4;
                    strings.push(`${sourcePlayer.name} odevzdal/a svoji kartu ${this.cardName(card)} hráči ${targetPlayer.name} a získává ${this.formatCoins(4)}.`);
                });
                this.log(strings.join(' '), true);
                this.currentTurnPhase = TurnPhase.PurpleCards;
            })
            .on(events.input.PASSIVE_PURPLE_CARD_EFFECTS, (data: PassivePurpleCardEffects) => {
                Object.entries(data.result).forEach(([id, result]) => {
                    if (!data.parkActivated && result.gains !== undefined && result.gains > 0) {
                        // someone stole something from player, show
                        this.log(`Fialové karty: ${this.playerName(data.player)} získává ${this.formatCoins(result.gains)} od ostatních hráčů a má nyní ${this.formatCoins(result.newMoney)}.`, true);
                    }
                    const p = this.findPlayer(Number(id));
                    p.money = result.newMoney;
                });
                if (data.parkActivated) {
                    this.log('Fialové karty: Byla aktivována karta Park - mince všech hráčů byly rozděleny rovným dílem.', true);
                }
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
                        this.log(`Fialové karty: ${sourcePlayer.name} vyměnil/a svoji kartu ${this.cardName(typedResult.swapCardOwn)} za ${this.cardName(typedResult.swapCardTarget)} od ${targetPlayer.name}.`, true);
                    } else if (cardEnum === CardName.TelevisionStudio) {
                        const typedResult = result as TelevisionStudioEffect;
                        this.findPlayer(typedResult.currentPlayerId).money = typedResult.currentPlayerMoney;
                        this.findPlayer(typedResult.targetPlayerId).money = typedResult.targetPlayerMoney;
                        this.log(`Fialové karty: ${this.playerName(typedResult.currentPlayerId)} získává ${this.formatCoins(typedResult.gain)} od ${this.playerName(typedResult.targetPlayerId)} a má nyní ${this.formatCoins(typedResult.currentPlayerMoney)}.`, true);
                    } else if (cardEnum === CardName.WaterTreatmentPlant) {
                        const typedResult = result as WaterTreatmentPlantEffect;
                        const currentPlayer = this.findPlayer(typedResult.currentPlayerId);
                        currentPlayer.money = typedResult.currentPlayerMoney;
                        this.players.forEach(player => this.toggleCardActive(player, typedResult.card, false));
                        this.log(`Fialové karty: ${currentPlayer.name} postavil/a všechny karty ${this.cardName(typedResult.card)} mimo provoz a za to získává ${this.formatCoins(typedResult.gain)}.`);
                    }
                });
            })
            .on(events.input.TOWN_HALL_GAIN, (data: TownHallGain) => {
                this.log(`${this.playerName(data.player)} získává 1 minci za Radnici.`, true);
                const player = this.findPlayer(data.player);
                player.money += 1;
            })
            .on(events.input.BUILDING_POSSIBLE, () => {
                if (this.isPlayerOnTurn) {
                    this.log('Nyní můžete stavět.', true);
                }
                this.currentTurnPhase = TurnPhase.Build;
            })
            .on(events.input.PLAYER_BOUGHT_CARD, (data: PlayerBoughtCard) => {
                this.log(`${this.playerName(data.player)} si koupil/a kartu ${this.cardName(data.card)}.`, true);

                const player = this.findPlayer(data.player);
                this.addCardToPlayer(player, data.card, true);

                if (!dominants.includes(data.card)) {
                    // remove from table
                    const card = this.table.buyableCards.find(cc => cc.card.cardName === data.card)!;
                    card.count -= 1;
                    if (card.count === 0) {
                        this.table.buyableCards = this.table.buyableCards.filter(cc => cc.card.cardName !== data.card);
                    }
                }

                // cards had to be drawn to fill up the empty spot, add them to table
                data.drawnCards.forEach(card => this.addCardToTable(card));

                this.currentTurnPhase = TurnPhase.EndTurn;
                if (this.isPlayerOnTurn) {
                    setTimeout(() => this.emitEndTurn(), 1000);
                }
            })
            .on(events.input.IT_CENTER_COIN, (data: ItCenterCoin) => {
                const player = this.findPlayer(data.player);
                this.log(`${player.name} přidal/a jednu minci na svoji kartu IT centrum.`, true);
                player.itCenterCoins += 1;
                player.money -= 1;
            })
            .on(events.input.AIRPORT_GAIN, ({ player }: AirportGain) => {
                this.log(`${this.playerName(player)} nic nepostavil/a, dostane 10 mincí za Letiště.`, true);
                const p = this.findPlayer(player);
                p.money += 10;
            })
            .on(events.input.AMUSEMENT_PARK_NEW_TURN, ({ player }: AmusementParkNewTurn) => {
                this.log(`${this.playerName(player)} hodil/a 2 stejné kostky, získává nový tah díky Zábavnímu parku.`, true);
                this.resetDefaultValues();
            })
            .on(events.input.NEW_TURN, ({ oldPlayer, newPlayer }: NewTurn) => {
                this.log(`${this.playerName(oldPlayer)} ukončil/a tah, nový hráč: ${this.playerName(newPlayer)}.`, true);
                this.activePlayerId = newPlayer;
                this.resetDefaultValues();
            })
            .on(events.input.PLAYER_LEFT_GAME, ({ playerId, newPlayer }: PlayerLeftGame) => {
                this.log(`${this.playerName(playerId)} opustil/a hru.`, true);
                // TODO: fix? broken?
                if (newPlayer !== undefined) {
                    this.log(`${this.playerName(playerId)} opustil/a hru. Jelikož byl/a právě na tahu, novým hráčem je ${this.playerName(newPlayer)}.`, true);
                    this.activePlayerId = newPlayer;
                }
                this.players = this.players.filter(p => p.id !== playerId);
            })
            .on(events.input.PLAYER_WON_GAME, ({ playerId }: PlayerWonGame) => {
                this.socket.disconnect();
                alert(`${this.playerName(playerId)} vyhrál/a hru!`);
                // TODO: "play again" kinda lobby
                this.$router.push({ path: '/lobby' });
            })
            .on(events.input.GAME_ENDED_EMPTY, () => {
                this.socket.disconnect();
                alert('Všichni ostatní hráči odešli, hra končí.');
                this.$router.push({ path: '/lobby' });
            });
    }

    addCardToTable (card: CardName) {
        const pair = this.table.buyableCards.find(cc => cc.card.cardName === card);
        if (pair) {
            pair.count += 1;
        } else {
            this.table.buyableCards.push({ card: { ...this.cardDb[card], bought: false }, count: 1, active: true });
        }
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
            const cardObj = this.cardDb[card];
            // we already made the assumption that we can't move/exchange deactivated cards
            player.cards.push({ card: { ...cardObj, bought: true }, count: 1, active: true });
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

<style lang="scss" scoped>

.sidebar-container {
    width: 230px;
}
.sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    height: 100%;
    width: 230px; // about col-4 on notebook (looks decently narrow)
    padding: 15px;

    &.sidebar-gray {
        background-color: lightgray;
    }
    &.sidebar-blue {
        background-color: #89c5ff;
    }
    .action-button {
        width: 130px;
        margin-bottom: 10px;
    }
}
.logo {
    margin-left: 25%;
}
.game {
    /*text-align: left;*/
}
.game-container {
    margin-left: 40px;
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
