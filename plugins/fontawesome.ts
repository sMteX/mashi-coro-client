import Vue from 'vue';
import { library, config } from '@fortawesome/fontawesome-svg-core';
import { faDice, faDiceFive, faCheck, faPowerOff, faRedoAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

config.autoAddCss = false;

library.add(faDice, faDiceFive, faCheck, faPowerOff, faRedoAlt);

Vue.component('font-awesome-icon', FontAwesomeIcon);
