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

<script>
import { Component, Vue } from 'vue-property-decorator';
import Card from './Card';

@Component({
    props: {
        player: Object
    },
    components: {
        Card
    }
})
export default class PlayerCards extends Vue {
    get playerCards () {
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
