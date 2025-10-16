/**
 * loadVvveb.js
 * Dynamic loader for VvvebJs editor scripts and styles
 * This module loads all necessary VvvebJs dependencies dynamically into the DOM
 */

const VVVEB_BASE_PATH = '/src/libs/VvvebJs-master';

// Track loaded resources to avoid duplicates
const loadedScripts = new Set();
const loadedStyles = new Set();

/**
 * Load a CSS file dynamically
 * @param {string} href - The path to the CSS file
 * @returns {Promise} - Resolves when the CSS is loaded
 */
export function loadStyle(href) {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (loadedStyles.has(href)) {
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => {
      loadedStyles.add(href);
      resolve();
    };
    link.onerror = () => reject(new Error(`Failed to load style: ${href}`));
    document.head.appendChild(link);
  });
}

/**
 * Load a JavaScript file dynamically
 * @param {string} src - The path to the JS file
 * @returns {Promise} - Resolves when the script is loaded
 */
export function loadScript(src) {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (loadedScripts.has(src)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.onload = () => {
      loadedScripts.add(src);
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.body.appendChild(script);
  });
}

/**
 * Load multiple scripts sequentially
 * @param {string[]} scripts - Array of script paths
 * @returns {Promise} - Resolves when all scripts are loaded
 */
export async function loadScriptsSequentially(scripts) {
  for (const script of scripts) {
    await loadScript(script);
  }
}

/**
 * Load all VvvebJs dependencies
 * This includes:
 * - Core styles (editor.css)
 * - Core scripts (popper, bootstrap, builder core)
 * - Media gallery
 * - Components and plugins
 * - Code editor (CodeMirror)
 */
export async function loadVvvebJs() {
  try {
    console.log('Loading VvvebJs editor...');

    // Step 1: Load core styles
    await loadStyle(`${VVVEB_BASE_PATH}/css/editor.css`);

    // Step 2: Load core JavaScript libraries (must be sequential)
    await loadScript(`${VVVEB_BASE_PATH}/js/popper.min.js`);
    await loadScript(`${VVVEB_BASE_PATH}/js/bootstrap.min.js`);

    // Step 3: Load builder core
    await loadScript(`${VVVEB_BASE_PATH}/libs/builder/builder.js`);
    await loadScript(`${VVVEB_BASE_PATH}/libs/builder/undo.js`);
    await loadScript(`${VVVEB_BASE_PATH}/libs/builder/inputs.js`);

    // Step 4: Load media gallery
    await loadStyle(`${VVVEB_BASE_PATH}/libs/media/media.css`);
    
    // Set media configuration
    if (window.Vvveb) {
      window.mediaPath = `${VVVEB_BASE_PATH}/media`;
      window.Vvveb.themeBaseUrl = `${VVVEB_BASE_PATH}/demo/landing/`;
    }

    await loadScript(`${VVVEB_BASE_PATH}/libs/media/media.js`);
    await loadScript(`${VVVEB_BASE_PATH}/libs/builder/plugin-media.js`);

    // Step 5: Load components and plugins
    const componentScripts = [
      `${VVVEB_BASE_PATH}/libs/builder/plugin-google-fonts.js`,
      `${VVVEB_BASE_PATH}/libs/builder/components-common.js`,
      `${VVVEB_BASE_PATH}/libs/builder/plugin-aos.js`,
      `${VVVEB_BASE_PATH}/libs/builder/components-html.js`,
      `${VVVEB_BASE_PATH}/libs/builder/components-elements.js`,
      `${VVVEB_BASE_PATH}/libs/builder/section.js`,
      `${VVVEB_BASE_PATH}/libs/builder/components-bootstrap5.js`,
      `${VVVEB_BASE_PATH}/libs/builder/components-widgets.js`,
      `${VVVEB_BASE_PATH}/libs/builder/oembed.js`,
      `${VVVEB_BASE_PATH}/libs/builder/components-embeds.js`,
    ];
    await loadScriptsSequentially(componentScripts);

    // Step 6: Load sections and blocks
    await loadScript(`${VVVEB_BASE_PATH}/demo/landing/sections/sections.js`);
    await loadScript(`${VVVEB_BASE_PATH}/libs/builder/sections-bootstrap4.js`);
    await loadScript(`${VVVEB_BASE_PATH}/libs/builder/blocks-bootstrap4.js`);

    // Step 7: Load CodeMirror for code editing
    await loadStyle(`${VVVEB_BASE_PATH}/libs/codemirror/lib/codemirror.css`);
    await loadStyle(`${VVVEB_BASE_PATH}/libs/codemirror/theme/material.css`);
    
    const codeMirrorScripts = [
      `${VVVEB_BASE_PATH}/libs/codemirror/lib/codemirror.js`,
      `${VVVEB_BASE_PATH}/libs/codemirror/lib/xml.js`,
      `${VVVEB_BASE_PATH}/libs/codemirror/lib/css.js`,
      `${VVVEB_BASE_PATH}/libs/codemirror/lib/formatting.js`,
      `${VVVEB_BASE_PATH}/libs/builder/plugin-codemirror.js`,
    ];
    await loadScriptsSequentially(codeMirrorScripts);

    console.log('VvvebJs editor loaded successfully');
    return true;
  } catch (error) {
    console.error('Error loading VvvebJs:', error);
    throw error;
  }
}

/**
 * Initialize VvvebJs editor in a container
 * @param {string} containerId - The ID of the container element
 * @param {Object} options - Configuration options for VvvebJs
 * @returns {Promise} - Resolves when VvvebJs is initialized
 */
export async function initVvvebEditor(containerId, options = {}) {
  await loadVvvebJs();

  // Wait for Vvveb to be available
  if (!window.Vvveb) {
    throw new Error('Vvveb object not found after loading scripts');
  }

  // Initialize Vvveb with the provided options
  // This would be configured based on VvvebJs documentation
  console.log('VvvebJs ready for initialization in container:', containerId);
  
  return window.Vvveb;
}

/**
 * Clean up VvvebJs resources
 * This can be used when unmounting the editor component
 */
export function cleanupVvveb() {
  // Remove any VvvebJs-specific DOM elements or event listeners
  // This is a placeholder for cleanup logic
  console.log('Cleaning up VvvebJs resources');
}
