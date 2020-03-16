<template lang="pug">
    div.ant-row
        div.ant-row
            h2 {{ player.name }}
        div.ant-row
            p Peníze: {{ player.money }}
        div.ant-row
            div.ant-row-flex.ant-row-flex-start.gutter-16(v-for="(row, rowIndex) in playerCards" :key="rowIndex")
                Card(v-for="(card, index) in row" :info="card" :key="index" :location="cardLocation.OtherPlayer" :itCenter="player.itCenterCoins")
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Card from './Card.vue';
import { CardCount } from '~/utils/interfaces/events/game/input.interface';
import { CardColor, CardLocation } from '~/utils/cards';

// TODO: duplicate in game/index.vue
interface Player {
    id: number;
    socketId: string;
    name: string;

    cards: CardCount[];
    money: number;
    winningCards: CardCount[];
    itCenterCoins: number;
}

const PlayerCardProps = Vue.extend({
    props: {
        player: {
            required: true,
            type: Object as () => Player
        }
    }
});

@Component({
    components: {
        Card
    }
})
export default class PlayerCards extends PlayerCardProps {
    cardLocation = CardLocation;

    get playerCards (): CardCount[][] {
        const avg = (dice: number[]) => (dice.reduce((acc, cur) => acc + cur, 0) / (dice.length || 1));
        const cards = [];
        cards.push([...this.player.winningCards]);
        cards.push([...this.player.cards.filter(({ card }) => card.color === CardColor.Red || card.color === CardColor.Blue).sort((a, b) => avg(a.card.triggerNumbers) - avg(b.card.triggerNumbers))]);
        cards.push([...this.player.cards.filter(({ card }) => card.color === CardColor.Green || card.color === CardColor.Purple).sort((a, b) => avg(a.card.triggerNumbers) - avg(b.card.triggerNumbers))]);
        return cards;
    }
}
</script>

<style scoped>
</style>
