#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
小说库同步脚本 - 从外部小说库同步到项目source目录
"""

import os
import shutil
import argparse
from pathlib import Path


def sync_novel_library(external_library_path: str, project_source_path: str, copy_mode: bool = False):
    """
    同步外部小说库到项目source目录
    
    Args:
        external_library_path: 外部小说库路径
        project_source_path: 项目source目录路径  
        copy_mode: True=复制文件，False=创建符号链接
    """
    external_path = Path(external_library_path)
    source_path = Path(project_source_path)
    
    print(f"📚 开始同步小说库...")
    print(f"源路径: {external_path}")
    print(f"目标路径: {source_path}")
    print(f"模式: {'复制' if copy_mode else '符号链接'}")
    
    if not external_path.exists():
        print(f"❌ 外部小说库不存在: {external_path}")
        return
        
    # 确保目标目录存在
    source_path.mkdir(parents=True, exist_ok=True)
    
    # 清理目标目录中的旧链接/文件
    for item in source_path.iterdir():
        if item.is_symlink() or (copy_mode and item.is_dir()):
            if item.is_symlink():
                item.unlink()
            else:
                shutil.rmtree(item)
                
    # 同步小说文件夹
    sync_count = 0
    for novel_folder in external_path.iterdir():
        if not novel_folder.is_dir():
            continue
            
        target_folder = source_path / novel_folder.name
        
        try:
            if copy_mode:
                # 复制整个文件夹
                if target_folder.exists():
                    shutil.rmtree(target_folder)
                shutil.copytree(novel_folder, target_folder)
                print(f"  📁 复制: {novel_folder.name}")
            else:
                # 创建符号链接
                if target_folder.exists():
                    target_folder.unlink()
                target_folder.symlink_to(novel_folder.absolute())
                print(f"  🔗 链接: {novel_folder.name}")
                
            sync_count += 1
            
        except Exception as e:
            print(f"  ❌ 同步失败 {novel_folder.name}: {e}")
            
    print(f"\n✅ 同步完成! 共同步 {sync_count} 本小说")


def main():
    parser = argparse.ArgumentParser(description='同步外部小说库到项目')
    parser.add_argument('--external', required=True, help='外部小说库路径')
    parser.add_argument('--source', default='source', help='项目source目录路径')
    parser.add_argument('--copy', action='store_true', help='复制文件而不是创建符号链接')
    
    args = parser.parse_args()
    
    sync_novel_library(args.external, args.source, args.copy)


if __name__ == '__main__':
    main()
