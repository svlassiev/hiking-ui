<template>
    <div>
        <v-app-bar app dense hide-on-scroll flat ref="header" :class="{'ml-n2': $vuetify.breakpoint.xs}">
            <v-app-bar-nav-icon @click="$vuetify.goTo(0, {duration: 1000})" :class="{'ml-2': $vuetify.breakpoint.smAndUp}">
                <v-icon>mdi-transfer-up</v-icon>
            </v-app-bar-nav-icon>
            <v-toolbar-title class="headline text-uppercase">
                Поход - редактирование
            </v-toolbar-title>
            <v-spacer/>
            <v-app-bar-nav-icon @click="onExitClick">
                <v-icon>mdi-exit-run</v-icon>
            </v-app-bar-nav-icon>
            <v-app-bar-nav-icon @click="onCollapseClick">
                <v-icon>mdi-arrow-collapse-vertical</v-icon>
            </v-app-bar-nav-icon>
        </v-app-bar>

        <v-content>
            <v-layout v-if="loading" justify-center>
                <v-progress-circular indeterminate color="blue" size="70"/>
            </v-layout>
            <v-layout v-else-if="editForbidden" justify-center class="ma-8">
                <v-btn text @click="onExitClick">Перейти к просмотру</v-btn>
            </v-layout>
            <v-timeline v-else dense clipped align-top class="timeline" :class="{'ml-n7': $vuetify.breakpoint.xs}">
                <v-timeline-item fill-dot :small="$vuetify.breakpoint.xsOnly">
                    <v-row class="subtitle-2 text-start pr-2">
                        <v-col cols="1" class="pa-0">
                            <v-btn @click="onAddImagesList" text width="100%" class="mb-4" :disabled="loading" :loading="loading">
                                <v-icon color="black" left large>mdi-camera-plus-outline</v-icon>
                            </v-btn>
                        </v-col>
                    </v-row>
                </v-timeline-item>
                <v-item-group multiple :value="activeLists">
                    <div
                            v-for="imagesList in foldersWithImages"
                            :key="imagesList.listId"
                            ref="folder"
                            class="mb-4"
                    >
                        <v-item v-slot:default="{ active, toggle }" :value="imagesList.listId">
                            <edit-image-list-timeline-items :imagesList="imagesList" :active="active" :toggle="toggle"/>
                        </v-item>
                    </div>
                </v-item-group>
            </v-timeline>
            <v-snackbar v-model="errorSnackbar" :timeout="6000">
                <v-layout>
                    {{ errorSnackbar }}
                </v-layout>
            </v-snackbar>
            <v-snackbar v-model="updateSnackbar" :timeout="3000">
                <v-layout>
                    {{ updateMessage }}
                </v-layout>
            </v-snackbar>
        </v-content>
    </div>
</template>

<script>
    import firebase from 'firebase/compat/app'
    import 'firebase/compat/auth'
    import EditImageListTimelineItems from './EditImageListTimelineItems'
    import { uuid } from 'uuidv4'

    export default {
        name: 'HikingTimeline',
        components: {EditImageListTimelineItems},
        data() {
            return {
                activeLists: []
            }
        },
        mounted() {
            firebase.auth().currentUser.getIdToken()
                .then(idToken => {
                    this.$store.dispatch('loadEditPage', { idToken })
                })
        },
        computed: {
            loading() {
                return this.$store.state.loading
            },
            updating() {
                return this.$store.state.updating
            },
            updateMessage() {
                return this.$store.state.updateMessage
            },
            editForbidden() {
                return this.$store.state.editForbidden
            },
            foldersWithImages() {
                return this.$store.state.folders
            },
            errorSnackbar: {
                get() {
                    return this.$store.state.updateError
                },
                set() {}
            },
            updateSnackbar: {
                get() {
                    return this.updating === false && this.updateMessage
                },
                set() {}
            }
        },
        methods: {
            onCollapseClick() {
                this.activeLists = []
            },
            onExitClick() {
                firebase.auth().signOut().then(() => this.$router.replace('timeline'))
            },
            onAddImagesList() {
                const newName = 'Новый альбом ' + this.$moment(new Date()).format('lll')
                const newImagesList = { listId: uuid(), name: newName, images: [] }
                this.$store.dispatch('addImagesList', newImagesList)
            }
        }
    }
</script>
<style scoped lang="scss">
    .timeline {
        max-width: 100%;
        overflow-x: hidden;
    }
</style>