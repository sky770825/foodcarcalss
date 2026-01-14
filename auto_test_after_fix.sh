#!/bin/bash
# 自動測試圖片上傳功能（RLS 政策設置後）

echo "🧪 等待 3 秒後開始測試..."
sleep 3

echo ""
echo "執行診斷測試..."
node diagnose_storage.js

echo ""
echo "如果看到 '✅ 上傳成功！'，表示問題已解決！"
echo "如果還是失敗，請檢查："
echo "1. SQL 是否執行成功"
echo "2. 是否有錯誤訊息"
