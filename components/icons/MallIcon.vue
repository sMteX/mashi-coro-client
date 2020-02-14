<template lang="pug" functional>
    svg(version="1.1" viewBox="0 0 100 100" :width="width" :height="height" xmlns="http://www.w3.org/2000/svg")
        g
            circle(cx="50" cy="50" r="50" fill="#416216" stroke-width="3" stroke="#fff")
        path(d="m36.113 16.814v4.7988h11.996v10.125a25.286 25.286 0 0 0-22.887 25.148 25.286 25.286 0 0 0 25.285 25.285 25.286 25.286 0 0 0 25.285-25.285 25.286 25.286 0 0 0-22.887-25.166v-10.107h11.996v-4.7988z" fill="#fff")
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

const MallIconProps = Vue.extend({
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
export default class MallIcon extends MallIconProps {}
</script>
