import { TrieNode } from './TrieNode';

export class Trie {
  constructor() {
    this.root = new TrieNode();
    this.wordCount = 0;
  }

  insert(word) {
    let current = this.root;
    for (const char of word) {
      if (!current.children.has(char)) {
        current.children.set(char, new TrieNode(char));
      }
      current = current.children.get(char);
    }
    if (!current.isEndOfWord) {
      this.wordCount++;
    }
    current.isEndOfWord = true;
    current.frequency++;
    return true;
  }

  search(word) {
    let current = this.root;
    for (const char of word) {
      if (!current.children.has(char)) {
        return false;
      }
      current = current.children.get(char);
    }
    return current.isEndOfWord;
  }

  delete(word) {
    const deleteRecursive = (node, word, depth) => {
      if (depth === word.length) {
        if (!node.isEndOfWord) return false;
        node.isEndOfWord = false;
        node.frequency--;
        this.wordCount--;
        return node.children.size === 0;
      }

      const char = word[depth];
      if (!node.children.has(char)) return false;

      const shouldDeleteCurrentNode = deleteRecursive(
        node.children.get(char), 
        word, 
        depth + 1
      );

      if (shouldDeleteCurrentNode) {
        node.children.delete(char);
        return node.children.size === 0 && !node.isEndOfWord;
      }

      return false;
    };

    deleteRecursive(this.root, word, 0);
    return true;
  }

  getD3Data() {
    const convertToD3Format = (node, parentName = '', depth = 0) => {
      const nodeName = parentName + (node.value || 'root');
      const children = Array.from(node.children.entries()).map(([_, childNode]) => 
        convertToD3Format(childNode, nodeName, depth + 1)
      );

      return {
        name: nodeName,
        value: node.value,
        isEndOfWord: node.isEndOfWord,
        frequency: node.frequency,
        depth: depth,
        children: children.length ? children : undefined
      };
    };

    return convertToD3Format(this.root);
  }
}