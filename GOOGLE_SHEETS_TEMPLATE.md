# Google Sheets 表格设置模板

## 表头设置（第一行）
A1: 时间
B1: 访问页面  
C1: 用户属性
D1: 来源页面

## 示例数据行
| 时间 | 访问页面 | 用户属性 | 来源页面 |
|------|----------|----------|----------|
| 2025/10/11 14:30:25 | https://test.ststorys.com/novels/my-rejected-mate-regrets/chapter-1.html | Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 | https://test.ststorys.com/novels/my-rejected-mate-regrets/ |
| 2025/10/11 14:32:15 | https://test.ststorys.com/novels/my-rejected-mate-regrets/chapter-2.html | Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 | https://test.ststorys.com/novels/my-rejected-mate-regrets/chapter-1.html |

## 有用的公式

### 统计今天的访问量
```
=COUNTIF(A:A,">"&TODAY())
```

### 统计特定小说的总访问量
```
=COUNTIF(B:B,"*my-rejected-mate-regrets*")
```

### 统计移动端访问量
```
=COUNTIF(C:C,"*Mobile*")+COUNTIF(C:C,"*iPhone*")+COUNTIF(C:C,"*Android*")
```

### 按小时统计访问量
```
=COUNTIFS(A:A,">="&TODAY()&" 14:00:00",A:A,"<"&TODAY()&" 15:00:00")
```