<template lang="pug">
    a-popover
        template(slot="content")
            // - dominant closeup
            div.card(v-if="info.card.color === cardColor.Dominant")
                div.inner(:class="backgroundClass")
                    a-row.name(type="flex" justify="center") {{ info.card.name }}
                    a-row.empty-space
                    a-row.text-center.bottom-row(type="flex" align="middle")
                        a-col(span=6) {{ info.card.cost }}
                        a-col(span=18) {{ info.card.description }}
            // - closeup
            div.card(v-else)
                div.inner(:class="backgroundClass")
                    a-row(type="flex" justify="center") {{ info.card.triggerNumbers.join(',') }}
                    a-row.name(type="flex" justify="center") {{ info.card.symbol }} {{ info.card.name }}
                    a-row.empty-space
                    a-row.text-center.bottom-row
                        a-col(span=6)
                            a-row {{ triggerType }}
                            a-row {{ info.card.cost }}
                        a-col(span=18)
                            a-row {{ info.card.description }}
        // - miniature
        div.card-stack
            div(v-for="index in info.count-1" :class="`card_${index}`" :key="index")
            div.card-miniature(:class="{ clickable }" @click="triggerClick")
                a-row.inner(type="flex" justify="center" align="middle" :class="backgroundClass")
                    div.text-center(v-if="info.card.color !== 4") {{ info.card.triggerNumbers.join(',') }}
                    div.miniature-name.text-center {{ info.card.name }}
                    div.text-center(v-if="location !== cardLocation.OtherPlayer && !info.card.bought") {{ info.card.cost }}
</template>

<script lang="ts">
import 'reflect-metadata';
import { Component, Prop, Vue } from 'vue-property-decorator';
import { CardColor, CardLocation } from '~/utils/cards';
import { CardCount } from '~/utils/interfaces/events/game/input.interface';

const cssBackgrounds = {
    green: 'green-bg',
    red: 'red-bg',
    purple: 'purple-bg',
    blue: 'blue-bg',
    winningActive: 'winning-active-bg',
    winningInactive: 'winning-inactive-bg'
};

@Component({
    components: {
    },
    props: {
        // clickable: {
        //     required: false,
        //     default: false,
        //     type: Boolean
        // },
        // clickEvent: {
        //     type: Function,
        //     required: false
        // },
        // info: Object
    }
})
export default class Card extends Vue {
    @Prop() readonly clickable?: boolean = false;
    @Prop() readonly clickEvent?: (...args: any[]) => void;
    @Prop() readonly info!: CardCount;
    @Prop() readonly location!: CardLocation;

    cardColor = CardColor;
    cardLocation = CardLocation;
    cardBackgroundMap = {
        [CardColor.Green]: cssBackgrounds.green,
        [CardColor.Blue]: cssBackgrounds.blue,
        [CardColor.Purple]: cssBackgrounds.purple,
        [CardColor.Red]: cssBackgrounds.red,
        [CardColor.Dominant]: cssBackgrounds.winningInactive
    };

    triggerClick () {
        if (this.clickable && this.clickEvent) {
            console.log('Card clicked');
            this.clickEvent(this.info.card.cardName);
        }
    }

    get triggerType (): string {
        if (this.info.card.color === CardColor.Blue || this.info.card.color === CardColor.Red) {
            return 'ALL';
        }
        return 'YOU';
    }

    get backgroundClass (): string {
        if (this.info.card.color === CardColor.Dominant) {
            return (this.info.card.bought) ? cssBackgrounds.winningActive : cssBackgrounds.winningInactive;
        }
        return this.cardBackgroundMap[this.info.card.color];
    }
}
</script>

<style scoped lang="scss">
$card-mini-height: 120;
$card-mini-width: 90;
$card-overlay: 3;

$card-height: 300;
$card-width: 200;

$colors: (
    "green-bg": #407900,
    "blue-bg": #4170a2,
    "red-bg": #84160f,
    "purple-bg": #952981,
    "winning-inactive-bg": #8a8a8a,
    "winning-active-bg": #fed233
);

.clickable {
    cursor: pointer;
}

@each $class, $color in $colors {
    .#{$class} {
        background-color: $color;
    }
    .clickable:hover {
        .#{$class} {
            background-color: lighten($color, 15%);
        }
    }
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
        flex-flow: column;

        @include border-radius;
        .miniature-name {
            display: flex;
            flex: 1;
            align-items: center;
        }
        div {
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
