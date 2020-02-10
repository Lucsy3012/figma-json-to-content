var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// This shows the HTML page in "ui.html".
figma.showUI(__html__, { height: 428 });
// Create empty data
let data = [];
let keys;
let random;
figma.ui.onmessage = msg => {
    // Load data
    if (msg.type === 'load') {
        data = [];
        data = msg.data;
        if (msg.data !== []) {
            // Load every text style in use once
            const textNodes = figma.root.findAll(node => node.type === "TEXT");
            for (const textNode of textNodes) {
                loadFontsFrom(textNode);
            }
        }
    }
    // Success
    if (msg.type === 'success') {
        figma.notify('Data has been loaded successfully. Have fun!');
    }
    // Fill in random entry
    if (msg.type === 'fill') {
        getData();
        selectData(random);
    }
    // Fill in specific entry
    if (msg.type === 'fill-specific') {
        getData();
        selectData(msg.index);
    }
    // Close
    if (msg.type === 'close') {
        figma.closePlugin();
    }
    // Error
    if (msg.type === 'warning') {
        // Empty object notification
        notifyWarning('emptyObject', 'I have discovered some empty objects and skipped those.');
    }
    function loadFontsFrom(layer) {
        return new Promise(resolve => {
            resolve(figma.loadFontAsync({ family: layer.fontName.family, style: layer.fontName.style }));
        });
    }
    function getData() {
        // Get keys of data after import
        for (const dataNodes of data) {
            keys = Object.keys(dataNodes);
        }
        // Get length and render a random number
        let len = data.length;
        random = Math.floor(Math.random() * len);
    }
    function selectData(index) {
        return __awaiter(this, void 0, void 0, function* () {
            // Get selection
            for (const node of figma.currentPage.selection) {
                // If selection is single TextNode
                if (node.type === "TEXT") {
                    for (const key of keys) {
                        yield loadFontsFrom(node);
                        if (node.name === key) {
                            node.characters = data[index][key].toString();
                        }
                    }
                }
                // If selection contains more TextNodes
                else {
                    // Get keys of data
                    for (const key of keys) {
                        // Texts
                        // Find elements in selection that match any key of data
                        const textLayers = node.findAll(node => node.name === key && node.type === 'TEXT');
                        // Rewrite layer text with value of each key
                        for (const layer of textLayers) {
                            yield loadFontsFrom(layer);
                            layer.characters = data[index][key].toString();
                        }
                    }
                }
            }
        });
    }
    function notifyWarning(data, text) {
        if (msg.data === data) {
            figma.notify(text);
        }
    }
};
