<template lang="pug" functional>
    svg(version="1.1" viewBox="0 0 100 100" :width="width" :height="height" xmlns="http://www.w3.org/2000/svg")
        g
            circle(cx="50" cy="50" r="50" fill="#4170a2" stroke-width="3" stroke="#fff")
        path(d="m51.653 25.756c-9.6749-0.10868-19.591 1.2348-29.941 5.1816l-4.3164 17.84-8.3457-5.7539 10.27 25.766 4.6133 0.61524 6.4102-14.008 8.6328 17.264 4.8906-10.359h26.473l5.4668 10.934 11.459-39.18 2.791 20.031 1.9102-7.7051c-0.41103-6.7811-0.42022-11.218-4.0703-14.48l0.28125-0.96289c-12.046-2.5011-24.084-5.0419-36.523-5.1816z" fill="#fff")
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

const PigIconProps = Vue.extend({
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
export default class PigIcon extends PigIconProps {}
</script>
