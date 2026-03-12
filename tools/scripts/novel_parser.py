#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Novel Data Parser
解析小说库文件，处理中文文件名和内容，转换为英文网站数据
"""

import os
import re
import json
import glob
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import hashlib
from datetime import datetime


class NovelParser:
    """小说数据解析器"""
    
    def __init__(self, library_path: str):
        self.library_path = Path(library_path)
        self.novels_data = {}
        
    def scan_library(self) -> Dict[str, Dict]:
        """扫描整个小说库"""
        print(f"扫描小说库: {self.library_path}")
        
        if not self.library_path.exists():
            print(f"错误: 小说库路径不存在: {self.library_path}")
            return {}
            
        novels = {}
        
        # 遍历所有小说文件夹
        for novel_dir in self.library_path.iterdir():
            if novel_dir.is_dir():
                try:
                    novel_data = self.parse_novel_folder(novel_dir)
                    if novel_data:
                        novels[novel_data['id']] = novel_data
                        print(f"✓ 解析成功: {novel_data['title']}")
                    else:
                        print(f"✗ 解析失败: {novel_dir.name}")
                except Exception as e:
                    print(f"✗ 解析错误 {novel_dir.name}: {e}")
                    
        print(f"共解析 {len(novels)} 本小说")
        return novels
        
    def parse_novel_folder(self, novel_dir: Path) -> Optional[Dict]:
        """解析单个小说文件夹"""
        
        # 查找必需文件
        description_file = self.find_file(novel_dir, "书籍描述.txt")
        content_file = self.find_file(novel_dir, "书籍正文.txt")
        cover_file = self.find_cover_image(novel_dir)
        
        if not description_file or not content_file:
            print(f"缺少必需文件: {novel_dir.name}")
            return None
            
        # 解析描述文件
        novel_info = self.parse_description_file(description_file)
        
        # 解析正文文件
        chapters = self.parse_content_file(content_file)
        
        if not chapters:
            print(f"没有找到章节内容: {novel_dir.name}")
            return None
            
        # 生成小说数据
        novel_data = {
            'id': self.generate_novel_id(novel_dir.name),
            'title': novel_info.get('title', novel_dir.name),
            'slug': self.generate_slug(novel_info.get('title', novel_dir.name)),
            'original_title': novel_dir.name,
            'author': novel_info.get('author', 'Unknown Author'),
            'description': novel_info.get('description', ''),
            'short_description': self.generate_short_description(novel_info.get('description', '')),
            'genres': novel_info.get('genres', ['Romance', 'Werewolf']),
            'tags': novel_info.get('tags', ['alpha', 'mate', 'werewolf']),
            'status': novel_info.get('status', 'completed'),
            'rating': novel_info.get('rating', 4.5),
            'cover_path': str(cover_file) if cover_file else None,
            'chapters': chapters,
            'total_chapters': len(chapters),
            'word_count': sum(len(ch['content'].split()) for ch in chapters),
            'last_updated': datetime.now().strftime('%Y-%m-%d'),
            'created_at': datetime.now().strftime('%Y-%m-%d'),
            'folder_path': str(novel_dir)
        }
        
        return novel_data
        
    def find_file(self, directory: Path, filename: str) -> Optional[Path]:
        """查找文件"""
        file_path = directory / filename
        return file_path if file_path.exists() else None
        
    def find_cover_image(self, directory: Path) -> Optional[Path]:
        """查找封面图片"""
        image_extensions = ['*.jpg', '*.jpeg', '*.png', '*.gif', '*.webp']
        
        for ext in image_extensions:
            for image_file in directory.glob(ext):
                return image_file
                
        return None
        
    def parse_description_file(self, file_path: Path) -> Dict:
        """解析描述文件"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read().strip()
        except Exception as e:
            print(f"读取描述文件失败: {e}")
            return {}
            
        info = {}
        lines = content.split('\n')
        description_lines = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # 解析字段
            if ':' in line or '：' in line:
                # 使用中文或英文冒号分割
                separator = '：' if '：' in line else ':'
                key, value = line.split(separator, 1)
                key = key.strip()
                value = value.strip()
                
                if key in ['标题', 'title', 'Title']:
                    info['title'] = value
                elif key in ['作者', 'author', 'Author']:
                    info['author'] = value
                elif key in ['类型', 'genre', 'genres', 'Genre']:
                    info['genres'] = [g.strip() for g in value.replace(',', '，').split('，')]
                elif key in ['状态', 'status', 'Status']:
                    info['status'] = self.translate_status(value)
                elif key in ['评分', 'rating', 'Rating']:
                    try:
                        info['rating'] = float(value)
                    except:
                        info['rating'] = 4.5
                elif key in ['标签', 'tags', 'Tags']:
                    info['tags'] = [t.strip() for t in value.replace(',', '，').split('，')]
                elif key in ['简介', 'description', 'Description']:
                    description_lines.append(value)
            else:
                # 如果不是键值对，可能是简介的一部分
                description_lines.append(line)
                
        # 合并简介
        if description_lines:
            info['description'] = '\n'.join(description_lines)
            
        return info
        
    def parse_content_file(self, file_path: Path) -> List[Dict]:
        """解析正文文件，按###分割章节"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read().strip()
        except Exception as e:
            print(f"读取正文文件失败: {e}")
            return []
            
        # 按###分割章节
        chapter_texts = content.split('###')
        chapters = []
        
        for i, chapter_text in enumerate(chapter_texts):
            chapter_text = chapter_text.strip()
            if not chapter_text:
                continue
                
            # 提取章节标题
            lines = chapter_text.split('\n')
            title_line = lines[0].strip() if lines else f"Chapter {i+1}"
            
            # 章节内容（去掉标题行）
            content_lines = lines[1:] if len(lines) > 1 else lines
            chapter_content = '\n'.join(content_lines).strip()
            
            if not chapter_content:
                continue
                
            chapter = {
                'number': len(chapters) + 1,
                'title': self.clean_chapter_title(title_line),
                'content': chapter_content,
                'word_count': len(chapter_content.split()),
                'publish_date': datetime.now().strftime('%Y-%m-%d')
            }
            
            chapters.append(chapter)
            
        return chapters
        
    def clean_chapter_title(self, title: str) -> str:
        """清理章节标题"""
        # 移除常见的前缀
        title = re.sub(r'^(第\d+章|章节\d+|Chapter\s*\d+)', '', title).strip()
        title = re.sub(r'^[:：\-\s]+', '', title).strip()
        
        if not title:
            return "Untitled Chapter"
            
        return title
        
    def translate_status(self, status: str) -> str:
        """翻译状态"""
        status_map = {
            '完结': 'completed',
            '连载': 'ongoing',
            '暂停': 'paused',
            '完成': 'completed',
            '更新中': 'ongoing'
        }
        return status_map.get(status.lower(), 'completed')
        
    def generate_novel_id(self, folder_name: str) -> str:
        """生成小说ID"""
        # 使用文件夹名的hash作为ID
        return hashlib.md5(folder_name.encode('utf-8')).hexdigest()[:12]
        
    def generate_slug(self, title: str) -> str:
        """生成URL友好的slug"""
        # 简单的slug生成，实际可以更复杂
        slug = re.sub(r'[^\w\s-]', '', title.lower())
        slug = re.sub(r'[-\s]+', '-', slug)
        return slug.strip('-')
        
    def generate_short_description(self, description: str) -> str:
        """生成短描述"""
        if not description:
            return ""
            
        sentences = description.split('。')
        if sentences:
            return sentences[0] + '。' if len(sentences[0]) < 200 else sentences[0][:200] + '...'
        
        return description[:200] + '...' if len(description) > 200 else description
        

class NovelLibraryManager:
    """小说库管理器"""
    
    def __init__(self, library_path: str, output_path: str):
        self.library_path = Path(library_path)
        self.output_path = Path(output_path)
        self.parser = NovelParser(library_path)
        self.novels_index_file = self.output_path / 'novels-index.json'
        
    def scan_and_update(self, force_rebuild: bool = False) -> Dict:
        """扫描并更新小说库"""
        
        # 加载现有索引
        existing_novels = self.load_existing_index()
        
        # 扫描当前小说库
        current_novels = self.parser.scan_library()
        
        # 检测变化
        changes = self.detect_changes(existing_novels, current_novels)
        
        if not changes['new'] and not changes['updated'] and not force_rebuild:
            print("没有检测到变化，跳过更新")
            return existing_novels
            
        # 合并数据
        updated_novels = self.merge_novels_data(existing_novels, current_novels, changes)
        
        # 保存更新后的索引
        self.save_novels_index(updated_novels)
        
        return {
            'novels': updated_novels,
            'changes': changes
        }
        
    def load_existing_index(self) -> Dict:
        """加载现有的小说索引"""
        if not self.novels_index_file.exists():
            return {}
            
        try:
            with open(self.novels_index_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get('novels', {})
        except Exception as e:
            print(f"加载索引文件失败: {e}")
            return {}
            
    def save_novels_index(self, novels: Dict) -> None:
        """保存小说索引"""
        self.output_path.mkdir(parents=True, exist_ok=True)
        
        index_data = {
            'last_updated': datetime.now().isoformat(),
            'total_novels': len(novels),
            'novels': novels
        }
        
        with open(self.novels_index_file, 'w', encoding='utf-8') as f:
            json.dump(index_data, f, ensure_ascii=False, indent=2)
            
        print(f"保存索引文件: {self.novels_index_file}")
        
    def detect_changes(self, existing: Dict, current: Dict) -> Dict:
        """检测变化"""
        changes = {
            'new': [],
            'updated': [],
            'removed': []
        }
        
        # 检测新增和更新
        for novel_id, novel_data in current.items():
            if novel_id not in existing:
                changes['new'].append(novel_id)
            else:
                # 检查是否有更新（比较章节数量和文件修改时间）
                existing_novel = existing[novel_id]
                if (novel_data['total_chapters'] != existing_novel.get('total_chapters', 0) or
                    self.is_novel_updated(novel_data)):
                    changes['updated'].append(novel_id)
                    
        # 检测删除
        for novel_id in existing:
            if novel_id not in current:
                changes['removed'].append(novel_id)
                
        return changes
        
    def is_novel_updated(self, novel_data: Dict) -> bool:
        """检查小说是否有更新"""
        folder_path = Path(novel_data['folder_path'])
        
        # 检查文件夹修改时间
        if folder_path.exists():
            # 检查正文文件的修改时间
            content_file = folder_path / "书籍正文.txt"
            if content_file.exists():
                mtime = content_file.stat().st_mtime
                last_check = datetime.fromisoformat(novel_data.get('last_updated', '2020-01-01'))
                file_mtime = datetime.fromtimestamp(mtime)
                return file_mtime > last_check
                
        return False
        
    def merge_novels_data(self, existing: Dict, current: Dict, changes: Dict) -> Dict:
        """合并小说数据"""
        result = existing.copy()
        
        # 添加新小说
        for novel_id in changes['new']:
            result[novel_id] = current[novel_id]
            print(f"新增小说: {current[novel_id]['title']}")
            
        # 更新现有小说
        for novel_id in changes['updated']:
            result[novel_id] = current[novel_id]
            print(f"更新小说: {current[novel_id]['title']}")
            
        # 移除已删除的小说
        for novel_id in changes['removed']:
            if novel_id in result:
                print(f"移除小说: {result[novel_id]['title']}")
                del result[novel_id]
                
        return result


def main():
    """主函数 - 用于测试"""
    import argparse
    
    parser = argparse.ArgumentParser(description='小说库数据解析器')
    parser.add_argument('--library', required=True, help='小说库路径')
    parser.add_argument('--output', required=True, help='输出路径')
    parser.add_argument('--force', action='store_true', help='强制重建')
    
    args = parser.parse_args()
    
    manager = NovelLibraryManager(args.library, args.output)
    result = manager.scan_and_update(force_rebuild=args.force)
    
    if 'changes' in result:
        changes = result['changes']
        print(f"\n总结:")
        print(f"新增: {len(changes['new'])} 本")
        print(f"更新: {len(changes['updated'])} 本")
        print(f"删除: {len(changes['removed'])} 本")
        print(f"总计: {len(result['novels'])} 本小说")


if __name__ == '__main__':
    main()
