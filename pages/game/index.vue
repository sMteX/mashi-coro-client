<template lang="pug">
    div.container
        div
            logo
            h1 Game
            div
                h3 Players:
                ul
                    li(v-for="player in players")
                        span {{ player.name }} - {{ player.id }}
            div.links
                nuxt-link(to="/lobby" class="button--grey") Back to lobby
                a(href="#" class="button--grey") This does nothing
            div
                ul
                    li(v-for="message in messages") {{ message }}
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';
import Logo from '~/components/Logo.vue';
const io = require('socket.io-client');

interface PlayerPair {
    id: string;
    name: string;
}

@Component({
    components: {
        Logo
    },
    head: {
        title: 'Game'
    }
})
export default class GamePage extends Vue {
    private socket!: SocketIOClient.Socket;

    private players: PlayerPair[] = [];
    private messages: string[] = [];

    mounted () {
        // this.$route.query.id
        // TODO: point to game namespace
        // this.socket = io.connect(
        //     `${process.env.serverUrl}/${lobbyEvents.namespaceName}`
        // );
        this.setupHandlers();
    }

    log (message: string) {
        this.messages.push(message);
        console.log(message);
    }

    findPlayer (id: string) {
        const player = this.players.find(p => p.id === id);
        if (!player) {
            throw new Error('Player not found');
        }
        return player;
    }

    get self (): PlayerPair {
        return this.findPlayer(this.socket.id);
    }

    setupHandlers () {

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
