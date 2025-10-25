
    // Google Apps Script 代码 - 网站访问统计系统
// Spreadsheet ID: 1_aTtHxX7LmHTcY9BB5qECc4L8OSWHxNoDaqDuyda_xY
// V8 部署 (2025年10月25日)
// 部署ID: AKfycbzdW57X6q48loXoU0bwVxdW_uNwSJltA_ybYMvGqyERPWifnTAisWsctXXsbV42-ZXX
// URL: https://script.google.com/macros/s/AKfycbzdW57X6q48loXoU0bwVxdW_uNwSJltA_ybYMvGqyERPWifnTAisWsctXXsbV42-ZXX/exec

function doPost(e) {
  try {
    console.log('=== doPost 接收到请求 ===');
    console.log('Request content:', e.postData.contents);
    
    const spreadsheet = SpreadsheetApp.openById('1_aTtHxX7LmHTcY9BB5qECc4L8OSWHxNoDaqDuyda_xY');
    const data = JSON.parse(e.postData.contents);
    const eventType = data.eventType || 'page_visit';
    
    console.log('事件类型:', eventType);
    console.log('数据内容:', JSON.stringify(data));
    
    if (eventType === 'ad_guide_triggered') {
      console.log('>>> 处理广告引导事件');
      handleAdGuideEvent(spreadsheet, data);
    } else {
      console.log('>>> 处理页面访问事件');
      handlePageVisitEvent(spreadsheet, data);
    }
    
    console.log('=== 处理完成 ===');
    return ContentService.createTextOutput(JSON.stringify({status: 'success'})).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Error stack:', error.stack);
    return ContentService.createTextOutput(JSON.stringify({status: 'error', message: error.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput('Analytics endpoint is working!').setMimeType(ContentService.MimeType.TEXT);
}


// ==================== 广告引导事件处理 ====================

function handleAdGuideEvent(spreadsheet, data) {
  console.log('>>> handleAdGuideEvent 开始执行');
  console.log('接收到的数据:', JSON.stringify(data));
  
  const dateString = getDateString();
  console.log('日期字符串:', dateString);
  
  const adGuideSheet = getOrCreateAdGuideSheet(spreadsheet, dateString);
  console.log('Sheet 名称:', adGuideSheet.getName());
  
  const rowData = [
    getTimeString(),                        // 时间
    data.page || '',                        // 访问页面
    data.userAgent || '',                   // 用户属性
    data.userIP || 'Unknown',               // IP地址
    data.totalAdsSeen || 0,                 // 累计广告数
    data.currentPageAds || 0,               // 当前页广告数
    data.triggerCount || 0,                 // 触发次数
    data.maxTriggersBeforeLongCooldown || 0, // 最大触发次数
    data.longCooldownHours || 0,            // 长冷却小时数
    data.isInLongCooldown ? '是' : '否',    // 是否在长冷却期
    data.timestamp || ''                    // 事件时间戳
  ];
  
  console.log('准备插入的数据:', JSON.stringify(rowData));
  adGuideSheet.appendRow(rowData);
  console.log('✅ 广告引导事件已记录到表格');
}

function getOrCreateAdGuideSheet(spreadsheet, dateString) {
  const sheetName = `广告引导-${dateString}`;
  console.log('尝试获取/创建 Sheet:', sheetName);
  
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    console.log('Sheet 不存在，开始创建新 Sheet');
    sheet = spreadsheet.insertSheet(sheetName);
    
    sheet.getRange(1, 1, 1, 11).setValues([
      ['时间', '访问页面', '用户属性', 'IP地址', '累计广告数', '当前页广告数', '触发次数', '最大触发次数', '长冷却小时数', '是否长冷却', '事件时间戳']
    ]);
    
    const headerRange = sheet.getRange(1, 1, 1, 11);
    headerRange.setBackground('#FF6B6B').setFontColor('white').setFontWeight('bold');
    
    sheet.setColumnWidth(1, 150);   // 时间
    sheet.setColumnWidth(2, 300);   // 访问页面
    sheet.setColumnWidth(3, 200);   // 用户属性
    sheet.setColumnWidth(4, 120);   // IP地址
    sheet.setColumnWidth(5, 100);   // 累计广告数
    sheet.setColumnWidth(6, 120);   // 当前页广告数
    sheet.setColumnWidth(7, 100);   // 触发次数
    sheet.setColumnWidth(8, 120);   // 最大触发次数
    sheet.setColumnWidth(9, 120);   // 长冷却小时数
    sheet.setColumnWidth(10, 100);  // 是否长冷却
    sheet.setColumnWidth(11, 180);  // 事件时间戳
    
    console.log('✅ 新 Sheet 创建完成');
  } else {
    console.log('Sheet 已存在，使用现有 Sheet');
  }
  
  return sheet;
}

// ==================== 页面访问事件处理 ====================

function handlePageVisitEvent(spreadsheet, data) {
  const dateString = getDateString();
  const todaySheet = getOrCreateDailySheet(spreadsheet, dateString);
  
  const rowData = [
    getTimeString(),              // 时间
    data.page || '',              // 访问页面
    data.userAgent || '',         // 用户属性
    data.userIP || 'Unknown'      // IP地址
  ];
  
  todaySheet.appendRow(rowData);
  
  // 1%概率执行统计更新
  if (Math.random() < 0.01) {
    updateDashboard(spreadsheet, dateString);
    cleanupOldSheets(spreadsheet);
    updateStatisticsTable(spreadsheet);
  }
}

function getOrCreateDailySheet(spreadsheet, dateString) {
  const sheetName = `详细-${dateString}`;
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    sheet.getRange(1, 1, 1, 4).setValues([
      ['时间', '访问页面', '用户属性', 'IP地址']
    ]);
    
    const headerRange = sheet.getRange(1, 1, 1, 4);
    headerRange.setBackground('#4285f4').setFontColor('white').setFontWeight('bold');
  }
  
  return sheet;
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

// ==================== 控制台统计 ====================

function updateDashboard(spreadsheet, currentDate) {
  try {
    let dashboardSheet = spreadsheet.getSheetByName('📊控制台');
    if (!dashboardSheet) {
      dashboardSheet = spreadsheet.insertSheet('📊控制台', 0);
      initializeDashboard(dashboardSheet);
    }
    
    const todaySheet = spreadsheet.getSheetByName(`详细-${currentDate}`);
    if (todaySheet) {
      const rowCount = Math.max(0, todaySheet.getDataRange().getNumRows() - 1);
      dashboardSheet.getRange(2, 2).setValue(rowCount);
      dashboardSheet.getRange(2, 3).setValue(new Date());
    }
    
    updateTotalStats(spreadsheet, dashboardSheet);
  } catch (error) {
    console.error('更新控制台失败:', error);
  }
}

function initializeDashboard(sheet) {
  sheet.getRange(1, 1, 1, 5).merge();
  sheet.getRange(1, 1).setValue('📊 网站访问统计控制台');
  
  const headers = [
    ['统计项目', '数值', '最后更新', '说明', ''],
    ['今日访问量', 0, '', '当天的访问次数', ''],
    ['总访问量', 0, '', '所有详细记录的总数', ''],
    ['活跃天数', 0, '', '有访问记录的天数', ''],
    ['平均日访问', 0, '', '每日平均访问量', '']
  ];
  
  sheet.getRange(2, 1, headers.length, 5).setValues(headers);
  sheet.getRange(1, 1).setBackground('#1a73e8').setFontColor('white').setFontSize(14).setFontWeight('bold');
  sheet.getRange(2, 1, 1, 5).setBackground('#4285f4').setFontColor('white').setFontWeight('bold');
}

function updateTotalStats(spreadsheet, dashboardSheet) {
  const sheets = spreadsheet.getSheets();
  let totalVisits = 0;
  let activeDays = 0;
  
  sheets.forEach(sheet => {
    const sheetName = sheet.getName();
    if (sheetName.startsWith('详细-')) {
      const rowCount = Math.max(0, sheet.getDataRange().getNumRows() - 1);
      totalVisits += rowCount;
      if (rowCount > 0) activeDays++;
    }
  });
  
  dashboardSheet.getRange(3, 2).setValue(totalVisits);
  dashboardSheet.getRange(4, 2).setValue(activeDays);
  dashboardSheet.getRange(5, 2).setValue(activeDays > 0 ? Math.round(totalVisits / activeDays) : 0);
  
  const updateTime = new Date();
  dashboardSheet.getRange(3, 3).setValue(updateTime);
  dashboardSheet.getRange(4, 3).setValue(updateTime);
  dashboardSheet.getRange(5, 3).setValue(updateTime);
}

// ==================== 数据清理 ====================

function cleanupOldSheets(spreadsheet) {
  try {
    const sheets = spreadsheet.getSheets();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 3); // 改为3天
    
    sheets.forEach(sheet => {
      const sheetName = sheet.getName();
      if (sheetName.startsWith('详细-')) {
        const dateStr = sheetName.replace('详细-', '');
        const sheetDate = new Date(dateStr);
        
        if (sheetDate < cutoffDate) {
          console.log(`删除过期数据表: ${sheetName}`);
          spreadsheet.deleteSheet(sheet);
        }
      }
    });
  } catch (error) {
    console.error('清理旧数据失败:', error);
  }
}

function manualCleanup() {
  const spreadsheet = SpreadsheetApp.openById('1_aTtHxX7LmHTcY9BB5qECc4L8OSWHxNoDaqDuyda_xY');
  cleanupOldSheets(spreadsheet);
  updateDashboard(spreadsheet, getDateString());
  return '数据清理完成';
}

// ==================== 统计汇总表 ====================

function updateStatisticsTable(spreadsheet) {
  try {
    let statsSheet = spreadsheet.getSheetByName('📈统计汇总表');
    if (!statsSheet) {
      statsSheet = spreadsheet.insertSheet('📈统计汇总表', 1);
      initializeStatisticsTable(statsSheet);
    }
    
    const today = new Date().toLocaleDateString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      month: 'numeric',
      day: 'numeric'
    });
    const todayLabel = `${today.split('/')[0]}月${today.split('/')[1]}日`;
    const todayStats = generateDailyStatistics(spreadsheet, todayLabel);
    
    updateStatsInTable(statsSheet, todayStats, todayLabel);
  } catch (error) {
    console.error('更新统计汇总表失败:', error);
  }
}

function initializeStatisticsTable(sheet) {
  sheet.getRange(1, 1, 1, 5).merge();
  sheet.getRange(1, 1).setValue('📈 网站访问统计汇总表');
  
  sheet.getRange(2, 1, 1, 5).setValues([
    ['时间', '域名来源', '书籍名称', '累计章节', '累计IP数量（去重）']
  ]);
  
  sheet.getRange(1, 1).setBackground('#1a73e8').setFontColor('white').setFontSize(14).setFontWeight('bold');
  sheet.getRange(2, 1, 1, 5).setBackground('#4285f4').setFontColor('white').setFontWeight('bold');
  
  sheet.setColumnWidth(1, 100);
  sheet.setColumnWidth(2, 200);
  sheet.setColumnWidth(3, 300);
  sheet.setColumnWidth(4, 150);
  sheet.setColumnWidth(5, 120);
}

function generateDailyStatistics(spreadsheet, dateLabel) {
  const todaySheetName = `详细-${getDateString()}`;
  const todaySheet = spreadsheet.getSheetByName(todaySheetName);
  
  if (!todaySheet) {
    console.log('未找到今日数据表:', todaySheetName);
    return [];
  }
  
  const stats = {};
  const values = todaySheet.getDataRange().getValues();
  
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const pageUrl = row[1] || '';
    const userIP = row[4] || '';
    
    if (!pageUrl || !userIP) continue;
    
    const urlInfo = parsePageUrl(pageUrl);
    if (!urlInfo) continue;
    
    const { domain, bookName, isChapter } = urlInfo;
    const key = `${domain}|${bookName}`;
    
    if (!stats[key]) {
      stats[key] = {
        domain: domain,
        bookName: bookName,
        chapterCount: 0,
        ipSet: new Set()
      };
    }
    
    if (isChapter) {
      stats[key].chapterCount++;
    }
    
    if (userIP && userIP !== 'Unknown' && userIP !== 'Error') {
      stats[key].ipSet.add(userIP);
    }
  }
  
  const result = [];
  for (const key in stats) {
    const stat = stats[key];
    result.push([
      dateLabel,
      stat.domain,
      stat.bookName,
      stat.chapterCount,
      stat.ipSet.size
    ]);
  }
  
  return result;
}

function parsePageUrl(url) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    const path = urlObj.pathname;
    
    const novelMatch = path.match(/\/novels\/([^\/]+)/);
    if (!novelMatch) return null;
    
    const bookName = novelMatch[1];
    const isChapter = path.includes('/chapter-');
    
    return { domain, bookName, isChapter };
  } catch (error) {
    console.error('URL解析失败:', url, error);
    return null;
  }
}

function updateStatsInTable(sheet, newStats, dateLabel) {
  if (!newStats || newStats.length === 0) {
    console.log('没有新的统计数据需要更新');
    return;
  }
  
  const dataRange = sheet.getDataRange();
  const existingData = dataRange.getNumRows() > 2 ? dataRange.getValues().slice(2) : [];
  const nonTodayData = existingData.filter(row => row[0] !== dateLabel);
  const allData = [...nonTodayData, ...newStats];
  
  if (dataRange.getNumRows() > 2) {
    sheet.getRange(3, 1, dataRange.getNumRows() - 2, 5).clear();
  }
  
  if (allData.length > 0) {
    sheet.getRange(3, 1, allData.length, 5).setValues(allData);
  }
  
  const lastRow = sheet.getLastRow() + 2;
  sheet.getRange(lastRow, 1, 1, 5).merge();
  sheet.getRange(lastRow, 1).setValue(`最后更新时间: ${getTimeString()}`);
  sheet.getRange(lastRow, 1).setFontStyle('italic').setFontColor('#666666');
  
  console.log(`统计表更新完成，共 ${allData.length} 条记录`);
}

function hourlyStatisticsUpdate() {
  const spreadsheet = SpreadsheetApp.openById('1_aTtHxX7LmHTcY9BB5qECc4L8OSWHxNoDaqDuyda_xY');
  updateStatisticsTable(spreadsheet);
  return '每小时统计更新完成';
}

function manualStatisticsUpdate() {
  const spreadsheet = SpreadsheetApp.openById('1_aTtHxX7LmHTcY9BB5qECc4L8OSWHxNoDaqDuyda_xY');
  updateStatisticsTable(spreadsheet);
  return '手动统计更新完成';
}

// ==================== 测试函数 ====================

function testAdGuideEvent() {
  console.log('=== 开始测试广告引导事件 ===');
  
  const spreadsheet = SpreadsheetApp.openById('1_aTtHxX7LmHTcY9BB5qECc4L8OSWHxNoDaqDuyda_xY');
  
  const testData = {
    eventType: 'ad_guide_triggered',
    page: 'https://re.cankalp.com/novels/test/chapter-1',
    userAgent: 'Mozilla/5.0 (iPhone; Test)',
    referrer: 'https://re.cankalp.com/novels/test/index',
    userIP: '127.0.0.1',
    totalAdsSeen: 15,
    currentPageAds: 3,
    triggerCount: 5,
    maxTriggersBeforeLongCooldown: 8,
    longCooldownHours: 12,
    isInLongCooldown: false,
    timestamp: new Date().toISOString()
  };
  
  console.log('测试数据:', JSON.stringify(testData));
  
  try {
    handleAdGuideEvent(spreadsheet, testData);
    console.log('✅ 测试成功！');
    return '测试成功 - 请检查 Google Sheets 中的"广告引导-' + getDateString() + '"表格';
  } catch (error) {
    console.error('❌ 测试失败:', error);
    return '测试失败: ' + error.toString();
  }
}

// ==================== 每日邮件报告 ====================

/**
 * 每天北京时间01:00发送统计报告邮件
 * 需要在Apps Script触发器中设置: 
 * - 选择函数: sendDailyEmailReport
 * - 部署方式: Head
 * - 选择事件来源: 时间驱动
 * - 选择时间类型: 天定时器
 * - 选择时间: 凌晨1点至2点
 */
function sendDailyEmailReport() {
  try {
    console.log('=== 开始生成每日邮件报告 ===');
    
    const spreadsheet = SpreadsheetApp.openById('1_aTtHxX7LmHTcY9BB5qECc4L8OSWHxNoDaqDuyda_xY');
    const recipient = 'jannatjahan36487@gmail.com';
    
    // 获取昨天的日期（因为是凌晨1点运行，统计的是昨天的数据）
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateString = yesterday.toLocaleDateString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-');
    
    console.log('统计日期:', dateString);
    
    // 准备邮件内容
    const emailSubject = `网站访问统计报告 - ${dateString}`;
    const emailBody = generateEmailBody(spreadsheet, dateString);
    const excelBlob = generateExcelReport(spreadsheet, dateString);
    
    // 发送邮件
    if (excelBlob) {
      MailApp.sendEmail({
        to: recipient,
        subject: emailSubject,
        body: emailBody,
        attachments: [excelBlob],
        name: 'NovelVibe Analytics'
      });
      console.log('✅ 邮件发送成功:', recipient);
      return '邮件发送成功';
    } else {
      MailApp.sendEmail({
        to: recipient,
        subject: emailSubject,
        body: emailBody + '\n\n注意: 未找到该日期的详细数据',
        name: 'NovelVibe Analytics'
      });
      console.log('⚠️ 邮件发送成功（无附件）:', recipient);
      return '邮件发送成功（无数据附件）';
    }
    
  } catch (error) {
    console.error('❌ 邮件发送失败:', error);
    console.error('Error stack:', error.stack);
    
    // 发送错误通知邮件
    try {
      MailApp.sendEmail({
        to: 'jannatjahan36487@gmail.com',
        subject: '⚠️ 统计报告生成失败',
        body: `生成每日报告时发生错误:\n\n${error.toString()}\n\n${error.stack}`,
        name: 'NovelVibe Analytics'
      });
    } catch (e) {
      console.error('发送错误通知邮件也失败了:', e);
    }
    
    return '邮件发送失败: ' + error.toString();
  }
}

/**
 * 生成邮件正文内容
 */
function generateEmailBody(spreadsheet, dateString) {
  const dashboardSheet = spreadsheet.getSheetByName('📊控制台');
  const statsSheet = spreadsheet.getSheetByName('📈统计汇总表');
  const todaySheet = spreadsheet.getSheetByName(`详细-${dateString}`);
  const adGuideSheet = spreadsheet.getSheetByName(`广告引导-${dateString}`);
  
  let body = `您好，\n\n这是 ${dateString} 的网站访问统计报告。\n\n`;
  body += `========== 📊 总体统计 ==========\n`;
  
  if (dashboardSheet) {
    const dashboardData = dashboardSheet.getRange(2, 1, 4, 2).getValues();
    dashboardData.forEach(row => {
      body += `${row[0]}: ${row[1]}\n`;
    });
  }
  
  body += `\n========== 📈 ${dateString} 详细数据 ==========\n`;
  
  if (todaySheet) {
    const rowCount = Math.max(0, todaySheet.getDataRange().getNumRows() - 1);
    body += `页面访问次数: ${rowCount}\n`;
  } else {
    body += `页面访问次数: 0 (无数据)\n`;
  }
  
  if (adGuideSheet) {
    const adRowCount = Math.max(0, adGuideSheet.getDataRange().getNumRows() - 1);
    body += `广告引导触发次数: ${adRowCount}\n`;
  } else {
    body += `广告引导触发次数: 0 (无数据)\n`;
  }
  
  body += `\n========== 📚 书籍访问统计 ==========\n`;
  
  if (statsSheet) {
    const statsData = statsSheet.getDataRange().getValues();
    const todayStats = statsData.slice(2).filter(row => row[0] && row[0].toString().includes(dateString.split('-')[1] + '月' + dateString.split('-')[2] + '日'));
    
    if (todayStats.length > 0) {
      todayStats.forEach(row => {
        body += `• ${row[2]}: ${row[3]}章节访问, ${row[4]}个独立IP\n`;
      });
    } else {
      body += `暂无书籍访问数据\n`;
    }
  }
  
  body += `\n详细数据请查看附件中的Excel文件。\n\n`;
  body += `---\n`;
  body += `此邮件由 NovelVibe Analytics 系统自动发送\n`;
  body += `发送时间: ${getTimeString()}\n`;
  
  return body;
}

/**
 * 生成Excel格式的报告
 */
function generateExcelReport(spreadsheet, dateString) {
  try {
    console.log('开始生成Excel报告...');
    
    // 方法1: 直接使用原始Spreadsheet的导出URL
    const spreadsheetId = spreadsheet.getId();
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx`;
    
    // 使用UrlFetchApp获取Excel文件
    const response = UrlFetchApp.fetch(url, {
      headers: {
        Authorization: 'Bearer ' + ScriptApp.getOAuthToken()
      }
    });
    
    const blob = response.getBlob();
    blob.setName(`NovelVibe统计报告-${dateString}.xlsx`);
    
    console.log('✅ Excel报告生成成功（完整表格）');
    return blob;
    
  } catch (error) {
    console.error('方法1失败，尝试方法2:', error);
    
    // 方法2: 生成CSV格式（作为备选方案）
    try {
      return generateCSVReport(spreadsheet, dateString);
    } catch (error2) {
      console.error('方法2也失败了:', error2);
      return null;
    }
  }
}

/**
 * 生成CSV格式的报告（备选方案）
 */
function generateCSVReport(spreadsheet, dateString) {
  try {
    console.log('生成CSV格式报告...');
    
    let csvContent = '';
    
    // 添加控制台数据
    csvContent += '========== 📊 控制台 ==========\n';
    const dashboardSheet = spreadsheet.getSheetByName('📊控制台');
    if (dashboardSheet) {
      const data = dashboardSheet.getDataRange().getValues();
      data.forEach(row => {
        csvContent += row.join(',') + '\n';
      });
    }
    csvContent += '\n\n';
    
    // 添加当天访问详细数据
    csvContent += `========== 📈 访问详细-${dateString} ==========\n`;
    const todaySheet = spreadsheet.getSheetByName(`详细-${dateString}`);
    if (todaySheet) {
      const data = todaySheet.getDataRange().getValues();
      data.forEach(row => {
        csvContent += row.join(',') + '\n';
      });
    } else {
      csvContent += '无数据\n';
    }
    csvContent += '\n\n';
    
    // 添加广告引导数据
    csvContent += `========== 🎯 广告引导-${dateString} ==========\n`;
    const adGuideSheet = spreadsheet.getSheetByName(`广告引导-${dateString}`);
    if (adGuideSheet) {
      const data = adGuideSheet.getDataRange().getValues();
      data.forEach(row => {
        csvContent += row.join(',') + '\n';
      });
    } else {
      csvContent += '无数据\n';
    }
    csvContent += '\n\n';
    
    // 添加统计汇总
    csvContent += '========== 📚 统计汇总表 ==========\n';
    const statsSheet = spreadsheet.getSheetByName('📈统计汇总表');
    if (statsSheet) {
      const data = statsSheet.getDataRange().getValues();
      data.forEach(row => {
        csvContent += row.join(',') + '\n';
      });
    }
    
    const blob = Utilities.newBlob(csvContent, 'text/csv', `NovelVibe统计报告-${dateString}.csv`);
    console.log('✅ CSV报告生成成功');
    return blob;
    
  } catch (error) {
    console.error('生成CSV报告失败:', error);
    return null;
  }
}

/**
 * 测试邮件发送功能（立即发送）
 */
function testEmailReport() {
  console.log('=== 开始测试邮件发送 ===');
  
  try {
    const spreadsheet = SpreadsheetApp.openById('1_aTtHxX7LmHTcY9BB5qECc4L8OSWHxNoDaqDuyda_xY');
    const recipient = 'jannatjahan36487@gmail.com';
    
    // 使用今天的日期进行测试
    const dateString = getDateString();
    console.log('测试日期:', dateString);
    
    const emailSubject = `[测试] 网站访问统计报告 - ${dateString}`;
    const emailBody = '这是一封测试邮件。\n\n' + generateEmailBody(spreadsheet, dateString);
    const excelBlob = generateExcelReport(spreadsheet, dateString);
    
    if (excelBlob) {
      MailApp.sendEmail({
        to: recipient,
        subject: emailSubject,
        body: emailBody,
        attachments: [excelBlob],
        name: 'NovelVibe Analytics (Test)'
      });
      const fileType = excelBlob.getName().endsWith('.xlsx') ? 'Excel' : 'CSV';
      console.log(`✅ 测试邮件发送成功（含${fileType}附件）`);
      return `✅ 测试邮件发送成功！\n收件人: ${recipient}\n附件格式: ${fileType}\n请检查邮箱（可能在垃圾邮件中）`;
    } else {
      MailApp.sendEmail({
        to: recipient,
        subject: emailSubject,
        body: emailBody + '\n\n注意: 未找到该日期的数据，无附件',
        name: 'NovelVibe Analytics (Test)'
      });
      console.log('⚠️ 测试邮件发送成功（无附件）');
      return '⚠️ 测试邮件发送成功（无附件）！请检查邮箱: ' + recipient;
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    console.error('Error stack:', error.stack);
    return '❌ 测试失败: ' + error.toString();
  }
}