# 🇯🇵 JLPT Master — 日本語能力試驗單字學習 App

一款專為 JLPT（日本語能力試驗）考生設計的線上單字學習工具，涵蓋 **N1～N5 共 10,000+ 單字**，支援單字卡、隨機測驗、難字收藏等功能。

<p align="center">
  <img src="https://img.shields.io/badge/JLPT-N1~N5-blueviolet?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Words-10%2C000%2B-brightgreen?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Language-繁體中文-orange?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" />
</p>

---

## ✨ 功能特色

### 📚 單字卡學習
- 支援 **N1 / N2 / N3 / N4+N5** 四個等級牌組
- 正面顯示漢字 + 平假名讀音 + 發音按鈕
- 背面顯示繁體中文釋義 + 例句 + 例句翻譯
- 可使用滑桿或輸入框跳到指定單字
- **記憶功能**：每次開啟自動跳到上次最後複習的位置

### 📝 隨機測驗
- 每次 **10 題**，每題 **10 分**，滿分 **100 分**
- 三種題型隨機出題：
  - 🔤 漢字 → 讀音
  - 🔤 讀音 → 漢字
  - 📖 例句填空
- 即時顯示答對/答錯反饋
- 測驗完成後可查看錯題詳解

### 📊 測驗記錄
- 完整保存每次測驗成績、用時、日期
- 可回顧歷次測驗的錯題，方便針對弱點複習

### ⭐ 難字收藏
- 單字卡右上角星號標記難字
- 獨立的「難字」分頁，可依等級篩選
- 方便集中記憶容易忘記的單字

### 👤 個人化設定
- 首次使用設定暱稱、目標級數、考試日期
- 介面上方顯示**考試倒數天數**
- 可隨時修改個人資料

### 📱 行動優先設計
- 完全響應式設計，手機瀏覽器也能完美使用
- 深色主題，長時間學習不傷眼
- 支援鍵盤快捷鍵（空白鍵翻卡、左右鍵切換）

---

## 🚀 使用方式

### 線上使用（GitHub Pages）

直接開啟以下網址即可使用：

👉 **https://yameitaitra.github.io/jlpt-master/**

### 本地使用

1. Clone 此專案：
   ```bash
   git clone https://github.com/yameitaitra/jlpt-master.git
   ```
2. 用瀏覽器開啟 `index.html` 即可

> 本專案為純靜態網頁（HTML + CSS + JavaScript），**無需安裝任何套件或框架**。

---

## 🗂️ 專案結構

```
jlpt-master/
├── index.html    # 主頁面結構
├── style.css     # 深色主題樣式
├── app.js        # 應用邏輯（單字卡、測驗、記錄、收藏）
├── data.js       # JLPT N1~N5 單字資料（10,000+ 筆）
└── README.md     # 本文件
```

---

## 📦 資料來源與致謝

本專案的單字資料來自以下優秀的開源專案：

### 🥚 [【egg rolls】JLPT N1～N5 一万詞 Anki 牌組 v3](https://github.com/5mdld/anki-jlpt-decks)

> 由 [**@5mdld**](https://github.com/5mdld) 精心整理的 JLPT 一萬詞 Anki 牌組，包含：
> - 完整的 N1～N5 單字收錄
> - 日文原文例句與中文翻譯（簡體 + 繁體）
> - 高品質語音檔案
> - 持續更新與維護
>
> 目前使用版本：**v26.04.26**

**特別感謝 @5mdld 的無私分享與持續維護，讓這些高品質的學習資源得以被更多人使用。** 🙏

如果你也在使用 Anki 學日文，強烈推薦直接使用 [egg rolls 的 Anki 牌組](https://github.com/5mdld/anki-jlpt-decks)！

---

## 🛠️ 技術棧

- **HTML5** — 語意化結構
- **CSS3** — 自訂深色主題、玻璃擬態效果、響應式設計
- **Vanilla JavaScript** — 零依賴，使用原生 Web API
- **LocalStorage** — 本地儲存學習進度、測驗記錄、難字清單
- **Web Speech API** — 日語語音朗讀（TTS）

---

## 📄 授權

本專案以 [MIT License](LICENSE) 開源。

單字資料版權歸 [egg rolls JLPT 牌組](https://github.com/5mdld/anki-jlpt-decks) 原作者所有。

---

<p align="center">
  <b>がんばって！祝你考試順利！🌸</b>
</p>
