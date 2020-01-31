<template lang="pug">
    div
        a-col(span=12, offset=6)
            a-row(type="flex" justify="center")
                logo
            a-row
                h1 Game
                div
                    h3 Players:
                    ul
                        li(v-for="player in players")
                            span {{ player.name }} - {{ player.id }}
                div.links
                    nuxt-link(to="/lobby" class="button--grey") Back to lobby
                    a(href="#" class="button--grey" v-on:click="useDummyData") Use dummy data for UI design
                div
                    ul
                        li(v-for="message in lastMessages") {{ message }}
                a-row.game
                    a-row
                        a-row
                            h3 Table
                        a-row
                            p Bank: {{ table.bank }}
                        a-row(type="flex" justify="space-around")
                            Card(v-for="(card, index) in table.buyableCards" :info="card" :key="index")
                        // - bank
                            buyable cards
                    h3 You
                        // - bank
                            active cards
                            winning cards
                    h3(v-for="player in otherPlayers") Player {{ player.name }}
                        // - bank
                            active cards
                            winning cards
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Logo from '~/components/Logo.vue';
import { events as eventConstants } from '~/utils/constants';
import { CardCount, GameStarting } from '~/utils/interfaces/events/game/input.interface';
import Card from '~/components/Card.vue';

const io = require('socket.io-client');
const { game: events } = eventConstants;

interface PlayerPair {
    socketId: string;
    id: number;
    name: string;
}

interface Table {
    bank: number;
    buyableCards: CardCount[];
}

@Component({
    components: {
        Logo,
        Card
    },
    head: {
        title: 'Game'
    }
})
export default class GamePage extends Vue {
    private socket!: SocketIOClient.Socket;

    private table: Table = {
        bank: 0,
        buyableCards: []
    };

    private dummySetup: boolean = false;
    private players: PlayerPair[] = [];
    private messages: string[] = [];

    mounted () {
        this.dummySetup = true;
        // without it is temporarily allowed through dummy data
        this.useDummyData();
        // TODO: redirect if player didn't come from lobby (or maybe just don't use pages for this, but instead giant components that just get switched?)
        // this.socket = io.connect(
        //     `${process.env.serverUrl}/${events.namespaceName}`
        // );
        // this.setupHandlers();
        // this.socket.emit(events.output.PLAYER_CONNECT, {
        //     game: this.$route.query.id,
        //     id: Number(this.$route.query.playerId)
        // });
    }

    get lastMessages (): string[] {
        return this.messages.slice(-3);
    }

    log (message: string) {
        this.messages.push(message);
        console.log(message);
    }

    findPlayer (id: string) {
        return this.players.find(p => p.socketId === id)!;
    }

    get self (): PlayerPair {
        if (this.dummySetup) {
            return this.players[0];
        }
        return this.findPlayer(this.socket.id);
    }

    get otherPlayers (): PlayerPair[] {
        if (this.dummySetup) {
            return this.players.slice(1);
        }
        return this.players.filter(p => p.socketId !== this.socket.id);
    }

    useDummyData () {
        // mimics real data returned
        const data: GameStarting = {
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
                        name: 'Stadión',
                        cost: 7,
                        description: 'Dostanete 5 mincí od zvoleného soupeře',
                        symbol: 5,
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
                    triggerNumbers: [],
                    canBeTriggeredByOthers: false,
                    canBeTriggeredBySelf: false
                }
            ],
            bank: 204
        };
        this.players.push(...data.players.map(({ id, socketId, name }) => ({ id, socketId, name })));
        this.table.bank = data.bank;
        this.table.buyableCards = [...data.buyableCards];
    }

    setupHandlers () {
        this.socket.on(events.input.GAME_STARTING, (data: GameStarting) => {
            console.log('Game starting soon, received data:', data);
        });
    }
}
</script>

<style lang="scss">
.game {
    /*text-align: left;*/
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
