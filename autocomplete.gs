/**
 * Represents a node in the Trie data structure.
 */
class TrieNode {
  constructor() {
    this.children = {};
    this.isEndOfWord = false;
    this.suggestions = [];
  }
}

/**
 * Implements the Trie data structure for autocomplete suggestions.
 */
class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  /**
   * Inserts a word and its associated suggestion into the Trie.
   * @param {string} word - The word to be inserted.
   * @param {string} suggestion - The autocomplete suggestion for the word.
   */
  insert(word, suggestion) {
    let node = this.root;
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
    }
    node.isEndOfWord = true;
    node.suggestions.push(suggestion);
  }

  /**
   * Finds autocomplete suggestions based on a given prefix.
   * @param {string} prefix - The prefix to search for suggestions.
   * @returns {string[]} An array of autocomplete suggestions.
   */
  search(prefix) {
    let node = this.root;
    for (let i = 0; i < prefix.length; i++) {
      const char = prefix[i];
      if (!node.children[char]) {
        return [];
      }
      node = node.children[char];
    }
    return this.collectSuggestions(node);
  }

  /**
   * Helper method to collect autocomplete suggestions from a given node.
   * @param {TrieNode} node - The node to start collecting suggestions from.
   * @param {string[]} suggestions - The current list of suggestions.
   * @param {string} prefix - The current prefix.
   * @returns {string[]} An array of autocomplete suggestions.
   */
  collectSuggestions(node, suggestions = [], prefix = '') {
    if (node.isEndOfWord) {
      suggestions = suggestions.concat(node.suggestions);
    }

    for (let char in node.children) {
      const childNode = node.children[char];
      suggestions = this.collectSuggestions(childNode, suggestions, prefix + char);
    }

    return suggestions;
  }
}

/**
 * A function to initialize and populate the Trie with words and suggestions from the active Google Doc.
 * @returns {Trie} An instance of the Trie data structure.
 */
function initializeTrie() {
  const trie = new Trie();

  // Get the active document
  const doc = DocumentApp.getActiveDocument();

  // Get the body text of the document
  const body = doc.getBody();
  const textContent = body.getText();

  // Split the text content into words
  const words = textContent.split(/\W+/);

  // Iterate over the words and insert them into the Trie
  for (const word of words) {
    const suggestion = `Suggestion for "${word}"`;
    trie.insert(word, suggestion);
  }

  return trie;
}

/**
 * A function to handle the "Show Suggestions for Selection" menu item click.
 */
function showSuggestionsForSelection() {
  const doc = DocumentApp.getActiveDocument();
  const selection = doc.getSelection();

  // Check if anything is selected
  if (!selection) {
    DocumentApp.getUi().alert('Please select some text.');
    return;
  }

  const elements = selection.getSelectedElements();
  const selectedTexts = elements.map(element => {
    const text = element.getElement().asText();
    return text.getText();
  });

  const trie = initializeTrie();

  const suggestions = [];
  selectedTexts.forEach(text => {
    const words = text.split(/\W+/);
    words.forEach(word => {
      const wordSuggestions = trie.search(word);
      if (wordSuggestions.length > 0) {
        suggestions.push(`${word}: ${wordSuggestions.join(', ')}`);
      }
    });
  });

  if (suggestions.length > 0) {
    const ui = DocumentApp.getUi();
    const response = ui.alert('Autocomplete Suggestions', suggestions.join('\n'), ui.ButtonSet.OK);
  } else {
    DocumentApp.getUi().alert('No suggestions found for selected text.');
  }
}

/**
 * A function that runs when the document is opened.
 */
function onOpen() {
  DocumentApp.getUi().createMenu('Autocomplete')
    .addItem('Show Suggestions for Selection', 'showSuggestionsForSelection')
    .addToUi();
}
