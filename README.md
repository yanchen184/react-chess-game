# React Chess Game

互動式西洋棋遊戲，支持雙人對戰和AI對手模式。使用React、TypeScript和CSS開發。

## 功能特色

- 完整的西洋棋規則實現
- 雙人對戰模式
- 具有多種難度等級的AI對手
- 可視化的走法提示
- 吃子歷史記錄
- 支持所有特殊走法（王車易位、兵升變、吃過路兵等）
- 遊戲狀態指示（將軍、將死、和局等）
- 可撤銷上一步
- 棋子移動音效

## 在線演示

訪問 [https://yanchen184.github.io/react-chess-game](https://yanchen184.github.io/react-chess-game) 體驗遊戲。

## 本地運行

```bash
# 克隆倉庫
git clone https://github.com/yanchen184/react-chess-game.git

# 進入項目目錄
cd react-chess-game

# 安裝依賴
npm install

# 啟動開發服務器
npm start
```

## 技術棧

- React
- TypeScript
- CSS

## 版本歷史

### v1.1.0
- 添加高品質的真實棋子移動音效
- 修復音效文件無法播放的問題
- 改進版本號顯示與管理
- 優化部署到 GitHub Pages 的配置

### v1.0.1
- 改進 AI 算法，使用極小化極大算法(Minimax Algorithm)進行走棋決策
- 添加移動、吃子和將軍的音效
- 修復了一些 UI 和遊戲邏輯 bug
- 當 AI 思考時顯示狀態指示

### v1.0.0
- 初始版本
- 實現基本的西洋棋遊戲功能
- 添加簡單的 AI 對手

## 許可證

MIT
