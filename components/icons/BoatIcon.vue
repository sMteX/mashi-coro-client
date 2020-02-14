<template lang="pug" functional>
    svg(version="1.1" viewBox="0 0 100 100" :width="width" :height="height" xmlns="http://www.w3.org/2000/svg")
        g
            circle(cx="50" cy="50" r="50" fill="#4170a2" stroke-width="3" stroke="#fff")
        path(d="m39.393 7.2832-0.44922 57.539h-24.121l16.561 15.535h46.354l4.7988-15.535h-42.662c6.8494-10.67 17.256-19.941 37.322-17.346z" fill="#fff")
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

const BoatIconProps = Vue.extend({
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
export default class BoatIcon extends BoatIconProps {}
</script>
