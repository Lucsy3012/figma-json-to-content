var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
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
        // Empty object notification
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
                // If selection is single object with fill
                if (node.type === "RECTANGLE" || node.type === "POLYGON" || node.type === "ELLIPSE" || node.type === "VECTOR") {
                    const newFills = [];
                    for (const key of keys) {
                        if (node.name === key) {
                            for (const paint of node.fills) {
                                if (paint.type === 'IMAGE') {
                                    // console.log(data[index][key], paint, figma.getImageByHash(paint.imageHash));
                                    // Send the raw bytes of the file to the worker.
                                    // todo
                                    /*
                                    const newPaint = JSON.parse(JSON.stringify(paint));
                                    newPaint.imageHash = figma.createImage(newBytes).hash;
                                    newFills.push(newPaint);
                                    */
                                }
                            }
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
                            layer.characters = datasets[activeTabIndex][index][key].toString();
                        }
                    }
                }
            }
        });
    }
    // Encoding an image is also done by sticking pixels in an
    // HTML canvas and by asking the canvas to serialize it into
    // an actual PNG file via canvas.toBlob().
    function encode(canvas, ctx, imageData) {
        return __awaiter(this, void 0, void 0, function* () {
            ctx.putImageData(imageData, 0, 0);
            return yield new Promise((resolve, reject) => {
                canvas.toBlob(blob => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(new Uint8Array(reader.result));
                    reader.onerror = () => reject(new Error('Could not read from blob'));
                    reader.readAsArrayBuffer(blob);
                });
            });
        });
    }
    // Decoding an image can be done by sticking it in an HTML
    // canvas, as we can read individual pixels off the canvas.
    function decode(canvas, ctx, bytes) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = URL.createObjectURL(new Blob([bytes]));
            const image = yield new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => reject();
                img.src = url;
            });
            canvas.width = image.width;
            canvas.height = image.height;
            ctx.drawImage(image, 0, 0);
            const imageData = ctx.getImageData(0, 0, image.width, image.height);
            return imageData;
        });
    }
    function notifyWarning(data, text) {
        if (msg.data === data) {
            figma.notify(text);
        }
    }
};
