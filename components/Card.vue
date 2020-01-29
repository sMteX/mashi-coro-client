<template lang="pug">
div.card(v-if="info.count === 1")
    p Cost: {{ info.card.cost }}
    p Name: {{ info.card.name }}
div.card.multiple(v-else)
    p Cost: {{ info.card.cost }}
    p Name: {{ info.card.name }}
    p Count: {{ info.count }}
</template>

<script>
import { Vue, Component } from 'vue-property-decorator';

@Component({
    props: {
        info: Object
    }
})
export default class Card extends Vue {
}
</script>

<style scoped>
.card {
    background-color: white;
    border: 1px solid black;
}
.multiple {
    -webkit-box-shadow: 4px 4px 3px 0 rgba(0,0,0,1);
    -moz-box-shadow: 4px 4px 3px 0 rgba(0,0,0,1);
    box-shadow: 4px 4px 3px 0 rgba(0,0,0,1);
}
</style>
