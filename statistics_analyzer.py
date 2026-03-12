#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
独立统计分析脚本
用于分析访问日志CSV文件，生成统计汇总表

使用方法:
python statistics_analyzer.py <csv文件路径>

示例:
python statistics_analyzer.py "ads-recan - 详细-2025-10-11.csv"
"""

import csv
import sys
import os
from urllib.parse import urlparse
from datetime import datetime
from collections import defaultdict
import argparse

def parse_page_url(url):
    """
    解析页面URL，提取域名和书籍信息
    返回: (域名, 书籍名称, 是否为章节页面)
    """
    try:
        parsed = urlparse(url)
        domain = parsed.netloc
        path = parsed.path
        
        # 提取书籍名称
        if '/novels/' in path:
            # 匹配 /novels/书籍名称/chapter-数字 或 /novels/书籍名称
            parts = path.split('/novels/')
            if len(parts) > 1:
                book_path = parts[1].split('/')[0]
                # 移除URL参数
                book_name = book_path.split('?')[0]
                
                # 判断是否为章节页面
                is_chapter = '/chapter-' in path
                
                return domain, book_name, is_chapter
    except Exception as e:
        print(f"URL解析错误: {url}, 错误: {e}")
        return None, None, False
    
    return None, None, False

def format_book_name(book_name):
    """
    格式化书籍名称，转换为更可读的格式
    """
    if not book_name:
        return "未知书籍"
    
    # 替换连字符为空格，并进行标题化
    formatted = book_name.replace('-', ' ').title()
    
    # 特殊处理一些常见的书名格式
    replacements = {
        'Ceo': 'CEO',
        'Billionaire': 'Billionaire',
        'Heartbreak Billionairehe': 'Heartbreak Billionaire: He'
    }
    
    for old, new in replacements.items():
        formatted = formatted.replace(old, new)
    
    return formatted

def analyze_csv_file(csv_file_path):
    """
    分析CSV文件，生成统计数据
    """
    print(f"正在分析文件: {csv_file_path}")
    
    if not os.path.exists(csv_file_path):
        print(f"错误: 文件不存在 {csv_file_path}")
        return None
    
    # 统计数据结构: {(域名, 书籍名称): {"chapters": set(), "ips": set()}}
    stats = defaultdict(lambda: {"chapters": set(), "ips": set(), "total_visits": 0})
    
    total_rows = 0
    valid_rows = 0
    
    try:
        with open(csv_file_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            
            # 验证CSV列名
            expected_columns = ['时间', '访问页面', '用户属性', '来源页面', 'ip']
            if not all(col in reader.fieldnames for col in expected_columns):
                print(f"错误: CSV文件缺少必要的列。期望: {expected_columns}, 实际: {reader.fieldnames}")
                return None
            
            for row in reader:
                total_rows += 1
                
                page_url = row.get('访问页面', '').strip()
                ip_address = row.get('ip', '').strip()
                
                if not page_url:
                    continue
                
                # 解析URL
                domain, book_name, is_chapter = parse_page_url(page_url)
                
                if domain and book_name:
                    valid_rows += 1
                    key = (domain, book_name)
                    
                    # 统计总访问次数
                    stats[key]["total_visits"] += 1
                    
                    # 如果是章节页面，记录章节
                    if is_chapter:
                        stats[key]["chapters"].add(page_url)
                    
                    # 记录IP地址（去重）
                    if ip_address and ip_address.lower() not in ['', 'unknown', 'error']:
                        stats[key]["ips"].add(ip_address)
    
    except Exception as e:
        print(f"读取CSV文件时出错: {e}")
        return None
    
    print(f"总行数: {total_rows}, 有效行数: {valid_rows}")
    return stats

def generate_statistics_table(stats, date_str):
    """
    生成统计汇总表
    """
    if not stats:
        print("没有数据可以统计")
        return []
    
    result = []
    
    # 按书籍名称排序
    sorted_stats = sorted(stats.items(), key=lambda x: x[0][1])
    
    for (domain, book_name), data in sorted_stats:
        formatted_book_name = format_book_name(book_name)
        chapter_count = len(data["chapters"])
        ip_count = len(data["ips"])
        total_visits = data["total_visits"]
        
        result.append([
            date_str,           # 时间
            domain,             # 域名来源
            formatted_book_name, # 书籍名称
            chapter_count,      # 累计章节（含chapter的url）
            ip_count,           # 累计ip数量（去重）
            total_visits        # 总访问次数（额外信息）
        ])
    
    return result

def save_statistics_to_csv(statistics, output_file):
    """
    保存统计结果到CSV文件
    """
    headers = ['时间', '域名来源（不记录后缀）', '书籍名称', '累计章节（含chapter的url）', '累计ip数量（去重）', '总访问次数']
    
    try:
        with open(output_file, 'w', encoding='utf-8', newline='') as file:
            writer = csv.writer(file)
            writer.writerow(headers)
            writer.writerows(statistics)
        
        print(f"统计结果已保存到: {output_file}")
        return True
    except Exception as e:
        print(f"保存文件时出错: {e}")
        return False

def print_statistics(statistics):
    """
    在控制台打印统计结果
    """
    if not statistics:
        print("没有统计数据")
        return
    
    print("\n" + "="*100)
    print("📊 访问统计汇总表")
    print("="*100)
    
    # 打印表头
    print(f"{'时间':<12} {'域名来源':<25} {'书籍名称':<35} {'章节数':<8} {'IP数量':<8} {'总访问':<8}")
    print("-"*100)
    
    # 打印数据
    total_chapters = 0
    total_ips = 0
    total_visits = 0
    
    for row in statistics:
        date_str, domain, book_name, chapter_count, ip_count, visit_count = row
        print(f"{date_str:<12} {domain:<25} {book_name:<35} {chapter_count:<8} {ip_count:<8} {visit_count:<8}")
        total_chapters += chapter_count
        total_ips += ip_count
        total_visits += visit_count
    
    print("-"*100)
    print(f"{'总计':<72} {total_chapters:<8} {total_ips:<8} {total_visits:<8}")
    print("="*100)

def extract_date_from_filename(filename):
    """
    从文件名中提取日期
    """
    # 匹配文件名中的日期格式：YYYY-MM-DD
    import re
    match = re.search(r'(\d{4}-\d{2}-\d{2})', filename)
    if match:
        date_str = match.group(1)
        try:
            # 转换为中文日期格式
            date_obj = datetime.strptime(date_str, '%Y-%m-%d')
            return f"{date_obj.month}月{date_obj.day}日"
        except:
            return date_str
    
    # 如果没有找到日期，使用当前日期
    return datetime.now().strftime("%m月%d日")

def main():
    """
    主函数
    """
    parser = argparse.ArgumentParser(description='分析访问日志CSV文件生成统计报表')
    parser.add_argument('csv_file', help='CSV文件路径')
    parser.add_argument('-o', '--output', help='输出文件路径（可选）')
    parser.add_argument('-q', '--quiet', action='store_true', help='静默模式，不显示详细输出')
    
    args = parser.parse_args()
    
    csv_file_path = args.csv_file
    
    # 分析CSV文件
    stats = analyze_csv_file(csv_file_path)
    if not stats:
        print("分析失败或没有有效数据")
        return 1
    
    # 提取日期
    date_str = extract_date_from_filename(os.path.basename(csv_file_path))
    
    # 生成统计表
    statistics = generate_statistics_table(stats, date_str)
    
    # 显示结果
    if not args.quiet:
        print_statistics(statistics)
    
    # 保存到文件
    if args.output:
        output_file = args.output
    else:
        # 默认输出文件名
        base_name = os.path.splitext(os.path.basename(csv_file_path))[0]
        output_file = f"统计汇总-{base_name}.csv"
    
    if save_statistics_to_csv(statistics, output_file):
        print(f"\n✅ 统计完成！输出文件: {output_file}")
        return 0
    else:
        print("\n❌ 保存文件失败")
        return 1

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("使用方法:")
        print(f"python {sys.argv[0]} <CSV文件路径> [-o 输出文件路径] [-q]")
        print("\n示例:")
        print(f'python {sys.argv[0]} "ads-recan - 详细-2025-10-11.csv"')
        print(f'python {sys.argv[0]} "ads-recan - 详细-2025-10-11.csv" -o "统计结果.csv"')
        sys.exit(1)
    
    sys.exit(main())