<template lang="pug">
    a-row
        a-col(span="4")
            a-row(v-for="(card, index) in purpleCards" :key="index")
                Card(:info="card" :location="cardLocation.Table" :clickable="clickableCheck(card)" :clickEvent="clickEvent")
        a-col(span="20")
            a-row(type="flex" justify="space-around")
                Card(v-for="(card, index) in lowCards" :key="index" :info="card" :location="cardLocation.Table" :clickable="clickableCheck(card)" :clickEvent="clickEvent")
            a-row(type="flex" justify="space-around")
                Card(v-for="(card, index) in highCards" :key="index" :info="card" :location="cardLocation.Table" :clickable="clickableCheck(card)" :clickEvent="clickEvent")

</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Card from './Card.vue';
import { CardCount } from '~/utils/interfaces/events/game/input.interface';
import { CardColor, CardLocation } from '~/utils/cards';

const TableCardsProps = Vue.extend({
    props: {
        clickableCheck: {
            required: true,
            type: Function
        },
        clickEvent: {
            required: true,
            type: Function
        },
        cards: {
            required: true,
            type: Object as () => CardCount[]
        }
    }
});

@Component({
    components: {
        Card
    }
})
export default class TableCards extends TableCardsProps {
    cardLocation = CardLocation;

    avg (a: number[]) {
        return a.reduce((acc, cur) => acc + cur, 0) / (a.length || 1);
    }

    get purpleCards (): CardCount[] {
        return this.cards.filter(({ card }) => card.color === CardColor.Purple);
    }

    get lowCards (): CardCount[] {
        return this.cards.filter(({ card }) => card.color !== CardColor.Purple && this.avg(card.triggerNumbers) <= 6);
    }

    get highCards (): CardCount[] {
        return this.cards.filter(({ card }) => card.color !== CardColor.Purple && this.avg(card.triggerNumbers) > 6);
    }
}

</script>

<style scoped>

</style>
