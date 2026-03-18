import * as types from './types'

export default {
    [types.LOAD_SIMPLE_TIMELINE.SUBMIT] (state) {
        state.loading = true
        state.timelineEntries = []
    },
    [types.LOAD_SIMPLE_TIMELINE.SUCCESS] (state, response) {
        state.loading = false
        state.timelineEntries = response.data
    },
    [types.LOAD_SIMPLE_TIMELINE.ERROR] (state) {
        state.loading = false
        state.timelineEntries = []
    },

    [types.LOAD_SIMPLE_TIMELINE_TAIL.SUBMIT] () {
    },
    [types.LOAD_SIMPLE_TIMELINE_TAIL.SUCCESS] (state, response) {
        let timelineEntries = [...state.timelineEntries, ...response.data]
        state.timelineEntries = timelineEntries
    },
    [types.LOAD_SIMPLE_TIMELINE_TAIL.ERROR] () {
    },

    // Add images to the store, skipping any that are already loaded.
    // This is used by the window-based image loading in SimpleTimeline.
    // Images can arrive in any order (not just top-to-bottom), so we
    // check by imageId to avoid duplicates.
    'ADD_IMAGES' (state, newImages) {
        newImages.forEach(image => {
            // Only add this image if we don't already have it
            const alreadyExists = state.images.some(existing => existing.imageId === image.imageId)
            if (!alreadyExists) {
                state.images.push(image)
            }
        })
    },

    [types.LOAD_TIMELINE.SUBMIT] (state) {
        state.loading = true
        state.folders = []
    },
    [types.LOAD_TIMELINE.SUCCESS] (state, response) {
        state.loading = false
        state.folders = response.data
    },
    [types.LOAD_TIMELINE.ERROR] (state) {
        state.loading = false
        state.folders = []
    },

    [types.LOAD_EDIT.SUBMIT] (state, idToken) {
        state.loading = true
        state.idToken = idToken
        state.folders = []
        state.editForbidden = false
    },
    [types.LOAD_EDIT.SUCCESS] (state, response) {
        const {data: {imagesLists = []}} = response
        state.folders = imagesLists
        state.loading = false
    },
    [types.LOAD_EDIT.ERROR] (state) {
        state.folders = []
        state.idToken = ''
        state.loading = false
        state.editForbidden = true
    },

    [types.UPDATE_LIST_NAME.SUBMIT] (state) {
        state.updateError = null
        state.updating = true
    },
    [types.UPDATE_LIST_NAME.SUCCESS] (state) {
        state.updateMessage = 'Images list name is updated'
        state.updating = false
    },
    [types.UPDATE_LIST_NAME.ERROR] (state, error) {
        state.updateError = error
        state.updating = false
    },

    [types.UPDATE_IMAGE_DESCRIPTION.SUBMIT] (state) {
        state.updateError = null
        state.updating = true
    },
    [types.UPDATE_IMAGE_DESCRIPTION.SUCCESS] (state) {
        state.updateMessage = 'Image description is updated'
        state.updating = false
    },
    [types.UPDATE_IMAGE_DESCRIPTION.ERROR] (state, error) {
        state.updateError = error
        state.updating = false
    },

    [types.ADD_IMAGES_LIST.SUBMIT] (state) {
        state.updateError = null
        state.updating = true
    },
    [types.ADD_IMAGES_LIST.SUCCESS] (state, imagesList) {
        state.updateMessage = `Images list [${imagesList.name}] is created`
        state.folders.unshift(imagesList)
        state.updating = false
    },
    [types.ADD_IMAGES_LIST.ERROR] (state, error) {
        state.updateError = error
        state.updating = false
    },

    [types.DELETE_IMAGES_LIST.SUBMIT] (state) {
        state.updateError = null
        state.updating = true
    },
    [types.DELETE_IMAGES_LIST.SUCCESS] (state, listId) {
        state.updateMessage = `Images list [${listId}] is deleted`
        state.folders = state.folders.filter(folder => folder.listId !== listId)
        state.updating = false
    },
    [types.DELETE_IMAGES_LIST.ERROR] (state, error) {
        state.updateError = error
        state.updating = false
    },

    [types.ADD_IMAGE.SUBMIT] (state) {
        state.updateError = null
        state.updating = true
    },
    [types.ADD_IMAGE.SUCCESS] (state, {listId, image}) {
        state.updateMessage = `Image is added to list [${listId}]`
        const list = state.folders.find(list => list.listId === listId)
        if (list) {
            list.images.unshift(image)
        }
        state.updating = false
    },
    [types.ADD_IMAGE.ERROR] (state, error) {
        state.updateError = error
        state.updating = false
    },

    [types.DELETE_IMAGE.SUBMIT] (state) {
        state.updateError = null
        state.updating = true
    },
    [types.DELETE_IMAGE.SUCCESS] (state, {listId, imageId}) {
        state.updateMessage = `Image [${imageId}] is deleted from list [${listId}]`
        const list = state.folders.find(list => list.listId === listId)
        if (list) {
            list.images = list.images.filter(image => image.imageId !== imageId)
        }
        state.updating = false
    },
    [types.DELETE_IMAGE.ERROR] (state, error) {
        state.updateError = error
        state.updating = false
    },

    [types.INITIALIZE_IMAGES_LIST.SUBMIT] (state, listId) {
        if (state.lists.some(list => list.listId === listId)) {
            state.lists = state.lists.map(list => {
                if (list.listId === listId) {
                    list.loading = true
                }
                return list
            })
        } else {
            state.lists.push({listId, loaded: false, loading: true, images: []})
        }
    },
    [types.INITIALIZE_IMAGES_LIST.SUCCESS] (state, {listId, cache, limit}) {
        state.lists = state.lists.map(list => {
            if (list.listId === listId) {
                list.loading = false
                const imagesLimit = cache.length > limit ? limit : cache.length
                const images = cache.slice(0, imagesLimit)
                const initialCache = cache.slice(imagesLimit)
                list.images = images
                list.cache = initialCache
                list.loaded = imagesLimit < limit
            }
            return list
        })
    },
    [types.INITIALIZE_IMAGES_LIST.ERROR] (state, listId) {
        state.lists = state.lists.map(list => {
            if (list.listId === listId) {
                list.loading = false
            }
            return list
        })
    },

    [types.LOAD_IMAGES.SUBMIT] () {},
    [types.LOAD_IMAGES.SUCCESS] (state, listId) {
        state.lists = state.lists.map(list => {
            if (list.listId === listId) {
                list.images = list.images.concat(list.cache)
                list.cache = []
            }
            return list
        })
    },
    [types.LOAD_IMAGES.ERROR] () {},

    [types.LOAD_IMAGES_TO_CACHE.SUBMIT] (state, listId) {
        state.lists = state.lists.map(list => {
            if (list.listId === listId) {
                list.loading = true
                list.cache = []
            }
            return list
        })
    },
    [types.LOAD_IMAGES_TO_CACHE.SUCCESS] (state, {listId, images, limit}) {
        state.lists = state.lists.map(list => {
            if (list.listId === listId) {
                list.cache = images
                list.loading = false
                list.loaded = images.length < limit
            }
            return list
        })
    },
    [types.LOAD_IMAGES_TO_CACHE.ERROR] (state, listId) {
        state.lists = state.lists.map(list => {
            if (list.listId === listId) {
                list.loading = false
            }
            return list
        })
    }
}
