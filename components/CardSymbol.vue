<template lang="pug" functional>
    WheatIcon(v-if="symbol === symbols.Wheat" :width="width" :height="height")
    BoxIcon(v-else-if="symbol === symbols.Box" :width="width" :height="height")
    PigIcon(v-else-if="symbol === symbols.Pig" :width="width" :height="height")
    CoffeeIcon(v-else-if="symbol === symbols.Coffee" :width="width" :height="height")
    CogIcon(v-else-if="symbol === symbols.Cog" :width="width" :height="height")
    FactoryIcon(v-else-if="symbol === symbols.Factory" :width="width" :height="height")
    BoatIcon(v-else-if="symbol === symbols.Boat" :width="width" :height="height")
    MallIcon(v-else-if="symbol === symbols.Mall" :width="width" :height="height")
    SuitcaseIcon(v-else-if="symbol === symbols.Suitcase" :width="width" :height="height")
    TowerIcon(v-else :type="towerType" :width="width" :height="height")
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import TowerIcon from './icons/TowerIcon.vue';
import BoatIcon from './icons/BoatIcon.vue';
import CoffeeIcon from './icons/CoffeeIcon.vue';
import CogIcon from './icons/CogIcon.vue';
import FactoryIcon from './icons/FactoryIcon.vue';
import MallIcon from './icons/MallIcon.vue';
import PigIcon from './icons/PigIcon.vue';
import SuitcaseIcon from './icons/SuitcaseIcon.vue';
import WheatIcon from './icons/WheatIcon.vue';
import { CardColor, CardSymbol as SymbolEnum } from '~/utils/cards';

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
    components: {
        BoatIcon,
        CoffeeIcon,
        CogIcon,
        FactoryIcon,
        MallIcon,
        PigIcon,
        SuitcaseIcon,
        TowerIcon,
        WheatIcon
    }
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
