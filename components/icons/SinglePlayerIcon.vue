<template lang="pug" functional>
    svg(version="1.1" viewBox="0 0 100 200" :width="props.width" :height="props.height" xmlns="http://www.w3.org/2000/svg")
        path(d="m96.217 184.34c1.7899-3.2255-0.58488-39.905-5.4946-59.02-5.2113-20.289-25.058-36.957-25.063-57.905-0.002537-13.022 15.905-14.931 14.9-36.113-0.59451-12.532-10.372-28.632-30.557-29.042h-0.1611c-20.185 0.40971-29.963 16.51-30.557 29.042-1.0049 21.182 14.902 23.091 14.9 36.113-0.0041 20.948-19.851 37.616-25.063 57.905-4.9097 19.115-7.2845 55.794-5.4946 59.02 4.5761 8.2463 29.942 12.567 46.295 12.867 16.353-0.30019 41.719-4.6204 46.295-12.867z" fill="#fff" stroke="#000" stroke-width="1.8898")
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

const SinglePlayerIconProps = Vue.extend({
    props: {
        width: {
            type: Number,
            required: false,
            default: 15
        },
        height: {
            type: Number,
            required: false,
            default: 30
        }
    }
});

@Component
export default class SinglePlayerIcon extends SinglePlayerIconProps {}
</script>
