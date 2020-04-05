<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';
import { MessageType } from '~/utils/enums';

// TODO: duplicate in game/index.vue
interface Message {
    type: MessageType;
    args: {
        [prop: string]: any
    };
}

const SidebarMessageProps = Vue.extend({
    functional: true,
    props: {
        message: {
            type: Object as () => Message,
            required: true
        }
    }
});

@Component
export default class SidebarMessage extends SidebarMessageProps {
    render (h: Vue.CreateElement, context: Vue.RenderContext) {
        const typedMessage = context.props.message as Message;

        const children = [];

        const args = typedMessage.args;

        switch (typedMessage.type) {
        case MessageType.FinalDiceRoll: {
            // args: { player, [dice], sum }
            const sum = args.dice[0] + ((args.dice.length === 2) ? args.dice[1] : 0);
            const port = (sum !== args.sum) ? '+2 ' : '';
            children.push(`${args.player}: kostky ${args.dice.join(', ')} ${port}(${args.sum})`);
            break;
        }
        case MessageType.RedCard:
            // args: { fromPlayer, player, gains, newMoney }
            children.push(
                h('span', { class: 'redCard bold' }, `${args.player}: +${args.gains} (od ${args.fromPlayer}) = ${args.newMoney}`)
            );
            break;
        case MessageType.BlueCard:
            // args: { player, gains, newMoney }
            children.push(
                h('span', { class: 'blueCard bold' }, `${args.player}: +${args.gains} = ${args.newMoney}`)
            );
            break;
        case MessageType.GreenCard:
            // args: { player, gains, newMoney }
            children.push(
                h('span', { class: 'greenCard bold' }, `${args.player}: +${args.gains} = ${args.newMoney}`)
            );
            break;
        case MessageType.LogisticsCompany: {
            // args: { player, gains, pairs: [card, target] }
            const pairs = args.pairs as { card: string, target: string}[];
            children.push(
                h('span', { class: 'greenCard bold' }, `${args.player}: Přepravní firma +${args.gains}:`),
                h('p', pairs.map(({ card, target }) => `${card} => ${target}`).join(', '))
            );
            break;
        }
        case MessageType.GenericPurpleCard:
            // args: { player, gains, newMoney }
            children.push(
                h('span', { class: 'purpleCard bold' }, `${args.player}: +${args.gains} (od ostatních) = ${args.newMoney}`)
            );
            break;
        case MessageType.Park:
            children.push(
                h('span', { class: 'purpleCard bold' }, 'Park - mince přerozděleny')
            );
            break;
        case MessageType.OfficeBuilding:
            // args: { source, sourceCard, target, targetCard }
            children.push(
                h('span', { class: 'purpleCard bold' }, `${args.sourceCard} (${args.source}) <=> ${args.targetCard} (${args.target})`)
            );
            break;
        case MessageType.TelevisionStudio:
            // args: { source, target, gains, newMoney }
            children.push(
                h('span', { class: 'purpleCard bold' }, `${args.target}: +${args.gains} (od ${args.source}) = ${args.newMoney}`)
            );
            break;
        case MessageType.WaterTreatment:
            // args: { player, card, gain }
            children.push(
                h('span', { class: 'purpleCard bold' }, `${args.player}: ${args.card} mimo provoz => +${args.gain}`)
            );
            break;
        case MessageType.TownHall:
            // args: { player }
            children.push(`${args.player}: +1 (Radnice)`);
            break;
        case MessageType.BoughtCard:
            // args: { player, card }
            children.push(
                h('span', { class: 'bold' }, `${args.player}: + ${args.card}`)
            );
            break;
        case MessageType.ItCenter:
            // args: { player }
            children.push(`${args.player}: IT Centrum + 1`);
            break;
        case MessageType.Airport:
            // args: { player }
            children.push(`${args.player}: +10 (Letiště)`);
            break;
        case MessageType.AmusementPark:
            // args: { player }
            children.push(`${args.player}: nový tah (Zábavní park)`);
            break;
        default:
            return null;
        }

        return h('p', children);
    }
}
</script>
