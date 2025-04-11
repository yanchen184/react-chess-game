import { 
  Piece, 
  PieceColor, 
  PieceType, 
  PIECE_VALUES, 
  Position, 
  Move, 
  BOARD_SIZE 
} from '../models/types';
import { getPossibleMoves, filterLegalMoves, applyMove, isKingInCheck, isCheckmate, isStalemate } from './gameUtils';
import { deepClone } from './boardUtils';

/**
 * Piece-Square Tables for positional evaluation
 * Higher values mean better positions for pieces
 */
const PIECE_SQUARE_TABLES = {
  [PieceType.PAWN]: [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5,  5, 10, 25, 25, 10,  5,  5],
    [0,  0,  0, 20, 20,  0,  0,  0],
    [5, -5, -10, 0, 0, -10, -5,  5],
    [5, 10, 10, -20, -20, 10, 10,  5],
    [0,  0,  0,  0,  0,  0,  0,  0]
  ],
  [PieceType.KNIGHT]: [
    [-50, -40, -30, -30, -30, -30, -40, -50],
    [-40, -20,  0,  0,  0,  0, -20, -40],
    [-30,  0, 10, 15, 15, 10,  0, -30],
    [-30,  5, 15, 20, 20, 15,  5, -30],
    [-30,  0, 15, 20, 20, 15,  0, -30],
    [-30,  5, 10, 15, 15, 10,  5, -30],
    [-40, -20,  0,  5,  5,  0, -20, -40],
    [-50, -40, -30, -30, -30, -30, -40, -50]
  ],
  [PieceType.BISHOP]: [
    [-20, -10, -10, -10, -10, -10, -10, -20],
    [-10,  0,  0,  0,  0,  0,  0, -10],
    [-10,  0, 10, 10, 10, 10,  0, -10],
    [-10,  5,  5, 10, 10,  5,  5, -10],
    [-10,  0,  5, 10, 10,  5,  0, -10],
    [-10,  5,  5,  5,  5,  5,  5, -10],
    [-10,  0,  5,  0,  0,  5,  0, -10],
    [-20, -10, -10, -10, -10, -10, -10, -20]
  ],
  [PieceType.ROOK]: [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [5, 10, 10, 10, 10, 10, 10,  5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [0,  0,  0,  5,  5,  0,  0,  0]
  ],
  [PieceType.QUEEN]: [
    [-20, -10, -10, -5, -5, -10, -10, -20],
    [-10,  0,  0,  0,  0,  0,  0, -10],
    [-10,  0,  5,  5,  5,  5,  0, -10],
    [-5,  0,  5,  5,  5,  5,  0, -5],
    [0,  0,  5,  5,  5,  5,  0, -5],
    [-10,  5,  5,  5,  5,  5,  0, -10],
    [-10,  0,  5,  0,  0,  0,  0, -10],
    [-20, -10, -10, -5, -5, -10, -10, -20]
  ],
  [PieceType.KING]: [
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-20, -30, -30, -40, -40, -30, -30, -20],
    [-10, -20, -20, -20, -20, -20, -20, -10],
    [20, 20,   0,  0,  0,  0, 20, 20],
    [20, 30,  10,  0,  0, 10, 30, 20]
  ],
  // Endgame king table (used when few pieces are left)
  kingEndgame: [
    [-50, -40, -30, -20, -20, -30, -40, -50],
    [-30, -20, -10,  0,  0, -10, -20, -30],
    [-30, -10, 20, 30, 30, 20, -10, -30],
    [-30, -10, 30, 40, 40, 30, -10, -30],
    [-30, -10, 30, 40, 40, 30, -10, -30],
    [-30, -10, 20, 30, 30, 20, -10, -30],
    [-30, -30,  0,  0,  0,  0, -30, -30],
    [-50, -30, -30, -30, -30, -30, -30, -50]
  ]
};

/**
 * Evaluate the current board position from black's perspective
 * Positive values are good for black, negative values are good for white
 */
export function evaluateBoard(board: (Piece | null)[][]): number {
  let score = 0;
  
  // Count material
  const materialScore = evaluateMaterial(board);
  score += materialScore;
  
  // Evaluate piece positions
  const positionScore = evaluatePositions(board);
  score += positionScore;
  
  // Check for checkmate and stalemate
  if (isCheckmate(board, PieceColor.WHITE)) {
    return 10000; // Black wins
  }
  
  if (isCheckmate(board, PieceColor.BLACK)) {
    return -10000; // White wins
  }
  
  if (isStalemate(board, PieceColor.WHITE) || isStalemate(board, PieceColor.BLACK)) {
    return 0; // Draw
  }
  
  // Check for king safety
  const kingScore = evaluateKingSafety(board);
  score += kingScore;
  
  // Evaluate mobility (number of legal moves)
  const mobilityScore = evaluateMobility(board);
  score += mobilityScore;
  
  return score;
}

/**
 * Evaluate material (piece values)
 */
function evaluateMaterial(board: (Piece | null)[][]): number {
  let score = 0;
  
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      
      if (piece) {
        const pieceValue = PIECE_VALUES[piece.type];
        
        if (piece.color === PieceColor.BLACK) {
          score += pieceValue;
        } else {
          score -= pieceValue;
        }
      }
    }
  }
  
  return score;
}

/**
 * Evaluate piece positions using piece-square tables
 */
function evaluatePositions(board: (Piece | null)[][]): number {
  let score = 0;
  
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      
      if (piece) {
        // Get position value from piece-square table
        let posValue = 0;
        
        if (piece.type === PieceType.KING) {
          // Use different king tables based on game phase
          const isEndgame = isEndgamePhase(board);
          
          if (isEndgame) {
            posValue = PIECE_SQUARE_TABLES.kingEndgame[row][col];
          } else {
            posValue = PIECE_SQUARE_TABLES[piece.type][row][col];
          }
        } else {
          posValue = PIECE_SQUARE_TABLES[piece.type][row][col];
        }
        
        // Adjust for black's perspective (flip the board)
        const adjustedRow = piece.color === PieceColor.BLACK ? row : 7 - row;
        const adjustedCol = piece.color === PieceColor.BLACK ? col : 7 - col;
        
        posValue = PIECE_SQUARE_TABLES[piece.type][adjustedRow][adjustedCol];
        
        if (piece.color === PieceColor.BLACK) {
          score += posValue;
        } else {
          score -= posValue;
        }
      }
    }
  }
  
  return score;
}

/**
 * Evaluate king safety
 */
function evaluateKingSafety(board: (Piece | null)[][]): number {
  let score = 0;
  
  // Find kings
  let whiteKingPos: Position | null = null;
  let blackKingPos: Position | null = null;
  
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      
      if (piece && piece.type === PieceType.KING) {
        if (piece.color === PieceColor.WHITE) {
          whiteKingPos = { row, col };
        } else {
          blackKingPos = { row, col };
        }
      }
    }
  }
  
  if (!whiteKingPos || !blackKingPos) return 0;
  
  // Check if kings are in check
  if (isKingInCheck(board, PieceColor.WHITE)) {
    score += 50; // Good for black
  }
  
  if (isKingInCheck(board, PieceColor.BLACK)) {
    score -= 50; // Good for white
  }
  
  // Evaluate pawn shield for kings
  score += evaluatePawnShield(board, blackKingPos, PieceColor.BLACK);
  score -= evaluatePawnShield(board, whiteKingPos, PieceColor.WHITE);
  
  return score;
}

/**
 * Evaluate pawn shield for a king
 */
function evaluatePawnShield(board: (Piece | null)[][], kingPos: Position, kingColor: PieceColor): number {
  let score = 0;
  const { row, col } = kingPos;
  
  // Check for pawns in front of the king
  const pawnDirection = kingColor === PieceColor.WHITE ? -1 : 1;
  const positions = [
    { row: row + pawnDirection, col: col - 1 },
    { row: row + pawnDirection, col },
    { row: row + pawnDirection, col + 1 },
  ];
  
  for (const pos of positions) {
    if (pos.row >= 0 && pos.row < BOARD_SIZE && pos.col >= 0 && pos.col < BOARD_SIZE) {
      const piece = board[pos.row][pos.col];
      
      if (piece && piece.type === PieceType.PAWN && piece.color === kingColor) {
        score += 10; // Pawn shield is good
      }
    }
  }
  
  return score;
}

/**
 * Evaluate mobility (number of legal moves)
 */
function evaluateMobility(board: (Piece | null)[][]): number {
  let score = 0;
  
  let whiteMoveCount = 0;
  let blackMoveCount = 0;
  
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      
      if (piece) {
        const moves = getPossibleMoves(board, { row, col });
        const legalMoves = filterLegalMoves(board, moves, piece.color);
        
        if (piece.color === PieceColor.WHITE) {
          whiteMoveCount += legalMoves.length;
        } else {
          blackMoveCount += legalMoves.length;
        }
      }
    }
  }
  
  // Each available move is worth a small amount
  score += blackMoveCount * 2;
  score -= whiteMoveCount * 2;
  
  return score;
}

/**
 * Check if the game is in endgame phase
 */
function isEndgamePhase(board: (Piece | null)[][]): boolean {
  let whiteQueens = 0;
  let blackQueens = 0;
  let whitePieceCount = 0;
  let blackPieceCount = 0;
  
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      
      if (piece) {
        if (piece.color === PieceColor.WHITE) {
          whitePieceCount++;
          if (piece.type === PieceType.QUEEN) {
            whiteQueens++;
          }
        } else {
          blackPieceCount++;
          if (piece.type === PieceType.QUEEN) {
            blackQueens++;
          }
        }
      }
    }
  }
  
  // Endgame is when:
  // 1. Both sides have no queens, or
  // 2. One side has a queen and the other has no pieces other than pawns, or
  // 3. Both sides have <= 3 pieces (excluding pawns and kings)
  return (
    (whiteQueens === 0 && blackQueens === 0) ||
    (whitePieceCount <= 4 && blackPieceCount <= 4)
  );
}

/**
 * Find the best move for the AI using the minimax algorithm with alpha-beta pruning
 */
export function findBestMove(
  board: (Piece | null)[][], 
  depth: number, 
  isBlack: boolean,
  enPassantTarget: Position | null = null,
  castlingRights: { [color: string]: { kingSide: boolean, queenSide: boolean } } = {
    [PieceColor.WHITE]: { kingSide: true, queenSide: true },
    [PieceColor.BLACK]: { kingSide: true, queenSide: true }
  }
): Move | null {
  const playerColor = isBlack ? PieceColor.BLACK : PieceColor.WHITE;
  
  // Get all legal moves for the player
  const allMoves: Move[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      if (piece && piece.color === playerColor) {
        const possibleMoves = getPossibleMoves(board, { row, col }, enPassantTarget, castlingRights);
        const legalMoves = filterLegalMoves(board, possibleMoves, playerColor);
        allMoves.push(...legalMoves);
      }
    }
  }
  
  if (allMoves.length === 0) return null;
  
  let bestMove: Move | null = null;
  let bestScore = isBlack ? -Infinity : Infinity;
  
  // For each move, evaluate the resulting board position
  for (const move of allMoves) {
    // Create a new board with the move applied
    const newBoard = deepClone(board);
    applyMove(newBoard, move);
    
    // Evaluate the position using minimax
    const score = minimax(
      newBoard, 
      depth - 1, 
      -Infinity, 
      Infinity, 
      !isBlack, 
      enPassantTarget, 
      castlingRights
    );
    
    // Update best move if needed
    if (isBlack) {
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
  }
  
  return bestMove;
}

/**
 * Minimax algorithm with alpha-beta pruning
 */
function minimax(
  board: (Piece | null)[][], 
  depth: number, 
  alpha: number, 
  beta: number, 
  isMaximizingPlayer: boolean,
  enPassantTarget: Position | null = null,
  castlingRights: { [color: string]: { kingSide: boolean, queenSide: boolean } } = {
    [PieceColor.WHITE]: { kingSide: true, queenSide: true },
    [PieceColor.BLACK]: { kingSide: true, queenSide: true }
  }
): number {
  // Base case: depth reached or terminal position
  if (depth === 0 || isCheckmate(board, PieceColor.WHITE) || isCheckmate(board, PieceColor.BLACK) ||
      isStalemate(board, PieceColor.WHITE) || isStalemate(board, PieceColor.BLACK)) {
    return evaluateBoard(board);
  }
  
  const playerColor = isMaximizingPlayer ? PieceColor.BLACK : PieceColor.WHITE;
  
  // Get all legal moves for the player
  const allMoves: Move[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      if (piece && piece.color === playerColor) {
        const possibleMoves = getPossibleMoves(board, { row, col }, enPassantTarget, castlingRights);
        const legalMoves = filterLegalMoves(board, possibleMoves, playerColor);
        allMoves.push(...legalMoves);
      }
    }
  }
  
  // No legal moves
  if (allMoves.length === 0) {
    return evaluateBoard(board);
  }
  
  if (isMaximizingPlayer) {
    let maxEval = -Infinity;
    
    for (const move of allMoves) {
      const newBoard = deepClone(board);
      applyMove(newBoard, move);
      
      const eval = minimax(newBoard, depth - 1, alpha, beta, false, enPassantTarget, castlingRights);
      maxEval = Math.max(maxEval, eval);
      
      // Alpha-beta pruning
      alpha = Math.max(alpha, eval);
      if (beta <= alpha) {
        break;
      }
    }
    
    return maxEval;
  } else {
    let minEval = Infinity;
    
    for (const move of allMoves) {
      const newBoard = deepClone(board);
      applyMove(newBoard, move);
      
      const eval = minimax(newBoard, depth - 1, alpha, beta, true, enPassantTarget, castlingRights);
      minEval = Math.min(minEval, eval);
      
      // Alpha-beta pruning
      beta = Math.min(beta, eval);
      if (beta <= alpha) {
        break;
      }
    }
    
    return minEval;
  }
}