import Vue from 'vue';
import Vuex from 'vuex';
import axios from 'axios'

Vue.use(Vuex);

const apiUrl = 'https://serg.vlassiev.info/hiking-api/'

export default new Vuex.Store({
    state: {
        folders: [],
        loading: true,
        firebaseConfig: {
            data: null,
            loading: false
        }
    },
    mutations: {
        LOAD_TIMELINE_SUBMIT (state){
            state.loading = true
            state.folders = []
        },
        LOAD_TIMELINE_SUCCESS (state, response){
            state.loading = false
            state.folders = response.data
        },
        LOAD_TIMELINE_ERROR (state){
            state.loading = false
            state.folders = []
        },

        LOAD_EDIT_SUBMIT (state){
            state.loading = true
            state.folders = []
        },
        LOAD_EDIT_SUCCESS (state, response){
            const { data: {imageLists = []} } = response
            state.folders = imageLists
            state.loading = false
        },
        LOAD_EDIT_ERROR (state){
            state.folders = []
            state.loading = false
        }
    },
    actions: {
        async loadTimeline({commit}) {
            commit('LOAD_TIMELINE_SUBMIT')
            const response = await axios.get(apiUrl + 'folders').catch(() => commit('LOAD_TIMELINE_ERROR'))
            if(response.status === 200) {
                commit('LOAD_TIMELINE_SUCCESS', response)
            } else {
                commit('LOAD_TIMELINE_ERROR')
            }
        },
        async loadEditPage({commit}) {
            commit('LOAD_EDIT_SUBMIT')
            const response = await axios.get(apiUrl + 'edit/data').catch(() => commit('LOAD_EDIT_ERROR'))
            if(response.status === 200) {
                commit('LOAD_EDIT_SUCCESS', response)
            } else {
                commit('LOAD_EDIT_ERROR')
            }
        }
    }
})

