import { Configuration } from '@nuxt/types';
const config = require('config');

const client: { host: string; port: number } = config.get('client');
const server: { host: string; port: number } = config.get('server');
const url = `http://${server.host}:${server.port}/graphql`;

const nuxtConfig: Configuration = {
    /*
     ** Nuxt.js dev-modules
     */
    buildModules: ['@nuxt/typescript-build', '@nuxtjs/stylelint-module'],
    typescript: {
        typeCheck: true,
        ignoreNotFoundWarnings: true
    },
    mode: 'universal',
    /*
     ** Host and port config
     */
    server: {
        port: client.port,
        host: client.host
    },
    /*
     ** Headers of the page
     */
    head: {
        titleTemplate: '%s | Contentry',
        meta: [
            { charset: 'utf-8' },
            {
                name: 'viewport',
                content: 'width=device-width, initial-scale=1'
            },
            {
                hid: 'description',
                name: 'description',
                content: process.env.npm_package_description || ''
            }
        ],
        link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }]
    },
    /*
     ** Customize the progress-bar color
     */
    loading: { color: '#fff' },
    /*
     ** Global CSS
     */
    css: ['ant-design-vue/dist/antd.css'],
    /*
     ** Plugins to load before mounting the App
     */
    plugins: ['@/plugins/antd-ui'],
    /*
     ** Nuxt.js modules
     */
    modules: [
        '@nuxtjs/pwa',
        '@nuxtjs/style-resources',
        '@nuxtjs/auth',
        '@nuxtjs/apollo'
    ],
    /*
     ** Apollo options
     */
    apollo: {
        defaultOptions: {
            $query: {
                loadingKey: 'loading'
            }
        },
        clientConfigs: {
            default: {
                httpEndpoint: url
            }
        }
    },
    /*
     ** Auth configuration
     */
    auth: {
        strategies: {
            localGraphQL: {
                _scheme: '~/apollo/scheme'
            }
        },
        watchLoggedIn: true,
        rewriteRedirects: false,
        resetOnError: true
    },
    /*
     ** Build configuration
     */
    build: {
        /*
         ** You can extend webpack config here
         */
    },
    /*
     ** Style resources
     */
    styleResources: {
        scss: './assets/css/variables.scss'
    },
    /*
     ** Router configuration
     */
    router: {
        middleware: ['auth']
    }
};

export default nuxtConfig;
