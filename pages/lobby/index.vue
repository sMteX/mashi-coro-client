<template lang="pug">
    div.container
        div
            logo
            div.links
                a(href="#", class="button--grey" v-on:click="createGame") Create game
                a(href="#", class="button--grey" v-on:click="joinGame") Join game
                a(href="#" class="button--grey" v-on:click="confirmReady" v-if="isPlayable") Confirm ready check
                a(href="#" class="button--grey" v-on:click="declineReady" v-if="isPlayable") Decline ready check
                a(href="#" class="button--grey" v-on:click="simulateCloseTab" v-if="gameSlug !== ''") Simulate close tab
                a(href="#" class="button--green" v-on:click="startGame" v-if="canStartGame") START THE GAME
                a(href="#" class="button--grey" v-clipboard="() => gameSlug" v-if="isOwner") Copy game slug
            div
                h3 Players:
                ul
                    li(v-for="player in players")
                        span(v-bind:style="{ color: (player.ready ? 'green': 'red')}") {{ player.name }}
                        | - {{ player.id }}
            div
                ul
                    li(v-for="message in messages") {{ message }}
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';
import Logo from '~/components/Logo.vue';
import { events as eventConstants } from '~/utils/constants';
import {
    PlayerChangedReady,
    PlayerEnteredLobby,
    PlayerLeftLobby
} from '~/utils/interfaces/events/lobby/input.interface';
const io = require('socket.io-client');

const { lobby: events } = eventConstants;
interface PlayerPair {
    id: number;
    name: string;
    ready: boolean;
}

@Component({
    components: {
        Logo
    },
    head: {
        title: 'Lobby'
    }
})
export default class LobbyPage extends Vue {
    private socket!: SocketIOClient.Socket;

    private selfId!: number;
    private isPlayable: boolean = false;
    private isOwner: boolean = false;
    private gameSlug: string = '';
    private players: PlayerPair[] = [];
    private messages: string[] = [];

    mounted () {
        this.socket = io.connect(
            `${process.env.serverUrl}/${events.namespaceName}`
        );
        this.setupHandlers();
    }

    log (message: string) {
        this.messages.push(message);
        console.log(message);
    }

    findPlayer (id: number) {
        const player = this.players.find(p => p.id === id);
        if (!player) {
            throw new Error('Player not found');
        }
        return player;
    }

    get self (): PlayerPair {
        return this.findPlayer(this.selfId);
    }

    get canStartGame (): boolean {
        return this.isOwner && this.players.every(p => p.ready);
    }

    async createGame () {
        // TODO: step 1: API POST to server/api/createGame
        this.gameSlug = await this.$axios.$post(
            `${process.env.serverUrl}/api/createGame`
        );
        this.log(`Game created - ${this.gameSlug}`);
        const name = 'Chizu';
        // TODO: step 3: open connection to lobby?
        this.socket.emit(events.output.PLAYER_ENTER, {
            playerName: name,
            game: this.gameSlug
        }, (id: number) => {
            this.selfId = id;
            this.players.push({ id: this.selfId, name, ready: false });
        });
        this.isOwner = true;
    }

    async joinGame () {
        let slug = null;
        while (slug === null) {
            slug = prompt('Enter the game slug');
        }

        // TODO: step 4: simulate other players entering the game - POST to server/api/validateGame
        const validGame = await this.$axios.$post(`${process.env.serverUrl}/api/validateGame`, {
            slug
        });

        if (!validGame) {
            this.log('Invalid slug');
            return;
        }

        this.gameSlug = slug;
        const name = prompt('Enter your name');
        this.log('Joined game');
        this.socket.emit(events.output.PLAYER_ENTER, {
            playerName: name,
            game: this.gameSlug
        }, (id: number) => this.selfId = id);
        this.socket.emit(events.output.GET_PLAYERS, {
            game: this.gameSlug
        }, (players: PlayerPair[]) => {
            this.players = [...players];
        });
    }

    confirmReady () {
        // TODO: emit confirm ready check
        this.socket.emit(events.output.PLAYER_READY_STATUS, {
            ready: true,
            game: this.gameSlug
        });
        this.self.ready = true;
    }

    declineReady () {
        // TODO: emit decline ready check
        this.socket.emit(events.output.PLAYER_READY_STATUS, {
            ready: false,
            game: this.gameSlug
        });
        this.self.ready = false;
    }

    simulateCloseTab () {
        // TODO: if during the ready check, emit that player left
        this.socket.emit(events.output.PLAYER_LEFT, {
            game: this.gameSlug
        });
        this.players = [];
        this.gameSlug = '';
        this.messages = [];
    }

    startGame () {
        this.socket.emit(events.output.START_GAME, {
            game: this.gameSlug
        });
    }

    setupHandlers () {
        this.socket
            .on(events.input.PLAYER_ENTERED_LOBBY, (player: PlayerEnteredLobby) => {
                this.log(`New player entered the game: ${player.name} - id: ${player.id}`);
                this.players.push({ id: player.id, name: player.name, ready: false });
            })
            .on(events.input.GAME_PLAYABLE, () => {
                // TODO: step 6: when game is playable, react somehow
                this.log('Game is playable now');
                this.isPlayable = true;
            })
            .on(events.input.ALL_READY, () => {
                this.log('All players ready');
            })
            .on(events.input.PLAYER_CHANGED_READY_STATUS, (event: PlayerChangedReady) => {
                // TODO: handle when another player confirms/cancels ready check
                const player = this.findPlayer(event.id);
                player.ready = event.newStatus;
                this.log(`Player ${player.name} changed ready status to ${player.ready}`);
            })
            .on(events.input.PLAYER_LEFT_LOBBY, (player: PlayerLeftLobby) => {
                const name = this.findPlayer(player.id).name;
                this.log(`Player ${name} left the lobby`);
                this.players = this.players.filter(p => p.id !== player.id);
                if (this.players.length === 1) {
                    this.isPlayable = false;
                }
            })
            .on(events.input.GAME_STARTED, () => {
                this.$router.push({
                    path: '/game',
                    query: {
                        id: this.gameSlug,
                        playerId: this.selfId.toString()
                    }
                });
            });
    }
}
</script>

<style lang="scss">
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
