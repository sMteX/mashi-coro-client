<template lang="pug" functional>
    svg(version="1.1" viewBox="0 0 100 100" :width="props.width" :height="props.height" xmlns="http://www.w3.org/2000/svg")
        g
            circle(cx="50" cy="50" r="50" fill="#407900" stroke-width="3" stroke="#fff")
        path(d="m17.268 25.299-6.3867 13.324h7.8711v40.832h62.25v-40.832h7.8691l-6.3867-13.324z" fill="#fff")
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

const BoxIconProps = Vue.extend({
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
export default class BoxIcon extends BoxIconProps {}
</script>
