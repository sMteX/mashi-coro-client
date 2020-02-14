<template lang="pug" functional>
    svg(version="1.1" viewBox="0 0 100 100" :width="width" :height="height" xmlns="http://www.w3.org/2000/svg")
        g
            circle(cx="50" cy="50" r="50" fill="#84160f" stroke-width="3" stroke="#fff")
        g(transform="translate(0 -73.542)")
            path(d="m14.7 115.54a31.271 36.215 0 0 0 15.565 31.456 31.271 36.215 0 0 0 31.306 0.0703 31.271 36.215 0 0 0 9.6873-10.144 12.261 11.245 0 0 0 5.6229 1.2552 12.261 11.245 0 0 0 12.26-11.245 12.261 11.245 0 0 0-11.902-11.233 31.271 36.215 0 0 0 0.0011-0.0202zm62.398 4.5511a7.5529 6.9272 0 0 1 7.5525 6.9277 7.5529 6.9272 0 0 1-7.5525 6.9272 7.5529 6.9272 0 0 1-3.6928-0.88832 31.271 36.215 0 0 0 3.575-12.963 7.5529 6.9272 0 0 1 0.11782-4e-3z" fill="#fff" stroke-width=".22442")
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

const CoffeeIconProps = Vue.extend({
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
export default class CoffeeIcon extends CoffeeIconProps {}
</script>
