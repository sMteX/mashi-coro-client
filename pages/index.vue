<template lang="pug">
    div.container
        // - a-modal(title="Close this dialog"
        // -    :visible="dv"
        // -    :closable="false"
        // -    :maskClosable="false"
        // -    :cancelButtonProps="{ props: { disabled: true } }"
        // -    :keyboard="false"
        // -    okText="Confirm"
        // -    cancelText="Nah fuck you"
        // -    @ok="dialogOk"
        // -    @cancel="dialogCancel")
        // -    | Try me bitch
        div
            logo
            h1.title client
            h2.subtitle Client for Contentry app
            div.links
                a(href="https://nuxtjs.org/", target="_blank", class="button--green") Documentation
                a(href="https://github.com/nuxt/nuxt.js", target="_blank", class="button--grey") GitHub
                nuxt-link(to="/lobby", class="button--grey") Game lobby
                nuxt-link(to="/game", class="button--grey") Game
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';
import Logo from '~/components/Logo.vue';

@Component({
    components: {
        Logo
    },
    head: {
        title: 'Home'
    }
})
export default class Homepage extends Vue {}
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
