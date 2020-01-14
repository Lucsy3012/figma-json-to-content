// This shows the HTML page in "ui.html".
figma.showUI(__html__, { height: 400});

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
    figma.loadFontAsync({ family: layer.fontName.family, style: layer.fontName.style });
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

    // Get selection
    for (const node of figma.currentPage.selection) {

      // If selection is single TextNode
      if (node.type === "TEXT") {
        for (const key of keys) {
          loadFontsFrom(node);

          if (node.name === key) {
            node.characters = data[index][key];
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
            loadFontsFrom(layer);
            layer.characters = data[index][key];
          }
        }
      }
    }
  }

  function notifyWarning(data, text) {
    if (msg.data === data) {
      figma.notify(text);
    }
  }
};