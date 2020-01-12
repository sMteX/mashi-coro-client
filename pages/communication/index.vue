<template lang="pug">
    div.container
        div
            logo
            div.links
                a(href="#", class="button--grey" v-on:click="createGame") Create game
                a(href="#", class="button--grey" v-on:click="openLink") Open link
                a(href="#" class="button--grey" v-on:click="confirmReady") Confirm ready check
                a(href="#" class="button--grey" v-on:click="declineReady") Decline ready check
                a(href="#" class="button--grey" v-on:click="simulateCloseTab") Simulate close tab
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';
import Logo from '~/components/Logo.vue';
import { events } from '~/utils/constants';
const io = require('socket.io-client');

const { lobby: lobbyEvents } = events;
const serverUrl = 'http://localhost:3001'; // TODO: extract?

@Component({
    components: {
        Logo
    },
    head: {
        title: 'Home'
    }
})
export default class Homepage extends Vue {
    private socket!: SocketIOClient.Socket;
    private socket2!: SocketIOClient.Socket;

    mounted() {
        // TODO: actually point the sockets to the lobby namespace
        // this.socket = io.connect(`${serverUrl}/${lobbyEvents.namespaceName}`);
        // this.setupHandlers();
    }

    async createGame() {
        // TODO: step 1: API POST to server/api/createGame
        const slug: string = await this.$axios.$post(
            `${serverUrl}/api/createGame`
        );
        console.log(`Received game slug: ${slug}`);
        // TODO: step 3: open connection to lobby?
        // this.socket.emit(lobbyEvents.output.PLAYER_ENTER, {});
    }

    openLink() {
        // const slug = prompt('Enter the game slug');
        //
        // // TODO: step 4: simulate other players entering the game - POST to server/api/validateGame
        //
        // const name = prompt('Enter your name');
        //
        // // TODO: open another connection to lobby as a separate player
        // this.socket2 = io.connect(`${serverUrl}/${lobbyEvents.namespaceName}`, {
        //     forceNew: true
        // });
        // this.socket2.emit(lobbyEvents.output.PLAYER_ENTER, {});
    }

    confirmReady() {
        // TODO: emit confirm ready check
        // this.socket.emit(lobbyEvents.output.PLAYER_READY_STATUS, {});
    }

    declineReady() {
        // TODO: emit decline ready check
        // this.socket.emit(lobbyEvents.output.PLAYER_READY_STATUS, {});
    }

    simulateCloseTab() {
        // TODO: if during the ready check, emit that player left
        // this.socket.emit(lobbyEvents.output.PLAYER_LEFT, {});
    }

    sendEvent() {
        alert('in handler');
        this.socket.emit('next', 0, (response: any) =>
            console.log('response', response)
        );
    }

    setupHandlers() {
        // this.socket
        //     .on(lobbyEvents.input.GAME_PLAYABLE, () => {
        //         // TODO: step 6: when game is playable, react somehow
        //     })
        //     .on(lobbyEvents.input.PLAYER_ENTERED_LOBBY, () => {
        //         // TODO: handle when another player enters lobby
        //     })
        //     .on(lobbyEvents.input.PLAYER_CHANGED_READY_STATUS, () => {
        //         // TODO: handle when another player confirms/cancels ready check
        //     })
        //     .on(lobbyEvents.input.PLAYER_LEFT_LOBBY, () => {
        //         // TODO: handle when another player leaves lobby
        //     });
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
