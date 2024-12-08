export class TrieNode {
    constructor(value = '') {
      this.value = value;
      this.isEndOfWord = false;
      this.frequency = 0;
      this.children = new Map();
    }
  }