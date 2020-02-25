<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import MultiPlayerIcon from './icons/MultiPlayerIcon.vue';
import SinglePlayerIcon from './icons/SinglePlayerIcon.vue';
import { CardColor, CardLocation } from '~/utils/cards';
import { CardCount } from '~/utils/interfaces/events/game/input.interface';
import CardSymbol from '~/components/CardSymbol.vue';
import CardDescription from '~/components/CardDescription.vue';

const cssBackgrounds = {
    green: 'green-bg',
    red: 'red-bg',
    purple: 'purple-bg',
    blue: 'blue-bg',
    winningActive: 'winning-active-bg',
    winningInactive: 'winning-inactive-bg'
};

const cardBackgroundMap = {
    [CardColor.Green]: cssBackgrounds.green,
    [CardColor.Blue]: cssBackgrounds.blue,
    [CardColor.Purple]: cssBackgrounds.purple,
    [CardColor.Red]: cssBackgrounds.red,
    [CardColor.Dominant]: cssBackgrounds.winningInactive
};

const CardProps = Vue.extend({
    functional: true,
    props: {
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
        info: {
            required: true,
            type: Object as () => CardCount
        },
        location: {
            required: true,
            type: Number,
            validator (value) {
                return Number(value) in CardLocation;
            }
        }
    }
});

@Component
export default class Card extends CardProps {
    render (h: Vue.CreateElement, { props }: Vue.RenderContext) {
        const { info: _info, clickable, clickEvent, location: _location } = props;
        const info = _info as CardCount;
        const location = _location as CardLocation;

        const div = (classes: (string|[string, boolean])[], children: any[], extraData?: object) => {
            const c: {[c: string]: boolean} = {};
            classes.forEach((cl) => {
                if (typeof cl === 'string') {
                    c[cl] = true;
                } else {
                    const [name, val] = cl;
                    c[name] = val;
                }
            });
            return h('div', { class: c, ...extraData }, [...children]);
        };
        const row = (classes: (string|[string, boolean])[], props: object, children: any[], extraData?: object) => {
            const c: {[c: string]: boolean} = {};
            classes.forEach((cl) => {
                if (typeof cl === 'string') {
                    c[cl] = true;
                } else {
                    const [name, val] = cl;
                    c[name] = val;
                }
            });
            return h('a-row', { class: c, props, ...extraData }, [...children]);
        };
        const col = (span: number, children: any[]) =>
            h('a-col', { props: { span } }, [...children]);

        const miniature = () => {
            const cardStack = [];
            // card stack
            for (let i = 1; i < info.count; i += 1) {
                cardStack.push(h('div', {
                    class: { [`card_${i}`]: true },
                    key: `${i}`
                }));
            }
            const content = [];
            // trigger numbers
            if (info.card.color !== CardColor.Dominant) {
                content.push(div(['text-center'], [info.card.triggerNumbers.join(', ')]));
            }
            // name
            content.push(div(['miniature-name', 'text-center'], [info.card.name]));
            // cost
            if (location !== CardLocation.OtherPlayer && !info.card.bought) {
                content.push(div(['text-center'], [`${info.card.cost}`]));
            }
            return div(
                ['card-stack'],
                [
                    ...cardStack,
                    div(
                        ['card-miniature', ['clickable', clickable]],
                        [row(
                            ['inner', cardBackgroundMap[info.card.color]],
                            { type: 'flex', justify: 'center', align: 'middle' },
                            [...content]
                        )],
                        {
                            on: {
                                click () {
                                    if (clickable && clickEvent) {
                                        clickEvent(info.card.cardName);
                                    }
                                }
                            }
                        }
                    )
                ]
            );
        };
        const dominantCloseup = () =>
            // div.card
            div(
                ['card'],
                [
                    // div.inner
                    div(
                        ['inner', cardBackgroundMap[info.card.color]],
                        [
                            // a-row.name
                            row(
                                ['name'],
                                { type: 'flex', justify: 'center' },
                                [
                                    h(CardSymbol, { props: { symbol: info.card.symbol, color: info.card.color, bought: info.card.bought } }),
                                    info.card.name
                                ]
                            ),
                            // a-row.empty-space
                            h('a-row', { class: { 'empty-space': true } }),
                            // a-row.text-center.bottom-row
                            row(
                                ['text-center', 'bottom-row'],
                                { type: 'flex', align: 'middle' },
                                [
                                    col(6, [`${info.card.cost}`]),
                                    col(18, [
                                        h(CardDescription, { props: { text: info.card.description } })
                                    ])
                                ]
                            )
                        ]
                    )
                ]
            );

        const closeup = () =>
            // div.card
            div(
                ['card'],
                [
                    // div.inner
                    div(
                        ['inner', cardBackgroundMap[info.card.color]],
                        [
                            // a-row (trigger numbers)
                            row(
                                [],
                                { type: 'flex', justify: 'center' },
                                [info.card.triggerNumbers.join(', ')]
                            ),
                            // a-row.name
                            row(
                                ['name'],
                                { type: 'flex', justify: 'center' },
                                [
                                    h(CardSymbol, { props: { symbol: info.card.symbol, color: info.card.color } }),
                                    info.card.name
                                ]
                            ),
                            // a-row.empty-space
                            h('a-row', { class: { 'empty-space': true } }),
                            // a-row.text-center.bottom-row
                            row(
                                ['text-center', 'bottom-row'],
                                {},
                                [
                                    // player icon and cost
                                    col(6, [
                                        h('a-row', [
                                            (info.card.color === CardColor.Blue || info.card.color === CardColor.Red)
                                                ? h(MultiPlayerIcon) : h(SinglePlayerIcon)
                                        ]),
                                        h('a-row', [`${info.card.cost}`])
                                    ]),
                                    // description
                                    col(18, [
                                        h('a-row', [
                                            h(CardDescription, { props: { text: info.card.description } })
                                        ])
                                    ])
                                ]
                            )
                        ]
                    )
                ]
            );

        const chosenCloseup = (info.card.color === CardColor.Dominant) ? dominantCloseup : closeup;
        return div(
            ['card-wrapper'],
            [
                div(['tooltip'], [chosenCloseup()]),
                miniature()
            ]
        );
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
