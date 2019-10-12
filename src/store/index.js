import Vue from 'vue';
import Vuex from 'vuex';
import axios from 'axios'

Vue.use(Vuex);

const apiUrl = 'https://serg.vlassiev.info/hiking-api/'

export default new Vuex.Store({
    state: {
        folders: [],
        loading: true
    },
    mutations: {
        getFolders(state) {
            state.loading = true;
            axios
                .get(apiUrl + 'folders')
                .then(response => {
                    state.folders = response.data
                })
                .finally(() => {
                    state.loading = false
                })
        }
    }
})

