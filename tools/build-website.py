#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Website Builder - 主构建脚本
生成完整的小说网站，包括首页、详情页和阅读页
"""

import os
import sys
import json
import shutil
import argparse
import random
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional
from urllib.parse import quote
import xml.etree.ElementTree as ET

# 添加脚本路径到sys.path
sys.path.append(str(Path(__file__).parent))

from scripts.smart_novel_parser import SmartNovelLibraryManager
from jinja2 import Environment, FileSystemLoader


class WebsiteBuilder:
    """网站构建器"""
    
    def __init__(self, config: Dict):
        self.config = config
        self.base_path = Path(config['base_path'])
        self.source_path = Path(config['source_path'])
        self.output_path = Path(config['output_path'])
        self.templates_path = Path(config['templates_path'])
        
        # 设置Jinja2模板环境
        self.env = Environment(
            loader=FileSystemLoader(str(self.templates_path)),
            autoescape=True
        )
        
        # 小说库管理器
        self.library_manager = SmartNovelLibraryManager(
            str(self.source_path),
            str(self.output_path)
        )
        
        self.site_url = config.get('site_url', 'https://example.github.io')
        
    def scan_novels(self) -> Dict:
            current_time = datetime.now()
            return {
                'created_iso': current_time.isoformat(),
                'modified_iso': current_time.isoformat(),
                'created_readable': current_time.strftime('%Y-%m-%d %H:%M:%S'),
                'modified_readable': current_time.strftime('%Y-%m-%d %H:%M:%S'),
                'created_date': current_time.strftime('%Y-%m-%d'),
                'modified_date': current_time.strftime('%Y-%m-%d')
            }
        
    def build_website(self, force_rebuild: bool = False, novel_filter: Optional[str] = None):
        """构建完整网站"""
        print("开始构建网站...")
        
        # 1. 扫描和解析小说库
        print("\n=== 第1步: 智能扫描小说库 ===")
        scan_result = self.library_manager.smart_scan_and_update()
        
        novels = scan_result['novels']
        changes = scan_result['changes']
            
        if not novels:
            print("没有找到小说数据，退出构建")
            return
            
        # 2. 处理封面图片
        print("\n=== 第2步: 处理封面图片 ===")
        self.process_cover_images(novels)
        
        # 3. 生成页面
        print("\n=== 第3步: 生成HTML页面 ===")
        
        if force_rebuild:
            # 强制重建所有小说
            novels_to_build = novels
            print("🔄 强制重建所有小说")
        elif novel_filter:
            # 只构建匹配的小说
            novels_to_build = {k: v for k, v in novels.items() 
                             if novel_filter.lower() in v['title'].lower()}
            print(f"🎯 构建匹配 '{novel_filter}' 的小说")
        else:
            # 智能增量构建：只构建有变化的小说
            novels_to_build = {}
            
            # 新增的小说
            for novel_id in changes['new']:
                if novel_id in novels:
                    novels_to_build[novel_id] = novels[novel_id]
                    
            # 更新的小说
            for novel_id in changes['updated']:
                if novel_id in novels:
                    novels_to_build[novel_id] = novels[novel_id]
                    
            if novels_to_build:
                print(f"📝 增量构建: {len(novels_to_build)} 本小说有变化")
            else:
                print("✅ 所有小说都是最新的，无需重新构建")
            
        # 生成小说相关页面
        for novel_id, novel_data in novels_to_build.items():
            self.build_novel_pages(novel_data)
            
        # 生成首页（总是重新生成）
        print("\n=== 第4步: 生成首页 ===")
        self.build_homepage(novels)
        
        # 4. 复制静态资源
        print("\n=== 第5步: 复制静态资源 ===")
        self.copy_static_assets()
        
        print(f"\n✅ 网站构建完成!")
        print(f"输出目录: {self.output_path}")
        print(f"总小说数: {len(novels)}")
        print(f"新增: {len(changes['new'])}, 更新: {len(changes['updated'])}, 无变化: {len(changes['unchanged'])}")
        if novels_to_build:
            print(f"本次构建: {len(novels_to_build)} 本小说")
            
    def build_novel_pages(self, novel_data: Dict):
        """构建单本小说的所有页面"""
        novel_slug = novel_data['slug']
        novel_dir = self.output_path / 'novels' / novel_slug
        novel_dir.mkdir(parents=True, exist_ok=True)
        
        print(f"构建小说: {novel_data['title']}")
        
        # 1. 生成小说详情页
        self.build_novel_detail_page(novel_data, novel_dir)
        
        # 2. 生成所有章节页面
        self.build_chapter_pages(novel_data, novel_dir)
        
    def build_novel_detail_page(self, novel_data: Dict, novel_dir: Path):
        """生成小说详情页"""
        template = self.env.get_template('novel.html')
        
        # 准备章节数据
        chapters = []
        for i, chapter in enumerate(novel_data['chapters']):
            # 使用绝对路径而不是相对路径
            chapter_url = f"/novels/{novel_data['slug']}/chapter-{chapter['number']}"
            chapters.append({
                'number': chapter['number'],
                'title': chapter['title'],
                'url': chapter_url,
                'publish_date': chapter.get('publish_date', ''),
                'word_count': chapter.get('word_count', 0)
            })
            
        # 处理封面URL
        cover_url = self.get_cover_url(novel_data)
        
        # 渲染页面
        html_content = template.render(
            novel={
                'title': novel_data['title'],
                'author': novel_data['author'],
                'description': novel_data['description'],
                'short_description': novel_data['short_description'],
                'genres': novel_data['genres'],
                'tags': novel_data['tags'],
                'status': novel_data['status'],
                'rating': novel_data['rating'],
                'total_chapters': novel_data['total_chapters'],
                'cover_url': cover_url,
                'chapters': chapters,
                'url': f"/novels/{novel_data['slug']}/"
            },
            site_url=self.site_url
        )
        
        # 保存文件
        output_file = novel_dir / 'index.html'
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
            
    def build_chapter_pages(self, novel_data: Dict, novel_dir: Path):
        """生成章节页面（包括带广告版本和clean版本）"""
        # 加载两个模板
        template_with_ads = self.env.get_template('chapter.html')
        template_clean = self.env.get_template('chapter-clean.html')
        
        chapters = novel_data['chapters']
        
        for i, chapter in enumerate(chapters):
            # 准备导航数据
            prev_chapter = None
            next_chapter = None
            
            if i > 0:
                prev_chapter = {
                    'number': chapters[i-1]['number'],
                    'title': chapters[i-1]['title'],
                    'url': f"/novels/{novel_data['slug']}/chapter-{chapters[i-1]['number']}"
                }
                
            if i < len(chapters) - 1:
                next_chapter = {
                    'number': chapters[i+1]['number'],
                    'title': chapters[i+1]['title'],
                    'url': f"/novels/{novel_data['slug']}/chapter-{chapters[i+1]['number']}"
                }
                
            # 准备所有章节列表（用于目录）
            all_chapters = []
            for ch in chapters:
                all_chapters.append({
                    'number': ch['number'],
                    'title': ch['title'],
                    'url': f"/novels/{novel_data['slug']}/chapter-{ch['number']}"
                })
            
            # 定义所有10个广告单元
            all_ad_units = [
                {'id': 1, 'slot_id': 'div-gpt-ad-1762511964282-0', 'path': '/22796784223/Netlink/goodluckark.com/banner_1'},
                {'id': 2, 'slot_id': 'div-gpt-ad-1762511986518-0', 'path': '/22796784223/Netlink/goodluckark.com/banner_2'},
                {'id': 3, 'slot_id': 'div-gpt-ad-1762512008111-0', 'path': '/22796784223/Netlink/goodluckark.com/banner_3'},
                {'id': 4, 'slot_id': 'div-gpt-ad-1762512031919-0', 'path': '/22796784223/Netlink/goodluckark.com/banner_4'},
                {'id': 5, 'slot_id': 'div-gpt-ad-1762512054239-0', 'path': '/22796784223/Netlink/goodluckark.com/banner_5'},
                {'id': 6, 'slot_id': 'div-gpt-ad-1762512074266-0', 'path': '/22796784223/Netlink/goodluckark.com/banner_in_article_1'},
                {'id': 7, 'slot_id': 'div-gpt-ad-1762512094799-0', 'path': '/22796784223/Netlink/goodluckark.com/banner_in_article_2'},
                {'id': 8, 'slot_id': 'div-gpt-ad-1762512119068-0', 'path': '/22796784223/Netlink/goodluckark.com/banner_in_article_3'},
                {'id': 9, 'slot_id': 'div-gpt-ad-1762512140538-0', 'path': '/22796784223/Netlink/goodluckark.com/banner_in_article_4'},
                {'id': 10, 'slot_id': 'div-gpt-ad-1762512161163-0', 'path': '/22796784223/Netlink/goodluckark.com/banner_in_article_5'},
            ]
            
            # 从10个广告单元中随机选择6个（每个页面都不同）
            selected_ad_units = random.sample(all_ad_units, 6)
            
            # 准备渲染数据（两个版本使用相同的数据）
            render_data = {
                'chapter': {
                    'number': chapter['number'],
                    'title': chapter['title'],
                    'content': chapter['content'],
                    'word_count': chapter.get('word_count', 0),
                    'publish_date': chapter.get('publish_date', '')
                },
                'novel': {
                    'title': novel_data['title'],
                    'author': novel_data['author'],
                    'cover_url': self.get_cover_url(novel_data),
                    'url': f"/novels/{novel_data['slug']}/",
                    'chapters': all_chapters,
                    'tags': novel_data['tags']
                },
                'selected_ad_units': selected_ad_units,  # 传递选中的6个广告单元完整信息
                'prev_chapter': prev_chapter,
                'next_chapter': next_chapter,
                'site_url': self.site_url,
                'novel_slug': novel_data['slug']
            }
                
            # 渲染并保存带广告版本
            html_content_with_ads = template_with_ads.render(**render_data)
            output_file = novel_dir / f"chapter-{chapter['number']}.html"
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(html_content_with_ads)
            
            # 渲染并保存clean版本
            html_content_clean = template_clean.render(**render_data)
            output_file_clean = novel_dir / f"chapter-{chapter['number']}-clean.html"
            with open(output_file_clean, 'w', encoding='utf-8') as f:
                f.write(html_content_clean)
                
    def build_homepage(self, novels: Dict):
        """生成首页（包括完整版和简化版）"""
        # 准备小说数据
        novel_list = list(novels.values())
        
        # 按最后更新时间排序
        novel_list.sort(key=lambda x: x.get('last_updated', ''), reverse=True)
        
        # 准备不同分类的小说
        # Featured Novels: 从整个小说库中真正随机选择5本（或全部，如果小说总数少于5本）
        featured_count = min(5, len(novel_list))  # 确保不超过实际小说数量
        if len(novel_list) > 0:
            featured_novels = self.prepare_novel_cards(random.sample(novel_list, featured_count))
        else:
            featured_novels = []
        
        new_novels = self.prepare_novel_cards(novel_list[:12])      # 最新12本
        popular_novels = self.prepare_novel_cards(novel_list[:12])  # 热门12本（暂时用最新的）
        
        # 推荐小说：随机选择8本作为默认显示
        recommended_count = min(8, len(novel_list))
        if len(novel_list) > 0:
            recommended_novels = self.prepare_novel_cards(random.sample(novel_list, recommended_count))
        else:
            recommended_novels = []
        
        # 准备分类数据
        categories = self.prepare_categories(novels)
        
        # 准备所有小说数据用于推荐区域
        all_novels = self.prepare_novel_cards(novel_list)
        
        # 1. 生成完整版首页（带FB检测跳转）
        template = self.env.get_template('index.html')
        html_content = template.render(
            featured_novels=featured_novels,
            new_novels=new_novels,
            popular_novels=popular_novels,
            recommended_novels=recommended_novels,
            all_novels=all_novels,
            categories=categories,
            site_url=self.site_url
        )
        
        output_file = self.output_path / 'index.html'
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
        print("✓ 生成完整版首页: index.html")
        
        # 2. 生成简化版首页（只有 Reading History）
        template_clean = self.env.get_template('index-clean.html')
        html_content_clean = template_clean.render(
            site_url=self.site_url
        )
        
        output_file_clean = self.output_path / 'index-clean.html'
        with open(output_file_clean, 'w', encoding='utf-8') as f:
            f.write(html_content_clean)
        print("✓ 生成简化版首页: index-clean.html")
            
    def prepare_novel_cards(self, novels: List[Dict]) -> List[Dict]:
        """准备小说卡片数据"""
        cards = []
        for novel in novels:
            cards.append({
                'title': novel['title'],
                'author': novel['author'],
                'description': novel['short_description'] or novel['description'][:200] + '...',
                'cover_url': self.get_cover_url(novel),
                'url': f"/novels/{novel['slug']}/",
                'tags': novel['tags'][:3],  # 只显示前3个标签
                'rating': novel['rating'],
                'chapters': novel['total_chapters'],
                'last_updated': novel['last_updated'],
                'progress': 0  # 阅读进度，实际应用中会从用户数据获取
            })
        return cards
        
    def prepare_categories(self, novels: Dict) -> List[Dict]:
        """准备分类数据"""
        # 统计各类型的小说
        genre_counts = {}
        for novel in novels.values():
            for genre in novel['genres']:
                if genre not in genre_counts:
                    genre_counts[genre] = []
                genre_counts[genre].append(novel)
                
        categories = []
        for genre, genre_novels in genre_counts.items():
            if len(genre_novels) >= 3:  # 至少3本书才显示分类
                categories.append({
                    'name': genre,
                    'url': f"/category/{genre.lower().replace(' ', '-')}/",
                    'books': [
                        {
                            'title': novel['title'],
                            'url': f"/novels/{novel['slug']}/"
                        }
                        for novel in genre_novels[:5]  # 每个分类最多显示5本
                    ]
                })
                
        return categories[:6]  # 最多显示6个分类
        
    def get_cover_url(self, novel_data: Dict) -> str:
        """获取封面图片URL"""
        if novel_data.get('cover_path'):
            # 生成相对于网站根目录的URL
            cover_filename = Path(novel_data['cover_path']).name
            return f"/covers/{novel_data['slug']}-{cover_filename}"
        else:
            return "/assets/images/default-cover.jpg"
            
    def process_cover_images(self, novels: Dict):
        """处理封面图片"""
        covers_dir = self.output_path / 'covers'
        covers_dir.mkdir(exist_ok=True)
        
        for novel_id, novel_data in novels.items():
            if novel_data.get('cover_path'):
                source_path = Path(novel_data['cover_path'])
                if source_path.exists():
                    # 生成目标文件名
                    file_extension = source_path.suffix
                    target_filename = f"{novel_data['slug']}-{source_path.name}"
                    target_path = covers_dir / target_filename
                    
                    # 复制图片文件
                    if not target_path.exists() or source_path.stat().st_mtime > target_path.stat().st_mtime:
                        try:
                            shutil.copy2(source_path, target_path)
                            print(f"复制封面: {novel_data['title']}")
                        except Exception as e:
                            print(f"复制封面失败 {novel_data['title']}: {e}")
                            
    def copy_static_assets(self):
        """复制静态资源"""
        assets_dir = self.output_path / 'assets'
        assets_dir.mkdir(exist_ok=True)
        
        # 创建基本的CSS和JS目录
        (assets_dir / 'css').mkdir(exist_ok=True)
        (assets_dir / 'js').mkdir(exist_ok=True)
        (assets_dir / 'images').mkdir(exist_ok=True)
        
        # 创建默认封面图片（可以是占位符）
        default_cover_path = assets_dir / 'images' / 'default-cover.jpg'
        if not default_cover_path.exists():
            # 这里可以创建一个默认的封面图片
            print("提示: 需要添加默认封面图片到 assets/images/default-cover.jpg")


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='小说网站构建器')
    parser.add_argument('--source', default='source', help='小说库源目录')
    parser.add_argument('--output', default='docs', help='输出目录')
    parser.add_argument('--templates', default='tools/templates', help='模板目录')
    parser.add_argument('--force', action='store_true', help='强制重建所有页面')
    parser.add_argument('--novel', help='只构建指定的小说（标题包含此字符串）')
    parser.add_argument('--site-url', help='网站URL (覆盖配置文件)')
    parser.add_argument('--incremental', action='store_true', help='增量构建（只构建有变化的内容）')
    
    args = parser.parse_args()
    
    # 读取配置文件
    site_url = 'https://adx.myfreenovel.com'  # 默认正确域名
    config_file = 'config.json'
    if os.path.exists(config_file):
        try:
            with open(config_file, 'r', encoding='utf-8') as f:
                json_config = json.load(f)
                site_url = json_config.get('site', {}).get('url', site_url)
        except Exception as e:
            print(f"警告: 无法读取配置文件 {config_file}: {e}")
    
    # 命令行参数覆盖配置文件
    if args.site_url:
        site_url = args.site_url
    
    # 配置
    config = {
        'base_path': os.getcwd(),
        'source_path': args.source,
        'output_path': args.output,
        'templates_path': args.templates,
        'site_url': site_url
    }
    
    # 构建网站
    builder = WebsiteBuilder(config)
    
    force_rebuild = args.force and not args.incremental
    
    try:
        builder.build_website(
            force_rebuild=force_rebuild,
            novel_filter=args.novel
        )
        print("\n🎉 构建成功!")
    except Exception as e:
        print(f"\n❌ 构建失败: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
