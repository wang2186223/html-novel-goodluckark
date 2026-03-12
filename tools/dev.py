#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
开发工具 - 提供便捷的开发功能
"""

import os
import sys
import json
import argparse
import subprocess
from pathlib import Path
from http.server import HTTPServer, SimpleHTTPRequestHandler
import webbrowser
import time


class DevServer:
    """开发服务器"""
    
    def __init__(self, port=8000, directory="docs"):
        self.port = port
        self.directory = Path(directory)
        
    def start(self):
        """启动开发服务器"""
        if not self.directory.exists():
            print(f"❌ 目录不存在: {self.directory}")
            print("请先运行构建脚本生成网站文件")
            return
            
        os.chdir(self.directory)
        
        handler = SimpleHTTPRequestHandler
        httpd = HTTPServer(("", self.port), handler)
        
        url = f"http://localhost:{self.port}"
        print(f"🌐 开发服务器启动: {url}")
        print("按 Ctrl+C 停止服务器")
        
        # 自动打开浏览器
        webbrowser.open(url)
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n服务器已停止")


class ProjectManager:
    """项目管理器"""
    
    def __init__(self):
        self.project_root = Path.cwd()
        
    def init_project(self):
        """初始化项目"""
        print("📁 初始化项目结构...")
        
        # 创建必要的目录
        directories = [
            "source",
            "docs", 
            "tools/scripts",
            "tools/templates"
        ]
        
        for dir_path in directories:
            dir_full_path = self.project_root / dir_path
            dir_full_path.mkdir(parents=True, exist_ok=True)
            print(f"创建目录: {dir_path}")
            
        # 创建示例小说目录结构
        example_novel_dir = self.project_root / "source" / "示例小说"
        example_novel_dir.mkdir(exist_ok=True)
        
        # 创建示例描述文件
        desc_file = example_novel_dir / "书籍描述.txt"
        if not desc_file.exists():
            with open(desc_file, 'w', encoding='utf-8') as f:
                f.write("""书籍名称: 月下狼王的挚爱
作者: 示例作者
简介: 这是一个关于狼人阿尔法和他的命定伴侣的故事...
标签: 狼人,阿尔法,命定伴侣,都市幻想
状态: 连载中
评分: 4.8""")
                
        # 创建示例正文文件
        content_file = example_novel_dir / "书籍正文.txt"
        if not content_file.exists():
            with open(content_file, 'w', encoding='utf-8') as f:
                f.write("""### 第一章 月圆之夜
月光透过窗帘洒在地板上，艾米莉感受到体内的躁动...

### 第二章 初次相遇
在咖啡店里，她遇到了那个改变她命运的男人...

### 第三章 真相揭晓
原来他就是传说中的狼人阿尔法...""")
                
        print("✅ 项目初始化完成!")
        print("\n📝 下一步:")
        print("1. 将你的小说文件放到 source/ 目录")
        print("2. 运行 python tools/build-website.py 构建网站")
        print("3. 运行 python tools/dev.py serve 启动开发服务器")
        
    def install_dependencies(self):
        """安装依赖"""
        print("📦 安装Python依赖...")
        
        requirements_file = self.project_root / "requirements.txt"
        if not requirements_file.exists():
            print("❌ requirements.txt 不存在")
            return
            
        try:
            subprocess.run([sys.executable, "-m", "pip", "install", "-r", str(requirements_file)], 
                         check=True)
            print("✅ 依赖安装完成!")
        except subprocess.CalledProcessError as e:
            print(f"❌ 依赖安装失败: {e}")
            
    def check_status(self):
        """检查项目状态"""
        print("📊 项目状态检查...")
        
        # 检查目录结构
        required_dirs = ["source", "tools/templates", "tools/scripts"]
        for dir_path in required_dirs:
            full_path = self.project_root / dir_path
            status = "✅" if full_path.exists() else "❌"
            print(f"{status} {dir_path}")
            
        # 检查文件
        required_files = [
            "requirements.txt",
            "config.json", 
            "tools/build-website.py",
            "tools/templates/index.html",
            "tools/templates/novel.html",
            "tools/templates/chapter.html"
        ]
        
        for file_path in required_files:
            full_path = self.project_root / file_path
            status = "✅" if full_path.exists() else "❌"
            print(f"{status} {file_path}")
            
        # 检查小说数量
        source_dir = self.project_root / "source"
        if source_dir.exists():
            novel_count = len([d for d in source_dir.iterdir() if d.is_dir()])
            print(f"📚 找到 {novel_count} 本小说")
        else:
            print("📚 source 目录不存在")
            
        # 检查输出
        docs_dir = self.project_root / "docs"
        if docs_dir.exists():
            html_files = list(docs_dir.glob("**/*.html"))
            print(f"🌐 已生成 {len(html_files)} 个HTML文件")
        else:
            print("🌐 还未生成网站文件")
            
    def clean_generated_files(self):
        """清理生成的文件"""
        print("🧹 清理生成的文件...")
        
        docs_dir = self.project_root / "docs"
        if docs_dir.exists():
            import shutil
            shutil.rmtree(docs_dir)
            print("✅ 删除 docs/ 目录")
        else:
            print("📁 docs/ 目录不存在")
            
        print("🎉 清理完成!")
        
    def validate_novels(self):
        """验证小说文件格式"""
        print("🔍 验证小说文件格式...")
        
        source_dir = self.project_root / "source"
        if not source_dir.exists():
            print("❌ source/ 目录不存在")
            return
            
        valid_count = 0
        invalid_count = 0
        
        for novel_dir in source_dir.iterdir():
            if not novel_dir.is_dir():
                continue
                
            print(f"\n📖 检查: {novel_dir.name}")
            
            # 检查必需文件
            desc_file = novel_dir / "书籍描述.txt"
            if not desc_file.exists():
                desc_file = novel_dir / "描述.txt"
                
            content_file = novel_dir / "书籍正文.txt"
            if not content_file.exists():
                content_file = novel_dir / "正文.txt"
                
            issues = []
            
            if not desc_file.exists():
                issues.append("缺少描述文件 (书籍描述.txt 或 描述.txt)")
                
            if not content_file.exists():
                issues.append("缺少正文文件 (书籍正文.txt 或 正文.txt)")
            else:
                # 检查章节格式
                try:
                    with open(content_file, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                    chapter_count = content.count('###')
                    if chapter_count == 0:
                        issues.append("正文文件中没有找到章节分割符 (###)")
                    else:
                        print(f"  ✅ 找到 {chapter_count} 个章节")
                        
                except Exception as e:
                    issues.append(f"无法读取正文文件: {e}")
                    
            # 检查封面图片
            cover_files = list(novel_dir.glob("*.jpg")) + list(novel_dir.glob("*.png"))
            if cover_files:
                print(f"  ✅ 找到封面图片: {cover_files[0].name}")
            else:
                print("  ⚠️ 没有找到封面图片")
                
            if issues:
                print("  ❌ 发现问题:")
                for issue in issues:
                    print(f"    - {issue}")
                invalid_count += 1
            else:
                print("  ✅ 格式正确")
                valid_count += 1
                
        print(f"\n📊 验证完成:")
        print(f"  有效: {valid_count} 本")
        print(f"  无效: {invalid_count} 本")


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='小说网站开发工具')
    subparsers = parser.add_subparsers(dest='command', help='可用命令')
    
    # serve 命令
    serve_parser = subparsers.add_parser('serve', help='启动开发服务器')
    serve_parser.add_argument('--port', type=int, default=8000, help='服务器端口')
    serve_parser.add_argument('--dir', default='docs', help='服务目录')
    
    # init 命令
    subparsers.add_parser('init', help='初始化项目')
    
    # install 命令
    subparsers.add_parser('install', help='安装依赖')
    
    # status 命令
    subparsers.add_parser('status', help='检查项目状态')
    
    # build 命令
    build_parser = subparsers.add_parser('build', help='构建网站')
    build_parser.add_argument('--force', action='store_true', help='强制重建')
    build_parser.add_argument('--novel', help='只构建指定小说')
    
    # sync 命令
    sync_parser = subparsers.add_parser('sync', help='同步外部小说库')
    sync_parser.add_argument('--external', required=True, help='外部小说库路径')
    sync_parser.add_argument('--copy', action='store_true', help='复制文件而不是创建符号链接')
    
    # clean 命令
    subparsers.add_parser('clean', help='清理生成的文件')
    
    # validate 命令
    subparsers.add_parser('validate', help='验证小说文件格式')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
        
    if args.command == 'serve':
        server = DevServer(args.port, args.dir)
        server.start()
        
    elif args.command == 'init':
        manager = ProjectManager()
        manager.init_project()
        
    elif args.command == 'install':
        manager = ProjectManager()
        manager.install_dependencies()
        
    elif args.command == 'status':
        manager = ProjectManager()
        manager.check_status()
        
    elif args.command == 'build':
        # 调用构建脚本
        build_script = Path("tools/build-website.py")
        if not build_script.exists():
            print("❌ 构建脚本不存在")
            return
            
        cmd = [sys.executable, str(build_script)]
        if args.force:
            cmd.append('--force')
        if args.novel:
            cmd.extend(['--novel', args.novel])
            
        try:
            subprocess.run(cmd, check=True)
        except subprocess.CalledProcessError as e:
            print(f"❌ 构建失败: {e}")
            
    elif args.command == 'sync':
        # 调用同步脚本
        sync_script = Path("tools/sync-library.py")
        if not sync_script.exists():
            print("❌ 同步脚本不存在")
            return
            
        cmd = [sys.executable, str(sync_script), '--external', args.external, '--source', 'source']
        if args.copy:
            cmd.append('--copy')
            
        try:
            subprocess.run(cmd, check=True)
        except subprocess.CalledProcessError as e:
            print(f"❌ 同步失败: {e}")
            
    elif args.command == 'clean':
        manager = ProjectManager()
        manager.clean_generated_files()
        
    elif args.command == 'validate':
        manager = ProjectManager()
        manager.validate_novels()


if __name__ == '__main__':
    main()
