# 🚀 快速開始 - Supabase 遷移

## ✅ 已完成
- [x] 步驟 1: 建立 Supabase 資料表
- [x] 步驟 2: 已配置 Supabase API Key

## 📋 下一步：執行資料遷移

### 方法 1: 使用瀏覽器工具（最簡單）⭐ 推薦

1. **打開遷移工具**
   - 在瀏覽器中打開 `migrate_browser.html`
   - 或直接雙擊檔案

2. **確認設定**
   - Supabase URL: `https://sqgrnowrcvspxhuudrqc.supabase.co` ✅
   - Supabase Anon Key: 已自動填入 ✅
   - Google Sheets API URL: 已自動填入 ✅

3. **開始遷移**
   - 點擊「開始遷移」按鈕
   - 等待遷移完成（會顯示進度條）
   - 遷移完成後會顯示成功訊息

### 方法 2: 使用 Node.js 腳本

如果您有 Node.js 環境：

```bash
# 安裝依賴
npm install

# 執行遷移
npm run migrate
```

## 🔍 驗證遷移結果

1. 登入 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇專案：`sqgrnowrcvspxhuudrqc`
3. 進入 **Table Editor** > **foodcarcalss**
4. 檢查資料是否正確遷移

## ⚠️ 注意事項

- 遷移過程中請勿關閉瀏覽器
- 如果資料量很大，遷移可能需要一些時間
- 建議先測試少量資料，確認無誤後再遷移全部

## 🎯 遷移完成後

遷移完成後，您需要：
1. 更新前端代碼使用 Supabase API
2. 測試所有功能
3. 確認無誤後完全切換

---

**準備好了嗎？** 打開 `migrate_browser.html` 開始遷移吧！ 🚀
