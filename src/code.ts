// This shows the HTML page in "ui.html".
figma.showUI(__html__, { width: 320, height: 512 });

// Create empty data
let datasets = {};
let data = [];
let activeTabIndex = 0;
let keys = [];
let nestedObjectName = "";
let depthSeparator = '-'
let random;

figma.ui.onmessage = msg => {

  // Load data
  if (msg.type === 'load') {
    data = [];
    data = msg.data;
    activeTabIndex = msg.activeTabIndex;
    datasets[activeTabIndex] = data;
    depthSeparator = msg.depthSeparator;

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

  // Separator changed
  if (msg.type === 'depth-separator-changed') {
    depthSeparator = msg.depthSeparator;
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

  // Data functions
  function getData() {

    // Reset values
    keys = []

    // Get keys of data after import
    for (const dataNodes of datasets[activeTabIndex]) {
      keys = Object.keys(dataNodes);
    }

    // Get length and render a random number
    let len = datasets[activeTabIndex].length;
    random = Math.floor(Math.random() * len);
  }

  async function selectData(index, iterate) {

    // For iteration
    const length = datasets[activeTabIndex].length;
    let usedIndexes = [index];
    let usedKeys = [];

    // Get selection
    for (const node of figma.currentPage.selection) {

      // If selection is single TextNode
      if (node.type === "TEXT") {
        await loadFontsFrom(node);

        /**
         * Replace Function Text based on key in object
         * 1. Direct hit
         * 2. Virtual hit (based on object structure)
         */

        const _isAvailable      = keys.includes(node.name);
        const _isSet            = typeof data[index][node.name] !== undefined;
        const _isNoObject       = typeof data[index][node.name] !== 'object';
        const _separatorInName  = node.name.indexOf(depthSeparator) >= 0;

        // 1. Direct hit (doesn't matter of separators)
        if (_isAvailable && _isSet && _isNoObject) {
          node.characters = data[index][node.name].toString();

        // 3. First Level hit (separator is only virtual)
        } else if (_separatorInName) {

          let separatorElements = node.name.split(depthSeparator);
          let firstSeparatorElement = separatorElements[0];

          if (keys.includes(firstSeparatorElement) && data[index][firstSeparatorElement] !== undefined) {
            node.characters = changeTextByLayerName(node.name, data[index], firstSeparatorElement);
          }
        }
      }

      // If selection contains more TextNodes
      else {

        // Get keys of data
        for (const key of keys) {

          // Texts
          // Find elements in selection that match any key of data
          const textLayers = node.findAll(node => node.name.indexOf(key) >= 0 && node.type === 'TEXT');

          // Rewrite layer text with value of each key but go the next index if key doubles
          if (iterate === true) {
            for (const layer of textLayers) {
              await loadFontsFrom(layer);

              // If duplicates
              if (usedKeys.includes(key)) {
                index++;
                usedIndexes.push(index);
                usedKeys = [];
              }

              // If index reached its end
              index = (index >= length) ? 0 : index;

              /**
               * Replace Function Text based on key in object
               * 1. Direct hit
               * 2. Virtual hit (based on object structure)
               */

              const _isAvailable      = keys.includes(layer.name);
              const _isSet            = datasets[activeTabIndex][index][layer.name] !== undefined;
              const _isNoObject       = typeof datasets[activeTabIndex][index][layer.name] !== 'object';
              const _separatorInName  = layer.name.indexOf(depthSeparator) >= 0;

              // 1. Direct hit (doesn't matter of separators)
              if (_isAvailable && _isSet && _isNoObject) {
                layer.characters = datasets[activeTabIndex][index][layer.name].toString();

              // 2. First Level hit (separator is only virtual)
              } else if (_separatorInName) {

                let separatorElements = layer.name.split(depthSeparator);
                let firstSeparatorElement = separatorElements[0];

                if (keys.includes(firstSeparatorElement) && datasets[activeTabIndex][index][firstSeparatorElement] !== undefined) {
                  layer.characters = changeTextByLayerName(layer.name, datasets[activeTabIndex][index], firstSeparatorElement);
                }
              }

              // Add key to used keys
              usedKeys.push(key);
            }
          }

          // Rewrite layer text with value of each key
          else {
            for (const layer of textLayers) {
              await loadFontsFrom(layer);

              /**
               * Replace Function Text based on key in object
               * 1. Direct hit
               * 2. Virtual hit (based on object structure)
               */

              const _isAvailable      = keys.includes(layer.name);
              const _isSet            = datasets[activeTabIndex][index][layer.name] !== undefined;
              const _isNoObject       = typeof datasets[activeTabIndex][index][layer.name] !== 'object';
              const _separatorInName  = layer.name.indexOf(depthSeparator) >= 0;

              // 1. Direct hit (doesn't matter of separators)
              if (_isAvailable && _isSet && _isNoObject) {
                layer.characters = datasets[activeTabIndex][index][layer.name].toString();

                // 2. First Level hit (separator is only virtual)
              } else if (_separatorInName) {

                let separatorElements = layer.name.split(depthSeparator);
                let firstSeparatorElement = separatorElements[0];

                if (keys.includes(firstSeparatorElement) && datasets[activeTabIndex][index][firstSeparatorElement] !== undefined) {
                  layer.characters = changeTextByLayerName(layer.name, datasets[activeTabIndex][index], firstSeparatorElement);
                }
              }
            }
          }
        }
      }
    }
  }

  /**
   * Functions for Depth Separator
   * ---------------------
   */
  function traverseMultiLayerObject(baseObject, keysArray) {
    if (keysArray.length > 0) {
      const obj = baseObject[keysArray[0]]
      const array = keysArray.slice(1)

      traverseMultiLayerObject(obj, array);
    } else {
      nestedObjectName = baseObject;
      return baseObject
    }
  }

  function changeTextByLayerName(objProperty, data, key) {

    // If property doesn't exist, return old content
    if (objProperty === undefined && typeof objProperty !== 'string') {
      return objProperty;
    }

    if (objProperty === key) {
      if (data[key]) {
        return data[key].toString();
      }
    } else if (objProperty.indexOf(depthSeparator) > 1) {
      nestedObjectName = '';

      const nameAsObjectProperty = objProperty.split(depthSeparator)

      traverseMultiLayerObject(data, nameAsObjectProperty);

      return nestedObjectName;
    }
  }

  function notifyWarning(data, text) {
    if (msg.data === data) {
      figma.notify(text);
    }
  }
}