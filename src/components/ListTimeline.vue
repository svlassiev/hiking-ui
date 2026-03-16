<template>
    <div>
        <v-timeline-item fill-dot :color="dotColor()" :small="$vuetify.breakpoint.xsOnly">
            <v-row>
                <div>
                    <v-btn @click="onChevronClick" text class="mb-4" ref="chevronButton" :disabled="loading" :loading="loading">
                        <div :id="id" class="subtitle-2 text-start">
                            {{ name }}
                            <v-icon v-if="active" color="black" right large>mdi-chevron-up</v-icon>
                            <v-icon v-else color="black" right large>mdi-chevron-down</v-icon>
                        </div>
                    </v-btn>
                </div>
            </v-row>
        </v-timeline-item>
        <v-slide-y-transition v-if="active">
            <v-col class="mb-4">
                <div
                        v-for="imagesWithinDate in imagesByDate"
                        :key="imagesWithinDate.date"
                        ref="date"
                        class="mb-4"
                        :small="$vuetify.breakpoint.xsOnly"
                >
                    <v-timeline-item hide-dot>
                        <div class="subtitle-1">{{ imagesWithinDate.date }}</div>
                    </v-timeline-item>
                    <div
                            v-for="image in imagesWithinDate.images"
                            :key="image.imageId"
                            ref="image"
                            class="mb-4">

                        <v-timeline-item hide-dot class="mb-0 pb-0">
                            <v-row>
                                <v-col align="left">
                                    <span class="caption pr-2">{{ image.timestamp | moment("LT") }}</span>
                                    <v-tooltip v-if="gps(image)" top>
                                        <template v-slot:activator="{ on }">
                                            <v-icon v-on="on" small color="black" @click="onMapClick(image)">mdi-map-marker-radius-outline</v-icon>
                                        </template>
                                        <span>{{ gps(image) }}</span>
                                    </v-tooltip>
                                </v-col>
                            </v-row>
                        </v-timeline-item>
                        <v-timeline-item hide-dot class="mb-0 pb-0" align="center">
                            <v-img :src="responsiveSrc(image)" :lazy-src="image.thumbnail" max-width="max-content" :max-height="$vuetify.breakpoint.xs ? 300 : 600" contain
                                   class="ml-n7"/>
                        </v-timeline-item>
                        <v-timeline-item hide-dot class="mt-0 py-0">
                            <v-row>
                                <v-col cols="12" align="center">
                                    <div class="caption">{{ image.description }}</div>
                                </v-col>
                            </v-row>
                        </v-timeline-item>
                    </div>
                </div>
                <div class="loading-placeholder" v-if="!loaded" v-observe-visibility="onListVisibilityChange"></div>
                <div
                        v-for="image in nonLoadedImages"
                        :key="image.imageId"
                        ref="image"
                        class="mb-4">

                    <v-timeline-item hide-dot class="mb-0 pb-0">
                        <v-row>
                            <v-col align="center">
                                <v-progress-circular indeterminate color="blue" size="70"/>
                            </v-col>
                        </v-row>
                    </v-timeline-item>
                </div>
            </v-col>
        </v-slide-y-transition>
    </div>
</template>

<script>
    import {ObserveVisibility} from 'vue-observe-visibility'

    export default {
        name: "ListTimeline",
        directives: {
            ObserveVisibility
        },
        props: {
            imagesList: {
                type: Object,
                required: true
            },
            active: {
                type: Boolean,
                required: true
            },
            toggle: {
                type: Function,
                required: true
            }
        },
        created() {
            this.$store.dispatch('initializeImagesList', this.imagesList)
        },
        mounted() {
            this.toggle()
        },
        computed: {
            colors() {
                return ["#00FFFF", "#8A2BE2", "#A52A2A", "#7FFF00", "#D2691E", "#FF7F50", "#DC143C", "#00FFFF", "#00008B", "#006400", "#8B008B", "#FF8C00", "#FF1493", "#B22222", "#228B22", "#008000", "#4B0082", "#CD5C5C", "#800000", "#0000CD", "#6B8E23", "#FFA500", "#FF4500", "#800080", "#FF0000", "#F4A460", "#FF6347", "#EE82EE", "#FFFF00", "#9ACD32"]
            },
            id() {
                return this.imagesList.listId
            },
            name() {
                return this.imagesList.name
            },
            imageIds() {
                return this.imagesList.images
            },
            listData() {
                return this.$store.state.lists.find(list => list.listId === this.id) || {}
            },
            loading() {
                return this.listData.loading
            },
            loaded() {
                return this.listData.loaded && this.listData.cache.length === 0
            },
            images() {
                return this.listData.images || []
            },
            dateToImage() {
                return this.images.map(image => ({date: this.$moment(image.timestamp).format("LL"), image: image}))
            },
            imagesByDate() {
                let imagesByDate = []
                let images = this.dateToImage
                while (images.length > 0) {
                    let indexDate = images[0].date
                    let lastIndex = images.findIndex(pair => pair.date !== indexDate)
                    let chunk = images.splice(0, lastIndex > 0 ? lastIndex : images.length)
                    imagesByDate.push({date: indexDate, images: chunk.map(pair => pair.image)})
                }
                return imagesByDate
            },
            nonLoadedImages() {
                const alreadyLoaded = this.images.length
                return this.imageIds.slice(alreadyLoaded, this.imageIds.length)
            }
        },
        methods: {
            loadImages() {
                this.$store.dispatch('loadMoreImages', this.imagesList)
            },
            onChevronClick() {
                if (!this.active && !this.loaded) {
                    this.loadImages()
                }
                this.toggle()
                this.$vuetify.goTo(this.$refs.chevronButton, {duration: 200})
            },
            dotColor() {
                return this.colors[Math.floor(Math.random() * this.colors.length)]
            },
            onListVisibilityChange(visible) {
                if (visible && !this.loaded) {
                    this.loadImages()
                }
            },
            coordinates(image) {
                if (image.gps) {
                    return image.gps.latitude + ' ' + image.gps.latitudeRef + ', ' + image.gps.longitude + ' ' + image.gps.longitudeRef
                }
                return ''
            },
            gps(image) {
                if (image.gps) {
                    return this.coordinates(image) + ', ' + image.gps.altitude
                }
                return ''
            },
            map(image) {
                return 'https://yandex.ru/maps/?l=sat&mode=search&text=' + this.coordinates(image)
            },
            variantUrl(image, name) {
                if (image.variants) {
                    const variant = image.variants.find(v => v.name === name)
                    if (variant) return variant.location
                }
                return image.location
            },
            responsiveSrc(image) {
                if (this.$vuetify.breakpoint.xs) return this.variantUrl(image, 'V800')
                if (this.$vuetify.breakpoint.smAndDown) return this.variantUrl(image, 'V1024')
                return this.variantUrl(image, 'V2048')
            },
            onMapClick(image) {
                window.open(this.map(image))
            }
        }
    }
</script>
<style scoped lang="scss">
    .loading-placeholder {
        height: 200px;
    }

    .gps {
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
        cursor: pointer;
    }
</style>
