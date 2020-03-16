<template lang="pug" functional>
    div.card-wrapper
        div.tooltip
            // - dominant closeup
            div.card(v-if="props.showDominantCloseup")
                div.inner(:class="props.backgroundClass")
                    div.name.ant-row-flex.ant-row-flex-center
                        // - workaround - functional components can't import components like others usually do
                        component(:is="injections.components.CardSymbol" :symbol="props.card.symbol" :color="props.card.color" :bought="props.card.bought")
                        | {{ props.card.name }}
                    div.empty-space.ant-row
                    div.text-center.bottom-row.ant-row-flex.ant-row-flex-middle
                        div.ant-col-6
                            | {{ props.card.cost }}
                        div.ant-col-18
                            component(:is="injections.components.CardDescription" :text="props.card.description")
            // - closeup
            div.card(v-else)
                div.inner(:class="props.backgroundClass")
                    div.ant-row-flex.ant-row-flex-center
                        | {{ props.card.triggerNumbers.join(', ') }}
                    div.name.ant-row-flex.ant-row-flex-center
                        component(:is="injections.components.CardSymbol" :symbol="props.card.symbol" :color="props.card.color")
                        | {{ props.card.name }}
                    div.empty-space.ant-row
                    div.text-center.bottom-row.ant-row
                        div.ant-col-6
                            div.ant-row
                                component(:is="injections.components.MultiPlayerIcon" v-if="props.triggeredByAll")
                                component(:is="injections.components.SinglePlayerIcon" v-else)
                            div.ant-row
                                | {{ props.card.cost }}
                        div.ant-col-18
                            div.ant-row
                                component(:is="injections.components.CardDescription" :text="props.card.description")
        // - miniature
        div.card-stack(:class="{ deactivated: !props.active }")
            div(v-for="index in props.cardCount-1" :class="`card_${index}`" :key="index")
            div.card-miniature(:class="{ clickable: props.clickable }" @click="props.clickEvent")
                div.inner.ant-row-flex.ant-row-flex-center.ant-row-flex-middle(:class="props.backgroundClass")
                    div.text-center(v-if="props.card.color !== 4")
                        | {{ props.card.triggerNumbers.join(', ') }}
                    // - TODO: better display
                    div.miniature-name.text-center(v-if="props.showItCenter")
                        | {{ props.card.name }} ({{ props.itCenter }})
                    div.miniature-name.text-center(v-else)
                        | {{ props.card.name }}
                    div.text-center(v-if="props.showCost")
                        | {{ props.card.cost }}
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import MultiPlayerIcon from './icons/MultiPlayerIcon.vue';
import SinglePlayerIcon from './icons/SinglePlayerIcon.vue';
import { Card } from '~/utils/cards';
import CardSymbol from '~/components/CardSymbol.vue';
import CardDescription from '~/components/CardDescription.vue';

const CardComponentProps = Vue.extend({
    props: {
        showDominantCloseup: {
            required: true,
            type: Boolean
        },
        backgroundClass: {
            required: true,
            type: String
        },
        clickable: {
            required: false,
            type: Boolean,
            default: false
        },
        clickEvent: {
            required: false,
            type: Function,
            default: null
        },
        card: {
            required: true,
            type: Object as () => Card
        },
        cardCount: {
            required: true,
            type: Number
        },
        active: {
            required: true,
            type: Boolean
        },
        triggeredByAll: {
            required: true,
            type: Boolean
        },
        showItCenter: {
            required: true,
            type: Boolean
        },
        itCenter: {
            required: false,
            type: Number,
            default: 0
        },
        showCost: {
            required: true,
            type: Boolean
        }
    }
});

@Component({
    inject: {
        components: {
            default: {
                CardSymbol,
                CardDescription,
                MultiPlayerIcon,
                SinglePlayerIcon
            }
        }
    }
})
export default class CardComponent extends CardComponentProps {}
</script>

<style scoped lang="scss">
$card-mini-height: 130;
$card-mini-width: 100;
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
// tooltips
.card-wrapper {
    .tooltip {
        display: none;
        width: auto !important;
    }
}
.card-wrapper:hover {
    position: relative;

    .tooltip {
        all: initial;
        font-family: Arial, Helvetica, sans-serif;
        display: inline-block;
        border-radius: 5px;
        color: #f9f9f9;
        position: absolute;
        bottom: 100%;
        width: #{$card-width}px;
        left: 50%;
        transform: translate(-50%, 0);
        margin-bottom: 15px;
        text-align: center;
        font-size: 14px;
        z-index: 200;
        animation: 0.25s appear;

        &::after {
            all: initial;
            display: inline-block;
            width: 0;
            height: 0;
            border-left: 10px solid transparent;
            border-right: 10px solid transparent;
            border-top: 10px solid #1a1a1a;
            position: absolute;
            bottom: -15px;
            content: '';
            left: 50%;
            transform: translate(-50%, 0);
            margin-bottom: 5px;
        }
    }
}
@keyframes appear {
    0% {
        opacity: 0;
    }
    100% {
        opacity: 1;
    }
}
.deactivated {
    transform: rotate(-90deg);
}
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
