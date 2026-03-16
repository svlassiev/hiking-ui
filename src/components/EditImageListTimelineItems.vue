<template>
    <div>
        <v-timeline-item fill-dot :color="dotColor()" :small="$vuetify.breakpoint.xsOnly">
            <v-row>
                <v-col class="py-0">
                    <v-row class="subtitle-2 text-start pr-2">
                        <v-col cols="10" class="py-0 pr-0">
                            <v-row>
                                <v-btn fab left small color="error" class="mr-8" @click="removeListConfirmationDialog = true"><v-icon>mdi-close</v-icon></v-btn>
                                <v-text-field v-model="updates.listName" class="py-0" @input="onListNameUpdated"></v-text-field>
                            </v-row>
                        </v-col>
                        <v-col cols="2" class="pa-0">
                            <v-btn @click="onChevronClick" text max-width="100%" class="mb-4" ref="chevronButton" :disabled="loading" :loading="loading">
                                <v-icon v-if="active" color="black" right large>mdi-chevron-up</v-icon>
                                <v-icon v-else color="black" right large>mdi-chevron-down</v-icon>
                            </v-btn>
                        </v-col>
                    </v-row>
                </v-col>
            </v-row>
        </v-timeline-item>
        <v-dialog v-model="removeListConfirmationDialog" :id="imagesList.listId" max-width="400px">
            <v-card>
                <v-card-title>
                    Удалить альбом?
                </v-card-title>
                <v-card-text>
                    {{ imagesList.name }}. Точно удаляем?
                </v-card-text>
                <v-card-actions>
                    <v-spacer/>
                    <v-btn text @click="removeListConfirmationDialog = false">Отмена</v-btn>
                    <v-btn color="error" @click="onListDelete">Удаляем</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <v-slide-y-transition v-if="active">
            <div>
                <v-timeline-item hide-dot>
                    <v-row class="subtitle-2 text-start pr-2">
                        <v-col cols="9" class="pa-0">
                            <v-file-input v-model="imagesToUpload" multiple chips prepend-icon="mdi-image-plus" accept="image/jpeg" full-width></v-file-input>
                        </v-col>
                        <v-col cols="3">
                            <v-btn @click="onAddImage" text max-width="100%" class="mb-4" :disabled="imagesToUpload.length < 1" :loading="loading">
                                Загрузить
                            </v-btn>
                        </v-col>
                    </v-row>
                </v-timeline-item>
                <div v-if="noImages || loading" v-observe-visibility="onListVisibilityChange"></div>
                <v-col v-else class="mb-4" v-observe-visibility="onListVisibilityChange">
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
                                <v-col cols="4" sm="2" align="left"><div class="caption">{{ image.timestamp | moment("LT") }}</div></v-col>
                                <v-col cols="8" sm="10" align="right"><div class="caption gps">{{ gps(image) }}</div></v-col>
                            </v-row>
                        </v-timeline-item>
                        <v-timeline-item hide-dot class="mb-0 pb-0">
                            <v-row>
                                <v-col cols="3" sm="2">
                                    <v-btn :id="image.imageId" fab left small color="error" class="mr-8" @click="updateDeleteImageDialog(image.imageId, true)"><v-icon>mdi-close</v-icon></v-btn>
                                </v-col>
                                <v-col cols="9" sm="10">
                                    <v-img :src="image.location" :lazy-src="image.thumbnail" max-width="max-content" :max-height="$vuetify.breakpoint.xs ? 300 : 600" contain class="ml-n7"/>
                                </v-col>
                            </v-row>
                            <v-dialog v-model="deleteImageConfirmationDialog[image.imageId]" :id="image.imageId" max-width="400px">
                                <v-card>
                                    <v-card-title>
                                        Удалить фотографию?
                                    </v-card-title>
                                    <v-card-text>
                                        <v-row>
                                            <v-img :src="image.thumbnail" max-width="80px"/>
                                        </v-row>
                                        <v-row>
                                            {{ image.timestamp | moment("LL") }} {{ image.timestamp | moment("LT") }}
                                        </v-row>
                                    </v-card-text>
                                    <v-card-actions>
                                        <v-spacer/>
                                        <v-btn text @click="updateDeleteImageDialog(image.imageId, false)">Отмена</v-btn>
                                        <v-btn color="error" @click="onImageDelete(image.imageId)">Удаляем</v-btn>
                                    </v-card-actions>
                                </v-card>
                            </v-dialog>
                        </v-timeline-item>
                        <v-timeline-item hide-dot class="mt-0 pt-0">
                            <v-row>
                                <v-col>
                                    <v-text-field v-model="image.description" class="py-0" @input="onImageDescriptionUpdated(image.imageId, image.description)"></v-text-field>
                                </v-col>
                            </v-row>
                        </v-timeline-item>
                        </div>
                    </div>
                </v-col>
            </div>
        </v-slide-y-transition>
    </div>
</template>

<script>
import axios from 'axios'
import { ObserveVisibility } from 'vue-observe-visibility'
import debounce from 'lodash/debounce'

const apiUrl = 'https://serg.vlassiev.info/hiking-api/'

export default {
    name: "EditImageListTimelineItems",
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
    data () {
        return {
            loading: false,
            images: [],
            updates: {
                listName: this.imagesList.name
            },
            removeListConfirmationDialog: false,
            deleteImageConfirmationDialog: {},
            imagesToUpload: []
        }
    },
    computed: {
        colors () {
            return ["#00FFFF", "#8A2BE2", "#A52A2A", "#7FFF00", "#D2691E", "#FF7F50", "#DC143C", "#00FFFF", "#00008B", "#006400", "#8B008B", "#FF8C00", "#FF1493", "#B22222", "#228B22", "#008000", "#4B0082", "#CD5C5C", "#800000", "#0000CD", "#6B8E23", "#FFA500", "#FF4500", "#800080", "#FF0000", "#F4A460", "#FF6347", "#EE82EE", "#FFFF00", "#9ACD32"]
        },
        dateToImage () {
            return this.images.map(image => ({ date: this.$moment(image.timestamp).format("LL"), image: image}))
        },
        imagesByDate () {
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
        noImages () {
            return this.images.length === 0
        }
    },
    methods: {
        loadImages() {
            this.loading = true
            axios
                .post(apiUrl + 'images', { imageIds: this.imagesList.images, skip: 0, limit: 1000 })
                .then(response => {
                    this.images = response.data
                })
                .finally(() => this.loading = false)
        },
        onChevronClick() {
            if (!this.active && this.noImages) {
                this.loadImages()
            }
            this.toggle()
            this.$vuetify.goTo(this.$refs.chevronButton, {duration: 200})
        },
        dotColor () {
            return this.colors[Math.floor(Math.random() * this.colors.length)]
        },
        onListVisibilityChange(visible) {
            if (visible && this.noImages) {
                this.loadImages()
            }
        },
        onListNameUpdated: debounce(function () {
            this.$store.dispatch('updateListName', { listId: this.imagesList.listId, listName: this.updates.listName })
        }, 700),
        onImageDescriptionUpdated: debounce(function (imageId, description) {
            this.$store.dispatch('updateImageDescription', { imageId, description })
        }, 700),
        onListDelete() {
            this.$store.dispatch('deleteImagesList', this.imagesList.listId)
            this.removeListConfirmationDialog = false
        },
        onAddImage() {
            this.imagesToUpload.forEach(image => this.$store.dispatch('addImage', { listId: this.imagesList.listId, image } ))
            this.$nextTick(() => { this.imagesToUpload = [] })
        },
        updateDeleteImageDialog(imageId, value) {
            const dialog = {}
            dialog[imageId] = value
            this.deleteImageConfirmationDialog = dialog
        },
        onImageDelete(imageId) {
            this.$store.dispatch('deleteImage', { listId: this.imagesList.listId, imageId } )
            this.updateDeleteImageDialog(imageId, false)
        },
        gps (image) {
            if (image.gps) {
                return image.gps.latitude + ' ' + image.gps.latitudeRef + ', ' + image.gps.longitude + ' ' + image.gps.longitudeRef + ', ' + image.gps.altitude
            }
            return ''
        }
    }
}
</script>
<style scoped lang="scss">
    .gps {
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
    }
</style>