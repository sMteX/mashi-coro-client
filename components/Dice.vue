<template lang="pug">
    div.dice(:class="{ [`dice_${diceValue}`]: true }")
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class Dice extends Vue {
    diceValue = 1;

    changeValue (times: number, result: number) {
        if (times > 1) {
            this.diceValue = Math.round(Math.random() * 5) + 1;
            setTimeout(() => {
                this.changeValue(times - 1, result);
            }, 100);
        } else {
            this.diceValue = result;
        }
    }
}
</script>

<style scoped>
.dice {
    background-image: url("../assets/img/dices.png");
    height: 49px;
    width: 49px;
    display: inline-block;
    margin: 5px;
}
.dice_1 {
    background-position: 0 0;
}
.dice_2 {
    background-position: -50px 0;
}
.dice_3 {
    background-position: -101px 0;
}
.dice_4 {
    background-position: -151px 0;
}
.dice_5 {
    background-position: -201px 0;
}
.dice_6 {
    background-position: -251px 0;
}
</style>
