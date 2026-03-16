import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import router from './plugins/router'
import store from './store/index'
import firebase from "firebase/compat/app"
import "firebase/compat/auth"

Vue.config.productionTip = false
Vue.use(require('vue-moment'))

const firebaseConfig = {
    apiKey: "AIzaSyCY-TsZmlriRqWMKI0pV2x4FKDtGY8ChHY",
    authDomain: "thematic-acumen-225120.firebaseapp.com",
    databaseURL: "https://thematic-acumen-225120.firebaseio.com",
    projectId: "thematic-acumen-225120",
    storageBucket: "thematic-acumen-225120.appspot.com",
    messagingSenderId: "771353780452",
    appId: "1:771353780452:web:f28f5686047cc327c50cf1"
}
firebase.initializeApp(firebaseConfig)

let app = ''

firebase.auth().onAuthStateChanged(() => {
    if (!app) {
        app = new Vue({
            vuetify,
            router,
            store,
            render: h => h(App)
        }).$mount('#app')
    }
})