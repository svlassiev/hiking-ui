<template>
    <div>
        <v-app-bar app dense hide-on-scroll flat ref="header" :class="{'ml-n2': $vuetify.breakpoint.xs}">
            <v-app-bar-nav-icon @click="$vuetify.goTo(0, {duration: 1000})" :class="{'ml-2': $vuetify.breakpoint.smAndUp}">
                <v-icon>mdi-transfer-up</v-icon>
            </v-app-bar-nav-icon>
            <v-toolbar-title class="headline text-uppercase">
                Поход
            </v-toolbar-title>
            <v-spacer/>
        </v-app-bar>

        <v-content :class="{'ml-n7': $vuetify.breakpoint.xs}">
            <v-row v-if="loading" justify-center class="ma-4" :class="{'ml-6': $vuetify.breakpoint.xs}">
                <v-col align="start">
                    <v-progress-circular indeterminate :color="dotColor()" :size="$vuetify.breakpoint.xsOnly ? '26' : '42'"/>
                </v-col>
            </v-row>
            <v-timeline v-else dense clipped align-top class="timeline">
                <div
                    v-for="entry in entries"
                    :key="entry.listId + entry.imageId + entry.title + entry.date"
                    ref="entry"
                    class="mb-4"
                    :small="$vuetify.breakpoint.xsOnly"
                >

                    <v-timeline-item v-if="entry.title" fill-dot :color="dotColor()" :small="$vuetify.breakpoint.xsOnly">
                        <div :id="entry.listId" class="subtitle-2 text-start text-uppercase mt-2">
                            {{ entry.title }}
                        </div>
                    </v-timeline-item>

                    <v-timeline-item v-if="entry.date" hide-dot>
                        <div class="subtitle-1">{{ $moment(entry.date).format("LL") }}</div>
                    </v-timeline-item>

                    <image-item v-else-if="image(entry.imageId)" :image="image(entry.imageId)" />

                    <v-timeline-item v-else-if="entry.imageId" hide-dot :small="$vuetify.breakpoint.xsOnly" class="loading-placeholder" v-observe-visibility="onImageVisibilityChange">
                        <v-row>
                            <v-col align="center">
                                <v-progress-linear :color="dotColor()" class="image-loader"/>
                            </v-col>
                        </v-row>
                    </v-timeline-item>
                </div>

            </v-timeline>
        </v-content>
    </div>
</template>

<script>
import {ObserveVisibility} from 'vue-observe-visibility'
    import ImageItem from './ImageItem'
    export default {
        name: 'SimpleTimeline',
        components: { ImageItem },
        directives: { ObserveVisibility },
        mounted () {
            this.$store.dispatch('loadSimpleTimeline')
        },
        computed: {
            colors() {
                return ["#00FFFF", "#8A2BE2", "#A52A2A", "#7FFF00", "#D2691E", "#FF7F50", "#DC143C", "#00FFFF", "#00008B", "#006400", "#8B008B", "#FF8C00", "#FF1493", "#B22222", "#228B22", "#008000", "#4B0082", "#CD5C5C", "#800000", "#0000CD", "#6B8E23", "#FFA500", "#FF4500", "#800080", "#FF0000", "#F4A460", "#FF6347", "#EE82EE", "#FFFF00", "#9ACD32"]
            },
            loading () {
                return this.$store.state.loading
            },
            loaded() {
                return false
            },
            data () {
                return this.$store.state.timelineEntries
            },
            images () {
                return this.$store.state.images
            },
            imageMap () {
                const map = new Map()
                this.images.forEach(img => map.set(img.imageId, img))
                return map
            },
            entries () {
                const entries = this.data
                return entries
            }
        },
        methods: {
            dotColor() {
                return this.colors[Math.floor(Math.random() * this.colors.length)]
            },
            onImageVisibilityChange(visible) {
                if (visible && !this.loaded) {
                    this.loadImages()
                }
            },
            image(imageId) {
                return this.imageMap.get(imageId)
            },
            loadImages() {
                this.$store.dispatch('loadImages')
            }
        }
    }
</script>
<style scoped lang="scss">
    .timeline {
        max-width: 100%;
        overflow-x: hidden;
    }

    .loading-placeholder {
        height: 200px;
    }

    .image-loader {
        max-width: 200px;
    }
</style>