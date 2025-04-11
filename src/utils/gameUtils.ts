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

/**
 * Get all possible pawn moves
 */
function getPawnMoves(
  board: (Piece | null)[][],
  position: Position,
  piece: Piece,
  moves: Move[],
  enPassantTarget: Position | null
): void {
  const { row, col } = position;
  const direction = piece.color === PieceColor.WHITE ? -1 : 1;
  
  // Forward moves
  const oneForward = { row: row + direction, col };
  
  if (isValidPosition(oneForward) && !board[oneForward.row][oneForward.col]) {
    // Regular forward move
    if ((piece.color === PieceColor.WHITE && oneForward.row === 0) || 
        (piece.color === PieceColor.BLACK && oneForward.row === 7)) {
      // Promotion
      addPawnPromotionMoves(moves, position, oneForward, piece);
    } else {
      moves.push({
        from: position,
        to: oneForward,
        type: MoveType.NORMAL,
        piece
      });
    }
    
    // Two-square move from starting position
    if ((piece.color === PieceColor.WHITE && row === 6) || 
        (piece.color === PieceColor.BLACK && row === 1)) {
      const twoForward = { row: row + 2 * direction, col };
      
      if (isValidPosition(twoForward) && !board[twoForward.row][twoForward.col]) {
        moves.push({
          from: position,
          to: twoForward,
          type: MoveType.NORMAL,
          piece
        });
      }
    }
  }
  
  // Capture moves
  const captureMoves = [
    { row: row + direction, col: col - 1 },
    { row: row + direction, col: col + 1 }
  ];
  
  for (const captureMove of captureMoves) {
    if (isValidPosition(captureMove)) {
      const targetPiece = board[captureMove.row][captureMove.col];
      
      if (targetPiece && targetPiece.color !== piece.color) {
        // Regular capture
        if ((piece.color === PieceColor.WHITE && captureMove.row === 0) || 
            (piece.color === PieceColor.BLACK && captureMove.row === 7)) {
          // Capture with promotion
          addPawnPromotionMoves(moves, position, captureMove, piece, targetPiece);
        } else {
          moves.push({
            from: position,
            to: captureMove,
            type: MoveType.CAPTURE,
            piece,
            capturedPiece: targetPiece
          });
        }
      }
      
      // En passant capture
      if (enPassantTarget && 
          captureMove.row === enPassantTarget.row && 
          captureMove.col === enPassantTarget.col) {
        const capturedPawnPos = { 
          row: row, 
          col: enPassantTarget.col 
        };
        const capturedPawn = board[capturedPawnPos.row][capturedPawnPos.col];
        
        if (capturedPawn && capturedPawn.type === PieceType.PAWN && 
            capturedPawn.color !== piece.color) {
          moves.push({
            from: position,
            to: captureMove,
            type: MoveType.EN_PASSANT,
            piece,
            capturedPiece: capturedPawn,
            enPassantCapturePos: capturedPawnPos
          });
        }
      }
    }
  }
}

/**
 * Add pawn promotion moves
 */
function addPawnPromotionMoves(
  moves: Move[],
  from: Position,
  to: Position,
  piece: Piece,
  capturedPiece?: Piece
): void {
  const promotionPieces = [
    PieceType.QUEEN,
    PieceType.ROOK,
    PieceType.BISHOP,
    PieceType.KNIGHT
  ];
  
  for (const promotionPieceType of promotionPieces) {
    moves.push({
      from,
      to,
      type: capturedPiece ? MoveType.CAPTURE_AND_PROMOTION : MoveType.PROMOTION,
      piece,
      capturedPiece,
      promotionPieceType
    });
  }
}

/**
 * Get all possible knight moves
 */
function getKnightMoves(
  board: (Piece | null)[][],
  position: Position,
  piece: Piece,
  moves: Move[]
): void {
  const { row, col } = position;
  
  for (const knightMove of KNIGHT_MOVES) {
    const newRow = row + knightMove.row;
    const newCol = col + knightMove.col;
    const newPos = { row: newRow, col: newCol };
    
    if (isValidPosition(newPos)) {
      const targetPiece = board[newRow][newCol];
      
      if (!targetPiece) {
        // Empty square
        moves.push({
          from: position,
          to: newPos,
          type: MoveType.NORMAL,
          piece
        });
      } else if (targetPiece.color !== piece.color) {
        // Capture
        moves.push({
          from: position,
          to: newPos,
          type: MoveType.CAPTURE,
          piece,
          capturedPiece: targetPiece
        });
      }
    }
  }
}

/**
 * Get all possible bishop moves
 */
function getBishopMoves(
  board: (Piece | null)[][],
  position: Position,
  piece: Piece,
  moves: Move[]
): void {
  // Bishops move diagonally
  const diagonalDirections = [
    DIRECTIONS.NORTHEAST,
    DIRECTIONS.SOUTHEAST,
    DIRECTIONS.SOUTHWEST,
    DIRECTIONS.NORTHWEST
  ];
  
  getLinearMoves(board, position, piece, moves, diagonalDirections);
}

/**
 * Get all possible rook moves
 */
function getRookMoves(
  board: (Piece | null)[][],
  position: Position,
  piece: Piece,
  moves: Move[]
): void {
  // Rooks move horizontally and vertically
  const straightDirections = [
    DIRECTIONS.NORTH,
    DIRECTIONS.EAST,
    DIRECTIONS.SOUTH,
    DIRECTIONS.WEST
  ];
  
  getLinearMoves(board, position, piece, moves, straightDirections);
}

/**
 * Get all possible queen moves
 */
function getQueenMoves(
  board: (Piece | null)[][],
  position: Position,
  piece: Piece,
  moves: Move[]
): void {
  // Queens move like rooks and bishops combined
  const allDirections = [
    DIRECTIONS.NORTH,
    DIRECTIONS.NORTHEAST,
    DIRECTIONS.EAST,
    DIRECTIONS.SOUTHEAST,
    DIRECTIONS.SOUTH,
    DIRECTIONS.SOUTHWEST,
    DIRECTIONS.WEST,
    DIRECTIONS.NORTHWEST
  ];
  
  getLinearMoves(board, position, piece, moves, allDirections);
}

/**
 * Get linear moves in the given directions
 */
function getLinearMoves(
  board: (Piece | null)[][],
  position: Position,
  piece: Piece,
  moves: Move[],
  directions: { row: number, col: number }[]
): void {
  const { row, col } = position;
  
  for (const direction of directions) {
    let newRow = row + direction.row;
    let newCol = col + direction.col;
    
    while (isValidPosition({ row: newRow, col: newCol })) {
      const targetPiece = board[newRow][newCol];
      
      if (!targetPiece) {
        // Empty square
        moves.push({
          from: position,
          to: { row: newRow, col: newCol },
          type: MoveType.NORMAL,
          piece
        });
      } else {
        // Hit a piece
        if (targetPiece.color !== piece.color) {
          // Can capture opponent piece
          moves.push({
            from: position,
            to: { row: newRow, col: newCol },
            type: MoveType.CAPTURE,
            piece,
            capturedPiece: targetPiece
          });
        }
        
        break; // Stop looking in this direction
      }
      
      newRow += direction.row;
      newCol += direction.col;
    }
  }
}

/**
 * Get all possible king moves
 */
function getKingMoves(
  board: (Piece | null)[][],
  position: Position,
  piece: Piece,
  moves: Move[],
  castlingRights: { [color: string]: { kingSide: boolean, queenSide: boolean } }
): void {
  const { row, col } = position;
  
  // King can move one square in any direction
  const allDirections = [
    DIRECTIONS.NORTH,
    DIRECTIONS.NORTHEAST,
    DIRECTIONS.EAST,
    DIRECTIONS.SOUTHEAST,
    DIRECTIONS.SOUTH,
    DIRECTIONS.SOUTHWEST,
    DIRECTIONS.WEST,
    DIRECTIONS.NORTHWEST
  ];
  
  for (const direction of allDirections) {
    const newRow = row + direction.row;
    const newCol = col + direction.col;
    const newPos = { row: newRow, col: newCol };
    
    if (isValidPosition(newPos)) {
      const targetPiece = board[newRow][newCol];
      
      if (!targetPiece) {
        // Empty square
        moves.push({
          from: position,
          to: newPos,
          type: MoveType.NORMAL,
          piece
        });
      } else if (targetPiece.color !== piece.color) {
        // Capture
        moves.push({
          from: position,
          to: newPos,
          type: MoveType.CAPTURE,
          piece,
          capturedPiece: targetPiece
        });
      }
    }
  }
  
  // Castling
  if (!piece.hasMoved) {
    // Check if castling is allowed
    const kingColor = piece.color;
    
    // Kingside castling
    if (castlingRights[kingColor]?.kingSide) {
      const kingRank = kingColor === PieceColor.WHITE ? 7 : 0;
      
      // Check if the squares between king and rook are empty
      if (!board[kingRank][5] && !board[kingRank][6]) {
        // Check if the king-side rook is in place and hasn't moved
        const rookPiece = board[kingRank][7];
        
        if (rookPiece && 
            rookPiece.type === PieceType.ROOK && 
            rookPiece.color === kingColor && 
            !rookPiece.hasMoved) {
          
          // Check if king is not in check and doesn't move through check
          // This will be filtered in filterLegalMoves() function
          moves.push({
            from: position,
            to: { row: kingRank, col: 6 },
            type: MoveType.CASTLE_KINGSIDE,
            piece,
            castlingRookFrom: { row: kingRank, col: 7 },
            castlingRookTo: { row: kingRank, col: 5 }
          });
        }
      }
    }
    
    // Queenside castling
    if (castlingRights[kingColor]?.queenSide) {
      const kingRank = kingColor === PieceColor.WHITE ? 7 : 0;
      
      // Check if the squares between king and rook are empty
      if (!board[kingRank][1] && !board[kingRank][2] && !board[kingRank][3]) {
        // Check if the queen-side rook is in place and hasn't moved
        const rookPiece = board[kingRank][0];
        
        if (rookPiece && 
            rookPiece.type === PieceType.ROOK && 
            rookPiece.color === kingColor && 
            !rookPiece.hasMoved) {
          
          // Check if king is not in check and doesn't move through check
          // This will be filtered in filterLegalMoves() function
          moves.push({
            from: position,
            to: { row: kingRank, col: 2 },
            type: MoveType.CASTLE_QUEENSIDE,
            piece,
            castlingRookFrom: { row: kingRank, col: 0 },
            castlingRookTo: { row: kingRank, col: 3 }
          });
        }
      }
    }
  }
}

/**
 * Check if a move is valid (used for move validation)
 */
export function isValidMove(
  board: (Piece | null)[][],
  from: Position,
  to: Position,
  enPassantTarget: Position | null = null,
  castlingRights: { [color: string]: { kingSide: boolean, queenSide: boolean } } = {
    [PieceColor.WHITE]: { kingSide: true, queenSide: true },
    [PieceColor.BLACK]: { kingSide: true, queenSide: true }
  }
): Move | null {
  const piece = board[from.row][from.col];
  
  if (!piece) return null;
  
  const possibleMoves = getPossibleMoves(board, from, enPassantTarget, castlingRights);
  const legalMoves = filterLegalMoves(board, possibleMoves, piece.color);
  
  // Find the move that matches the destination
  for (const move of legalMoves) {
    if (move.to.row === to.row && move.to.col === to.col) {
      return move;
    }
  }
  
  return null; // No valid move found
}

/**
 * Get the position of a newly created en passant target (if any)
 */
export function getEnPassantTarget(move: Move): Position | null {
  const { from, to, piece, type } = move;
  
  // Only pawns moving two squares create en passant targets
  if (piece.type === PieceType.PAWN && type === MoveType.NORMAL) {
    const rowDiff = Math.abs(to.row - from.row);
    
    if (rowDiff === 2) {
      // En passant target is the square behind the pawn
      const direction = piece.color === PieceColor.WHITE ? 1 : -1;
      return { row: to.row + direction, col: to.col };
    }
  }
  
  return null;
}