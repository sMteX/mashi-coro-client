<template lang="pug">
    a-popover
        template(slot="content")
            // - closeup
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
        // - miniature
        div.card-stack
            div(v-for="index in info.count-1" :class="`card_${index}`" :key="index")
            div.card-miniature
                a-row.inner(type="flex" justify="center" align="middle" :class="cardBackgroundMap[info.card.cardName]")
                    span.text-center {{ info.card.name }}
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
$card-mini-height: 110;
$card-mini-width: 80;
$card-overlay: 3;

$card-height: 300;
$card-width: 200;

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
@mixin border-radius($radius: 5) {
    $rpx: #{$radius}px;
    border-radius: $rpx;
    -moz-border-radius: $rpx;
    -webkit-border-radius: $rpx;
}
@mixin common-card-style {
    background-color: white;
    color: white;
    border: 1px solid black;
}
@mixin card-mini-style {
    @include common-card-style;
    @include border-radius;
    position: absolute;
    height: #{$card-mini-height}px;
    width: #{$card-mini-width}px;
}
.card-stack {
    position: relative;
    width: #{$card-mini-width + 5 * $card-overlay}px;
    height: #{$card-mini-height + 5 * $card-overlay}px;
    margin-bottom: 10px;
    margin-right: 10px;
}
.card {
    @include common-card-style;
    @include border-radius;
    height: #{$card-height}px;
    width: #{$card-width}px;
    display: flex;

    .inner {
        margin: 8px;
        display: flex;
        flex-flow: column;

        @include border-radius;

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
.card-miniature {
    @include card-mini-style;
    bottom: 0;
    z-index: 100;
    display: flex;

    .inner {
        margin: 4px;
        display: flex;
        flex: 1;

        @include border-radius;

        span {
            margin: 4px;
            word-break: break-word;
        }
    }
}
@for $i from 1 through 5 {
    .card_#{$i} {
        @include card-mini-style;
        left: #{$i * $card-overlay}px;
        bottom: #{$i * $card-overlay}px;
        z-index: #{100 - $i};
    }
}
.text-center {
    text-align: center;
}
</style>
