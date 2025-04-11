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
  const directions = [
    DIRECTIONS.NORTHEAST,
    DIRECTIONS.SOUTHEAST,
    DIRECTIONS.SOUTHWEST,
    DIRECTIONS.NORTHWEST
  ];
  
  getSlidingPieceMoves(board, position, piece, moves, directions);
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
  const directions = [
    DIRECTIONS.NORTH,
    DIRECTIONS.EAST,
    DIRECTIONS.SOUTH,
    DIRECTIONS.WEST
  ];
  
  getSlidingPieceMoves(board, position, piece, moves, directions);
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
  // Queen combines rook and bishop moves
  getBishopMoves(board, position, piece, moves);
  getRookMoves(board, position, piece, moves);
}

/**
 * Get all possible sliding piece moves (bishop, rook, queen)
 */
function getSlidingPieceMoves(
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
        if (targetPiece.color !== piece.color) {
          // Capture
          moves.push({
            from: position,
            to: { row: newRow, col: newCol },
            type: MoveType.CAPTURE,
            piece,
            capturedPiece: targetPiece
          });
        }
        
        // Stop after hitting a piece
        break;
      }
      
      // Move further in the same direction
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
  
  // Regular king moves (one square in any direction)
  for (const direction of Object.values(DIRECTIONS)) {
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
    const rights = castlingRights[piece.color];
    
    // King-side castling
    if (rights.kingSide) {
      const rookCol = 7;
      const rookPiece = board[row][rookCol];
      
      if (rookPiece && 
          rookPiece.type === PieceType.ROOK && 
          rookPiece.color === piece.color && 
          !rookPiece.hasMoved) {
        
        // Check if squares between king and rook are empty
        let canCastle = true;
        for (let c = col + 1; c < rookCol; c++) {
          if (board[row][c]) {
            canCastle = false;
            break;
          }
        }
        
        if (canCastle) {
          moves.push({
            from: position,
            to: { row, col: col + 2 },
            type: MoveType.CASTLE_KINGSIDE,
            piece,
            castlingRookFrom: { row, col: rookCol },
            castlingRookTo: { row, col: col + 1 }
          });
        }
      }
    }
    
    // Queen-side castling
    if (rights.queenSide) {
      const rookCol = 0;
      const rookPiece = board[row][rookCol];
      
      if (rookPiece && 
          rookPiece.type === PieceType.ROOK && 
          rookPiece.color === piece.color && 
          !rookPiece.hasMoved) {
        
        // Check if squares between king and rook are empty
        let canCastle = true;
        for (let c = col - 1; c > rookCol; c--) {
          if (board[row][c]) {
            canCastle = false;
            break;
          }
        }
        
        if (canCastle) {
          moves.push({
            from: position,
            to: { row, col: col - 2 },
            type: MoveType.CASTLE_QUEENSIDE,
            piece,
            castlingRookFrom: { row, col: rookCol },
            castlingRookTo: { row, col: col - 1 }
          });
        }
      }
    }
  }
}

/**
 * Convert a move to algebraic notation
 */
export function moveToAlgebraic(board: (Piece | null)[][], move: Move): string {
  const { from, to, type, piece, promotionPieceType } = move;
  
  // Piece letter (except for pawns)
  let notation = '';
  if (piece.type !== PieceType.PAWN) {
    notation += piece.type.charAt(0).toUpperCase();
  }
  
  // Source coordinates (only if needed to disambiguate)
  const similarPieces = findSimilarPieces(board, move);
  if (similarPieces.length > 0) {
    let needFile = false;
    let needRank = false;
    
    for (const similarPos of similarPieces) {
      if (similarPos.col === from.col) {
        needRank = true;
      } else if (similarPos.row === from.row) {
        needFile = true;
      } else {
        needFile = true;
      }
    }
    
    if (needFile) {
      notation += String.fromCharCode(97 + from.col); // 'a' to 'h'
    }
    
    if (needRank) {
      notation += (8 - from.row); // '1' to '8'
    }
  }
  
  // Capture symbol
  if (type === MoveType.CAPTURE || 
      type === MoveType.EN_PASSANT || 
      type === MoveType.CAPTURE_AND_PROMOTION) {
    if (piece.type === PieceType.PAWN) {
      notation += String.fromCharCode(97 + from.col);
    }
    notation += 'x';
  }
  
  // Destination coordinates
  notation += String.fromCharCode(97 + to.col);
  notation += (8 - to.row);
  
  // Promotion
  if (type === MoveType.PROMOTION || type === MoveType.CAPTURE_AND_PROMOTION) {
    notation += '=';
    notation += promotionPieceType!.charAt(0).toUpperCase();
  }
  
  // Castling
  if (type === MoveType.CASTLE_KINGSIDE) {
    return 'O-O';
  } else if (type === MoveType.CASTLE_QUEENSIDE) {
    return 'O-O-O';
  }
  
  return notation;
}

/**
 * Find similar pieces that could move to the same destination
 */
function findSimilarPieces(board: (Piece | null)[][], move: Move): Position[] {
  const { to, piece } = move;
  const similarPositions: Position[] = [];
  
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const currentPiece = board[row][col];
      
      if (currentPiece && 
          currentPiece.color === piece.color && 
          currentPiece.type === piece.type && 
          !(row === move.from.row && col === move.from.col)) {
        
        const moves = getPossibleMoves(board, { row, col });
        
        for (const potentialMove of moves) {
          if (potentialMove.to.row === to.row && potentialMove.to.col === to.col) {
            similarPositions.push({ row, col });
            break;
          }
        }
      }
    }
  }
  
  return similarPositions;
}