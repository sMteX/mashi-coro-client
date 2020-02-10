<template lang="pug">
    svg(version="1.1" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg")
        g
            circle(cx="50" cy="50" r="50" :fill="color")
        path(d="m47.966 8.0569-0.84375 11.621h-11.42l6.0371 9.291 4.7031 0.06836-4.6211 63.658 16.109-0.08398-4.4648-63.576 4.5449-0.06641 6.0391-9.291h-11.242l-0.81641-11.621z" fill="#fff")
</template>

<script lang="ts">
import 'reflect-metadata';
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class TowerIcon extends Vue {
    @Prop() readonly type!: 'purple'|'dominant-inactive'|'dominant-active';

    get color (): string {
        if (this.type === 'purple') {
            return '#952981';
        } else if (this.type === 'dominant-active') {
            return '#723718';
        }
        return '#8a8a8a';
    }
}
</script>
