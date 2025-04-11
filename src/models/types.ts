// 定義棋子類型
export enum PieceType {
  KING = 'king',
  QUEEN = 'queen',
  ROOK = 'rook',
  BISHOP = 'bishop',
  KNIGHT = 'knight',
  PAWN = 'pawn'
}

// 定義棋子顏色
export enum PieceColor {
  WHITE = 'white',
  BLACK = 'black'
}

// 定義特殊能力接口
export interface SpecialAbility {
  type: string;
  description: string;
  cooldown?: number;
  currentCooldown?: number;
  // 可以擴展更多屬性,如範圍、持續時間等
}

// 定義特殊能力類型 (用於將來擴展)
export enum SpecialAbilityType {
  DOUBLE_MOVE = 'double-move',  // 一回合內可以移動兩次
  TELEPORT = 'teleport',        // 可以傳送到棋盤上的任意空位
  REVIVAL = 'revival',          // 復活一個被吃掉的棋子
  SWAP = 'swap',                // 交換兩個棋子的位置
  PROMOTION = 'promotion',      // 直接升級棋子
  FREEZE = 'freeze',            // 凍結對手的棋子一回合
  // 可以擴展更多特殊能力
}

// 定義棋子接口
export interface Piece {
  type: PieceType;
  color: PieceColor;
  hasMoved: boolean;
  specialAbilities?: SpecialAbility[];  // 新增特殊能力陣列
}

// 定義棋盤座標
export interface Position {
  row: number;
  col: number;
}

// 定義移動類型
export enum MoveType {
  NORMAL = 'normal',
  CAPTURE = 'capture',
  CASTLE_KINGSIDE = 'castle-kingside',
  CASTLE_QUEENSIDE = 'castle-queenside',
  EN_PASSANT = 'en-passant',
  PROMOTION = 'promotion',
  CAPTURE_AND_PROMOTION = 'capture-and-promotion',
  SPECIAL_ABILITY = 'special-ability'  // 新增特殊能力移動類型
}

// 定義移動接口
export interface Move {
  from: Position;
  to: Position;
  type: MoveType;
  piece: Piece;
  capturedPiece?: Piece;
  promotionPieceType?: PieceType;
  castlingRookFrom?: Position;
  castlingRookTo?: Position;
  enPassantCapturePos?: Position;
  specialAbility?: SpecialAbility;  // 新增特殊能力屬性
  specialMoveData?: any;  // 額外的特殊移動數據
}

// 定義遊戲狀態
export enum GameState {
  ACTIVE = 'active',
  CHECK = 'check',
  CHECKMATE = 'checkmate',
  STALEMATE = 'stalemate',
  DRAW = 'draw'
}

// 定義遊戲模式
export enum GameMode {
  TWO_PLAYER = 'two-player',
  COMPUTER_EASY = 'computer-easy',
  COMPUTER_MEDIUM = 'computer-medium',
  COMPUTER_HARD = 'computer-hard',
  SPECIAL_MODE = 'special-mode'  // 新增特殊模式
}

// 定義AI難度對應的搜索深度
export const AI_DEPTH = {
  [GameMode.COMPUTER_EASY]: 1,
  [GameMode.COMPUTER_MEDIUM]: 2,
  [GameMode.COMPUTER_HARD]: 3
};

// 棋盤大小
export const BOARD_SIZE = 8;

// 行標籤（檔案）
export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

// 列標籤（等級）
export const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

// 棋子值（用於AI評估）
export const PIECE_VALUES = {
  [PieceType.PAWN]: 100,
  [PieceType.KNIGHT]: 320,
  [PieceType.BISHOP]: 330,
  [PieceType.ROOK]: 500,
  [PieceType.QUEEN]: 900,
  [PieceType.KING]: 20000
};

// 方向常量
export const DIRECTIONS = {
  NORTH: { row: -1, col: 0 },
  NORTHEAST: { row: -1, col: 1 },
  EAST: { row: 0, col: 1 },
  SOUTHEAST: { row: 1, col: 1 },
  SOUTH: { row: 1, col: 0 },
  SOUTHWEST: { row: 1, col: -1 },
  WEST: { row: 0, col: -1 },
  NORTHWEST: { row: -1, col: -1 }
};

// 騎士移動偏移量
export const KNIGHT_MOVES = [
  { row: -2, col: -1 },
  { row: -2, col: 1 },
  { row: -1, col: -2 },
  { row: -1, col: 2 },
  { row: 1, col: -2 },
  { row: 1, col: 2 },
  { row: 2, col: -1 },
  { row: 2, col: 1 }
];