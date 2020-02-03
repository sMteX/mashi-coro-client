<template lang="pug">
    a-row
        a-row
            h3 {{ player.name }}
        a-row
            p Money: {{ player.money }}
        a-row
            a-row(type="flex" justify="start" :gutter=16 v-for="(row, rowIndex) in playerCards" :key="rowIndex")
                Card(v-for="(card, index) in row" :info="card" :key="index")
</template>

<script lang="ts">
import 'reflect-metadata';
import { Component, Prop, Vue } from 'vue-property-decorator';
import Card from './Card.vue';
import { CardCount } from '~/utils/interfaces/events/game/input.interface';

// TODO: duplicate in game/index.vue
interface Player {
    id: number;
    socketId: string;
    name: string;

    cards: CardCount[];
    money: number;
    winningCards: CardCount[];
}

@Component({
    components: {
        Card
    }
})
export default class PlayerCards extends Vue {
    @Prop() readonly player!: Player;

    get playerCards (): CardCount[][] {
        const cards = [];
        cards.push([...this.player.winningCards]);
        cards.push([...this.player.cards.filter(({ card }) => card.canBeTriggeredByOthers)]);
        cards.push([...this.player.cards.filter(({ card }) => !card.canBeTriggeredByOthers)]);
        return cards;
    }
}
</script>

<style scoped>

</style>
