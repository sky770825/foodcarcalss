# 🚀 快速修復圖片上傳問題

## ✅ 問題診斷結果

根據自動化測試，問題已找到：
- ✅ **Bucket 已存在** (`foodcarcalss`)
- ❌ **RLS 政策未設置**（導致上傳失敗）

錯誤訊息：`new row violates row-level security policy`

## 🔧 解決方案（2 分鐘完成）

### 步驟 1: 設置 RLS 政策

1. **登入 Supabase Dashboard**
   - 網址：https://supabase.com/dashboard/project/sqgrnowrcvspxhuudrqc
   - 進入 **SQL Editor**（左側導航欄）

2. **執行 SQL 腳本**
   - 點擊 **"New Query"**
   - 複製 `fix_storage_rls.sql` 文件的全部內容
   - 貼上到 SQL Editor
   - 點擊 **"Run"** 執行

3. **驗證設置**
   - 執行後應該看到 "Success. No rows returned" 或類似的成功訊息
   - 如果看到錯誤，請檢查錯誤訊息

### 步驟 2: 驗證修復

執行以下命令測試：

```bash
node diagnose_storage.js
```

如果看到 "✅ 上傳成功！"，表示問題已解決！

## 📋 需要設置的 4 個 RLS 政策

1. **SELECT** - 允許公開讀取圖片
2. **INSERT** - 允許公開上傳圖片（最重要！）
3. **UPDATE** - 允許更新圖片（可選）
4. **DELETE** - 允許刪除圖片（可選）

## 🎯 完成後

設置完成後，圖片上傳功能應該可以正常工作了！

- ✅ 報名表單可以上傳匯款圖片
- ✅ 繳費彈窗可以上傳匯款圖片
- ✅ 後台可以查看上傳的圖片

## 🆘 如果還有問題

1. 確認 bucket 名稱是否為 `foodcarcalss`（完全一致，小寫）
2. 確認 bucket 是否設置為公開（Public bucket: ✅）
3. 檢查 SQL 執行是否有錯誤訊息
4. 重新運行 `node diagnose_storage.js` 查看最新狀態
