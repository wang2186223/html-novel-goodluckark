export default function middleware(request) {
  const userAgent = request.headers.get('user-agent') || '';

  // 1. 核心白名单：谷歌广告蜘蛛直接放行，确保广告正常吐出来
  if (userAgent.includes('Mediapartners-Google') || userAgent.includes('Google-Ads-Creatives')) {
    return; // Vercel Edge Middleware 中 return undefined = 放行，官方标准写法
  }

  // 2. 检查是否有"真实读者通行证" Cookie
  const cookieHeader = request.headers.get('cookie') || '';
  const hasAuth = cookieHeader.includes('reader_auth=passed_verification');

  if (hasAuth) {
    return; // 有通行证，放行（用户翻页无感知）
  }

  // 3. 拦截：返回验证页面（爬虫看到的是这个 HTML，不是真实章节内容）
  const verifyHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Check - Verify Connection</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #f4f6f9;
            color: #1e293b;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
        }
        .card {
            background: #ffffff;
            padding: 40px 32px;
            max-width: 440px;
            width: 100%;
            border-radius: 16px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
            text-align: center;
            border: 1px solid #e2e8f0;
        }
        .icon-container {
            width: 64px;
            height: 64px;
            background-color: #eff6ff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px auto;
        }
        .shield-icon {
            width: 28px;
            height: 28px;
            fill: #2563eb;
        }
        h2 {
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 12px 0;
            color: #0f172a;
            letter-spacing: -0.02em;
        }
        p {
            font-size: 14px;
            line-height: 1.6;
            color: #64748b;
            margin: 0 0 28px 0;
        }
        button {
            width: 100%;
            background-color: #2563eb;
            color: #ffffff;
            border: none;
            padding: 14px 24px;
            font-size: 15px;
            font-weight: 600;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
        }
        button:hover {
            background-color: #1d4ed8;
            box-shadow: 0 6px 12px -2px rgba(37, 99, 235, 0.3);
            transform: translateY(-1px);
        }
        button:active {
            transform: translateY(0);
            box-shadow: 0 2px 4px -1px rgba(37, 99, 235, 0.2);
        }
        .footer-note {
            font-size: 12px;
            color: #94a3b8;
            margin-top: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="icon-container">
            <svg class="shield-icon" viewBox="0 0 24 24">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM11 7h2v2h-2V7zm0 4h2v6h-2v-6z"/>
            </svg>
        </div>
        <h2>Verify You Are a Reader</h2>
        <p>Our system detected high traffic. Please click below to verify your connection and safely access the story. Thank you for supporting original web novels!</p>
        <button onclick="document.cookie='reader_auth=passed_verification; path=/; max-age=86400;'; location.reload();">
            I am a Human Reader
        </button>
        <div class="footer-note">
            <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24" style="margin-right:2px;">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
            </svg>
            Secure verification powered by DDOS Protection
        </div>
    </div>
</body>
</html>`;

  // 返回自定义的验证 HTML
  return new Response(verifyHtml, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

// 4. 只拦截章节页面，首页和小说目录页保持公开（有利于 SEO）
export const config = {
  matcher: ['/novels/:novel/:chapter'],
};