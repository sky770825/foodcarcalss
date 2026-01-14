#!/bin/bash

# 標籤頁切換功能自動化測試腳本
# 這個腳本會自動啟動服務器、運行測試，然後清理

echo "🚀 開始標籤頁切換功能自動化測試"
echo "=================================="

# 顏色定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 檢查 Node.js 是否安裝
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安裝，請先安裝 Node.js${NC}"
    exit 1
fi

# 檢查是否已安裝依賴
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 安裝依賴...${NC}"
    npm install
fi

# 檢查服務器是否已在運行
PORT=5000
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${GREEN}✅ 服務器已在端口 $PORT 運行${NC}"
    SERVER_RUNNING=true
else
    echo -e "${YELLOW}🌐 啟動本地服務器...${NC}"
    npm run serve > /dev/null 2>&1 &
    SERVER_PID=$!
    SERVER_RUNNING=false
    
    # 等待服務器啟動
    echo "⏳ 等待服務器啟動..."
    sleep 3
    
    # 檢查服務器是否成功啟動
    if ! lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${RED}❌ 服務器啟動失敗${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ 服務器已啟動（PID: $SERVER_PID）${NC}"
fi

# 運行測試
echo ""
echo -e "${YELLOW}🧪 開始運行測試...${NC}"
echo ""

npm run test:tabs
TEST_EXIT_CODE=$?

# 清理：如果我們啟動了服務器，則停止它
if [ "$SERVER_RUNNING" = false ] && [ ! -z "$SERVER_PID" ]; then
    echo ""
    echo -e "${YELLOW}🛑 停止服務器...${NC}"
    kill $SERVER_PID 2>/dev/null
    wait $SERVER_PID 2>/dev/null
    echo -e "${GREEN}✅ 服務器已停止${NC}"
fi

# 顯示測試結果
echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}=================================="
    echo "✅ 所有測試通過！"
    echo "==================================${NC}"
    exit 0
else
    echo -e "${RED}=================================="
    echo "❌ 測試失敗"
    echo "==================================${NC}"
    echo ""
    echo "請檢查："
    echo "1. 服務器是否正常運行"
    echo "2. 管理密碼是否正確"
    echo "3. 查看 test_screenshots/ 目錄中的截圖"
    exit 1
fi
