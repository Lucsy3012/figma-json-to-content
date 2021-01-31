var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// This shows the HTML page in "ui.html".
figma.showUI(__html__, { height: 438 });
// Create empty data
let datasets = {};
let data = [];
let activeTabIndex = 0;
let keys;
let random;
figma.ui.onmessage = msg => {
    // Load data
    if (msg.type === 'load') {
        data = [];
        data = msg.data;
        activeTabIndex = msg.activeTabIndex;
        datasets[activeTabIndex] = data;
        // if single object, wrap in array
        if (datasets[activeTabIndex].length === undefined) {
            datasets[activeTabIndex] = [data];
        }
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
    // Tab changed
    if (msg.type === 'tab-changed') {
        activeTabIndex = msg.activeTabIndex;
    }
    // Tab deleted
    if (msg.type === 'tab-deleted') {
        delete datasets[msg.clickedTabIndex];
    }
    // Fill in random entry
    if (msg.type === 'fill') {
        getData();
        selectData(random, false);
    }
    // Iterate over random entries
    if (msg.type === 'iterate') {
        getData();
        selectData(random, true);
    }
    // Fill in specific entry
    if (msg.type === 'fill-specific') {
        getData();
        selectData(msg.index, false);
    }
    // Close
    if (msg.type === 'close') {
        figma.closePlugin();
    }
    // Error
    if (msg.type === 'warning') {
        // Empty object notification
        notifyWarning('emptyObject', 'I have discovered some empty objects and skipped those.');
        // Empty object notification
        notifyWarning('nonArray', 'The input data was non-iterable. JSON To Content works best with an array of objects.');
        // Last tab notification
        notifyWarning('lastTab', 'You may not delete the last available tab.');
    }
    function loadFontsFrom(layer) {
        return new Promise(resolve => {
            resolve(figma.loadFontAsync({ family: layer.fontName.family, style: layer.fontName.style }));
        });
    }
    function getData() {
        // Get keys of data after import
        for (const dataNodes of datasets[activeTabIndex]) {
            keys = Object.keys(dataNodes);
        }
        // Get length and render a random number
        let len = datasets[activeTabIndex].length;
        random = Math.floor(Math.random() * len);
    }
    function selectData(index, iterate) {
        return __awaiter(this, void 0, void 0, function* () {
            // For iteration
            const length = datasets[activeTabIndex].length;
            let usedIndexes = [index];
            let usedKeys = [];
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
                        // Rewrite layer text with value of each key but go the next index if key doubles
                        if (iterate === true) {
                            for (const layer of textLayers) {
                                yield loadFontsFrom(layer);
                                // If duplicates
                                if (usedKeys.includes(key)) {
                                    index++;
                                    usedIndexes.push(index);
                                    usedKeys = [];
                                }
                                // If index reached its end
                                index = (index >= length) ? 0 : index;
                                layer.characters = datasets[activeTabIndex][index][key].toString();
                                // Add key to used keys
                                usedKeys.push(key);
                            }
                        }
                        // Rewrite layer text with value of each key
                        else {
                            for (const layer of textLayers) {
                                yield loadFontsFrom(layer);
                                layer.characters = datasets[activeTabIndex][index][key].toString();
                            }
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
