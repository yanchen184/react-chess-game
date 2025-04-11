import { 
  PieceType, 
  PieceColor, 
  Piece, 
  Position, 
  Move, 
  MoveType, 
  DIRECTIONS, 
  KNIGHT_MOVES, 
  BOARD_SIZE 
} from '../models/types';
import { isValidPosition, deepClone } from './boardUtils';

/**
 * Get all possible moves for a piece at the given position
 */
export function getPossibleMoves(
  board: (Piece | null)[][], 
  position: Position, 
  enPassantTarget: Position | null = null,
  castlingRights: { [color: string]: { kingSide: boolean, queenSide: boolean } } = {
    [PieceColor.WHITE]: { kingSide: true, queenSide: true },
    [PieceColor.BLACK]: { kingSide: true, queenSide: true }
  }
): Move[] {
  const { row, col } = position;
  const piece = board[row][col];
  
  if (!piece) return [];
  
  const moves: Move[] = [];
  
  switch (piece.type) {
    case PieceType.PAWN:
      getPawnMoves(board, position, piece, moves, enPassantTarget);
      break;
    case PieceType.KNIGHT:
      getKnightMoves(board, position, piece, moves);
      break;
    case PieceType.BISHOP:
      getBishopMoves(board, position, piece, moves);
      break;
    case PieceType.ROOK:
      getRookMoves(board, position, piece, moves);
      break;
    case PieceType.QUEEN:
      getQueenMoves(board, position, piece, moves);
      break;
    case PieceType.KING:
      getKingMoves(board, position, piece, moves, castlingRights);
      break;
  }
  
  return moves;
}

/**
 * Filter moves that would result in check
 */
export function filterLegalMoves(board: (Piece | null)[][], moves: Move[], currentPlayer: PieceColor): Move[] {
  return moves.filter(move => {
    // Create a deep copy of the board
    const newBoard = deepClone(board);
    
    // Apply the move
    applyMove(newBoard, move);
    
    // Check if the king is in check after the move
    return !isKingInCheck(newBoard, currentPlayer);
  });
}

/**
 * Check if a king is in check
 */
export function isKingInCheck(board: (Piece | null)[][], kingColor: PieceColor): boolean {
  // Find the king position
  let kingPosition: Position | null = null;
  
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      if (
        piece && 
        piece.type === PieceType.KING && 
        piece.color === kingColor
      ) {
        kingPosition = { row, col };
        break;
      }
    }
    if (kingPosition) break;
  }
  
  if (!kingPosition) return false; // Should never happen in a valid game
  
  // Check if any opponent piece can capture the king
  const opponentColor = kingColor === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;
  
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      
      if (piece && piece.color === opponentColor) {
        const moves = getPossibleMoves(board, { row, col });
        
        // Check if any move can capture the king
        for (const move of moves) {
          if (
            move.to.row === kingPosition.row && 
            move.to.col === kingPosition.col
          ) {
            return true;
          }
        }
      }
    }
  }
  
  return false;
}

/**
 * Check if a player is in checkmate
 */
export function isCheckmate(board: (Piece | null)[][], playerColor: PieceColor): boolean {
  // If not in check, not checkmate
  if (!isKingInCheck(board, playerColor)) return false;
  
  // Check if any move can get out of check
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      
      if (piece && piece.color === playerColor) {
        const moves = getPossibleMoves(board, { row, col });
        const legalMoves = filterLegalMoves(board, moves, playerColor);
        
        if (legalMoves.length > 0) {
          return false; // Found at least one legal move
        }
      }
    }
  }
  
  return true; // No legal moves found, it's checkmate
}

/**
 * Check if a player is in stalemate
 */
export function isStalemate(board: (Piece | null)[][], playerColor: PieceColor): boolean {
  // If in check, not stalemate
  if (isKingInCheck(board, playerColor)) return false;
  
  // Check if any legal move exists
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      
      if (piece && piece.color === playerColor) {
        const moves = getPossibleMoves(board, { row, col });
        const legalMoves = filterLegalMoves(board, moves, playerColor);
        
        if (legalMoves.length > 0) {
          return false; // Found at least one legal move
        }
      }
    }
  }
  
  return true; // No legal moves found but not in check, it's stalemate
}

/**
 * Apply a move to the board
 */
export function applyMove(board: (Piece | null)[][], move: Move): void {
  const { from, to, type, piece, capturedPiece, promotionPieceType, castlingRookFrom, castlingRookTo, enPassantCapturePos } = move;
  
  // Move the piece
  board[from.row][from.col] = null;
  
  // Handle promotion
  if (type === MoveType.PROMOTION || type === MoveType.CAPTURE_AND_PROMOTION) {
    board[to.row][to.col] = {
      type: promotionPieceType || PieceType.QUEEN, // Default to queen if not specified
      color: piece.color,
      hasMoved: true
    };
  } else {
    // Regular move
    board[to.row][to.col] = {
      ...piece,
      hasMoved: true
    };
  }
  
  // Handle castling
  if (type === MoveType.CASTLE_KINGSIDE || type === MoveType.CASTLE_QUEENSIDE) {
    if (castlingRookFrom && castlingRookTo) {
      const rook = board[castlingRookFrom.row][castlingRookFrom.col];
      board[castlingRookFrom.row][castlingRookFrom.col] = null;
      if (rook) {
        board[castlingRookTo.row][castlingRookTo.col] = {
          ...rook,
          hasMoved: true
        };
      }
    }
  }
  
  // Handle en passant capture
  if (type === MoveType.EN_PASSANT && enPassantCapturePos) {
    board[enPassantCapturePos.row][enPassantCapturePos.col] = null;
  }
}