/**
 * 標籤頁切換功能自動化測試腳本
 * 使用 Puppeteer 測試後台管理系統的標籤頁切換功能
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// 測試配置
const TEST_CONFIG = {
  adminUrl: process.env.ADMIN_URL || 'http://localhost:5000/admin.html',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
  timeout: 30000,
  headless: process.env.HEADLESS !== 'false', // 設為 false 可以看到瀏覽器操作過程
  screenshotPath: './test_screenshots'
};

// 創建截圖目錄
if (!fs.existsSync(TEST_CONFIG.screenshotPath)) {
  fs.mkdirSync(TEST_CONFIG.screenshotPath, { recursive: true });
}

async function testTabSwitching() {
  console.log('🚀 開始測試標籤頁切換功能...\n');
  
  let browser;
  let page;
  
  try {
    // 啟動瀏覽器
    console.log('📱 啟動瀏覽器...');
    browser = await puppeteer.launch({
      headless: TEST_CONFIG.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    page.setViewport({ width: 1920, height: 1080 });
    
    // 設置超時時間
    page.setDefaultTimeout(TEST_CONFIG.timeout);
    
    // 監聽控制台輸出
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        console.error(`❌ 頁面錯誤: ${text}`);
      } else if (text.includes('切換標籤') || text.includes('標籤頁')) {
        console.log(`📋 ${text}`);
      }
    });
    
    // 訪問頁面
    console.log(`🌐 訪問頁面: ${TEST_CONFIG.adminUrl}`);
    await page.goto(TEST_CONFIG.adminUrl, { waitUntil: 'networkidle2' });
    
    // 等待登入畫面出現
    console.log('⏳ 等待登入畫面...');
    await page.waitForSelector('#loginModal', { visible: true });
    
    // 截圖：登入畫面
    await page.screenshot({ path: `${TEST_CONFIG.screenshotPath}/01_login.png` });
    console.log('✅ 登入畫面已載入');
    
    // 輸入密碼並登入
    console.log('🔐 輸入管理密碼...');
    await page.type('#adminPassword', TEST_CONFIG.adminPassword);
    await page.click('button[onclick="handleLogin()"]');
    
    // 等待主內容載入
    console.log('⏳ 等待主內容載入...');
    await page.waitForSelector('#mainAdminContent', { visible: true });
    await page.waitForTimeout(1000); // 等待初始化完成
    
    // 截圖：主內容
    await page.screenshot({ path: `${TEST_CONFIG.screenshotPath}/02_main_content.png` });
    console.log('✅ 主內容已載入');
    
    // 測試結果
    const testResults = {
      bookingsTab: false,
      locationsTab: false,
      noticesTab: false,
      tabSwitching: false
    };
    
    // ========== 測試 1: 檢查初始狀態（預約管理標籤頁） ==========
    console.log('\n📋 測試 1: 檢查初始狀態（預約管理標籤頁）');
    const initialTabVisible = await page.evaluate(() => {
      const tabBookings = document.getElementById('tabBookings');
      const tabLocations = document.getElementById('tabLocations');
      const tabNotices = document.getElementById('tabNotices');
      
      return {
        bookingsVisible: tabBookings && window.getComputedStyle(tabBookings).display !== 'none',
        locationsVisible: tabLocations && window.getComputedStyle(tabLocations).display !== 'none',
        noticesVisible: tabNotices && window.getComputedStyle(tabNotices).display !== 'none',
        bookingsHasActive: tabBookings && tabBookings.classList.contains('active'),
        locationsHasActive: tabLocations && tabLocations.classList.contains('active'),
        noticesHasActive: tabNotices && tabNotices.classList.contains('active')
      };
    });
    
    console.log('   預約管理標籤頁:', initialTabVisible.bookingsVisible ? '✅ 可見' : '❌ 不可見');
    console.log('   場地管理標籤頁:', initialTabVisible.locationsVisible ? '❌ 應該隱藏' : '✅ 已隱藏');
    console.log('   注意事項管理標籤頁:', initialTabVisible.noticesVisible ? '❌ 應該隱藏' : '✅ 已隱藏');
    
    if (initialTabVisible.bookingsVisible && !initialTabVisible.locationsVisible && !initialTabVisible.noticesVisible) {
      testResults.bookingsTab = true;
      console.log('   ✅ 初始狀態正確');
    } else {
      console.log('   ❌ 初始狀態不正確');
    }
    
    // ========== 測試 2: 切換到場地管理標籤頁 ==========
    console.log('\n📋 測試 2: 切換到場地管理標籤頁');
    await page.click('button[data-tab="locations"]');
    await page.waitForTimeout(500); // 等待切換動畫
    
    const locationsTabState = await page.evaluate(() => {
      const tabBookings = document.getElementById('tabBookings');
      const tabLocations = document.getElementById('tabLocations');
      const tabNotices = document.getElementById('tabNotices');
      
      return {
        bookingsVisible: tabBookings && window.getComputedStyle(tabBookings).display !== 'none',
        locationsVisible: tabLocations && window.getComputedStyle(tabLocations).display !== 'none',
        noticesVisible: tabNotices && window.getComputedStyle(tabNotices).display !== 'none',
        locationsHasActive: tabLocations && tabLocations.classList.contains('active'),
        locationsListExists: !!document.getElementById('locationsList')
      };
    });
    
    console.log('   預約管理標籤頁:', locationsTabState.bookingsVisible ? '❌ 應該隱藏' : '✅ 已隱藏');
    console.log('   場地管理標籤頁:', locationsTabState.locationsVisible ? '✅ 可見' : '❌ 不可見');
    console.log('   注意事項管理標籤頁:', locationsTabState.noticesVisible ? '❌ 應該隱藏' : '✅ 已隱藏');
    console.log('   場地列表容器:', locationsTabState.locationsListExists ? '✅ 存在' : '❌ 不存在');
    
    if (!locationsTabState.bookingsVisible && locationsTabState.locationsVisible && !locationsTabState.noticesVisible && locationsTabState.locationsListExists) {
      testResults.locationsTab = true;
      console.log('   ✅ 場地管理標籤頁切換成功');
    } else {
      console.log('   ❌ 場地管理標籤頁切換失敗');
    }
    
    // 截圖：場地管理標籤頁
    await page.screenshot({ path: `${TEST_CONFIG.screenshotPath}/03_locations_tab.png` });
    
    // ========== 測試 3: 切換到注意事項管理標籤頁 ==========
    console.log('\n📋 測試 3: 切換到注意事項管理標籤頁');
    await page.click('button[data-tab="notices"]');
    await page.waitForTimeout(500); // 等待切換動畫
    
    const noticesTabState = await page.evaluate(() => {
      const tabBookings = document.getElementById('tabBookings');
      const tabLocations = document.getElementById('tabLocations');
      const tabNotices = document.getElementById('tabNotices');
      
      return {
        bookingsVisible: tabBookings && window.getComputedStyle(tabBookings).display !== 'none',
        locationsVisible: tabLocations && window.getComputedStyle(tabLocations).display !== 'none',
        noticesVisible: tabNotices && window.getComputedStyle(tabNotices).display !== 'none',
        noticesHasActive: tabNotices && tabNotices.classList.contains('active'),
        noticesListExists: !!document.getElementById('noticesList')
      };
    });
    
    console.log('   預約管理標籤頁:', noticesTabState.bookingsVisible ? '❌ 應該隱藏' : '✅ 已隱藏');
    console.log('   場地管理標籤頁:', noticesTabState.locationsVisible ? '❌ 應該隱藏' : '✅ 已隱藏');
    console.log('   注意事項管理標籤頁:', noticesTabState.noticesVisible ? '✅ 可見' : '❌ 不可見');
    console.log('   注意事項列表容器:', noticesTabState.noticesListExists ? '✅ 存在' : '❌ 不存在');
    
    if (!noticesTabState.bookingsVisible && !noticesTabState.locationsVisible && noticesTabState.noticesVisible && noticesTabState.noticesListExists) {
      testResults.noticesTab = true;
      console.log('   ✅ 注意事項管理標籤頁切換成功');
    } else {
      console.log('   ❌ 注意事項管理標籤頁切換失敗');
    }
    
    // 截圖：注意事項管理標籤頁
    await page.screenshot({ path: `${TEST_CONFIG.screenshotPath}/04_notices_tab.png` });
    
    // ========== 測試 4: 切換回預約管理標籤頁 ==========
    console.log('\n📋 測試 4: 切換回預約管理標籤頁');
    await page.click('button[data-tab="bookings"]');
    await page.waitForTimeout(500); // 等待切換動畫
    
    const bookingsTabState = await page.evaluate(() => {
      const tabBookings = document.getElementById('tabBookings');
      const tabLocations = document.getElementById('tabLocations');
      const tabNotices = document.getElementById('tabNotices');
      
      return {
        bookingsVisible: tabBookings && window.getComputedStyle(tabBookings).display !== 'none',
        locationsVisible: tabLocations && window.getComputedStyle(tabLocations).display !== 'none',
        noticesVisible: tabNotices && window.getComputedStyle(tabNotices).display !== 'none',
        bookingsHasActive: tabBookings && tabBookings.classList.contains('active'),
        bookingsTableExists: !!document.getElementById('bookingsTableBody')
      };
    });
    
    console.log('   預約管理標籤頁:', bookingsTabState.bookingsVisible ? '✅ 可見' : '❌ 不可見');
    console.log('   場地管理標籤頁:', bookingsTabState.locationsVisible ? '❌ 應該隱藏' : '✅ 已隱藏');
    console.log('   注意事項管理標籤頁:', bookingsTabState.noticesVisible ? '❌ 應該隱藏' : '✅ 已隱藏');
    console.log('   預約列表容器:', bookingsTabState.bookingsTableExists ? '✅ 存在' : '❌ 不存在');
    
    if (bookingsTabState.bookingsVisible && !bookingsTabState.locationsVisible && !bookingsTabState.noticesVisible && bookingsTabState.bookingsTableExists) {
      testResults.tabSwitching = true;
      console.log('   ✅ 預約管理標籤頁切換成功');
    } else {
      console.log('   ❌ 預約管理標籤頁切換失敗');
    }
    
    // 截圖：預約管理標籤頁（切換回來後）
    await page.screenshot({ path: `${TEST_CONFIG.screenshotPath}/05_bookings_tab_after_switch.png` });
    
    // ========== 測試結果總結 ==========
    console.log('\n' + '='.repeat(60));
    console.log('📊 測試結果總結');
    console.log('='.repeat(60));
    console.log(`預約管理標籤頁初始狀態: ${testResults.bookingsTab ? '✅ 通過' : '❌ 失敗'}`);
    console.log(`場地管理標籤頁切換: ${testResults.locationsTab ? '✅ 通過' : '❌ 失敗'}`);
    console.log(`注意事項管理標籤頁切換: ${testResults.noticesTab ? '✅ 通過' : '❌ 失敗'}`);
    console.log(`標籤頁切換功能: ${testResults.tabSwitching ? '✅ 通過' : '❌ 失敗'}`);
    
    const allPassed = Object.values(testResults).every(result => result === true);
    
    if (allPassed) {
      console.log('\n🎉 所有測試通過！標籤頁切換功能正常運作。');
      process.exit(0);
    } else {
      console.log('\n⚠️  部分測試失敗，請檢查代碼。');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ 測試過程中發生錯誤:');
    console.error(error);
    
    // 錯誤截圖
    if (page) {
      try {
        await page.screenshot({ path: `${TEST_CONFIG.screenshotPath}/error.png`, fullPage: true });
        console.log(`📸 錯誤截圖已保存: ${TEST_CONFIG.screenshotPath}/error.png`);
      } catch (e) {
        console.error('無法保存錯誤截圖:', e);
      }
    }
    
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
      console.log('\n🔒 瀏覽器已關閉');
    }
  }
}

// 執行測試
if (require.main === module) {
  testTabSwitching().catch(error => {
    console.error('測試執行失敗:', error);
    process.exit(1);
  });
}

module.exports = { testTabSwitching };
