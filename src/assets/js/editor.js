// @ts-check
/// <reference path="globals.d.ts"/>
import { computed, createApp, defineComponent, onMounted, reactive, ref, watch } from 'https://cdn.jsdelivr.net/npm/vue@3.2.31/dist/vue.esm-browser.js';
import Color from 'https://cdn.jsdelivr.net/npm/color@4.2.1/index.js/+esm';
import Picker from 'https://cdn.jsdelivr.net/npm/vanilla-picker@2.12.1/dist/vanilla-picker.mjs';

console.log('Editor.js');

Object.assign(window, { Color });

const editorStyle = document.createElement('style');
const editorStyleText = document.createTextNode('');
editorStyle.append(editorStyleText);
document.head.append(editorStyle);
editorStyleText.data = /*css*/`
.uni-editor {
    position: fixed;
    width: 250px;
    background-color: rgb(255 255 255 / 50%);
    z-index: 10000000000;
    padding: 10px;
    max-height: 100%;
    max-width: 100%;
    overflow: auto;
    box-sizing: border-box;
    box-shadow: 0 0 5px rgb(0 0 0 / 25%);
    backdrop-filter: blur(5px);
}
.uni-editor.uni-editor-position-top-right {
    right: 0;
    top: 0;
}
.uni-editor.uni-editor-position-top-left {
    left: 0;
    top: 0;
}
.uni-editor.uni-editor-position-bottom-right {
    right: 0;
    bottom: 0;
}
.uni-editor.uni-editor-position-bottom-left {
    left: 0;
    bottom: 0;
}
.uni-editor h3 {
    margin: 0;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
}
.uni-editor h3 select {
    border: solid 1px #999;
    border-radius: 3px;
    padding: 3px;
    font-size: 10px;
    font-family: inherit;
}
.uni-editor * + h3 {
    border-top: solid 1px #bdbdbd;
    margin-top: 10px;
    padding-top: 10px;
}
.uni-editor .pick-colors > div {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 5px;
}
.uni-editor .pick-colors > div > div {
    display: flex;
    border: solid 1px #bdbdbd;
    border-radius: 3px;
}
.uni-editor .pick-colors input[type="text"] {
    width: 55px;
    height: 20px;
    padding: 0 7px;
    font-family: monospace;
    border: 0;
    font-size: 13px;
}
.uni-editor .pick-colors .picker_sample {
    width: 20px;
    height: 20px;
    border-radius: 0 3px 3px 0;
    font-size: 10px;
    height: auto;
}
.uni-editor .pick-colors .picker_sample .popup.popup_left {
    right: -1px;
    margin: 0;
    top: 100%;
    width: 230px;
    border: 0;
    margin-top: 9px;
}
.uni-editor .pick-colors .picker_sample .popup.popup_left .picker_arrow {
    display: none;
}
.uni-editor .nice-color-palettes {
    --gap: 5px;
    --cols: 4;
    display: flex;
    flex-wrap: wrap;
    gap: var(--gap);
    margin-top: 10px;
}

.uni-editor .nice-color-palettes > div {
    display: flex;
    width: calc((100% - (var(--cols) - 1) * var(--gap)) / var(--cols));
    cursor: pointer;
    transition: transform 0.2s, opacity 0.2s;
}

.uni-editor .nice-color-palettes > div > span {
    background-color: var(--color);
    aspect-ratio: 1 / 1;
    flex: 1;
}

.uni-editor .nice-color-palettes > div:hover {
    transform: scale(1.25);
}

.uni-editor textarea {
    display: block;
    width: 100%;
    box-sizing: border-box;
    border: 0;
    padding: 5px;
    border: solid 1px #9e9e9e;
    border-radius: 3px;
    font-size: 10px;
    color: #212121;
    resize: none;
    background-color: rgb(255 255 255 / 50%);
}
`;

const style = document.createElement('style');
const styleText = document.createTextNode('');
const colorsLevels = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
const createColorConfig = (colorBase, name) => {
    return colorsLevels.map(level => {
        let key = level + '';
        if (name !== 'gray' && name !== 'light' && level === 50) {
            key = '';
        }
        let percent = 0;
        let targetColor = level < 50 ? '#ffffff' : '#000000';
        if (level < 50) {
            // 10 -> 40
            // 90% -> 0%
            percent = (1 - (level - 10) / 40) * 90;
        } else {
            // 50 -> 100
            // 0% -> 90%
            percent = (level - 50) / (100 - 50) * 90;
        }
        try {
            const color = Color(targetColor).mix(Color(colorBase), 1 - percent / 100).hex();
            return [key, color];
        } catch (err) {
            return [key, '#000000'];
        }
    });
};
const colors = reactive({
    'primary': '#3f51b5',
    'secondary': '#ff5722',
    'tertiary': '#7e57c2',
    'darkgrey': '#616161',
    'gray': '#9e9e9e',
});
const generatedCSS = ref('');
const generatedSASS = ref('');
const update = () => {
    const cssVars = {};
    for (const name in colors) {
        for (const [key, color] of createColorConfig(colors[name], name)) {
            cssVars['--color-' + name + (key ? '-' + key : '')] = color;
        }
    }
    let code = ':root {\n';
    for (const [key, value ] of Object.entries(cssVars)) {
        code += `    ${key}: ${value};\n`;
    }
    code += '}';
    generatedCSS.value = code;
    let sassCode = '$user-config: (\n';
    sassCode += "    'color': (\n";
    for (const [key, value] of Object.entries(colors)) {
        sassCode += `        '${key}': ${value},\n`;
    }
    sassCode += '    ),\n';
    sassCode += ');';
    generatedSASS.value = sassCode;
    styleText.data = code;
};

const colorPalettes = ref([]);
fetch('https://cdn.jsdelivr.net/npm/nice-color-palettes@3.0.0/200.json').then(res => res.json()).then(data => {
    const dataColors = [...data].map(palette => {
        const paletteColors = [...palette].map(color => Color(color));
        const totalSaturation = paletteColors.reduce((acc, color) => acc + color.hsl().array()[2], 0);
        return {
            palette: paletteColors,
            totalSaturation,
        }; 
    });
    dataColors.sort((a, b) => {
        // return a.palette[0].hsl().array()[0] - b.palette[0].hsl().array()[0];
        return a.totalSaturation - b.totalSaturation;
    });
    for (let { palette } of dataColors) {
        palette = palette.sort((a, b) => Color(b).hsl().array()[1] - Color(a).hsl().array()[1]);
        const primary = palette.find(color => color.contrast(Color('white')) > 4.5 && color.contrast(Color('black')) > 3 && color.hsl().saturationv() > 50 && color.hsl().l() > 40);
        if (!primary) continue;
        const secondary = palette.find(color => color !== primary && color.contrast(Color('white')) > 2 && color.hsl().l() > 40);
        if (!secondary) continue;
        const tertiary = palette.find(color => color !== primary && color !== secondary && color.contrast(Color('white')) > 2 && color.hsl().l() > 40);
        if (!tertiary) continue;
        palette = [
            primary,
            secondary,
            tertiary,
        ];
        colorPalettes.value.push(palette.map(color => {
            // color = Color.hsl(color.hsl().array()[0], 100, 50);
            return color.hex();
        }));
    }
});

const InputColor = defineComponent({
    template: /*html*/`
        <input type="text" v-model="value">
        <div class="picker_sample" ref="pickerContainer"></div>
    `,
    props: {
        modelValue: {
            type: String,
        },
    },
    setup(props, { emit }) {
        const pickerContainer = ref();
        const value = ref(props.modelValue);
        watch(() => props.modelValue, modelValue => {
            value.value = modelValue;
        });
        watch(value, value => {
            emit('update:modelValue', value);
        });
        /** @type {Picker} */
        let picker;
        onMounted(() => {
            picker = new Picker({
                parent: pickerContainer.value,
                popup: 'left',
                color: value.value,
                onChange(color) {
                    value.value = color.hex;
                    pickerContainer.value.style.color = color.hex;
                },
            });
        });
        return {
            pickerContainer,
            value,
        };
    },
});

const App = defineComponent({
    components: {
        InputColor,
    },
    template: /*html*/`
    <div class="uni-editor" :class="{ ['uni-editor-position-' + position]: true }">
        <h3>
            Position:
            <select v-model="position">
                <option value="top-right">Top Right</option>
                <option value="top-left">Top Left</option>
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
            </select>
        </h3>
        <h3>Colors:</h3>
        <div class="pick-colors">
            <div v-for="(color, name) of colors" :key="name">
                {{ name }}:
                <div>
                    <InputColor v-model="colors[name]"></InputColor>
                </div>
            </div>
        </div>
        <h3>Nice Color Palettes:</h3>
        <div class="nice-color-palettes">
            <div v-for="palette of colorPalettes" v-on:click="applyColorPalette(palette)">
                <span v-for="color of palette" :style="{ '--color': color }" :title="Color(color).hsl().toString()"></span>
            </div>
        </div>
        <h3>Generated CSS:</h3>
        <textarea readonly :value="generatedCSS" :rows="Math.min(generatedCSSRows, 7)"></textarea>
        <h3>Generated SASS:</h3>
        <textarea readonly :value="generatedSASS" :rows="Math.min(generatedSASSRows, 7)"></textarea>
    </div>
    `,
    setup() {
        const position = ref('top-right');
        const applyColorPalette = (palette) => {
            colors['primary'] = palette[0];
            colors['secondary'] = palette[1];
            colors['tertiary'] = palette[2];
        };
        // setInterval(() => {
        //     if (colorPalettes.value.length) {
        //         applyColorPalette(colorPalettes.value[Math.floor(Math.random() * colorPalettes.value.length)]);
        //     }
        // }, 1000);
        const generatedCSSRows = computed(() => generatedCSS.value.split('\n').length);
        const generatedSASSRows = computed(() => generatedSASS.value.split('\n').length);
        return {
            position,
            colors,
            colorPalettes,
            applyColorPalette,
            Color,
            generatedCSS,
            generatedSASS,
            generatedCSSRows,
            generatedSASSRows,
        };
    },
});

window.addEventListener('load', () => {
    const computedStyles = getComputedStyle(document.documentElement);
    Object.entries(colors).forEach(([name, color]) => {
        colors[name] = computedStyles.getPropertyValue('--color-' + name).trim() || colors[name];
    });
    colorPalettes.value.unshift([
        colors['primary'],
        colors['secondary'],
        colors['tertiary'],
    ]);
    update();
    watch(colors, update);
    const app = createApp(App);
    const appContainer = document.createElement('div');
    app.mount(appContainer);
    document.documentElement.appendChild(appContainer);
});
style.append(styleText);
document.head.append(style);
