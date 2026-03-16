<template>
    <v-layout justify-center align-center>
        <v-form>
            <v-text-field v-model="email" label="E-mail" required></v-text-field>
            <v-text-field v-model="password" label="Password" type="password" required></v-text-field>
            <v-btn @click="onLoginClick">Попробовать войти</v-btn>
            <v-btn v-if=false @click="onGoogleLoginClick">Google</v-btn>
        </v-form>
        <v-snackbar v-model="snackbar" :timeout="6000">
            <v-layout>
                {{ error }}
            </v-layout>
        </v-snackbar>
    </v-layout>
</template>

<script>
    import firebase from 'firebase/compat/app'
    import 'firebase/compat/auth'

    export default {
        name: 'login',
        data () {
            return {
                email: '',
                password: '',
                snackbar: false,
                error: ''
            }
        },
        methods: {
            onLoginClick () {
                firebase.auth().signInWithEmailAndPassword(this.email, this.password).then(
                    () => {
                        this.error = ''
                        this.email = ''
                        this.password = ''
                        this.$router.replace('edit')
                    },
                    (error) => {
                        this.snackbar = true
                        this.error = error.message
                    }
                )
            },
            onGoogleLoginClick () {
                const provider = new firebase.auth.GoogleAuthProvider()
                firebase.auth().signInWithPopup(provider).then(
                    () => {
                        this.error = ''
                        this.$router.replace('edit')
                    },
                    (error) => {
                        this.snackbar = true
                        this.error = error.message
                    }
                )
            }
        }
    }
</script>