#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import * as sass from 'sass';
import * as terser from 'terser';
import CleanCSS from 'clean-css';
import { PurgeCSS } from 'purgecss';
import deleteAsync from 'del';
import { Command } from 'commander';
import glob from 'fast-glob';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SRC_FOLDER = 'src';
let isMinified = false;
let usePurgeCSS = false;
let isLite = false;

// Default configuration
const defaultConfig = {
    assetsBlacklist: {
        css: {
            files: [
                'magic-cursor.css',
            ],
            folders: []
        },
        js: {
            files: ['app-head.js', 'uikit-components.js', 'uni-core-icons.min.js', 'uni-core.min.js', 'anime-helper-defined-timelines.js', 'dynamic-background.js', 'imgtrigger.js'],
            folders: ['uni-core/css/components/**','uni-core/js/components/**']
        },
        images: {
            files: [],
            folders: []
        }
    },
    purgeCSSSafeList: [
        'bp-xs', 'bp-sm', 'bp-md', 'bp-lg', 'bp-xl', 'bp-xxl', 'dom-ready', 'page-preload', 'loaded', 'page-revealer', 'darkmode-trigger', 'uc-sticky-placeholder', 'header', 'uc-sticky', 'uc-open', 'uc-active', 'uc-sticky-below', 'uc-sticky-fixed', 'inner', 'nav-desktop', 'wrap', 'sm:hstack', 'xl:btn-xl', 'uc-svg', 'uc-circle-text', 'uc-circle-text-path', 'center-icon', 'uni-testimonials', 'image-hover-revealer',
        '[dir=ltr]', '[dir=rtl]', 'swiper-pagination-clickable', 'swiper-pagination-bullets', 'swiper-pagination-horizontal', 'swiper-pagination-bullet', 'swiper-pagination-bullet-active', 'swiper-slide-fully-visible', 'swiper-watch-progress', 'swiper-initialized', 'swiper-horizontal', 'swiper-slide-visible', 'swiper-slide-prev', 'swiper-slide-next', 'swiper-slide-active', 'uc-accordion', 'uc-switcher', 'uc-grid', 'uc-grid-margin', 'uc-tab', 'uc-tooltip',
    ],
    sassOptions: {
        silenceDeprecations: ['mixed-decls', 'import', 'global-builtin', 'color-functions']
    }
};

// Load external configuration if it exists
let buildConfig = defaultConfig;
try {
    const configPath = path.join(process.cwd(), 'build.config.mjs');
    if (await fs.access(configPath).then(() => true).catch(() => false)) {
        const userConfig = await import(pathToFileURL(configPath).href);
        buildConfig = {
            ...defaultConfig,
            ...userConfig.default,
            assetsBlacklist: {
                ...defaultConfig.assetsBlacklist,
                ...(userConfig.default?.assetsBlacklist || {}),
                css: {
                    ...defaultConfig.assetsBlacklist.css,
                    ...(userConfig.default?.assetsBlacklist?.css || {}),
                    files: [
                        ...defaultConfig.assetsBlacklist.css.files,
                        ...(userConfig.default?.assetsBlacklist?.css?.files || [])
                    ],
                    folders: [
                        ...defaultConfig.assetsBlacklist.css.folders,
                        ...(userConfig.default?.assetsBlacklist?.css?.folders || [])
                    ]
                },
                js: {
                    ...defaultConfig.assetsBlacklist.js,
                    ...(userConfig.default?.assetsBlacklist?.js || {}),
                    files: [
                        ...defaultConfig.assetsBlacklist.js.files,
                        ...(userConfig.default?.assetsBlacklist?.js?.files || [])
                    ],
                    folders: [
                        ...defaultConfig.assetsBlacklist.js.folders,
                        ...(userConfig.default?.assetsBlacklist?.js?.folders || [])
                    ]
                },
                images: {
                    ...defaultConfig.assetsBlacklist.images,
                    ...(userConfig.default?.assetsBlacklist?.images || {}),
                    files: [
                        ...defaultConfig.assetsBlacklist.images.files,
                        ...(userConfig.default?.assetsBlacklist?.images?.files || [])
                    ],
                    folders: [
                        ...defaultConfig.assetsBlacklist.images.folders,
                        ...(userConfig.default?.assetsBlacklist?.images?.folders || [])
                    ]
                }
            },
            purgeCSSSafeList: [
                ...defaultConfig.purgeCSSSafeList,
                ...(userConfig.default?.purgeCSSSafeList || [])
            ],
            sassOptions: {
                ...defaultConfig.sassOptions,
                ...(userConfig.default?.sassOptions || {})
            }
        };
        console.log('📝 Loaded external build configuration');
    }
} catch (error) {
    console.warn(error);
    console.log('ℹ️  No external build configuration found, using defaults');
}

// Helper function to create blacklist patterns for glob
const createAssetBlacklistPattern = (type) => {
    const config = buildConfig.assetsBlacklist[type] || { files: [], folders: [] };
    const filePatterns = config.files.map(file => '!' + path.join(SRC_FOLDER, 'assets', type, '**', file).replace(/\\/g, '/'));
    const folderPatterns = config.folders.map(folder => '!' + path.join(SRC_FOLDER, 'assets', type, folder).replace(/\\/g, '/'));
    return [...filePatterns, ...folderPatterns];
};

// Clean Dist Folder
async function clean() {
    console.log('🧹 Cleaning dist folder...');
    await deleteAsync('dist/**', { force: true });
}

// Clean Large CSS Files
async function cleanLargeCSS() {
    console.log('🧹 Cleaning up large unminified CSS files...');
    try {
        await deleteAsync([
            'dist/assets/css/theme/*.css',
            '!dist/assets/css/theme/*.min.css',
            '!dist/assets/css/theme/*.purge.css'
        ], { force: true });
        console.log('✅ Large CSS files cleaned');
    } catch (err) {
        console.log('⚠️  No large CSS files to clean');
    }
}

// Copy Files
async function copyFiles(src, dest, options = {}) {
    const files = await glob(src, { dot: true, ...options });
    for (const file of files) {
        const destPath = path.join(dest, path.relative(options.base || '.', file));
        await fs.mkdir(path.dirname(destPath), { recursive: true });
        await fs.copyFile(file, destPath);
    }
}

// Copy All Assets
async function copyAssets() {
    console.log('📦 Copying static assets (fonts, images, favicon)...');
    
    // Copy fonts
    await copyFiles(
        [
            path.join(SRC_FOLDER, 'assets/fonts/**/*'),
            ...createAssetBlacklistPattern('fonts')
        ],
        'dist/assets/fonts',
        { base: path.join(SRC_FOLDER, 'assets/fonts') }
    );

    // Copy favicon
    await copyFiles(
        [
            path.join(SRC_FOLDER, 'favicon.ico'),
        ],
        'dist',
        { base: path.join(SRC_FOLDER) }
    );

    // Optional hero still/mockup at src root or project root: ../main.* (HTML under main/)
    async function copyFirstFound(fileName) {
        const candidates = [path.join(SRC_FOLDER, fileName), path.join(__dirname, fileName)];
        for (const srcPath of candidates) {
            try {
                await fs.access(srcPath);
                await fs.copyFile(srcPath, path.join('dist', fileName));
                return path.relative(__dirname, srcPath);
            } catch {
                // try next
            }
        }
        return null;
    }

    const pngFrom = await copyFirstFound('main.png');
    if (pngFrom) console.log('🖼️  Hero mockup:', pngFrom, '→ dist/main.png');

    const jpgFrom = await copyFirstFound('main.jpg');
    if (jpgFrom) console.log('🖼️  Hero image:', jpgFrom, '→ dist/main.jpg');

    // Video: HTML uses ../main_compress.mp4 — search src/ then project root (same as your file layout)
    const videoDest = 'main_compress.mp4';
    const videoSources = [
        path.join(SRC_FOLDER, 'main_compress.mp4'),
        path.join(__dirname, 'main_compress.mp4'),
        path.join(SRC_FOLDER, 'main.mp4'),
        path.join(__dirname, 'main.mp4'),
    ];
    for (const srcPath of videoSources) {
        try {
            await fs.access(srcPath);
            await fs.copyFile(srcPath, path.join('dist', videoDest));
            console.log('📹 Hero video:', path.relative(__dirname, srcPath), '→ dist/' + videoDest);
            break;
        } catch {
            // try next
        }
    }

    // Brand icons under src/assets/icons (HTML: ../assets/icons/...)
    const iconsDir = path.join(SRC_FOLDER, 'assets/icons');
    try {
        await fs.access(iconsDir);
        await copyFiles(
            [path.join(SRC_FOLDER, 'assets/icons/**/*')],
            'dist/assets/icons',
            { base: iconsDir }
        );
    } catch {
        // optional directory
    }

    // Optional: src/icons/ (flat) merged into dist/assets/icons so paths match HTML
    const flatIconsDir = path.join(SRC_FOLDER, 'icons');
    try {
        await fs.access(flatIconsDir);
        await copyFiles(
            [path.join(SRC_FOLDER, 'icons/**/*')],
            'dist/assets/icons',
            { base: flatIconsDir }
        );
    } catch {
        // optional directory
    }

    // Copy images if they exist
    const imagesDir = path.join(SRC_FOLDER, 'assets/images');
    try {
        await fs.access(imagesDir);
        console.log('📸 Copying images...');
        await copyFiles(
            [
                path.join(SRC_FOLDER, 'assets/images/**/*'),
                ...createAssetBlacklistPattern('images')
            ],
            'dist/assets/images',
            { base: path.join(SRC_FOLDER, 'assets/images') }
        );
    } catch {
        console.log('📁 No images directory found, skipping...');
    }
}

// Process CSS Files
async function processCSS() {
    console.log('🎨 Processing CSS files...');
    const cleanCSSOptions = {
        level: isMinified ? 2 : 0,
        compatibility: 'ie9',
        format: isMinified ? false : 'beautify'
    };

    const cssFiles = await glob([
        path.join(SRC_FOLDER, 'assets/css/**/*.css'),
        ...createAssetBlacklistPattern('css')
    ]);
    for (const file of cssFiles) {
        const content = await fs.readFile(file, 'utf8');
        const processed = new CleanCSS(cleanCSSOptions).minify(content).styles;
        const destPath = path.join('dist/assets/css', path.relative(path.join(SRC_FOLDER, 'assets/css'), file));
        await fs.mkdir(path.dirname(destPath), { recursive: true });
        await fs.writeFile(destPath, processed);
    }
}

// Process SCSS Files
async function processSass() {
    console.log(`🎨 Compiling SCSS (${isMinified ? 'minified' : 'beautified'})...`);
    const sassOptions = {
        style: isMinified ? 'compressed' : 'expanded',
        charset: false,
        sourceMap: false,
        ...buildConfig.sassOptions,
        loadPaths: [
            'node_modules',
            ...(buildConfig.sassOptions?.loadPaths || [])
        ]
    };

    const files = await glob(path.join(SRC_FOLDER, 'assets/scss/theme/*.scss'));
    
    for (const file of files) {
        const result = sass.compile(file, sassOptions);
        const cleanCSSResult = new CleanCSS({
            level: isMinified ? 2 : 0,
            format: isMinified ? false : 'beautify',
            compatibility: 'ie9'
        }).minify(result.css);

        const destPath = path.join(
            'dist/assets/css/theme',
            path.basename(file, '.scss') + '.min.css'
        );

        await fs.mkdir(path.dirname(destPath), { recursive: true });
        await fs.writeFile(destPath, cleanCSSResult.styles);

        if (usePurgeCSS) {
            const purged = await new PurgeCSS().purge({
                content: glob.sync('dist/**/*.html'),
                css: [
                    {
                        raw: cleanCSSResult.styles,
                    },
                ],
                stdin: true,
                safelist: buildConfig.purgeCSSSafeList,
                defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || []
            });

            const purgedPath = path.join(
                path.dirname(destPath),
                path.basename(destPath, '.min.css') + '.purge.css'
            );
            await fs.writeFile(purgedPath, purged[0].css);
            await fs.unlink(destPath);
        }
    }
}

// Process HTML Files
async function processHTML() {
    console.log('📄 Processing HTML files...');
    const files = await glob(path.join(SRC_FOLDER, '**/*.html'));
    
    for (const file of files) {
        let content = await fs.readFile(file, 'utf8');
        content = content.replace(
            /assets\/s?css\/theme\/(.*?)\.s?css/g,
            `assets/css/theme/$1${usePurgeCSS ? '.purge' : '.min'}.css`
        );
        
        const destPath = path.join('dist', path.relative(SRC_FOLDER, file));
        await fs.mkdir(path.dirname(destPath), { recursive: true });
        await fs.writeFile(destPath, content);
    }
}

// Process JS Files
async function processJS() {
    console.log(`⚙️  Processing JavaScript files (${isMinified ? 'minified' : 'beautified'})...`);
    
    const jsFiles = await glob([
        path.join(SRC_FOLDER, 'assets/js/**/*.js'),
        ...createAssetBlacklistPattern('js')
    ]);
    for (const file of jsFiles) {
        const content = await fs.readFile(file, 'utf8');
        
        // Use different terser options based on whether the file is already minified
        const terserOptions = file.endsWith('.min.js') ? {
            // For .min.js files, just pass through with minimal processing
            compress: false,
            mangle: false,
            output: {
                comments: true,
                beautify: false
            }
        } : (isMinified ? {
            // For non-minified files when minification is requested
            compress: {
                drop_console: true,
                drop_debugger: true,
                pure_funcs: ['console.log', 'console.info', 'console.debug']
            },
            mangle: {
                safari10: true
            },
            output: {
                comments: false
            }
        } : {
            // For non-minified files when beautification is requested
            compress: false,
            mangle: false,
            output: {
                beautify: true,
                comments: true,
                indent_level: 2
            }
        });

        const result = await terser.minify(content, terserOptions);
        const destPath = path.join('dist', path.relative(SRC_FOLDER, file));
        await fs.mkdir(path.dirname(destPath), { recursive: true });
        await fs.writeFile(destPath, result.code);
    }

    // Copy CSS files that are in the JS directory structure
    const jsCssFiles = await glob([
        path.join(SRC_FOLDER, 'assets/js/**/*.css'),
        ...createAssetBlacklistPattern('js').map(pattern => pattern.replace('/**/*.js', '/**/*.css'))
    ]);
    for (const file of jsCssFiles) {
        const content = await fs.readFile(file, 'utf8');
        const processed = new CleanCSS({
            level: isMinified ? 2 : 0,
            compatibility: 'ie9',
            format: isMinified ? false : 'beautify'
        }).minify(content).styles;
        const destPath = path.join('dist', path.relative(SRC_FOLDER, file));
        await fs.mkdir(path.dirname(destPath), { recursive: true });
        await fs.writeFile(destPath, processed);
    }
}

// CLI setup
const program = new Command();
program
    .option('--minify', 'Enable minification', false)
    .option('--purge-css', 'Enable PurgeCSS', false)
    .option('--lite', 'Build lite version', false)
    .option('--clean-only', 'Only clean the dist directory', false)
    .option('--skip-images', 'Skip image processing', false)
    .parse(process.argv);
const options = program.opts();

// Main build function
async function build() {
    try {        
        isMinified = options.minify || options.lite;
        usePurgeCSS = options.purgeCss || options.lite;
        isLite = options.lite;

        if (options.cleanOnly) {
            await clean();
            return;
        }

        console.log('🚀 Starting build process...');
        console.time('⌛ Build completed in');

        await clean();
        await Promise.all([
            copyAssets(),
            processCSS(),
            processJS(),
            processHTML().then(processSass),
        ]);

        if (usePurgeCSS) {
            await cleanLargeCSS();
        }

        console.timeEnd('⌛ Build completed in');
        console.log('✨ Build successful!');
    } catch (error) {
        console.error('❌ Build failed:', error);
        process.exit(1);
    }
}

// Run build
build();