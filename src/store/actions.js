import axios from 'axios'
import * as types from './types'

const apiUrl = 'https://serg.vlassiev.info/hiking-api/'

export default {
    async loadSimpleTimeline({commit, dispatch}) {
        commit(types.LOAD_SIMPLE_TIMELINE.SUBMIT)
        axios.get(apiUrl + 'timeline/data/head')
            .then(response => {
                commit(types.LOAD_SIMPLE_TIMELINE.SUCCESS, response)
                dispatch('loadImages')
                dispatch('loadSimpleTimelineTail')

            })
            .catch(() => commit(types.LOAD_SIMPLE_TIMELINE.ERROR))
    },
    async loadSimpleTimelineTail({commit}) {
        commit(types.LOAD_SIMPLE_TIMELINE_TAIL.SUBMIT)
        axios.get(apiUrl + 'timeline/data/tail')
            .then(response => {
                commit(types.LOAD_SIMPLE_TIMELINE_TAIL.SUCCESS, response)
            })
            .catch(() => commit(types.LOAD_SIMPLE_TIMELINE_TAIL.ERROR))
    },
    async loadImages({state, commit}) {
        if (state.loading || state.loaded || state.loadingImages) {
            return
        }
        commit(types.LOAD_IMAGES_FLAT.SUBMIT)
        const alreadyLoaded = state.images.length
        const limit = 5
        const imageIds = state.timelineEntries.filter(entry => entry.imageId).map(entry => entry.imageId).slice(alreadyLoaded, alreadyLoaded + limit)
        axios.post(apiUrl + 'images', {imageIds, skip: 0, limit})
          .then(response => {
              commit(types.LOAD_IMAGES_FLAT.SUCCESS, {images: response.data, limit})
          })
          .catch(() => commit(types.LOAD_IMAGES_FLAT.ERROR))
    },
    async loadTimeline({commit}) {
        commit(types.LOAD_TIMELINE.SUBMIT)
        axios.get(apiUrl + 'folders')
            .then(response => {
                commit(types.LOAD_TIMELINE.SUCCESS, response)
            })
            .catch(() => commit(types.LOAD_TIMELINE.ERROR))
    },
    async loadEditPage({commit}, idToken) {
        commit(types.LOAD_EDIT.SUBMIT, idToken)
        axios.get(apiUrl + 'edit/data', {params: idToken})
            .then(response => {
                commit(types.LOAD_EDIT.SUCCESS, response)
            })
            .catch(() => commit(types.LOAD_EDIT.ERROR))
    },
    async updateListName({commit, state}, {listId, listName}) {
        commit(types.UPDATE_LIST_NAME.SUBMIT)
        axios.put(apiUrl + `edit/images-lists/${listId}/name`, {listName}, {params: state.idToken})
            .then(response => {
                commit(types.UPDATE_LIST_NAME.SUCCESS, response)
            })
            .catch(error => commit(types.UPDATE_LIST_NAME.ERROR, error))
    },
    async updateImageDescription({commit, state}, {imageId, description}) {
        commit(types.UPDATE_IMAGE_DESCRIPTION.SUBMIT)
        axios.put(apiUrl + `edit/images/${imageId}/description`, {description}, {params: state.idToken})
            .then(response => {
                commit(types.UPDATE_IMAGE_DESCRIPTION.SUCCESS, response)
            })
            .catch(error => commit(types.UPDATE_IMAGE_DESCRIPTION.ERROR, error))
    },
    async addImagesList({commit, state}, imagesList) {
        commit(types.ADD_IMAGES_LIST.SUBMIT)
        axios.post(apiUrl + `edit/images-lists`, imagesList, {params: state.idToken})
            .then(() => {
                commit(types.ADD_IMAGES_LIST.SUCCESS, imagesList)
            })
            .catch(error => commit(types.ADD_IMAGES_LIST.ERROR, error))
    },
    async deleteImagesList({commit, state}, listId) {
        commit(types.DELETE_IMAGES_LIST.SUBMIT)
        axios.delete(apiUrl + `edit/images-lists/${listId}`, {params: state.idToken})
            .then(() => {
                commit(types.DELETE_IMAGES_LIST.SUCCESS, listId)
            })
            .catch(error => commit(types.DELETE_IMAGES_LIST.ERROR, error))
    },
    async addImage({commit, state}, {listId, image}) {
        commit(types.ADD_IMAGE.SUBMIT)
        axios.post(apiUrl + `edit/images/signed-url`, listId, {params: state.idToken})
            .then(response => {
                const {signedUrl, location} = response.data
                axios.put(signedUrl, image, {headers: {'Content-Type': 'image/jpeg'}})
                    .then(() => {
                        axios.post(apiUrl + `edit/images`, {listId, location}, {params: state.idToken})
                            .then(response => {
                                commit(types.ADD_IMAGE.SUCCESS, {listId, image: response.data})
                            }).catch(error => commit(types.ADD_IMAGE.ERROR, error))
                    }).catch(error => commit(types.ADD_IMAGE.ERROR, error))
            }).catch(error => commit(types.ADD_IMAGE.ERROR, error))
    },
    async deleteImage({commit, state}, {listId, imageId}) {
        commit(types.DELETE_IMAGE.SUBMIT)
        axios.delete(apiUrl + `edit/images-lists/${listId}/images/${imageId}`, {params: state.idToken})
            .then(() => {
                commit(types.DELETE_IMAGE.SUCCESS, {listId, imageId})
            })
            .catch(error => commit(types.DELETE_IMAGE.ERROR, error))
    },

    async initializeImagesList({commit, state}, imagesList) {
        commit(types.INITIALIZE_IMAGES_LIST.SUBMIT, imagesList.listId)
        const { listId, loaded = false, images = [], cache = [] } = state.lists.find(list => list.listId === imagesList.listId)
        if (!loaded && cache.length === 0) {
            const skip = images.length
            const limit = 1
            axios.post(apiUrl + 'images', {imageIds: imagesList.images, skip, limit})
                .then(response => {
                    commit(types.INITIALIZE_IMAGES_LIST.SUCCESS, {listId, cache: response.data, limit})
                })
                .catch(() => commit(types.INITIALIZE_IMAGES_LIST.ERROR, listId))
        }
    },

    async loadMoreImages({commit, dispatch, state}, imagesList) {
        const { listId, cache=[] } = state.lists.find(list => list.listId === imagesList.listId)
        commit(types.LOAD_IMAGES.SUBMIT)
        if (cache.length > 0) {
            commit(types.LOAD_IMAGES.SUCCESS, listId)
        }
        dispatch('loadImagesToCache', imagesList)
    },
    async loadImagesToCache({commit, state}, imagesList) {
        const { listId, loaded = false, loading = false, images = [] } = state.lists.find(list => list.listId === imagesList.listId)
        if (loaded || loading) {
            return
        }
        const skip = images.length
        const limit = 5
        commit(types.LOAD_IMAGES_TO_CACHE.SUBMIT, listId)
        axios.post(apiUrl + 'images', {imageIds: imagesList.images, skip, limit})
            .then(response => {
                commit(types.LOAD_IMAGES_TO_CACHE.SUCCESS, {listId, images: response.data, limit})
            })
            .catch(() => commit(types.LOAD_IMAGES_TO_CACHE.ERROR, listId))
    }
}

