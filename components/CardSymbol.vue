<template lang="pug">
    img(v-if="card.symbol === symbol.Wheat" src="@/assets/icons/wheat.svg" :width="width" :height="height")
    img(v-else-if="card.symbol === symbol.Box" src="@/assets/icons/box.svg" :width="width" :height="height")
    img(v-else-if="card.symbol === symbol.Pig" src="@/assets/icons/pig.svg" :width="width" :height="height")
    img(v-else-if="card.symbol === symbol.Coffee" src="@/assets/icons/coffee.svg" :width="width" :height="height")
    img(v-else-if="card.symbol === symbol.Cog" src="@/assets/icons/cog.svg" :width="width" :height="height")
    img(v-else-if="card.symbol === symbol.Factory" src="@/assets/icons/factory.svg" :width="width" :height="height")
    img(v-else-if="card.symbol === symbol.Boat" src="@/assets/icons/boat.svg" :width="width" :height="height")
    img(v-else-if="card.symbol === symbol.Mall" src="@/assets/icons/mall.svg" :width="width" :height="height")
    img(v-else-if="card.symbol === symbol.Suitcase" src="@/assets/icons/suitcase.svg" :width="width" :height="height")
    TowerIcon(v-else :type="towerType" :width="width" :height="height")
</template>

<script lang="ts">
import 'reflect-metadata';
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Card, CardColor, CardSymbol as SymbolEnum } from '~/utils/cards';
import TowerIcon from '~/components/TowerIcon.vue';

@Component({
    components: { TowerIcon }
})
export default class CardSymbol extends Vue {
    @Prop() readonly card!: Card;
    @Prop() readonly isInText: boolean = false;
    @Prop() readonly width: number = 20;
    @Prop() readonly height: number = 20;

    readonly symbol = SymbolEnum;

    get towerType (): 'purple'|'dominant-inactive'|'dominant-active' {
        if (this.card.color === CardColor.Purple) {
            return 'purple';
        }
        return this.card.bought ? 'dominant-active' : 'dominant-inactive';
    }
}
</script>

<style scoped>

</style>
