<template lang="pug">
    div.card-stack
        div(v-for="index in info.count-1" :class="`card_${index}`" :key="index")
        div.card
            a-row(type="flex" justify="center") {{ info.card.triggerNumbers }}
            a-row(type="flex" justify="center") {{ info.card.symbol }} {{ info.card.name }}
            a-row.card-empty-space
            a-row.text-center
                a-col(span=6)
                    a-row {{ info.card.canBeTriggeredByOthers ? 'ALL' : 'YOU' }}
                    a-row {{ info.card.cost }}
                a-col(span=18)
                    a-row {{ info.card.description }}
</template>

<script>
import { Vue, Component } from 'vue-property-decorator';

@Component({
    components: {
    },
    props: {
        info: Object
    }
})
export default class Card extends Vue {
}
</script>

<style scoped lang="scss">
//$colors: red, yellow, orange, green, cyan;
$card-height: 225;
$card-width: 175;
@for $i from 1 through 5 {
    .card_#{$i} {
        position: absolute;
        left: #{$i * 5}px;
        bottom: #{$i * 5}px;
        z-index: #{100 - $i};
        background-color: white;
        height: #{$card-height}px;
        width: #{$card-width}px;
        border: 1px solid black;
    }
}
.card-stack {
    position: relative;
    width: #{$card-width + 25}px;
    height: #{$card-height + 25}px;
}
.text-center {
    text-align: center;
}
.card {
    position: absolute;
    bottom: 0;
    z-index: 100;
    display: flex;
    flex-flow: column;
    width: #{$card-width}px;
    height: #{$card-height}px;
    background-color: white;
    border: 1px solid black;
}
.card-empty-space {
    flex: 1;
    min-height: 100px;
}
.multiple {
    -webkit-box-shadow: 4px 4px 3px 0 rgba(0,0,0,1);
    -moz-box-shadow: 4px 4px 3px 0 rgba(0,0,0,1);
    box-shadow: 4px 4px 3px 0 rgba(0,0,0,1);
}
</style>
