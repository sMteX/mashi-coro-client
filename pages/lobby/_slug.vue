<template lang="pug">
    div
        // - dialogs - ugly but works best
        a-modal(title="Vytvoření hry"
            :visible="createNameDialog.visible"
            okText="Potvrdit"
            cancelText="Zrušit"
            @ok="createNameDialogOk"
            @cancel="hideDialog(createNameDialog)"
            width="400px")
            template(v-if="createNameDialog.error")
                a-alert(type="error" :message="createNameDialog.error" showIcon)
                br
            p Zadejte svoje jméno
            a-input(v-model="createNameDialog.temp" autoFocus @pressEnter="createNameDialogOk")
        a-modal(title="Připojení ke hře"
            :visible="joinNameDialog.visible"
            okText="Potvrdit"
            cancelText="Zrušit"
            @ok="joinNameDialogOk"
            @cancel="hideDialog(joinNameDialog)"
            width="400px")
            template(v-if="joinNameDialog.error")
                a-alert(type="error" :message="joinNameDialog.error" showIcon)
                br
            p Zadejte svoje jméno
            a-input(v-model="joinNameDialog.temp" autoFocus @pressEnter="joinNameDialogOk")

        div.game-container.ant-col-14.ant-col-offset-5
            div.ant-row-flex.ant-row-flex-center
                MachiKoroLogo
            div.lobby.ant-row
                div.ant-col-16.ant-col-offset-4
                    div.ant-row-flex.ant-row-flex-space-around
                        a-button(size="large" @click="createGame" v-if="gameSlug === ''") Vytvořit hru
                        a-button(size="large" @click="confirmReady" v-if="isPlayable") Jsem připraven
                        a-button(size="large" @click="declineReady" v-if="isPlayable" type="danger") Nejsem připraven
                        a-button(size="large" @click="startGame" v-if="canStartGame" type="primary") Spustit hru
                        a-button(size="large" @click="copySlug" v-if="isOwner") Zkopíruj kód hry
            div.ant-row(v-if="players.length > 0")
                h3 Hráči:
                ul
                    li(v-for="player in players")
                        | {{ player.name }} -
                        |
                        span(v-if="player.ready" :style="{ color: 'green' }") připraven
                        span(v-else :style="{ color: 'red' }") nepřipraven
            div.ant-row(v-if="messages.length > 0")
                h3 Zprávy:
                ul
                    li(v-for="message in messages") {{ message }}
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import MachiKoroLogo from '~/components/MachiKoroLogo.vue';
import { events as eventConstants } from '~/utils/constants';
import {
    PlayerChangedReady,
    PlayerEnteredLobby,
    PlayerEnterLobbyFail,
    PlayerEnterLobbySuccess,
    PlayerLeftLobby
} from '~/utils/interfaces/events/lobby/input.interface';
import { ValidateFailReason } from '~/utils/enums';

const io = require('socket.io-client');

const { lobby: events } = eventConstants;
interface PlayerPair {
    id: number;
    name: string;
    ready: boolean;
}
interface Dialog {
    temp: string;
    visible: boolean;
    result: string;
    error: string;
}
@Component({
    components: {
        MachiKoroLogo
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

    private createNameDialog: Dialog = {
        temp: '',
        visible: false,
        result: '',
        error: ''
    };

    private joinNameDialog: Dialog = {
        temp: '',
        visible: false,
        result: '',
        error: ''
    };

    async mounted () {
        this.socket = io.connect(
            `${process.env.serverUrl}/${events.namespaceName}`
        );
        this.setupHandlers();

        if (this.$route.params.slug) {
            const validGame = await this.$axios.$post(`${process.env.serverUrl}/api/validateGame`, {
                slug: this.$route.params.slug
            });

            if (!validGame.success) {
                let error = '';
                if (validGame.reason === ValidateFailReason.GAME_NOT_FOUND) {
                    error = 'Nesprávný kód hry.';
                } else if (validGame.reason === ValidateFailReason.GAME_FULL) {
                    error = 'Hra je již plná.';
                } else {
                    error = 'Hra už je spuštěná.';
                }
                this.$message.error(error);
            } else {
                this.showDialog(this.joinNameDialog);
            }
        }
    }

    async createNameDialogOk () {
        if (this.createNameDialog.temp.trim() === '') {
            this.createNameDialog.error = 'Musíte si vybrat jméno.';
            return;
        }

        this.createNameDialog.result = this.createNameDialog.temp;
        this.hideDialog(this.createNameDialog);

        this.gameSlug = await this.$axios.$post(
            `${process.env.serverUrl}/api/createGame`
        );

        // this.log(`Game created - ${this.gameSlug}`);

        this.socket.emit(events.output.PLAYER_ENTER, {
            playerName: this.createNameDialog.result,
            game: this.gameSlug
        }, ({ id, name }: PlayerEnteredLobby) => {
            this.selfId = id;
            this.players.push({ id: this.selfId, name, ready: false });
        });
        this.isOwner = true;
    }

    joinNameDialogOk () {
        if (this.joinNameDialog.temp.trim() === '') {
            this.joinNameDialog.error = 'Musíte si vybrat jméno.';
            return;
        }
        this.joinNameDialog.result = this.joinNameDialog.temp;
        this.hideDialog(this.joinNameDialog);

        this.gameSlug = this.$route.params.slug;
        this.socket.emit(events.output.PLAYER_ENTER, {
            playerName: this.joinNameDialog.result,
            game: this.gameSlug
        }, (result: PlayerEnterLobbySuccess|PlayerEnterLobbyFail) => {
            if (!result.success) {
                // game is already full
                const tr = result as PlayerEnterLobbyFail;
                if (tr.reason === ValidateFailReason.GAME_FULL) {
                    this.$message.error('Hra už je plná.');
                } else if (tr.reason === ValidateFailReason.GAME_RUNNING) {
                    this.$message.error('Hra už je spuštěná.');
                }
                this.gameSlug = '';
                return;
            }
            const tr = result as PlayerEnterLobbySuccess;
            this.selfId = tr.id;
            this.socket.emit(events.output.GET_PLAYERS, {
                game: this.gameSlug
            }, (players: PlayerPair[]) => {
                this.players = [...players];
            });
        });
    }

    copySlug () {
        // @ts-ignore
        this.$clipboard(`${window.location.origin}/lobby/${this.gameSlug}`);
        this.$message.success('Odkaz na hru zkopírován do schránky');
    }

    showDialog (dialog: Dialog) {
        dialog.visible = true;
    }

    hideDialog (dialog: Dialog) {
        dialog.visible = false;
        dialog.temp = '';
        dialog.error = '';
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

    createGame () {
        this.showDialog(this.createNameDialog);
    }

    confirmReady () {
        this.socket.emit(events.output.PLAYER_READY_STATUS, {
            ready: true,
            game: this.gameSlug
        });
        this.self.ready = true;
    }

    declineReady () {
        this.socket.emit(events.output.PLAYER_READY_STATUS, {
            ready: false,
            game: this.gameSlug
        });
        this.self.ready = false;
    }

    startGame () {
        this.socket.emit(events.output.START_GAME, {
            game: this.gameSlug
        });
    }

    setupHandlers () {
        this.socket
            .on(events.input.PLAYER_ENTERED_LOBBY, (player: PlayerEnteredLobby) => {
                this.log(`Nový hráč se přidal do hry: ${player.name}.`);
                this.players.push({ id: player.id, name: player.name, ready: false });
            })
            .on(events.input.GAME_PLAYABLE, () => {
                this.log('Hra se nyní dá spustit.');
                this.isPlayable = true;
            })
            .on(events.input.ALL_READY, () => {
                this.log('Všichni hráči jsou připraveni.');
            })
            .on(events.input.PLAYER_CHANGED_READY_STATUS, (event: PlayerChangedReady) => {
                const player = this.findPlayer(event.id);
                player.ready = event.newStatus;
                if (player.ready) {
                    this.log(`Hráč ${player.name} je nyní připraven.`);
                } else {
                    this.log(`Hráč ${player.name} už není připraven.`);
                }
            })
            .on(events.input.PLAYER_LEFT_LOBBY, (player: PlayerLeftLobby) => {
                const name = this.findPlayer(player.id).name;
                this.log(`Hráč ${name} opustil hru.`);
                this.players = this.players.filter(p => p.id !== player.id);
                if (this.players.length === 1) {
                    this.isPlayable = false;
                }
            })
            .on(events.input.GAME_STARTED, () => {
                this.socket.disconnect();
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

<style lang="scss" scoped>
.game-container {
    margin-top: 10px;
    margin-bottom: 50px;
}
.lobby {
    margin-top: 20px;
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
