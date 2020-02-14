<template lang="pug" functional>
    svg(version="1.1" viewBox="0 0 100 100" :width="width" :height="height" xmlns="http://www.w3.org/2000/svg")
        g
            circle(cx="50" cy="50" r="50" fill="#416216" stroke-width="3" stroke="#fff")
        path(d="m44.652 18.324c-8.6127 0-15.547 7.6544-15.547 15.279 0 0.04339 0.0074 0.08375 0.0078 0.12695h-7.6504c-2.7536 0-4.9707 2.4938-4.9707 5.5918v31.746c0 3.098 2.2171 5.5918 4.9707 5.5918h58.09c2.7536 0 4.9707-2.4938 4.9707-5.5918v-31.746c0-3.098-2.2171-5.5918-4.9707-5.5918h-7.6426c0-7.6249-6.9322-15.406-15.545-15.406zm1.2031 6.6816h9.3066c6.762 0 9.6059 2.8142 9.6738 8.7246h-28.428c-0.0012-0.09145-0.0078-0.17912-0.0078-0.27148 0-6.0598 2.6103-8.4531 9.4551-8.4531z" fill="#fff")
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

const SuitcaseIconProps = Vue.extend({
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
export default class SuitcaseIcon extends SuitcaseIconProps {}
</script>
