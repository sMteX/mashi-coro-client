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
import { Component, Vue } from 'vue-property-decorator';
import { CardColor, CardSymbol as SymbolEnum } from '~/utils/cards';
import TowerIcon from '~/components/icons/TowerIcon.vue';

const CardSymbolProps = Vue.extend({
    props: {
        symbol: {
            required: true,
            type: Object as () => SymbolEnum
        },
        // if symbol is Tower, two additional properties must be provided
        // eslint-disable-next-line vue/require-default-prop
        color: {
            required: false,
            type: Object as () => CardColor
        },
        bought: {
            required: false,
            type: Boolean
        },
        width: {
            type: Number,
            required: false,
            default: 20
        },
        height: {
            type: Number,
            required: false,
            default: 20
        }
    }
});

@Component({
    components: { TowerIcon }
})
export default class CardSymbol extends CardSymbolProps {
    readonly symbols = SymbolEnum;

    get towerType (): 'purple'|'dominant-inactive'|'dominant-active' {
        if (this.color === CardColor.Purple) {
            return 'purple';
        }
        return this.bought ? 'dominant-active' : 'dominant-inactive';
    }
}
</script>
