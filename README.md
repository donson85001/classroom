# Stream Avatars Classroom Prototype

這是一個你可以直接放進 GitHub 的 React + Vite 專案。

## 功能
- 第一次講話：角色出現、正面打招呼
- 自動分配一張書桌
- 椅子先拉開
- 角色走過去坐下
- 已入座的人再次講話：會坐著舉手，並顯示對話泡泡
- 可先用內建測試按鈕模擬聊天室

## 本機使用方式

### 1) 安裝 Node.js
建議安裝 Node.js 20 以上版本。

### 2) 安裝套件
```bash
npm install
```

### 3) 啟動開發模式
```bash
npm run dev
```

### 4) 打開瀏覽器
看到終端機顯示網址後，開啟：
```bash
http://localhost:5173
```

## 發佈到 GitHub
1. 建一個新的 GitHub repository
2. 把這個專案全部上傳
3. 你可以先用本機跑
4. 若要部署網頁，可用 Vercel / Netlify

## OBS 使用
這版目前最適合先當 prototype 頁面使用。
若你要掛進 OBS：
1. 先把它部署成公開網址
2. 在 OBS 新增 Browser Source
3. 網址填入你的部署網址
4. 寬高建議先設 1600 x 900

## 要接 Twitch / YouTube Chat 時
目前是用這個函式模擬聊天室訊息：

```js
simulateChat(name, text)
```

你只要把真實聊天室收到訊息的地方改成呼叫這個函式即可。

## 後續建議擴充
- 接 Twitch IRC / tmi.js
- 接 YouTube Live Chat API
- 改成像素角色素材
- 增加桌上道具、表情、打賞特效
- 分頁拆成 overlay 與 control panel
