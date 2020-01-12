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
      figma.notify('JSON has been loaded successfully');

      // Load every text style in use once
      const textNodes = figma.root.findAll(node => node.type === "TEXT");

      for (const textNode of textNodes) {
        loadFontsFrom(textNode);
      }
    }
  }

  // Fill in random entry
  if (msg.type === 'fill') {
    getData();
    selectData(random);
  }

  if (msg.type === 'fill-specific') {
    getData();
    selectData(msg.index);
  }

  if (msg.type === 'create-rectangles') {
    const nodes: SceneNode[] = [];
    for (let i = 0; i < msg.count; i++) {
      const rect = figma.createRectangle();
      rect.x = i * 150;
      rect.fills = [{type: 'SOLID', color: {r: 1, g: 0.5, b: 0}}];
      figma.currentPage.appendChild(rect);
      nodes.push(rect);
    }
    figma.currentPage.selection = nodes;
    figma.viewport.scrollAndZoomIntoView(nodes);
  }

  // Close
  if (msg.type === 'close') {
    figma.closePlugin();
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

          // Find elements in selection that match any key of data
          const layers = node.findAll(node => node.name === key);

          // Rewrite layer text with value of each key
          for (const layer of layers) {
            loadFontsFrom(layer);
            layer.characters = data[index][key];
          }
        }
      }
    }
  }
};

