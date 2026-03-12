## 获取您的 Google Apps Script URL

您的 Google Sheets 链接: https://docs.google.com/spreadsheets/d/1kEvOkFHVQ92HK0y7I1-8qEjfzYrwt0DFQWEiVNTqXS4/edit?gid=0#gid=0

请按照以下步骤获取您的 Google Apps Script URL：

### 第1步：创建 Google Apps Script
1. 访问 https://script.google.com/
2. 点击"新建项目"
3. 删除默认代码，复制以下代码：

```javascript
function doPost(e) {
  try {
    // 获取电子表格
    const spreadsheetId = '1kEvOkFHVQ92HK0y7I1-8qEjfzYrwt0DFQWEiVNTqXS4'; // 您的表格ID
    const sheet = SpreadsheetApp.openById(spreadsheetId).getActiveSheet();
    
    // 解析请求数据
    const data = JSON.parse(e.postData.contents);
    
    // 北京时间处理
    const beijingTime = new Date(new Date().getTime() + 8 * 60 * 60 * 1000);
    const timeString = beijingTime.toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    // 准备要插入的数据
    const rowData = [
      timeString,                    // 时间 (北京时间)
      data.page || '',              // 访问页面
      data.userAgent || '',         // 用户属性 (浏览器信息)
      data.referrer || ''           // 来源页面
    ];
    
    // 插入数据到表格
    sheet.appendRow(rowData);
    
    return ContentService
      .createTextOutput(JSON.stringify({status: 'success'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error:', error);
    return ContentService
      .createTextOutput(JSON.stringify({status: 'error', message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return doPost(e);
}
```

### 第2步：部署为 Web 应用
1. 点击"部署" > "新部署"
2. 类型选择"Web 应用"
3. 执行身份：选择您的账户
4. 访问权限：选择"任何人"
5. 点击"部署"
6. 复制生成的 URL

### 第3步：设置表格权限
1. 打开您的 Google Sheets
2. 点击"共享"
3. 将权限设置为"任何知道此链接的用户都可修改"

### 第4步：在表格中添加标题行
请在您的 Google Sheets 第一行添加以下标题：
- A1: 时间
- B1: 访问页面  
- C1: 用户属性
- D1: 来源页面

### 您的 Google Apps Script URL 示例格式：
```
https://script.google.com/macros/s/YOUR_ACTUAL_SCRIPT_ID/exec
```

获得实际 URL 后，运行以下命令：
```bash
./setup-analytics.sh "https://script.google.com/macros/s/YOUR_ACTUAL_SCRIPT_ID/exec"
```