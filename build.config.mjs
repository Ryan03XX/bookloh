export default {
    assetsBlacklist: {
        css: {
            files: [
                'magic-cursor.css',
                'uni-core-bundle.min.css',
            ],
            folders: [
                'uni-core/css/components/**',
            ]
        },
        js: {
            files: [
                'app-head.js',
                'uikit-components.js',
                'uni-core-icons.min.js',
                'uni-core.min.js',
                'anime-helper-defined-timelines.js',
                'dynamic-background.js',
                'imgtrigger.js',
            ],
            folders: [
                'uni-core/css/components/**',
                'uni-core/js/components/**'
            ]
        },
        images: {
            files: [],
            folders: []
        }
    }
}; 