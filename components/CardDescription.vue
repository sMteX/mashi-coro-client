<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import { CardColor, CardSymbol as SymbolEnum } from '~/utils/cards';
import CardSymbol from '~/components/CardSymbol.vue';

@Component
export default class CardDescription extends Vue {
    @Prop() readonly text!: string;

    render (createElement: Vue.CreateElement) {
        const regex = /#SYMBOL_(\d+)/g;
        const result: (string|Vue.VNode)[] = this.text.split(regex)
            .filter(s => s.trim() !== '')
            .map((s: string) => {
                const ns = Number(s);
                if (!isNaN(ns)) {
                    // return normal symbol, if it's tower, assume it's purple
                    const symbol = ns as SymbolEnum;
                    const data: { props: { [key: string]: any} } = {
                        props: {
                            symbol
                        }
                    };
                    if (symbol === SymbolEnum.Tower) {
                        data.props.color = CardColor.Purple;
                    }
                    return createElement(CardSymbol, data);
                }
                return s;
            });
        return createElement('span', [...result]);
    }
}
</script>
