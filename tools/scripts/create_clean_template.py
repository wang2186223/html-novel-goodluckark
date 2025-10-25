#!/usr/bin/env python3
"""
Create a clean version of chapter.html without ads
"""

import re
import os

def create_clean_template():
    """Create chapter-clean.html from chapter.html by removing ONLY AdClickGuideSystem code"""
    
    # Read the original template
    template_path = os.path.join(os.path.dirname(__file__), '..', 'templates', 'chapter.html')
    with open(template_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove AB version detection script (only keep for ad version)
    # We don't need this in clean version as it's already the destination
    ab_pattern = r'<!-- AB Version Detection & Redirect System -->.*?</script>\s*\n'
    content = re.sub(ab_pattern, '', content, flags=re.DOTALL)
    
    # ONLY Remove AdClickGuideSystem class and all related code
    # Match from the comment to just before the closing </script> tag
    adclick_pattern = r'// ===== Ad Click Guide System =====.*?(?=\s*</script>)'
    content = re.sub(adclick_pattern, '', content, flags=re.DOTALL)
    
    # Clean up multiple empty lines
    content = re.sub(r'\n{3,}', '\n\n', content)
    
    # Write to clean template
    clean_template_path = os.path.join(os.path.dirname(__file__), '..', 'templates', 'chapter-clean.html')
    with open(clean_template_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    original_size = len(open(template_path, 'r', encoding='utf-8').read())
    clean_size = len(content)
    
    print(f"✓ Created clean template: {clean_template_path}")
    print(f"  Original size: {original_size} bytes")
    print(f"  Clean size: {clean_size} bytes")
    print(f"  Reduction: {original_size - clean_size} bytes ({100 * (original_size - clean_size) / original_size:.1f}%)")
    
    # Verify only AdClickGuideSystem code was removed
    has_adclick = 'AdClickGuideSystem' in content
    has_gpt = 'window.googletag' in content or 'div-gpt-ad' in content
    has_analytics = 'gtag' in content
    has_fbpixel = 'fbq' in content
    
    print("\n✓ Verification:")
    print(f"  - AdClickGuideSystem removed: {'✓' if not has_adclick else '✗ (still present!)'}")
    print(f"  - Google Ads (GPT) kept: {'✓' if has_gpt else '✗ (removed by mistake!)'}")
    print(f"  - Google Analytics kept: {'✓' if has_analytics else '✗ (removed by mistake!)'}")
    print(f"  - Facebook Pixel kept: {'✓' if has_fbpixel else '✗ (removed by mistake!)'}")

if __name__ == '__main__':
    create_clean_template()
