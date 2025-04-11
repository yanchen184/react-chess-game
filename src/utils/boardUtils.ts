import { 
  BOARD_SIZE, 
  FILES, 
  RANKS, 
  PieceType, 
  PieceColor, 
  Piece, 
  Position 
} from '../models/types';

/**
 * 初始棋盤FEN表示法
 */
export const INITIAL_POSITION = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

/**
 * 將代數表示法（例如，"e4"）轉換為棋盤坐標 [row, col]
 */
export function algebraicToCoords(algebraic: string): Position | null {
  if (!algebraic || algebraic.length !== 2) {
    return null;
  }
  
  const file = algebraic.charAt(0).toLowerCase();
  const rank = algebraic.charAt(1);
  
  if (!FILES.includes(file) || !RANKS.includes(rank)) {
    return null;
  }
  
  const col = FILES.indexOf(file);
  const row = RANKS.indexOf(rank);
  
  return { row, col };
}

/**
 * 將棋盤坐標 [row, col] 轉換為代數表示法（例如，"e4"）
 */
export function coordsToAlgebraic(position: Position): string | null {
  const { row, col } = position;
  
  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
    return null;
  }
  
  const file = FILES[col];
  const rank = RANKS[row];
  
  return file + rank;
}

/**
 * 檢查一個位置是否在棋盤範圍內
 */
export function isValidPosition(position: Position): boolean {
  const { row, col } = position;
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

/**
 * 深拷貝一個對象或數組
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * 解析FEN表示法為棋盤狀態
 */
export function parseFEN(fen: string): { 
  board: (Piece | null)[][],
  activeColor: PieceColor,
  castlingRights: { [color: string]: { kingSide: boolean, queenSide: boolean } },
  enPassantTarget: Position | null,
  halfmoveClock: number,
  fullmoveNumber: number
} {
  const parts = fen.split(' ');
  const boardPart = parts[0];
  const activeColorPart = parts[1];  // 'w' or 'b'
  const castlingPart = parts[2];     // 'KQkq', 'Kk', etc.
  const enPassantPart = parts[3];    // '-' or target square
  const halfmoveClockPart = parts[4]; // Halfmove clock for 50-move rule
  const fullmoveNumberPart = parts[5]; // Fullmove number
  
  const board: (Piece | null)[][] = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
  const rows = boardPart.split('/');
  
  // Parse board position
  for (let i = 0; i < BOARD_SIZE; i++) {
    let col = 0;
    for (let j = 0; j < rows[i].length; j++) {
      const char = rows[i].charAt(j);
      if (isNaN(Number(char))) {
        // It's a piece
        const color = char === char.toUpperCase() ? PieceColor.WHITE : PieceColor.BLACK;
        let type: PieceType;
        
        switch (char.toUpperCase()) {
          case 'P': type = PieceType.PAWN; break;
          case 'R': type = PieceType.ROOK; break;
          case 'N': type = PieceType.KNIGHT; break;
          case 'B': type = PieceType.BISHOP; break;
          case 'Q': type = PieceType.QUEEN; break;
          case 'K': type = PieceType.KING; break;
          default: continue; // Skip unknown characters
        }
        
        board[i][col] = { type, color, hasMoved: false };
        col++;
      } else {
        // It's a number (empty squares)
        col += parseInt(char);
      }
    }
  }
  
  // Parse game state
  const activeColor = activeColorPart === 'w' ? PieceColor.WHITE : PieceColor.BLACK;
  
  const castlingRights = {
    [PieceColor.WHITE]: {
      kingSide: castlingPart.includes('K'),
      queenSide: castlingPart.includes('Q')
    },
    [PieceColor.BLACK]: {
      kingSide: castlingPart.includes('k'),
      queenSide: castlingPart.includes('q')
    }
  };
  
  const enPassantTarget = enPassantPart === '-' ? null : algebraicToCoords(enPassantPart);
  const halfmoveClock = parseInt(halfmoveClockPart);
  const fullmoveNumber = parseInt(fullmoveNumberPart);
  
  return {
    board,
    activeColor,
    castlingRights,
    enPassantTarget,
    halfmoveClock,
    fullmoveNumber
  };
}

/**
 * 將棋盤狀態轉換為FEN表示法
 */
export function boardToFEN(gameState: { 
  board: (Piece | null)[][],
  activeColor: PieceColor,
  castlingRights: { [color: string]: { kingSide: boolean, queenSide: boolean } },
  enPassantTarget: Position | null,
  halfmoveClock: number,
  fullmoveNumber: number
}): string {
  const { board, activeColor, castlingRights, enPassantTarget, halfmoveClock, fullmoveNumber } = gameState;
  let fen = '';
  
  // Board position
  for (let i = 0; i < BOARD_SIZE; i++) {
    let emptyCount = 0;
    
    for (let j = 0; j < BOARD_SIZE; j++) {
      const piece = board[i][j];
      
      if (piece === null) {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          fen += emptyCount;
          emptyCount = 0;
        }
        
        let pieceChar;
        switch (piece.type) {
          case PieceType.PAWN: pieceChar = 'p'; break;
          case PieceType.ROOK: pieceChar = 'r'; break;
          case PieceType.KNIGHT: pieceChar = 'n'; break;
          case PieceType.BISHOP: pieceChar = 'b'; break;
          case PieceType.QUEEN: pieceChar = 'q'; break;
          case PieceType.KING: pieceChar = 'k'; break;
          default: pieceChar = '?'; // Should never happen
        }
        
        if (piece.color === PieceColor.WHITE) {
          pieceChar = pieceChar.toUpperCase();
        }
        
        fen += pieceChar;
      }
    }
    
    if (emptyCount > 0) {
      fen += emptyCount;
    }
    
    if (i < BOARD_SIZE - 1) {
      fen += '/';
    }
  }
  
  // Active color
  fen += ' ' + (activeColor === PieceColor.WHITE ? 'w' : 'b');
  
  // Castling rights
  let castlingString = '';
  if (castlingRights[PieceColor.WHITE].kingSide) castlingString += 'K';
  if (castlingRights[PieceColor.WHITE].queenSide) castlingString += 'Q';
  if (castlingRights[PieceColor.BLACK].kingSide) castlingString += 'k';
  if (castlingRights[PieceColor.BLACK].queenSide) castlingString += 'q';
  fen += ' ' + (castlingString || '-');
  
  // En passant target
  fen += ' ' + (enPassantTarget ? coordsToAlgebraic(enPassantTarget) : '-');
  
  // Halfmove clock and fullmove number
  fen += ' ' + halfmoveClock + ' ' + fullmoveNumber;
  
  return fen;
}