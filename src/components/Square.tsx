import React from 'react';
import { Piece, Position } from '../models/types';
import './Square.css';

/**
 * Props for the Square component
 */
interface SquareProps {
  position: Position;
  piece: Piece | null;
  isLight: boolean;
  isSelected: boolean;
  isValidMove: boolean;
  onClick: () => void;
}

/**
 * Component for a single square on the chess board
 */
const Square: React.FC<SquareProps> = ({
  position,
  piece,
  isLight,
  isSelected,
  isValidMove,
  onClick
}) => {
  /**
   * Get CSS classes for the square
   */
  const getSquareClasses = (): string => {
    let classes = 'square';
    classes += isLight ? ' light' : ' dark';
    if (isSelected) classes += ' selected';
    if (isValidMove) classes += ' valid-move';
    return classes;
  };

  /**
   * Render the chess piece
   */
  const renderPiece = () => {
    if (!piece) return null;

    // Map of unicode chess symbols
    const pieceSymbols: { [key: string]: { [key: string]: string } } = {
      white: {
        king: '♔',
        queen: '♕',
        rook: '♖',
        bishop: '♗',
        knight: '♘',
        pawn: '♙'
      },
      black: {
        king: '♚',
        queen: '♛',
        rook: '♜',
        bishop: '♝',
        knight: '♞',
        pawn: '♟'
      }
    };

    const symbol = pieceSymbols[piece.color][piece.type];

    return (
      <div className={`piece ${piece.color}`}>
        {symbol}
      </div>
    );
  };

  /**
   * Render valid move indicator
   */
  const renderValidMoveIndicator = () => {
    if (!isValidMove) return null;

    return (
      <div className="valid-move-indicator" />
    );
  };

  return (
    <div 
      className={getSquareClasses()}
      onClick={onClick}
    >
      {renderPiece()}
      {renderValidMoveIndicator()}
    </div>
  );
};

export default Square;