import React from 'react';
import './App.css';
import ChessGame from './components/ChessGame';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>React Chess Game <span className="version">v1.0.1</span></h1>
      </header>
      <main>
        <ChessGame />
      </main>
      <footer className="App-footer">
        <p>© 2025 Chess Game. All rights reserved.</p>
        <p>
          <a 
            href="https://github.com/yanchen184/react-chess-game" 
            target="_blank" 
            rel="noreferrer"
          >
            View source on GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;