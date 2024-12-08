import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as d3 from 'd3';

class TrieNode {
  constructor(value = '') {
    this.value = value;
    this.isEndOfWord = false;
    this.frequency = 0;
    this.children = new Map();
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
    this.wordCount = 0;
  }

  insert(word) {
    if (!word || typeof word !== 'string') {
      throw new Error('Invalid input: Word must be a non-empty string');
    }

    let current = this.root;
    for (const char of word.toLowerCase()) {
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
    if (!word || typeof word !== 'string') {
      return false;
    }

    let current = this.root;
    for (const char of word.toLowerCase()) {
      if (!current.children.has(char)) {
        return false;
      }
      current = current.children.get(char);
    }
    return current.isEndOfWord;
  }

  delete(word) {
    if (!word || typeof word !== 'string') {
      throw new Error('Invalid input: Word must be a non-empty string');
    }

    const deleteRecursive = (node, word, depth) => {
      if (depth === word.length) {
        if (!node.isEndOfWord) return false;
        node.isEndOfWord = false;
        node.frequency--;
        this.wordCount--;
        return node.children.size === 0;
      }

      const char = word[depth].toLowerCase();
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

    deleteRecursive(this.root, word.toLowerCase(), 0);
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

function App() {
  // State Management
  const [trie] = useState(new Trie());
  const [inputWord, setInputWord] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [error, setError] = useState(null);
  const d3Container = useRef(null);

  // Visualization Function
  const visualizeTrie = useCallback(() => {
    if (!d3Container.current) return;

    // Clear previous visualization
    d3.select(d3Container.current).selectAll("*").remove();

    const root = trie.getD3Data();
    const width = 1000;
    const height = 600;
    const margin = {top: 20, right: 120, bottom: 20, left: 40};

    // Color scale
    const colorScale = d3.scaleSequential()
      .domain([0, 5])
      .interpolator(d3.interpolateViridis);

    // Tree layout
    const tree = d3.tree()
      .size([height - margin.top - margin.bottom, width - margin.left - margin.right])
      .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);

    // Create SVG
    const svg = d3.select(d3Container.current)
      .append("svg")
        .attr("width", width)
        .attr("height", height)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Process the root data
    const rootNode = d3.hierarchy(root);
    tree(rootNode);

    // Create link paths
    const link = svg.append("g")
      .attr("fill", "none")
      .attr("stroke", "#a8b5c7")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 2)
      .selectAll("path")
      .data(rootNode.links())
      .join("path")
        .attr("d", d3.linkVertical()
          .x(d => d.x)
          .y(d => d.y)
        )
        .attr("stroke", d => colorScale(d.target.depth));

    // Create nodes
    const node = svg.append("g")
      .selectAll("g")
      .data(rootNode.descendants())
      .join("g")
        .attr("transform", d => `translate(${d.x},${d.y})`);

    // Node circles
    node.append("circle")
      .attr("r", d => Math.max(5, 10 - d.depth))
      .attr("fill", d => d.data.isEndOfWord 
        ? colorScale(d.depth + 2) 
        : colorScale(d.depth)
      )
      .attr("stroke", d => colorScale(d.depth))
      .attr("stroke-width", 2);

    // Text labels
    node.append("text")
      .attr("dy", "0.31em")
      .attr("x", d => d.children ? -13 : 13)
      .attr("text-anchor", d => d.children ? "end" : "start")
      .text(d => d.data.value || 'root')
      .attr("font-size", 10)
      .attr("font-weight", 600)
      .attr("fill", "#2c3e50")
      .attr("opacity", 0.8);
  }, [trie]);

  useEffect(() => {
    visualizeTrie();
  }, [visualizeTrie]);

  const handleInsert = () => {
    try {
      if (inputWord.trim()) {
        trie.insert(inputWord.trim());
        visualizeTrie();
        setInputWord('');
        setError(null);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSearch = () => {
    if (inputWord.trim()) {
      const result = trie.search(inputWord.trim());
      setSearchResult(result);
      setError(null);
    }
  };

  const handleDelete = () => {
    try {
      if (inputWord.trim()) {
        trie.delete(inputWord.trim());
        visualizeTrie();
        setSearchResult(null);
        setInputWord('');
        setError(null);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex justify-center items-center">
      <div className="w-full max-w-4xl bg-white shadow-2xl rounded-xl overflow-hidden">
        <div className="p-6 bg-blue-50 border-b border-blue-100">
          <h1 className="text-3xl font-bold text-blue-800 text-center">
            Trie Visualizer
          </h1>
        </div>

        <div className="p-6">
          <div className="flex space-x-2 mb-4">
            <input 
              type="text"
              value={inputWord}
              onChange={(e) => setInputWord(e.target.value)}
              className="flex-grow p-2 border-2 border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter a word"
            />
            <button 
              onClick={handleInsert}
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition"
            >
              Insert
            </button>
            <button 
              onClick={handleSearch}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
            >
              Search
            </button>
            <button 
              onClick={handleDelete}
              className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition"
            >
              Delete
            </button>
          </div>

          {/* Error Handling */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              {error}
            </div>
          )}

          {searchResult !== null && (
            <div className={`
              mb-4 p-3 rounded text-center font-bold
              ${searchResult 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
              }
            `}>
              {searchResult ? 'Word Found in Trie' : 'Word Not Found'}
            </div>
          )}

          <div 
            ref={d3Container} 
            className="w-full overflow-x-auto bg-gray-50 rounded-lg shadow-inner"
          />
        </div>
      </div>
    </div>
  );
}

export default App;