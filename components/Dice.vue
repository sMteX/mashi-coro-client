<template lang="pug">
    div
        div.dice(:class="{ [`dice-${diceValue}`]: true }" v-show="finishedRolling")
        div.rolling-dice(v-show="!finishedRolling && !second")
        div.rolling-dice-second(v-show="!finishedRolling && second")
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

const DiceProps = Vue.extend({
    props: {
        second: {
            required: false,
            type: Boolean,
            defualt: false
        }
    }
});

@Component
export default class Dice extends DiceProps {
    finishedRolling = false;
    diceValue = 1;

    changeValue (result: number) {
        this.finishedRolling = false;
        this.diceValue = result;
        setTimeout(() => {
            this.finishedRolling = true;
        }, 1000);
    }
}
</script>

<style scoped>
.rolling-dice {
    background-image: url("../assets/img/dice_roll_endless.gif");
    height: 52px;
    width: 52px;
    display: inline-block;
    margin: 5px;
}
.rolling-dice-second {
    background-image: url("../assets/img/dice_roll_endless2.gif");
    height: 52px;
    width: 52px;
    display: inline-block;
    margin: 5px;
}
.dice {
    background-image: url("../assets/img/dices.png");
    height: 49px;
    width: 49px;
    display: inline-block;
    margin: 5px;
}
.dice-1 {
    background-position: 0 0;
}
.dice-2 {
    background-position: -50px 0;
}
.dice-3 {
    background-position: -101px 0;
}
.dice-4 {
    background-position: -151px 0;
}
.dice-5 {
    background-position: -201px 0;
}
.dice-6 {
    background-position: -251px 0;
}
</style>
