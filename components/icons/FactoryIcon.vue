<template lang="pug" functional>
    svg(version="1.1" viewBox="0 0 100 100" :width="props.width" :height="props.height" xmlns="http://www.w3.org/2000/svg")
        g
            circle(cx="50" cy="50" r="50" fill="#416216" stroke-width="3" stroke="#fff")
        path(fill="#ffffff" d="m14.67 74.8v-29.96h68.48v29.96h-68.48zm22.72-29.96 22.72-22.72v22.72h-22.72zm-22.72 0 22.72-22.72v22.72h-22.72zm45.77 0 22.71-22.72v22.72h-22.71z")
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

const FactoryIconProps = Vue.extend({
    props: {
        width: {
            type: Number,
            required: true
        },
        height: {
            type: Number,
            required: true
        }
    }
});

@Component
export default class FactoryIcon extends FactoryIconProps {}
</script>
