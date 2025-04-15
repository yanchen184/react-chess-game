import React, { useState, useEffect, useCallback, useRef } from 'react';
import Board from './Board';
import { PieceColor, GameState, GameMode, MoveType, Piece, Position, Move, AI_DEPTH } from '../models/types';
import { parseFEN, INITIAL_POSITION, deepClone, coordsToAlgebraic } from '../utils/boardUtils';
import { getPossibleMoves, filterLegalMoves, isKingInCheck, isCheckmate, isStalemate, applyMove, moveToAlgebraic } from '../utils/gameUtils';
import { findBestMove } from '../utils/aiUtils';
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
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  // Game mode (two-player or vs computer)
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.TWO_PLAYER);
  // Move history
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  // Captured pieces
  const [capturedPieces, setCapturedPieces] = useState<{[color: string]: Piece[]}>({
    [PieceColor.WHITE]: [],
    [PieceColor.BLACK]: []
  });
  // En passant target square
  const [enPassantTarget, setEnPassantTarget] = useState<Position | null>(null);
  // Castling rights
  const [castlingRights, setCastlingRights] = useState<{
    [color: string]: { kingSide: boolean, queenSide: boolean }
  }>({
    [PieceColor.WHITE]: { kingSide: true, queenSide: true },
    [PieceColor.BLACK]: { kingSide: true, queenSide: true }
  });
  // AI is thinking
  const [isAIThinking, setIsAIThinking] = useState<boolean>(false);
  
  // Sound effects
  const moveSound = useRef<HTMLAudioElement | null>(null);
  const captureSound = useRef<HTMLAudioElement | null>(null);
  const checkSound = useRef<HTMLAudioElement | null>(null);
  
  // Initialize sound effects
  useEffect(() => {
    try {
      moveSound.current = new Audio(`${process.env.PUBLIC_URL}/sounds/move.mp3`);
      captureSound.current = new Audio(`${process.env.PUBLIC_URL}/sounds/capture.mp3`);
      checkSound.current = new Audio(`${process.env.PUBLIC_URL}/sounds/check.mp3`);
    } catch (error) {
      console.warn("無法加載音效文件:", error);
    }
  }, []);

  // Initialize the board when the component mounts
  useEffect(() => {
    initializeBoard();
  }, []);

  // Make AI move when it's AI's turn
  useEffect(() => {
    if (
      gameState === GameState.ACTIVE &&
      currentPlayer === PieceColor.BLACK &&
      gameMode !== GameMode.TWO_PLAYER
    ) {
      const timer = setTimeout(() => {
        setIsAIThinking(true);
        makeAIMove();
      }, 500); // Add a small delay for better UX
      
      return () => clearTimeout(timer);
    }
  }, [currentPlayer, gameState, gameMode]);

  /**
   * Initialize the chess board with the starting position
   */
  const initializeBoard = () => {
    const { 
      board: newBoard, 
      activeColor,
      castlingRights: newCastlingRights,
      enPassantTarget: newEnPassantTarget
    } = parseFEN(INITIAL_POSITION);
    
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
    setEnPassantTarget(newEnPassantTarget);
    setCastlingRights(newCastlingRights);
    setIsAIThinking(false);
  };

  /**
   * Play the appropriate sound for a move
   */
  const playMoveSound = useCallback((move: Move, newGameState: GameState) => {
    try {
      if (newGameState === GameState.CHECK || newGameState === GameState.CHECKMATE) {
        checkSound.current?.play();
      } else if (move.capturedPiece) {
        captureSound.current?.play();
      } else {
        moveSound.current?.play();
      }
    } catch (error) {
      console.warn("播放音效時出錯:", error);
    }
  }, []);

  /**
   * Handle click on a square
   */
  const handleSquareClick = (position: Position) => {
    // If game is over, ignore clicks
    if (gameState !== GameState.ACTIVE) {
      return;
    }
    
    // If AI is thinking, ignore clicks
    if (isAIThinking || (currentPlayer === PieceColor.BLACK && gameMode !== GameMode.TWO_PLAYER)) {
      return;
    }
    
    const piece = board[position.row][position.col];
    
    // If a piece is already selected
    if (selectedPosition) {
      // Check if clicked on a valid move destination
      const moveToMake = validMoves.find(move => {
        return move.to.row === position.row && move.to.col === position.col;
      });
      
      if (moveToMake) {
        // Make the move
        makeMove(moveToMake);
        
        // Deselect the piece
        setSelectedPosition(null);
        setValidMoves([]);
        return;
      }
      
      // If clicked on the same piece, deselect it
      if (
        selectedPosition.row === position.row && 
        selectedPosition.col === position.col
      ) {
        setSelectedPosition(null);
        setValidMoves([]);
        return;
      }
      
      // If clicked on another own piece, select that piece instead
      if (piece && piece.color === currentPlayer) {
        selectPiece(position);
        return;
      }
      
      // If clicked elsewhere, deselect the piece
      setSelectedPosition(null);
      setValidMoves([]);
    } else {
      // If no piece is selected yet, select the clicked piece if it belongs to the current player
      if (piece && piece.color === currentPlayer) {
        selectPiece(position);
      }
    }
  };

  /**
   * Select a piece and calculate its valid moves
   */
  const selectPiece = (position: Position) => {
    setSelectedPosition(position);
    
    // Get all possible moves for the piece
    const piece = board[position.row][position.col];
    if (!piece) return;
    
    const possibleMoves = getPossibleMoves(board, position, enPassantTarget, castlingRights);
    
    // Filter out moves that would put or leave the king in check
    const legalMoves = filterLegalMoves(board, possibleMoves, currentPlayer);
    
    setValidMoves(legalMoves);
  };

  /**
   * Make a move on the board
   */
  const makeMove = (move: Move) => {
    // Create new board and game state
    const newBoard = deepClone(board);
    const newCapturedPieces = deepClone(capturedPieces);
    const newCastlingRights = deepClone(castlingRights);
    
    // Update board with the move
    applyMove(newBoard, move);
    
    // Update castling rights if needed
    updateCastlingRights(move, newCastlingRights);
    
    // Update captured pieces
    if (move.capturedPiece) {
      const oppositeColor = move.piece.color === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;
      newCapturedPieces[move.piece.color].push(move.capturedPiece);
    }
    
    // Update en passant target
    let newEnPassantTarget: Position | null = null;
    if (
      move.piece.type === 'pawn' && 
      Math.abs(move.from.row - move.to.row) === 2
    ) {
      // Set en passant target to the square behind the moved pawn
      const direction = move.piece.color === PieceColor.WHITE ? 1 : -1;
      newEnPassantTarget = {
        row: move.to.row + direction,
        col: move.to.col
      };
    }
    
    // Add move to history
    const newMoveHistory = [...moveHistory, move];
    
    // Switch player
    const nextPlayer = currentPlayer === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;
    
    // Check for check, checkmate, or stalemate
    const newGameState = calculateGameState(newBoard, nextPlayer);
    
    // Play sound effect
    playMoveSound(move, newGameState);
    
    // Update state
    setBoard(newBoard);
    setCapturedPieces(newCapturedPieces);
    setCastlingRights(newCastlingRights);
    setEnPassantTarget(newEnPassantTarget);
    setMoveHistory(newMoveHistory);
    setCurrentPlayer(nextPlayer);
    setGameState(newGameState);
  };

  /**
   * Calculate the game state (check, checkmate, stalemate)
   */
  const calculateGameState = (newBoard: (Piece | null)[][], nextPlayer: PieceColor): GameState => {
    if (isKingInCheck(newBoard, nextPlayer)) {
      if (isCheckmate(newBoard, nextPlayer)) {
        return GameState.CHECKMATE;
      } else {
        return GameState.CHECK;
      }
    } else if (isStalemate(newBoard, nextPlayer)) {
      return GameState.STALEMATE;
    } else {
      return GameState.ACTIVE;
    }
  };

  /**
   * Update castling rights after a move
   */
  const updateCastlingRights = (
    move: Move, 
    newCastlingRights: { [color: string]: { kingSide: boolean, queenSide: boolean } }
  ) => {
    const { piece, from } = move;
    
    // If king moved, remove castling rights for that color
    if (piece.type === 'king') {
      newCastlingRights[piece.color].kingSide = false;
      newCastlingRights[piece.color].queenSide = false;
    }
    
    // If rook moved, remove the corresponding castling right
    if (piece.type === 'rook') {
      // King-side rook
      if (from.col === 7) {
        newCastlingRights[piece.color].kingSide = false;
      }
      // Queen-side rook
      else if (from.col === 0) {
        newCastlingRights[piece.color].queenSide = false;
      }
    }
    
    // If rook captured, remove the corresponding castling right for the opponent
    if (move.capturedPiece && move.capturedPiece.type === 'rook') {
      const opponentColor = piece.color === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;
      
      // King-side rook
      if (move.to.col === 7) {
        newCastlingRights[opponentColor].kingSide = false;
      }
      // Queen-side rook
      else if (move.to.col === 0) {
        newCastlingRights[opponentColor].queenSide = false;
      }
    }
  };

  /**
   * Make an AI move
   */
  const makeAIMove = () => {
    // Use Web Worker for AI calculation in the background (if available)
    const performAIMove = () => {
      // Get AI search depth based on difficulty
      const depth = AI_DEPTH[gameMode as keyof typeof AI_DEPTH] || 1;
      
      // Use the minimax algorithm to find the best move
      const aiMove = findBestMove(board, depth, true, enPassantTarget, castlingRights);
      
      if (aiMove) {
        // Make the move
        makeMove(aiMove);
      } else {
        // No valid moves - game should be over
        updateGameState(board, PieceColor.BLACK);
      }
      
      setIsAIThinking(false);
    };

    // Use setTimeout to avoid blocking the UI
    setTimeout(performAIMove, 100);
  };

  /**
   * Update the game state (check, checkmate, stalemate)
   */
  const updateGameState = (newBoard: (Piece | null)[][], nextPlayer: PieceColor) => {
    if (isKingInCheck(newBoard, nextPlayer)) {
      if (isCheckmate(newBoard, nextPlayer)) {
        setGameState(GameState.CHECKMATE);
      } else {
        setGameState(GameState.CHECK);
      }
    } else if (isStalemate(newBoard, nextPlayer)) {
      setGameState(GameState.STALEMATE);
    } else {
      setGameState(GameState.ACTIVE);
    }
  };

  /**
   * Undo the last move
   */
  const undoMove = () => {
    if (moveHistory.length === 0) return;
    
    // If playing against AI, undo both the AI's move and the player's move
    const movesToUndo = gameMode !== GameMode.TWO_PLAYER ? 2 : 1;
    
    // Check if we have enough moves to undo
    if (moveHistory.length < movesToUndo) return;
    
    // Reinitialize the board and replay all moves except the last one(s)
    const { board: newBoard, activeColor, castlingRights: newCastlingRights } = parseFEN(INITIAL_POSITION);
    const newMoveHistory = moveHistory.slice(0, moveHistory.length - movesToUndo);
    
    // Initialize state
    setBoard(newBoard);
    setCurrentPlayer(activeColor);
    setGameState(GameState.ACTIVE);
    setSelectedPosition(null);
    setValidMoves([]);
    setCapturedPieces({
      [PieceColor.WHITE]: [],
      [PieceColor.BLACK]: []
    });
    setEnPassantTarget(null);
    setCastlingRights(newCastlingRights);
    
    // Replay all moves except the last one(s)
    for (const move of newMoveHistory) {
      applyMove(newBoard, move);
      updateCastlingRights(move, newCastlingRights);
      
      // Update captured pieces
      if (move.capturedPiece) {
        const captureColor = move.piece.color;
        setCapturedPieces(prev => {
          const newCapturedPieces = deepClone(prev);
          newCapturedPieces[captureColor].push(move.capturedPiece!);
          return newCapturedPieces;
        });
      }
    }
    
    // Set final state after replaying moves
    setMoveHistory(newMoveHistory);
    setCurrentPlayer(newMoveHistory.length % 2 === 0 ? PieceColor.WHITE : PieceColor.BLACK);
    
    // Update game state
    updateGameState(
      newBoard, 
      newMoveHistory.length % 2 === 0 ? PieceColor.WHITE : PieceColor.BLACK
    );
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

  /**
   * Convert a move to text description
   */
  const formatMove = (move: Move, index: number): string => {
    const moveNumber = Math.floor(index / 2) + 1;
    const prefix = move.piece.color === PieceColor.WHITE ? `${moveNumber}. ` : '';
    
    let moveText = moveToAlgebraic(board, move);
    
    // Add check/checkmate symbol
    if (index < moveHistory.length - 1) {
      const nextMove = moveHistory[index + 1];
      const tempBoard = deepClone(board);
      applyMove(tempBoard, move);
      
      const opponentColor = move.piece.color === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;
      
      if (isKingInCheck(tempBoard, opponentColor)) {
        if (isCheckmate(tempBoard, opponentColor)) {
          moveText += '#';
        } else {
          moveText += '+';
        }
      }
    }
    
    return prefix + moveText;
  };

  return (
    <div className="chess-game">
      <div className="game-info">
        <div className="game-status">
          <h2>
            {isAIThinking && gameMode !== GameMode.TWO_PLAYER && currentPlayer === PieceColor.BLACK && 
              '電腦思考中...'}
            {!isAIThinking && gameState === GameState.ACTIVE && 
              `${currentPlayer === PieceColor.WHITE ? '白方' : '黑方'}的回合`}
            {!isAIThinking && gameState === GameState.CHECK && 
              `${currentPlayer === PieceColor.WHITE ? '白方' : '黑方'}被將軍!`}
            {!isAIThinking && gameState === GameState.CHECKMATE && 
              `將死! ${currentPlayer === PieceColor.WHITE ? '黑方' : '白方'}獲勝!`}
            {!isAIThinking && gameState === GameState.STALEMATE && '和局 - 無子可動'}
            {!isAIThinking && gameState === GameState.DRAW && '和局'}
          </h2>
          <span className="version">v1.1.0</span>
        </div>
        <div className="game-controls">
          <button onClick={undoMove} disabled={isAIThinking || moveHistory.length === 0}>撤銷上一步</button>
          <button onClick={restartGame} disabled={isAIThinking}>重新開始</button>
          <select 
            value={gameMode} 
            onChange={(e) => changeGameMode(e.target.value as GameMode)}
            disabled={isAIThinking}
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
              {/* Display Unicode chess symbol */}
              {piece.type === 'king' && '♚'}
              {piece.type === 'queen' && '♛'}
              {piece.type === 'rook' && '♜'}
              {piece.type === 'bishop' && '♝'}
              {piece.type === 'knight' && '♞'}
              {piece.type === 'pawn' && '♟'}
            </div>
          ))}
        </div>
        
        <Board 
          board={board} 
          currentPlayer={currentPlayer}
          selectedPosition={selectedPosition}
          validMoves={validMoves.map(move => move.to)}
          onSquareClick={handleSquareClick}
        />
        
        <div className="captured-pieces black">
          {capturedPieces[PieceColor.WHITE].map((piece, index) => (
            <div key={index} className="captured-piece">
              {/* Display Unicode chess symbol */}
              {piece.type === 'king' && '♔'}
              {piece.type === 'queen' && '♕'}
              {piece.type === 'rook' && '♖'}
              {piece.type === 'bishop' && '♗'}
              {piece.type === 'knight' && '♘'}
              {piece.type === 'pawn' && '♙'}
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
                  {formatMove(move, index)}
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