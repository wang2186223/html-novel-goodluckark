// Google Apps Script 代码 - 网站访问统计系统(每日独立表格版本)
// 主控制表格 ID: 1_aTtHxX7LmHTcY9BB5qECc4L8OSWHxNoDaqDuyda_xY
// 部署ID: AKfycbzYA0Fe1-_ihK8E44GHmTrVQBYgjKkNM39sdGpl0DrdhOWxTaaaowf3eEvLXxbq08i1ug
// 部署URL: https://script.google.com/macros/s/AKfycbzYA0Fe1-_ihK8E44GHmTrVQBYgjKkNM39sdGpl0DrdhOWxTaaaowf3eEvLXxbq08i1ug/exec
// 
// 架构说明：
// - 主表格：用于控制台、统计汇总、表格索引
// - 每日表格：每天自动创建新的独立表格，包含当天的详细数据和广告引导数据
// - 表格命名：adx-good-2025-01-15
// - 文件夹：所有每日表格存放在"网站统计数据"文件夹中

// ==================== 配置常量 ====================

const MAIN_SPREADSHEET_ID = '1_aTtHxX7LmHTcY9BB5qECc4L8OSWHxNoDaqDuyda_xY';
const DATA_FOLDER_NAME = '网站统计数据';
const SPREADSHEET_PREFIX = 'adx-good-';

// ==================== 主入口函数 ====================

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const eventType = data.eventType || 'page_visit';
    
    // 获取或创建今日表格
    const dateString = getDateString();
    const dailySpreadsheet = getOrCreateDailySpreadsheet(dateString);
    
    if (eventType === 'ad_guide_triggered') {
      handleAdGuideEvent(dailySpreadsheet, data);
    } else if (eventType === 'ad_click') {
      handleAdClickEvent(dailySpreadsheet, data);
    } else {
      handlePageVisitEvent(dailySpreadsheet, data);
    }
    
    // 1%概率更新主控制台统计
    if (Math.random() < 0.01) {
      updateMainDashboard();
    }
    
    // 0.5%概率自动清理重复索引（平均每200次请求清理一次）
    if (Math.random() < 0.005) {
      cleanupDuplicateIndexRecords();
    }
    
    return ContentService.createTextOutput(JSON.stringify({status: 'success'})).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error('Error:', error);
    return ContentService.createTextOutput(JSON.stringify({status: 'error', message: error.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput('Analytics endpoint is working! (Daily Spreadsheets Version)').setMimeType(ContentService.MimeType.TEXT);
}

// ==================== 表格管理核心函数 ====================

/**
 * 获取或创建每日独立表格（带并发锁保护）
 * @param {string} dateString - 日期字符串（格式：2025-01-15）
 * @return {Spreadsheet} 每日表格对象
 */
function getOrCreateDailySpreadsheet(dateString) {
  const spreadsheetName = SPREADSHEET_PREFIX + dateString;
  
  // 1. 先快速查找索引（无锁）
  const mainSpreadsheet = SpreadsheetApp.openById(MAIN_SPREADSHEET_ID);
  const indexSheet = getOrCreateIndexSheet(mainSpreadsheet);
  let spreadsheetId = findSpreadsheetIdFromIndex(indexSheet, dateString);
  
  if (spreadsheetId) {
    try {
      return SpreadsheetApp.openById(spreadsheetId);
    } catch (e) {
      console.log('索引中的表格ID无效，将重新查找');
    }
  }
  
  // 2. 获取锁，防止并发创建（最多等待10秒）
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    
    // 再次检查索引（可能其他线程已创建）
    spreadsheetId = findSpreadsheetIdFromIndex(indexSheet, dateString);
    if (spreadsheetId) {
      try {
        lock.releaseLock();
        return SpreadsheetApp.openById(spreadsheetId);
      } catch (e) {
        console.log('索引中的表格ID无效');
      }
    }
    
    // 3. 搜索文件夹中是否存在同名表格（关键：防止创建重复文件）
    const folder = getOrCreateDataFolder();
    const files = folder.getFilesByName(spreadsheetName);
    
    if (files.hasNext()) {
      const file = files.next();
      const spreadsheet = SpreadsheetApp.openById(file.getId());
      // 找到文件后添加到索引（允许重复索引，不影响数据）
      addToIndex(indexSheet, dateString, file.getId(), file.getUrl());
      lock.releaseLock();
      return spreadsheet;
    }
    
    // 4. 创建新的每日表格
    const newSpreadsheet = SpreadsheetApp.create(spreadsheetName);
    const newFile = DriveApp.getFileById(newSpreadsheet.getId());
    
    // 移动到指定文件夹
    folder.addFile(newFile);
    DriveApp.getRootFolder().removeFile(newFile);
    
    // 初始化表格结构
    initializeDailySpreadsheet(newSpreadsheet, dateString);
    
    // 添加到索引（允许重复索引，不影响数据）
    addToIndex(indexSheet, dateString, newSpreadsheet.getId(), newSpreadsheet.getUrl());
    
    lock.releaseLock();
    return newSpreadsheet;
    
  } catch (e) {
    console.error('获取锁失败:', e);
    // 如果获取锁失败，尝试直接从文件夹查找
    const folder = getOrCreateDataFolder();
    const files = folder.getFilesByName(spreadsheetName);
    if (files.hasNext()) {
      return SpreadsheetApp.openById(files.next().getId());
    }
    throw new Error('无法创建或获取每日表格');
  }
}

/**
 * 初始化每日表格的基本结构
 */
function initializeDailySpreadsheet(spreadsheet, dateString) {
  // 删除默认的Sheet1
  const defaultSheet = spreadsheet.getSheetByName('Sheet1');
  if (defaultSheet) {
    spreadsheet.deleteSheet(defaultSheet);
  }
  
  // 创建"页面访问"sheet
  const visitSheet = spreadsheet.insertSheet('页面访问');
  visitSheet.getRange(1, 1, 1, 7).setValues([
    ['时间', '访问页面', '用户属性', 'IP地址', '累计章节', '累计广告数', '累计失败广告数']
  ]);
  const visitHeader = visitSheet.getRange(1, 1, 1, 7);
  visitHeader.setBackground('#4285f4').setFontColor('white').setFontWeight('bold');
  visitSheet.setColumnWidth(1, 150);
  visitSheet.setColumnWidth(2, 300);
  visitSheet.setColumnWidth(3, 200);
  visitSheet.setColumnWidth(4, 120);
  visitSheet.setColumnWidth(5, 100);  // 累计章节
  visitSheet.setColumnWidth(6, 110);  // 累计广告数
  visitSheet.setColumnWidth(7, 120);  // 累计失败广告数
  
  // 创建“广告引导”sheet
  const adGuideSheet = spreadsheet.insertSheet('广告引导');
  adGuideSheet.getRange(1, 1, 1, 10).setValues([
    ['时间', '访问页面', '用户属性', 'IP地址', '累计广告数', '累计失败广告数', '当前页广告数', '触发次数', '最大触发次数', '事件时间戳']
  ]);
  const adGuideHeader = adGuideSheet.getRange(1, 1, 1, 10);
  adGuideHeader.setBackground('#FF6B6B').setFontColor('white').setFontWeight('bold');
  adGuideSheet.setColumnWidth(1, 150);
  adGuideSheet.setColumnWidth(2, 300);
  adGuideSheet.setColumnWidth(3, 200);
  adGuideSheet.setColumnWidth(4, 120);
  adGuideSheet.setColumnWidth(5, 100);  // 累计广告数
  adGuideSheet.setColumnWidth(6, 120);  // 累计失败广告数
  adGuideSheet.setColumnWidth(7, 120);  // 当前页广告数
  adGuideSheet.setColumnWidth(8, 100);  // 触发次数
  adGuideSheet.setColumnWidth(9, 120);  // 最大触发次数
  adGuideSheet.setColumnWidth(10, 180); // 事件时间戳
  
  // 创建"广告点击"sheet
  const adClickSheet = spreadsheet.insertSheet('广告点击');
  adClickSheet.getRange(1, 1, 1, 13).setValues([
    ['时间', '小说标题', '章节号', '页面URL', '广告位ID', '广告位置(px)', '滚动深度', '用户IP', '设备类型', '屏幕尺寸', '停留时长(秒)', '历史累计点击', '点击来源']
  ]);
  const adClickHeader = adClickSheet.getRange(1, 1, 1, 13);
  adClickHeader.setBackground('#34A853').setFontColor('white').setFontWeight('bold');
  adClickSheet.setColumnWidth(1, 150);   // 时间
  adClickSheet.setColumnWidth(2, 200);   // 小说标题
  adClickSheet.setColumnWidth(3, 80);    // 章节号
  adClickSheet.setColumnWidth(4, 300);   // 页面URL
  adClickSheet.setColumnWidth(5, 120);   // 广告位ID
  adClickSheet.setColumnWidth(6, 100);   // 广告位置
  adClickSheet.setColumnWidth(7, 100);   // 滚动深度
  adClickSheet.setColumnWidth(8, 120);   // IP地址
  adClickSheet.setColumnWidth(9, 100);   // 设备类型
  adClickSheet.setColumnWidth(10, 120);  // 屏幕尺寸
  adClickSheet.setColumnWidth(11, 100);  // 停留时长
  adClickSheet.setColumnWidth(12, 120);  // 历史累计点击
  adClickSheet.setColumnWidth(13, 120);  // 点击来源
  
  // 创建"当日统计"概览sheet
  const summarySheet = spreadsheet.insertSheet('📊当日统计', 0);
  initializeDailySummary(summarySheet, dateString);
}

/**
 * 初始化当日统计概览
 */
function initializeDailySummary(sheet, dateString) {
  sheet.getRange(1, 1, 1, 3).merge();
  sheet.getRange(1, 1).setValue(`📊 ${dateString} 访问统计概览`);
  sheet.getRange(1, 1).setBackground('#1a73e8').setFontColor('white').setFontSize(14).setFontWeight('bold');
  
  const headers = [
    ['统计项目', '数值', '说明'],
    ['页面访问次数', 0, '当天的总访问次数'],
    ['广告引导触发', 0, '广告引导弹窗触发次数'],
    ['广告点击次数', 0, '当天的广告点击次数'],
    ['独立IP数量', 0, '去重后的访问IP数量'],
    ['最后更新时间', '', '数据最后更新的时间']
  ];
  
  sheet.getRange(2, 1, headers.length, 3).setValues(headers);
  sheet.getRange(2, 1, 1, 3).setBackground('#4285f4').setFontColor('white').setFontWeight('bold');
  
  sheet.setColumnWidth(1, 150);
  sheet.setColumnWidth(2, 100);
  sheet.setColumnWidth(3, 250);
}

/**
 * 获取或创建数据文件夹
 */
function getOrCreateDataFolder() {
  const folders = DriveApp.getFoldersByName(DATA_FOLDER_NAME);
  
  if (folders.hasNext()) {
    return folders.next();
  }
  
  return DriveApp.createFolder(DATA_FOLDER_NAME);
}

/**
 * 获取或创建主表格的索引sheet
 */
function getOrCreateIndexSheet(mainSpreadsheet) {
  let indexSheet = mainSpreadsheet.getSheetByName('📑表格索引');
  
  if (!indexSheet) {
    indexSheet = mainSpreadsheet.insertSheet('📑表格索引', 0);
    
    // 设置表头
    indexSheet.getRange(1, 1, 1, 4).setValues([
      ['日期', '表格ID', '表格链接', '创建时间']
    ]);
    indexSheet.getRange(1, 1, 1, 4).setBackground('#34a853').setFontColor('white').setFontWeight('bold');
    
    indexSheet.setColumnWidth(1, 120);
    indexSheet.setColumnWidth(2, 300);
    indexSheet.setColumnWidth(3, 400);
    indexSheet.setColumnWidth(4, 180);
  }
  
  return indexSheet;
}

/**
 * 从索引中查找表格ID
 */
function findSpreadsheetIdFromIndex(indexSheet, dateString) {
  const data = indexSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === dateString) {
      return data[i][1];
    }
  }
  
  return null;
}

/**
 * 添加表格到索引（简单添加，允许重复）
 */
function addToIndex(indexSheet, dateString, spreadsheetId, spreadsheetUrl) {
  // 简单添加，不做复杂检查
  // 重复索引不影响数据收集，只是显示上有重复，可以定期清理
  const newRow = [
    dateString,
    spreadsheetId,
    spreadsheetUrl,
    getTimeString()
  ];
  
  indexSheet.appendRow(newRow);
  console.log(`添加索引: ${dateString} -> ${spreadsheetId}`);
}

// ==================== 数据写入函数 ====================

/**
 * 处理页面访问事件
 */
function handlePageVisitEvent(dailySpreadsheet, data) {
  const visitSheet = dailySpreadsheet.getSheetByName('页面访问');
  
  if (!visitSheet) {
    console.error('页面访问sheet不存在！');
    return;
  }
  
  const rowData = [
    getTimeString(),              // 时间
    data.page || '',              // 访问页面
    data.userAgent || '',         // 用户属性
    data.userIP || 'Unknown',     // IP地址
    data.chapterCount || 0,       // 累计章节
    data.adCount || 0,            // 累计广告数
    data.failedAdCount || 0       // 累计失败广告数
  ];
  
  visitSheet.appendRow(rowData);
  
  // 5%概率更新当日统计
  if (Math.random() < 0.05) {
    updateDailySummary(dailySpreadsheet);
  }
}

/**
 * 处理广告引导事件
 */
function handleAdGuideEvent(dailySpreadsheet, data) {
  const adGuideSheet = dailySpreadsheet.getSheetByName('广告引导');
  
  if (!adGuideSheet) {
    console.error('广告引导sheet不存在！');
    return;
  }
  
  const rowData = [
    getTimeString(),
    data.page || '',
    data.userAgent || '',
    data.userIP || 'Unknown',
    data.totalAdsSeen || 0,
    data.totalFailedAds || 0,
    data.currentPageAds || 0,
    data.triggerCount || 0,
    data.maxTriggers || 3,
    data.timestamp || ''
  ];
  
  adGuideSheet.appendRow(rowData);
}

// ==================== 统计更新函数 ====================

/**
 * 更新每日表格的统计概览
 */
function updateDailySummary(dailySpreadsheet) {
  try {
    const summarySheet = dailySpreadsheet.getSheetByName('📊当日统计');
    if (!summarySheet) return;
    
    // 统计页面访问
    const visitSheet = dailySpreadsheet.getSheetByName('页面访问');
    const visitCount = visitSheet ? Math.max(0, visitSheet.getDataRange().getNumRows() - 1) : 0;
    
    // 统计广告引导
    const adGuideSheet = dailySpreadsheet.getSheetByName('广告引导');
    const adGuideCount = adGuideSheet ? Math.max(0, adGuideSheet.getDataRange().getNumRows() - 1) : 0;
    
    // 统计广告点击
    const adClickSheet = dailySpreadsheet.getSheetByName('广告点击');
    const adClickCount = adClickSheet ? Math.max(0, adClickSheet.getDataRange().getNumRows() - 1) : 0;
    
    // 统计独立IP
    let uniqueIPs = 0;
    if (visitSheet && visitCount > 0) {
      const ipData = visitSheet.getRange(2, 4, visitCount, 1).getValues();
      const ipSet = new Set();
      ipData.forEach(row => {
        const ip = row[0];
        if (ip && ip !== 'Unknown' && ip !== 'Error') {
          ipSet.add(ip);
        }
      });
      uniqueIPs = ipSet.size;
    }
    
    // 更新数据
    summarySheet.getRange(3, 2).setValue(visitCount);
    summarySheet.getRange(4, 2).setValue(adGuideCount);
    summarySheet.getRange(5, 2).setValue(adClickCount);
    summarySheet.getRange(6, 2).setValue(uniqueIPs);
    summarySheet.getRange(7, 2).setValue(getTimeString());
  } catch (error) {
    console.error('更新每日统计失败:', error);
  }
}

/**
 * 更新主控制台（汇总所有表格的统计）
 */
function updateMainDashboard() {
  try {
    const mainSpreadsheet = SpreadsheetApp.openById(MAIN_SPREADSHEET_ID);
    
    let dashboardSheet = mainSpreadsheet.getSheetByName('📊总控制台');
    if (!dashboardSheet) {
      dashboardSheet = mainSpreadsheet.insertSheet('📊总控制台', 0);
      initializeMainDashboard(dashboardSheet);
    }
    
    // 获取索引sheet
    const indexSheet = mainSpreadsheet.getSheetByName('📑表格索引');
    if (!indexSheet) return;
    
    // 统计所有表格
    const indexData = indexSheet.getDataRange().getValues();
    let totalVisits = 0;
    let totalAdGuides = 0;
    let activeDays = 0;
    let todayVisits = 0;
    
    const today = getDateString();
    
    for (let i = 1; i < indexData.length; i++) {
      const dateString = indexData[i][0];
      const spreadsheetId = indexData[i][1];
      
      if (!spreadsheetId) continue;
      
      try {
        const dailySpreadsheet = SpreadsheetApp.openById(spreadsheetId);
        const visitSheet = dailySpreadsheet.getSheetByName('页面访问');
        const adGuideSheet = dailySpreadsheet.getSheetByName('广告引导');
        
        if (visitSheet) {
          const visitCount = Math.max(0, visitSheet.getDataRange().getNumRows() - 1);
          totalVisits += visitCount;
          
          if (visitCount > 0) activeDays++;
          if (dateString === today) todayVisits = visitCount;
        }
        
        if (adGuideSheet) {
          totalAdGuides += Math.max(0, adGuideSheet.getDataRange().getNumRows() - 1);
        }
      } catch (e) {
        console.log(`无法打开表格 ${spreadsheetId}`);
      }
    }
    
    // 更新控制台数据
    dashboardSheet.getRange(3, 2).setValue(todayVisits);
    dashboardSheet.getRange(4, 2).setValue(totalVisits);
    dashboardSheet.getRange(5, 2).setValue(totalAdGuides);
    dashboardSheet.getRange(6, 2).setValue(activeDays);
    dashboardSheet.getRange(7, 2).setValue(activeDays > 0 ? Math.round(totalVisits / activeDays) : 0);
    
    const updateTime = getTimeString();
    dashboardSheet.getRange(3, 3).setValue(updateTime);
    dashboardSheet.getRange(4, 3).setValue(updateTime);
  } catch (error) {
    console.error('更新主控制台失败:', error);
  }
}

/**
 * 初始化主控制台
 */
function initializeMainDashboard(sheet) {
  sheet.getRange(1, 1, 1, 4).merge();
  sheet.getRange(1, 1).setValue('📊 网站访问统计总控制台');
  sheet.getRange(1, 1).setBackground('#1a73e8').setFontColor('white').setFontSize(14).setFontWeight('bold');
  
  const headers = [
    ['统计项目', '数值', '最后更新', '说明'],
    ['今日访问量', 0, '', '今天的访问次数'],
    ['总访问量', 0, '', '所有记录的总访问量'],
    ['总广告引导', 0, '', '所有广告引导触发次数'],
    ['活跃天数', 0, '', '有访问记录的天数'],
    ['平均日访问', 0, '', '每日平均访问量']
  ];
  
  sheet.getRange(2, 1, headers.length, 4).setValues(headers);
  sheet.getRange(2, 1, 1, 4).setBackground('#4285f4').setFontColor('white').setFontWeight('bold');
  
  sheet.setColumnWidth(1, 150);
  sheet.setColumnWidth(2, 100);
  sheet.setColumnWidth(3, 180);
  sheet.setColumnWidth(4, 250);
}

// ==================== 工具函数 ====================

function getDateString() {
  return new Date().toLocaleDateString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-');
}

function getTimeString() {
  return new Date().toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

// ==================== 测试和手动触发函数 ====================

function testCreateDailySpreadsheet() {
  const dateString = getDateString();
  const spreadsheet = getOrCreateDailySpreadsheet(dateString);
  return '测试成功！表格URL: ' + spreadsheet.getUrl();
}

function manualUpdateDashboard() {
  updateMainDashboard();
  return '主控制台更新完成';
}

/**
 * 定期清理索引中的重复记录（按表格ID去重，每个表格ID只保留第一条）
 * 自动运行：0.5%概率（平均每200次请求清理一次）
 */
function cleanupDuplicateIndexRecords() {
  try {
    const mainSpreadsheet = SpreadsheetApp.openById(MAIN_SPREADSHEET_ID);
    const indexSheet = mainSpreadsheet.getSheetByName('📑表格索引');
    
    if (!indexSheet) {
      console.log('找不到索引表');
      return '找不到索引表';
    }
    
    const data = indexSheet.getDataRange().getValues();
    const seen = new Map(); // 表格ID -> 第一次出现的行号
    const rowsToDelete = [];
    
    // 从第1行开始检查（兼容有无表头的情况）
    for (let i = 0; i < data.length; i++) {
      const dateString = data[i][0];
      const spreadsheetId = data[i][1]; // 第2列是表格ID
      
      // 跳过表头行（包含"日期"或"表格ID"文字的）
      if (dateString === '日期' || dateString === 'Date' || spreadsheetId === '表格ID') {
        continue;
      }
      
      // 跳过空行
      if (!spreadsheetId) {
        rowsToDelete.push(i + 1);
        continue;
      }
      
      if (seen.has(spreadsheetId)) {
        // 已经有这个表格ID了，标记删除
        rowsToDelete.push(i + 1);
        console.log(`发现重复表格ID: ${spreadsheetId} (日期:${dateString}, 行${i + 1})`);
      } else {
        // 第一次见到这个表格ID，保留
        seen.set(spreadsheetId, i + 1);
      }
    }
    
    // 从后往前删除（避免行号变化）
    rowsToDelete.reverse();
    let deletedCount = 0;
    for (const row of rowsToDelete) {
      try {
        indexSheet.deleteRow(row);
        deletedCount++;
      } catch (e) {
        console.error(`删除行${row}失败:`, e);
      }
    }
    
    const message = `清理完成！删除了 ${deletedCount} 条重复索引（按表格ID去重），保留了 ${seen.size} 条唯一表格`;
    console.log(message);
    return message;
    
  } catch (error) {
    console.error('清理索引失败:', error);
    return '清理失败: ' + error.toString();
  }
}

/**
 * 手动立即清理重复索引（处理大量重复时使用）
 */
function manualCleanupDuplicates() {
  return cleanupDuplicateIndexRecords();
}

function testPageVisit() {
  const testData = {
    eventType: 'page_visit',
    page: 'https://novel.goodluckark.com/novels/test/chapter-1',
    userAgent: 'Mozilla/5.0 (iPhone; Test)',
    referrer: 'https://novel.goodluckark.com/novels/test/index',
    userIP: '127.0.0.1'
  };
  
  const dateString = getDateString();
  const dailySpreadsheet = getOrCreateDailySpreadsheet(dateString);
  handlePageVisitEvent(dailySpreadsheet, testData);
  
  return '测试数据已写入: ' + dailySpreadsheet.getUrl();
}

function testAdGuide() {
  const testData = {
    eventType: 'ad_guide_triggered',
    page: 'https://novel.goodluckark.com/novels/test/chapter-1',
    userAgent: 'Mozilla/5.0 (iPhone; Test)',
    referrer: 'https://novel.goodluckark.com/novels/test/index',
    userIP: '127.0.0.1',
    totalAdsSeen: 15,
    currentPageAds: 3,
    triggerCount: 2,
    maxTriggers: 3,
    timestamp: new Date().toISOString()
  };
  
  const dateString = getDateString();
  const dailySpreadsheet = getOrCreateDailySpreadsheet(dateString);
  handleAdGuideEvent(dailySpreadsheet, testData);
  
  return '测试数据已写入: ' + dailySpreadsheet.getUrl();
}

// ==================== 广告点击监控函数 ====================

/**
 * 处理广告点击事件
 */
function handleAdClickEvent(dailySpreadsheet, data) {
  // 确保广告点击工作表存在
  let adClickSheet = dailySpreadsheet.getSheetByName('广告点击');
  
  if (!adClickSheet) {
    console.log('广告点击工作表不存在，正在创建...');
    adClickSheet = addAdClickSheetToExisting(dailySpreadsheet);
  }
  
  // 解析设备信息
  const deviceType = getDeviceType(data.userAgent);
  
  const rowData = [
    getTimeString(),                    // 时间
    data.novel || '',                   // 小说标题
    data.chapter || '',                 // 章节号
    data.pageUrl || '',                 // 页面URL
    data.adSlot || '',                  // 广告位ID
    data.adPosition || '',              // 广告位置(px)
    data.scrollDepth || '',             // 滚动深度
    data.userIP || 'Unknown',           // IP地址
    deviceType,                         // 设备类型
    data.screenSize || '',              // 屏幕尺寸
    data.stayDuration || 0,             // 停留时长(秒)
    data.totalClickCount || 0,          // 历史累计点击次数
    data.clickSource || 'normal'        // 点击来源
  ];
  
  adClickSheet.appendRow(rowData);
  
  // 5%概率更新当日统计
  if (Math.random() < 0.05) {
    updateDailySummary(dailySpreadsheet);
  }
}

/**
 * 为现有的每日表格添加"广告点击"工作表（如果不存在）
 */
function addAdClickSheetToExisting(spreadsheet) {
  let adClickSheet = spreadsheet.getSheetByName('广告点击');
  
  if (adClickSheet) {
    console.log('广告点击工作表已存在');
    return adClickSheet;
  }
  
  // 创建新的广告点击工作表
  adClickSheet = spreadsheet.insertSheet('广告点击');
  adClickSheet.getRange(1, 1, 1, 13).setValues([
    ['时间', '小说标题', '章节号', '页面URL', '广告位ID', '广告位置(px)', '滚动深度', '用户IP', '设备类型', '屏幕尺寸', '停留时长(秒)', '历史累计点击', '点击来源']
  ]);
  
  const adClickHeader = adClickSheet.getRange(1, 1, 1, 13);
  adClickHeader.setBackground('#34A853').setFontColor('white').setFontWeight('bold');
  
  adClickSheet.setColumnWidth(1, 150);   // 时间
  adClickSheet.setColumnWidth(2, 200);   // 小说标题
  adClickSheet.setColumnWidth(3, 80);    // 章节号
  adClickSheet.setColumnWidth(4, 300);   // 页面URL
  adClickSheet.setColumnWidth(5, 120);   // 广告位ID
  adClickSheet.setColumnWidth(6, 100);   // 广告位置
  adClickSheet.setColumnWidth(7, 100);   // 滚动深度
  adClickSheet.setColumnWidth(8, 120);   // IP地址
  adClickSheet.setColumnWidth(9, 100);   // 设备类型
  adClickSheet.setColumnWidth(10, 120);  // 屏幕尺寸
  adClickSheet.setColumnWidth(11, 100);  // 停留时长
  adClickSheet.setColumnWidth(12, 120);  // 历史累计点击
  adClickSheet.setColumnWidth(13, 120);  // 点击来源
  
  console.log('成功创建广告点击工作表');
  return adClickSheet;
}

/**
 * 获取设备类型
 */
function getDeviceType(userAgent) {
  if (!userAgent) return 'Unknown';
  
  if (/mobile/i.test(userAgent)) {
    if (/iphone/i.test(userAgent)) return 'iPhone';
    if (/android/i.test(userAgent)) return 'Android';
    return 'Mobile';
  }
  if (/tablet|ipad/i.test(userAgent)) return 'Tablet';
  return 'Desktop';
}

/**
 * 测试广告点击事件
 */
function testAdClick() {
  const testData = {
    eventType: 'ad_click',
    novel: 'Test Novel',
    chapter: '1',
    pageUrl: 'https://novel.goodluckark.com/novels/test/chapter-1',
    adSlot: 'div-gpt-ad-1762511964282-0',
    adPosition: '850',
    scrollDepth: '500',
    userIP: '127.0.0.1',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
    screenSize: '390x844',
    stayDuration: 45,
    totalClickCount: 5,
    clickSource: 'return_50s',
    timestamp: new Date().toISOString()
  };
  
  const dateString = getDateString();
  const dailySpreadsheet = getOrCreateDailySpreadsheet(dateString);
  
  // 确保广告点击工作表存在
  addAdClickSheetToExisting(dailySpreadsheet);
  
  handleAdClickEvent(dailySpreadsheet, testData);
  
  return '测试广告点击数据已写入: ' + dailySpreadsheet.getUrl();
}
