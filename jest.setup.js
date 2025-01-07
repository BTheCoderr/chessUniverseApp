const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Setup a DOM environment for tests
const { JSDOM } = require('jsdom');

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost',
    pretendToBeVisual: true,
    runScripts: 'dangerously'
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = {
    userAgent: 'node.js'
};

// Mock modal functionality
global.window.modal = jest.fn();

// Setup other browser globals that might be needed
global.HTMLElement = dom.window.HTMLElement;
global.HTMLDivElement = dom.window.HTMLDivElement;
global.CustomEvent = dom.window.CustomEvent; 