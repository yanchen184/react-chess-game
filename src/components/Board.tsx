import React from 'react';
import Square from './Square';
import { Piece, PieceColor, Position, BOARD_SIZE, FILES, RANKS } from '../models/types';
import './Board.css';

/**
 * Props for the Board component
 */
interface BoardProps {
  board: (Piece | null)[][];
  currentPlayer: PieceColor;
  selectedPosition: Position | null;
  validMoves: Position[];
  onSquareClick: (position: Position) => void;
}

/**
 * Chess board component that renders the squares and pieces
 */
const Board: React.FC<BoardProps> = ({ 
  board, 
  currentPlayer, 
  selectedPosition, 
  validMoves, 
  onSquareClick 
}) => {
  /**
   * Check if a position is a valid move destination
   */
  const isValidMoveDestination = (position: Position): boolean => {
    return validMoves.some(move => move.row === position.row && move.col === position.col);
  };

  /**
   * Check if a position is the selected position
   */
  const isSelectedPosition = (position: Position): boolean => {
    return !!selectedPosition && 
           selectedPosition.row === position.row && 
           selectedPosition.col === position.col;
  };

  /**
   * Render the board coordinates (files and ranks)
   */
  const renderCoordinates = () => {
    // Render file labels (a-h)
    const files = FILES.map((file, index) => (
      <div key={`file-${index}`} className="coordinate file">
        {file}
      </div>
    ));

    // Render rank labels (1-8)
    const ranks = RANKS.map((rank, index) => (
      <div key={`rank-${index}`} className="coordinate rank">
        {rank}
      </div>
    ));

    return (
      <>
        <div className="files-coordinates">{files}</div>
        <div className="ranks-coordinates">{ranks}</div>
      </>
    );
  };

  /**
   * Render a square on the board
   */
  const renderSquare = (row: number, col: number) => {
    const position: Position = { row, col };
    const piece = board[row][col];
    const isLight = (row + col) % 2 === 0;
    const isSelected = isSelectedPosition(position);
    const isValidMove = isValidMoveDestination(position);
    
    return (
      <Square 
        key={`${row}-${col}`}
        position={position}
        piece={piece}
        isLight={isLight}
        isSelected={isSelected}
        isValidMove={isValidMove}
        onClick={() => onSquareClick(position)}
      />
    );
  };

  /**
   * Render a row of squares
   */
  const renderRow = (row: number) => {
    const squares = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
      squares.push(renderSquare(row, col));
    }
    return (
      <div key={`row-${row}`} className="board-row">
        {squares}
      </div>
    );
  };

  /**
   * Render the chess board
   */
  const renderBoard = () => {
    const rows = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      rows.push(renderRow(row));
    }
    return rows;
  };

  return (
    <div className="board-container">
      {renderCoordinates()}
      <div className="board">
        {renderBoard()}
      </div>
    </div>
  );
};

export default Board;