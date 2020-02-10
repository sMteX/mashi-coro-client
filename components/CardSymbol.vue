<template lang="pug">
    img(v-if="symbol === symbols.Wheat" src="@/assets/icons/wheat.svg" :width="width" :height="height")
    img(v-else-if="symbol === symbols.Box" src="@/assets/icons/box.svg" :width="width" :height="height")
    img(v-else-if="symbol === symbols.Pig" src="@/assets/icons/pig.svg" :width="width" :height="height")
    img(v-else-if="symbol === symbols.Coffee" src="@/assets/icons/coffee.svg" :width="width" :height="height")
    img(v-else-if="symbol === symbols.Cog" src="@/assets/icons/cog.svg" :width="width" :height="height")
    img(v-else-if="symbol === symbols.Factory" src="@/assets/icons/factory.svg" :width="width" :height="height")
    img(v-else-if="symbol === symbols.Boat" src="@/assets/icons/boat.svg" :width="width" :height="height")
    img(v-else-if="symbol === symbols.Mall" src="@/assets/icons/mall.svg" :width="width" :height="height")
    img(v-else-if="symbol === symbols.Suitcase" src="@/assets/icons/suitcase.svg" :width="width" :height="height")
    TowerIcon(v-else :type="towerType" :width="width" :height="height")
</template>

<script lang="ts">
import 'reflect-metadata';
import { Component, Prop, Vue } from 'vue-property-decorator';
import { CardColor, CardSymbol as SymbolEnum } from '~/utils/cards';
import TowerIcon from '~/components/TowerIcon.vue';

@Component({
    components: { TowerIcon }
})
export default class CardSymbol extends Vue {
    @Prop() readonly symbol!: SymbolEnum;
    @Prop() readonly color?: CardColor;
    @Prop() readonly bought?: boolean;
    @Prop() readonly width: number = 20;
    @Prop() readonly height: number = 20;

    readonly symbols = SymbolEnum;

    get towerType (): 'purple'|'dominant-inactive'|'dominant-active' {
        if (this.color === CardColor.Purple) {
            return 'purple';
        }
        return this.bought ? 'dominant-active' : 'dominant-inactive';
    }
}
</script>
