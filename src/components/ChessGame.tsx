import React, { useState, useEffect } from 'react';
import Board from './Board';
import { PieceColor, GameState, GameMode, MoveType, Piece, Position, Move } from '../models/types';
import { parseFEN, INITIAL_POSITION } from '../utils/boardUtils';
import './ChessGame.css';

/**
 * The main chess game component that manages the game state and renders the board
 */
const ChessGame: React.FC = () => {
  // State for the chess board
  const [board, setBoard] = useState<(Piece | null)[][]>(Array(8).fill(null).map(() => Array(8).fill(null)));
  // Current active player
  const [currentPlayer, setCurrentPlayer] = useState<PieceColor>(PieceColor.WHITE);
  // Game state (active, check, checkmate, etc.)
  const [gameState, setGameState] = useState<GameState>(GameState.ACTIVE);
  // Selected piece position
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  // Valid moves for the selected piece
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  // Game mode (two-player or vs computer)
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.TWO_PLAYER);
  // Move history
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  // Captured pieces
  const [capturedPieces, setCapturedPieces] = useState<{[color: string]: Piece[]}>({
    [PieceColor.WHITE]: [],
    [PieceColor.BLACK]: []
  });

  // Initialize the board when the component mounts
  useEffect(() => {
    initializeBoard();
  }, []);

  /**
   * Initialize the chess board with the starting position
   */
  const initializeBoard = () => {
    const { board: newBoard, activeColor } = parseFEN(INITIAL_POSITION);
    setBoard(newBoard);
    setCurrentPlayer(activeColor);
    setGameState(GameState.ACTIVE);
    setSelectedPosition(null);
    setValidMoves([]);
    setMoveHistory([]);
    setCapturedPieces({
      [PieceColor.WHITE]: [],
      [PieceColor.BLACK]: []
    });
  };

  /**
   * Handle click on a square
   */
  const handleSquareClick = (position: Position) => {
    // Logic for selecting a piece or making a move will be implemented here
    console.log(`Clicked on square: (${position.row}, ${position.col})`);
  };

  /**
   * Undo the last move
   */
  const undoMove = () => {
    // Logic for undoing a move will be implemented here
    console.log('Undo move');
  };

  /**
   * Change the game mode
   */
  const changeGameMode = (mode: GameMode) => {
    setGameMode(mode);
    initializeBoard();
  };

  /**
   * Restart the game
   */
  const restartGame = () => {
    initializeBoard();
  };

  return (
    <div className="chess-game">
      <div className="game-info">
        <div className="game-status">
          <h2>
            {gameState === GameState.ACTIVE && `${currentPlayer === PieceColor.WHITE ? '白方' : '黑方'}的回合`}
            {gameState === GameState.CHECK && `${currentPlayer === PieceColor.WHITE ? '白方' : '黑方'}被將軍!`}
            {gameState === GameState.CHECKMATE && `將死! ${currentPlayer === PieceColor.WHITE ? '黑方' : '白方'}獲勝!`}
            {gameState === GameState.STALEMATE && '和局 - 無子可動'}
            {gameState === GameState.DRAW && '和局'}
          </h2>
        </div>
        <div className="game-controls">
          <button onClick={undoMove}>撤銷上一步</button>
          <button onClick={restartGame}>重新開始</button>
          <select 
            value={gameMode} 
            onChange={(e) => changeGameMode(e.target.value as GameMode)}
          >
            <option value={GameMode.TWO_PLAYER}>雙人對戰</option>
            <option value={GameMode.COMPUTER_EASY}>電腦對手 - 簡單</option>
            <option value={GameMode.COMPUTER_MEDIUM}>電腦對手 - 中等</option>
            <option value={GameMode.COMPUTER_HARD}>電腦對手 - 困難</option>
          </select>
        </div>
      </div>
      
      <div className="game-board-container">
        <div className="captured-pieces white">
          {capturedPieces[PieceColor.BLACK].map((piece, index) => (
            <div key={index} className="captured-piece">
              {/* Piece representation will be implemented */}
              {piece.type}
            </div>
          ))}
        </div>
        
        <Board 
          board={board} 
          currentPlayer={currentPlayer}
          selectedPosition={selectedPosition}
          validMoves={validMoves}
          onSquareClick={handleSquareClick}
        />
        
        <div className="captured-pieces black">
          {capturedPieces[PieceColor.WHITE].map((piece, index) => (
            <div key={index} className="captured-piece">
              {/* Piece representation will be implemented */}
              {piece.type}
            </div>
          ))}
        </div>
      </div>
      
      <div className="move-history">
        <h3>走棋記錄</h3>
        <div className="moves-list">
          {moveHistory.length === 0 ? (
            <p>尚無走棋記錄</p>
          ) : (
            <ul>
              {moveHistory.map((move, index) => (
                <li key={index}>
                  {/* Move representation will be implemented */}
                  Move {index + 1}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChessGame;