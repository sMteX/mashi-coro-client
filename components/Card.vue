<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { CardColor, CardLocation, CardName } from '~/utils/cards';
import { CardCount } from '~/utils/interfaces/events/game/input.interface';
import CardComponent from '~/components/CardComponent.vue';

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
        itCenter: {
            required: false,
            type: Number,
            default: 0
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
    // this component is a wrapper that "prepares" data for the actual card component (which was previously done with computed properties)
    // and then renders the card component, which can be then simplified back to template instead of endless nest of render functions
    render (h: Vue.CreateElement, { props }: Vue.RenderContext) {
        const { info: _info, clickable, clickEvent: _clickEvent, location: _location } = props;
        const info = _info as CardCount;
        const location = _location as CardLocation;

        let backgroundClass: string;
        if (info.card.color === CardColor.Dominant) {
            backgroundClass = (props.info.card.bought) ? cssBackgrounds.winningActive : cssBackgrounds.winningInactive;
        } else {
            backgroundClass = cardBackgroundMap[info.card.color];
        }

        const triggeredByAll = info.card.color === CardColor.Blue || info.card.color === CardColor.Red;
        const showDominantCloseup = info.card.color === CardColor.Dominant;
        const showItCenter = info.card.cardName === CardName.ItCenter && info.card.bought;
        const showCost = location !== CardLocation.OtherPlayer && !info.card.bought;
        const clickEvent = () => {
            if (clickable && _clickEvent) {
                _clickEvent(info.card.cardName);
            }
        };

        return h(CardComponent, {
            props: {
                showDominantCloseup,
                backgroundClass,
                clickable,
                clickEvent,
                triggeredByAll,
                showCost,
                showItCenter,
                active: info.active,
                itCenter: props.itCenter,
                card: info.card,
                cardCount: info.count
            }
        });
    }
}
</script>
