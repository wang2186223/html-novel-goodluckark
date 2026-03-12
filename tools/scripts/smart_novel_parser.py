#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
智能小说库管理器 - 支持增量更新和变化检测
适配新的文件结构：文件夹名=小说标题，描述.txt，正文.txt
"""

import os
import json
import hashlib
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import chardet
import re


class SmartNovelLibraryManager:
    """智能小说库管理器"""
    
    def __init__(self, source_path: str, output_path: str):
        self.source_path = Path(source_path)
        self.output_path = Path(output_path)
        self.index_file = self.output_path / "novels-index.json"
        self.cache_file = self.output_path / "novels-cache.json"
        
        # 确保输出目录存在
        self.output_path.mkdir(parents=True, exist_ok=True)
        
    def smart_scan_and_update(self) -> Dict:
        """智能扫描和更新小说库"""
        print("🔍 开始智能扫描小说库...")
        
        # 加载历史缓存
        cache_data = self.load_cache()
        current_novels = {}
        changes = {
            'new': [],      # 新增的小说
            'updated': [],  # 更新的小说
            'unchanged': [], # 未变化的小说
            'removed': []   # 删除的小说
        }
        
        # 扫描当前文件夹
        if not self.source_path.exists():
            print(f"❌ 源目录不存在: {self.source_path}")
            return {'novels': {}, 'changes': changes}
            
        print(f"📂 扫描目录: {self.source_path}")
        
        for folder in self.source_path.iterdir():
            if not folder.is_dir():
                continue
                
            print(f"📖 检查小说: {folder.name}")
            
            # 解析小说数据
            novel_data = self.parse_novel_folder(folder)
            if not novel_data:
                continue
                
            novel_id = novel_data['slug']
            current_novels[novel_id] = novel_data
            
            # 检查是否有变化
            if novel_id not in cache_data:
                # 新增小说
                changes['new'].append(novel_id)
                print(f"  ✨ 新增小说: {novel_data['title']}")
            else:
                # 检查是否有更新
                cached_novel = cache_data[novel_id]
                if self.has_content_changed(novel_data, cached_novel):
                    changes['updated'].append(novel_id)
                    print(f"  🔄 小说更新: {novel_data['title']}")
                else:
                    changes['unchanged'].append(novel_id)
                    print(f"  ✅ 无变化: {novel_data['title']}")
                    
        # 检查删除的小说
        for novel_id in cache_data:
            if novel_id not in current_novels:
                changes['removed'].append(novel_id)
                print(f"  🗑️ 小说删除: {cache_data[novel_id].get('title', novel_id)}")
                
        # 保存缓存和索引
        self.save_cache(current_novels)
        self.save_index(current_novels)
        
        print(f"\n📊 扫描完成:")
        print(f"  新增: {len(changes['new'])} 本")
        print(f"  更新: {len(changes['updated'])} 本")
        print(f"  无变化: {len(changes['unchanged'])} 本")
        print(f"  删除: {len(changes['removed'])} 本")
        
        return {
            'novels': current_novels,
            'changes': changes
        }
        
    def parse_novel_folder(self, folder_path: Path) -> Optional[Dict]:
        """解析单个小说文件夹"""
        try:
            # 新的文件结构：描述.txt 和 正文.txt
            desc_file = folder_path / "描述.txt"
            content_file = folder_path / "正文.txt"
            
            # 兼容旧格式
            if not desc_file.exists():
                desc_file = folder_path / "书籍描述.txt"
            if not content_file.exists():
                content_file = folder_path / "书籍正文.txt"
                
            if not desc_file.exists() or not content_file.exists():
                print(f"  ⚠️ 跳过: 缺少必需文件 (需要 描述.txt 和 正文.txt)")
                return None
                
            # 解析小说信息
            novel_info = self.parse_description_file(desc_file)
            if not novel_info:
                print(f"  ❌ 解析描述文件失败")
                return None
                
            # 解析章节内容
            chapters = self.parse_content_file(content_file)
            if not chapters:
                print(f"  ❌ 解析正文文件失败")
                return None
                
            # 查找封面图片
            cover_file = self.find_cover_image(folder_path)
            
            # 生成小说slug（URL友好的标识符）
            title = novel_info.get('title', folder_path.name)
            slug = self.generate_slug(title)
            
            # 计算文件指纹（用于检测变化）
            content_hash = self.calculate_content_hash(desc_file, content_file)
            
            # 构建小说数据
            novel_data = {
                'id': slug,
                'slug': slug,
                'title': title,
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
                'folder_path': str(folder_path),
                'folder_name': folder_path.name,
                'content_hash': content_hash  # 用于检测变化
            }
            
            return novel_data
            
        except Exception as e:
            print(f"  ❌ 解析失败: {e}")
            return None
            
    def parse_description_file(self, file_path: Path) -> Optional[Dict]:
        """解析描述文件，支持多种格式"""
        try:
            content = self.read_file_with_encoding(file_path)
            if not content:
                return None
                
            content = content.strip()
            info = {}
            
            # 检查是否为键值对格式
            lines = content.split('\n')
            has_key_value_pairs = any(':' in line for line in lines[:5])  # 检查前5行
            
            if has_key_value_pairs:
                # 键值对格式
                for line in lines:
                    line = line.strip()
                    if not line:
                        continue
                        
                    if ':' in line:
                        key, value = line.split(':', 1)
                        key = key.strip()
                        value = value.strip()
                        
                        if key in ['书籍名称', '标题', '书名', 'title']:
                            info['title'] = value
                        elif key in ['作者', 'author']:
                            info['author'] = value
                        elif key in ['简介', '描述', 'description']:
                            info['description'] = value
                        elif key in ['标签', 'tags']:
                            tags = [tag.strip() for tag in value.replace('，', ',').split(',') if tag.strip()]
                            info['tags'] = tags
                        elif key in ['状态', 'status']:
                            status_map = {
                                '连载中': 'ongoing',
                                '已完结': 'completed',
                                '完结': 'completed',
                                '暂停': 'paused'
                            }
                            info['status'] = status_map.get(value, 'completed')
                        elif key in ['评分', 'rating']:
                            try:
                                info['rating'] = float(value)
                            except:
                                info['rating'] = 4.5
            else:
                # 纯文本格式（英文描述）
                # 从文件夹名提取标题
                folder_name = file_path.parent.name
                info['title'] = folder_name
                info['description'] = content
                
                # 从描述中推断标签和类型
                description_lower = content.lower()
                tags = []
                genres = []
                
                # 检测狼人相关词汇
                if any(word in description_lower for word in ['werewolf', 'wolf', 'alpha', 'pack', 'mate', 'luna']):
                    tags.extend(['werewolf', 'alpha', 'pack'])
                    genres.append('Werewolf')
                    
                # 检测龙相关词汇
                if any(word in description_lower for word in ['dragon', 'drake', 'wyvern']):
                    tags.extend(['dragon', 'fantasy'])
                    genres.append('Fantasy')
                    
                # 检测海洋/深海主题
                if any(word in description_lower for word in ['ocean', 'sea', 'marine', 'underwater', 'abyss']):
                    tags.extend(['ocean', 'underwater', 'marine'])
                    genres.append('Fantasy')
                    
                # 检测爱情元素
                if any(word in description_lower for word in ['romance', 'love', 'forbidden', 'relationship']):
                    tags.append('romance')
                    genres.append('Romance')
                    
                # 检测CEO主题
                if any(word in description_lower for word in ['ceo', 'billionaire', 'tycoon', 'executive']):
                    tags.extend(['ceo', 'billionaire', 'contemporary'])
                    genres.append('Contemporary')
                    
                # 如果没有检测到类型，默认为浪漫幻想
                if not genres:
                    genres = ['Romance', 'Fantasy']
                if not tags:
                    tags = ['romance', 'fantasy']
                    
                info['tags'] = tags[:5]  # 限制标签数量
                info['genres'] = list(set(genres))[:3]  # 去重并限制类型数量
                
            # 确保必需字段存在
            if 'title' not in info or not info['title']:
                # 使用文件夹名作为标题
                info['title'] = file_path.parent.name
                
            # 设置默认值
            info.setdefault('author', 'Unknown Author')
            info.setdefault('description', '')
            info.setdefault('tags', ['romance', 'fantasy'])
            info.setdefault('genres', ['Romance', 'Fantasy'])
            info.setdefault('status', 'completed')
            info.setdefault('rating', 4.5)
            
            return info
            
        except Exception as e:
            print(f"  ❌ 解析描述文件错误: {e}")
            return None
            
    def parse_content_file(self, file_path: Path) -> List[Dict]:
        """解析正文文件，按 ### 分割章节"""
        try:
            content = self.read_file_with_encoding(file_path)
            if not content:
                return []
                
            # 按 ### 分割章节，这里就是简单的 ### 分割
            chapter_parts = content.split('###')
            chapters = []
            
            for i, part in enumerate(chapter_parts):
                part = part.strip()
                if not part:
                    continue
                    
                # 提取章节标题和内容
                lines = part.split('\n')
                first_line = lines[0].strip() if lines else ""
                
                # 确定章节标题和内容起始位置
                chapter_title = ""
                content_start_line = 0
                
                # 检查第一行是否是章节标题（如 "chapter 1"）
                if first_line and re.match(r'^chapter\s+\d+', first_line, re.IGNORECASE):
                    # 提取章节号
                    match = re.search(r'chapter\s+(\d+)', first_line, re.IGNORECASE)
                    if match:
                        chapter_num = match.group(1)
                        chapter_title = f"Chapter {chapter_num}"
                    else:
                        chapter_title = first_line.title()
                    content_start_line = 1
                else:
                    # 如果第一行不是标准的章节标题，使用序号
                    chapter_title = f"Chapter {len(chapters) + 1}"
                    content_start_line = 0
                    
                # 提取章节内容（跳过装饰性分隔符）
                content_lines = []
                for line in lines[content_start_line:]:
                    line_stripped = line.strip()
                    # 跳过纯装饰性的行（如 ********* 或 --------- ）
                    if not line_stripped or line_stripped == '*' * len(line_stripped) or line_stripped == '-' * len(line_stripped):
                        continue
                    content_lines.append(line)
                    
                chapter_content = '\n'.join(content_lines).strip()
                
                if chapter_content:  # 只添加有内容的章节
                    chapters.append({
                        'number': len(chapters) + 1,
                        'title': chapter_title,
                        'content': chapter_content,
                        'word_count': len(chapter_content.split()),
                        'publish_date': datetime.now().strftime('%Y-%m-%d')
                    })
                
            return chapters
            
        except Exception as e:
            print(f"  ❌ 解析正文文件错误: {e}")
            return []
            
    def find_cover_image(self, folder_path: Path) -> Optional[Path]:
        """查找封面图片"""
        image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
        
        for file in folder_path.iterdir():
            if file.is_file() and file.suffix.lower() in image_extensions:
                return file
                
        return None
        
    def calculate_content_hash(self, desc_file: Path, content_file: Path) -> str:
        """计算内容的哈希值，用于检测变化"""
        try:
            desc_content = self.read_file_with_encoding(desc_file) or ""
            content_content = self.read_file_with_encoding(content_file) or ""
            
            combined_content = desc_content + content_content
            return hashlib.md5(combined_content.encode('utf-8')).hexdigest()
        except:
            return ""
            
    def has_content_changed(self, new_novel: Dict, cached_novel: Dict) -> bool:
        """检查小说内容是否有变化"""
        # 比较内容哈希
        new_hash = new_novel.get('content_hash', '')
        cached_hash = cached_novel.get('content_hash', '')
        
        if new_hash and cached_hash:
            return new_hash != cached_hash
            
        # 如果没有哈希，比较其他字段
        compare_fields = ['total_chapters', 'word_count', 'description']
        for field in compare_fields:
            if new_novel.get(field) != cached_novel.get(field):
                return True
                
        return False
        
    def read_file_with_encoding(self, file_path: Path) -> Optional[str]:
        """智能读取文件，自动检测编码"""
        try:
            # 首先尝试UTF-8
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except UnicodeDecodeError:
            try:
                # 检测编码
                with open(file_path, 'rb') as f:
                    raw_data = f.read()
                    result = chardet.detect(raw_data)
                    encoding = result['encoding'] or 'utf-8'
                    
                # 使用检测到的编码读取
                return raw_data.decode(encoding)
            except Exception as e:
                print(f"  ❌ 读取文件失败 {file_path}: {e}")
                return None
                
    def generate_slug(self, title: str) -> str:
        """生成URL友好的slug"""
        # 移除特殊字符，替换空格为连字符
        slug = re.sub(r'[^\w\s-]', '', title.lower())
        slug = re.sub(r'[-\s]+', '-', slug)
        return slug.strip('-')
        
    def generate_short_description(self, description: str, max_length: int = 200) -> str:
        """生成短描述"""
        if len(description) <= max_length:
            return description
        return description[:max_length].rsplit(' ', 1)[0] + '...'
        
    def load_cache(self) -> Dict:
        """加载缓存数据"""
        try:
            if self.cache_file.exists():
                with open(self.cache_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception as e:
            print(f"⚠️ 加载缓存失败: {e}")
        return {}
        
    def save_cache(self, novels: Dict) -> None:
        """保存缓存数据（章节内容限制为前100个字符）"""
        try:
            # 创建缓存数据，限制章节内容长度
            cache_data = {}
            for novel_id, novel_data in novels.items():
                cache_data[novel_id] = novel_data.copy()
                
                # 如果有章节数据，截取content为前100个字符
                if 'chapters' in cache_data[novel_id]:
                    cache_data[novel_id]['chapters'] = []
                    for chapter in novel_data.get('chapters', []):
                        cached_chapter = chapter.copy()
                        # 截取content为前100个字符
                        if 'content' in cached_chapter and cached_chapter['content']:
                            cached_chapter['content'] = cached_chapter['content'][:100]
                        cache_data[novel_id]['chapters'].append(cached_chapter)
            
            with open(self.cache_file, 'w', encoding='utf-8') as f:
                json.dump(cache_data, f, ensure_ascii=False, indent=2)
            print(f"💾 保存缓存文件（content限制100字符）: {self.cache_file}")
        except Exception as e:
            print(f"❌ 保存缓存失败: {e}")
            
    def save_index(self, novels: Dict) -> None:
        """保存小说索引（仅元数据）"""
        try:
            # 创建只包含元数据的索引
            index_data = {}
            for novel_id, novel_data in novels.items():
                # 只保留元数据，不包含章节内容
                index_data[novel_id] = {
                    'id': novel_data.get('id'),
                    'slug': novel_data.get('slug'),
                    'title': novel_data.get('title'),
                    'author': novel_data.get('author'),
                    'description': novel_data.get('description'),
                    'short_description': novel_data.get('short_description'),
                    'genres': novel_data.get('genres', []),
                    'tags': novel_data.get('tags', []),
                    'status': novel_data.get('status'),
                    'rating': novel_data.get('rating'),
                    'cover_path': novel_data.get('cover_path'),
                    'total_chapters': novel_data.get('total_chapters', 0),
                    'last_updated': novel_data.get('last_updated'),
                    # 章节列表只保留元数据，不包含content
                    'chapters': [
                        {
                            'number': ch.get('number'),
                            'title': ch.get('title'),
                            'word_count': ch.get('word_count', 0),
                            'publish_date': ch.get('publish_date')
                        }
                        for ch in novel_data.get('chapters', [])
                    ]
                }
            
            with open(self.index_file, 'w', encoding='utf-8') as f:
                json.dump(index_data, f, ensure_ascii=False, indent=2)
            print(f"💾 保存索引文件（仅元数据）: {self.index_file}")
        except Exception as e:
            print(f"❌ 保存索引失败: {e}")
            
    def get_novels_for_homepage(self) -> List[Dict]:
        """获取首页展示的小说列表"""
        try:
            if self.index_file.exists():
                with open(self.index_file, 'r', encoding='utf-8') as f:
                    novels = json.load(f)
                    
                # 转换为列表并按更新时间排序
                novel_list = list(novels.values())
                novel_list.sort(key=lambda x: x.get('last_updated', ''), reverse=True)
                
                return novel_list
        except Exception as e:
            print(f"❌ 获取小说列表失败: {e}")
            
        return []


# 兼容性函数，保持与旧版本的接口一致
class NovelLibraryManager(SmartNovelLibraryManager):
    """兼容性类，保持旧接口"""
    
    def scan_and_update(self, force_rebuild: bool = False) -> Dict:
        """扫描和更新小说库"""
        if force_rebuild:
            # 如果强制重建，删除缓存
            if self.cache_file.exists():
                self.cache_file.unlink()
                
        result = self.smart_scan_and_update()
        
        # 返回格式兼容
        if 'changes' in result:
            return result
        else:
            return {
                'novels': result.get('novels', {}),
                'changes': {'new': [], 'updated': [], 'removed': []}
            }
