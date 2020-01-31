<template lang="pug">
    div.card-stack
        div(v-for="index in info.count-1" :class="`card_${index} ${cardBackgroundMap[info.card.cardName]}`" :key="index")
        div.card
            div.inner(:class="cardBackgroundMap[info.card.cardName]")
                a-row(type="flex" justify="center") {{ info.card.triggerNumbers }}
                a-row.name(type="flex" justify="center") {{ info.card.symbol }} {{ info.card.name }}
                a-row.empty-space
                a-row.text-center.bottom-row
                    a-col(span=6)
                        a-row {{ info.card.canBeTriggeredByOthers ? 'ALL' : 'YOU' }}
                        a-row {{ info.card.cost }}
                    a-col(span=18)
                        a-row {{ info.card.description }}
</template>

<script>
import { Vue, Component } from 'vue-property-decorator';
import { CardName } from '~/utils/cards';

const cssBackgrounds = {
    green: 'green-bg',
    red: 'red-bg',
    purple: 'purple-bg',
    blue: 'blue-bg'
};

@Component({
    components: {
    },
    props: {
        info: Object
    }
})
export default class Card extends Vue {
    cardBackgroundMap = {
        [CardName.Bakery]: cssBackgrounds.green,
        [CardName.Shop]: cssBackgrounds.green,
        [CardName.DairyShop]: cssBackgrounds.green,
        [CardName.FurnitureFactory]: cssBackgrounds.green,
        [CardName.Mall]: cssBackgrounds.green,

        [CardName.WheatField]: cssBackgrounds.blue,
        [CardName.Farm]: cssBackgrounds.blue,
        [CardName.Forest]: cssBackgrounds.blue,
        [CardName.Mine]: cssBackgrounds.blue,
        [CardName.ApplePark]: cssBackgrounds.blue,

        [CardName.Stadium]: cssBackgrounds.purple,
        [CardName.TelevisionStudio]: cssBackgrounds.purple,
        [CardName.OfficeBuilding]: cssBackgrounds.purple,

        [CardName.CoffeeShop]: cssBackgrounds.red,
        [CardName.Restaurant]: cssBackgrounds.red
        // TODO: winning cards
    };
}
</script>

<style scoped lang="scss">
$card-height: 225;
$card-width: 175;
$card-overlay: 3;

.green-bg {
    background-color: #407900;
}
.blue-bg {
    background-color: #4170a2;
}
.red-bg {
    background-color: #84160f;
}
.purple-bg {
    background-color: #952981;
}
@mixin card-style {
    position: absolute;
    background-color: white;
    color: white;
    height: #{$card-height}px;
    width: #{$card-width}px;
    border-radius: 5px 5px 5px 5px;
    -moz-border-radius: 5px 5px 5px 5px;
    -webkit-border-radius: 5px 5px 5px 5px;
    border: 1px solid black;
}

.card-stack {
    position: relative;
    width: #{$card-width + 5 * $card-overlay}px;
    height: #{$card-height + 5 * $card-overlay}px;
    margin-bottom: 10px;
    margin-right: 10px;
}
.card {
    @include card-style;
    bottom: 0;
    z-index: 100;
    display: flex;

    .inner {
        margin: 8px;
        display: flex;
        flex-flow: column;

        border-radius: 5px 5px 5px 5px;
        -moz-border-radius: 5px 5px 5px 5px;
        -webkit-border-radius: 5px 5px 5px 5px;

        .name {
            margin-bottom: 5px;
        }
        .empty-space {
            flex: 1;
            background-color: white;
            min-height: 50px;
        }
        .bottom-row {
            margin: 5px;
        }
    }
}
@for $i from 1 through 5 {
    .card_#{$i} {
        @include card-style;
        left: #{$i * $card-overlay}px;
        bottom: #{$i * $card-overlay}px;
        z-index: #{100 - $i};
    }
}
.text-center {
    text-align: center;
}
</style>
