<template lang="pug">
    div.ant-row
        div.purple-cards.ant-col-4
            div.ant-row(v-for="(card, index) in purpleCards" :key="index")
                Card(:info="card" :location="cardLocation.Table" :clickable="clickableCheck(card)" :clickEvent="clickEvent")
        div.ant-col-20
            div.low-row.ant-row-flex.ant-row-flex-space-around
                Card(v-for="(card, index) in lowCards" :key="index" :info="card" :location="cardLocation.Table" :clickable="clickableCheck(card)" :clickEvent="clickEvent")
            div.ant-row-flex.ant-row-flex-space-around
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
            type: Array
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
        return (this.cards as CardCount[])
            .filter(({ card }) => card.color === CardColor.Purple)
            .sort(({ card: cardA }, { card: cardB }) => this.avg(cardA.triggerNumbers) - this.avg(cardB.triggerNumbers));
    }

    get lowCards (): CardCount[] {
        return (this.cards as CardCount[])
            .filter(({ card }) => card.color !== CardColor.Purple && this.avg(card.triggerNumbers) <= 6)
            .sort(({ card: cardA }, { card: cardB }) => this.avg(cardA.triggerNumbers) - this.avg(cardB.triggerNumbers));
    }

    get highCards (): CardCount[] {
        return (this.cards as CardCount[])
            .filter(({ card }) => card.color !== CardColor.Purple && this.avg(card.triggerNumbers) > 6)
            .sort(({ card: cardA }, { card: cardB }) => this.avg(cardA.triggerNumbers) - this.avg(cardB.triggerNumbers));
    }
}

</script>

<style scoped lang="scss">
.purple-cards {
    padding-top: 40px;
}
.low-row {
    margin-top: 20px;
    margin-bottom: 40px;
}
</style>
