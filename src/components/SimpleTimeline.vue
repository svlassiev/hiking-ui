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
            <!-- Page loading spinner: shows the site favicon rotating while
                 timeline entries are being fetched from the API -->
            <v-row v-if="loading" justify="center" class="ma-8">
                <img :src="spinnerSkin" class="favicon-spinner" />
            </v-row>
            <v-timeline v-else dense clipped align-top class="timeline">
                <!-- The :id on this wrapper div (not on the placeholder inside) ensures
                     we can scroll to an image even after it loads. The placeholder has
                     v-if/v-else — when the image loads, the placeholder disappears and
                     <image-item> replaces it. But this wrapper div persists with the id. -->
                <div
                    v-for="entry in entries"
                    :key="entry.listId + entry.imageId + entry.title + entry.date"
                    :id="entry.imageId ? 'img-' + entry.imageId : null"
                    ref="entry"
                    class="mb-4"
                    :small="$vuetify.breakpoint.xsOnly"
                >

                    <!-- Album title -->
                    <v-timeline-item v-if="entry.title" fill-dot :color="dotColor()" :small="$vuetify.breakpoint.xsOnly">
                        <div :id="entry.listId" class="subtitle-2 text-start text-uppercase mt-2">
                            {{ entry.title }}
                        </div>
                    </v-timeline-item>

                    <!-- Date header -->
                    <v-timeline-item v-if="entry.date" hide-dot>
                        <div class="subtitle-1">{{ $moment(entry.date).format("LL") }}</div>
                    </v-timeline-item>

                    <!-- Loaded image: show the actual photo -->
                    <image-item v-else-if="image(entry.imageId)" :image="image(entry.imageId)" />

                    <!-- Unloaded image placeholder: shows a small spinning favicon while
                         the actual image data is being fetched from the API.
                         The :id lets us scroll to this specific placeholder for deep links.
                         v-observe-visibility watches when this placeholder approaches the
                         viewport (1000px ahead), then triggers image loading.
                         Once the image loads, Vue replaces this with <image-item> above. -->
                    <v-timeline-item
                        v-else-if="entry.imageId"
                        hide-dot
                        :small="$vuetify.breakpoint.xsOnly"
                        class="loading-placeholder"
                        v-observe-visibility="{
                            callback: (visible) => onImageVisible(visible, entry.imageId),
                            intersection: { rootMargin: '1000px' }
                        }"
                    >
                        <v-row justify="center">
                            <img :src="spinnerSkin" class="favicon-spinner favicon-spinner-small" />
                        </v-row>
                    </v-timeline-item>
                </div>

            </v-timeline>
        </v-content>
    </div>
</template>

<script>
import { ObserveVisibility } from 'vue-observe-visibility'
import debounce from 'lodash/debounce'
import ImageItem from './ImageItem'

// Webpack processes this image at build time.
// At 1.3KB it gets inlined as a base64 data URL — no network request needed.
import spinnerSkin from '@/assets/spinner-skin.png'

export default {
    name: 'SimpleTimeline',
    components: { ImageItem },
    directives: { ObserveVisibility },

    data() {
        return {
            // The spinner image URL, resolved by webpack at build time.
            // It's a base64 data URL so it renders instantly without a network request.
            spinnerSkin,

            // Collects imageIds of placeholders that recently became visible.
            // Instead of loading each one immediately, we wait a short time (200ms)
            // and batch them into a single API call. This prevents dozens of tiny
            // requests when the user scrolls quickly.
            pendingImageIds: new Set(),

            // When following a shared link (/hiking?image=xxx), this holds the
            // target image's index in allImageIds. While set, images ABOVE this
            // index are NOT loaded — this prevents layout shift from pushing
            // the target photo down as images above it expand from placeholders
            // to full-size photos. Cleared after the scroll completes.
            deepLinkImageIndex: null
        }
    },

    created() {
        // Create a debounced version of flushPendingImages.
        // "Debounce" means: wait 200ms after the LAST call before actually running.
        // So if 10 placeholders become visible within 200ms (fast scroll),
        // we only make ONE API call for all 10 images.
        this.debouncedLoadImages = debounce(this.flushPendingImages, 200)
    },

    async mounted() {
        // Step 1: Load all timeline entries (titles, dates, imageIds).
        // This is just metadata — fast and small. No actual images yet.
        await this.$store.dispatch('loadSimpleTimeline')

        // Step 2: If the URL has ?image=xxx (shared link), load that image
        // and scroll to it. We load the target + a few images BELOW first,
        // wait for them to render at their final height, then scroll.
        // Images above the target are NOT loaded yet — this prevents
        // layout shift (images expanding above would push the target down).
        const targetImageId = this.$route.query.image
        if (targetImageId) {
            await this.deepLinkToImage(targetImageId)
        }
    },

    computed: {
        colors() {
            return ["#00FFFF", "#8A2BE2", "#A52A2A", "#7FFF00", "#D2691E", "#FF7F50", "#DC143C", "#00FFFF", "#00008B", "#006400", "#8B008B", "#FF8C00", "#FF1493", "#B22222", "#228B22", "#008000", "#4B0082", "#CD5C5C", "#800000", "#0000CD", "#6B8E23", "#FFA500", "#FF4500", "#800080", "#FF0000", "#F4A460", "#FF6347", "#EE82EE", "#FFFF00", "#9ACD32"]
        },
        loading() {
            return this.$store.state.loading
        },
        entries() {
            return this.$store.state.timelineEntries
        },
        images() {
            return this.$store.state.images
        },
        // A Map for fast O(1) lookups: imageId → image object.
        // The images array can have items in any order, so we build
        // a Map for quick access instead of searching with .find() every time.
        imageMap() {
            const map = new Map()
            this.images.forEach(img => map.set(img.imageId, img))
            return map
        },
        // List of ALL imageIds in the timeline, in order.
        // Used by flushPendingImages to find "nearby" images for look-ahead loading.
        allImageIds() {
            return this.entries
                .filter(e => e.imageId)
                .map(e => e.imageId)
        }
    },

    methods: {
        dotColor() {
            return this.colors[Math.floor(Math.random() * this.colors.length)]
        },

        // Look up an image by ID. Returns the image object if loaded, or undefined.
        image(imageId) {
            return this.imageMap.get(imageId)
        },

        // Called by IntersectionObserver when an image placeholder enters or
        // leaves the viewport (plus 1000px margin for look-ahead).
        onImageVisible(visible, imageId) {
            // Only care about placeholders entering the viewport, not leaving.
            // Skip images that are already loaded — nothing to do.
            if (!visible || this.imageMap.has(imageId)) return

            // During a deep link scroll, don't load images ABOVE the target.
            // If we did, they'd expand from 200px placeholders to full-size photos,
            // pushing the target image down and causing the page to jump.
            if (this.deepLinkImageIndex !== null) {
                const thisIndex = this.allImageIds.indexOf(imageId)
                if (thisIndex !== -1 && thisIndex < this.deepLinkImageIndex) return
            }

            // Add this imageId to the "pending" set.
            // Don't fetch it immediately — wait for the debounce to collect
            // more nearby images and batch them into one API call.
            this.pendingImageIds.add(imageId)
            this.debouncedLoadImages()
        },

        // Called after 200ms of no new visibility events.
        // Takes all pending imageIds, expands each one to include a few
        // neighbors (look-ahead), and fetches them all in one API call.
        flushPendingImages() {
            // Grab all pending IDs and clear the set for the next batch
            const pending = [...this.pendingImageIds]
            this.pendingImageIds.clear()

            // For each pending image, also include 3 images before and after it.
            // This "look-ahead" means images are ready before the user scrolls to them.
            const toLoad = new Set()
            pending.forEach(id => {
                const index = this.allImageIds.indexOf(id)
                if (index === -1) return

                // Look 3 positions in each direction
                const start = Math.max(0, index - 3)
                const end = Math.min(this.allImageIds.length - 1, index + 3)
                for (let i = start; i <= end; i++) {
                    const nearbyId = this.allImageIds[i]
                    // Only add if not already loaded
                    if (!this.imageMap.has(nearbyId)) {
                        toLoad.add(nearbyId)
                    }
                }
            })

            // Send one API call for all the images we need
            if (toLoad.size > 0) {
                this.$store.dispatch('loadImageWindow', [...toLoad])
            }
        },

        // Handle a shared link: load the target image + a few below it,
        // wait for them to render at final height, then scroll to the target.
        // Images above are blocked until scrolling is done (see onImageVisible).
        async deepLinkToImage(imageId) {
            const index = this.allImageIds.indexOf(imageId)
            if (index === -1) return

            // Block loading images above the target to prevent layout shift
            this.deepLinkImageIndex = index

            // Load the target + 5 images below it (not above).
            // This ensures the target renders at its final height before we scroll.
            const end = Math.min(this.allImageIds.length, index + 6)
            const idsToLoad = this.allImageIds.slice(index, end)
            await this.$store.dispatch('loadImageWindow', idsToLoad)

            // Wait for Vue to render the loaded images in the DOM
            this.$nextTick(() => {
                const element = document.getElementById('img-' + imageId)
                if (element) {
                    element.scrollIntoView({ block: 'center' })
                }

                // After 2 seconds, allow loading images above the target too.
                // By then the user has seen the target photo and any further
                // layout shift from images above won't be as jarring.
                setTimeout(() => { this.deepLinkImageIndex = null }, 2000)
            })
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

    /* Spinning logo used as a branded loading indicator.
       spinner-skin.png rotates continuously while content loads.
       Two sizes: 48px for the initial page load, 24px for image placeholders. */
    .favicon-spinner {
        width: 48px;
        height: 48px;
        animation: spin 1.5s linear infinite;
    }

    .favicon-spinner-small {
        width: 24px;
        height: 24px;
    }

    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
</style>
