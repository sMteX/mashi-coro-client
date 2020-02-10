import { CardSymbol } from '~/utils/cards';
<script lang="ts">
import { CardColor, CardSymbol as SymbolEnum } from '~/utils/cards';
import CardSymbol from '~/components/CardSymbol.vue';

export default {
    name: 'CardDescription',
    props: {
        text: {
            type: String,
            required: true
        }
    },
    // eslint-disable-next-line object-shorthand
    render: function (createElement: Vue.CreateElement) {
        const regex = /#SYMBOL_(\d+)/g;
        // @ts-ignore
        const text: string = this.text;
        const result: (string|Vue.VNode)[] = text.split(regex)
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
};
</script>
