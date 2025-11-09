// ===== 独立广告点击检测系统 =====
// 纯监控上报，不干扰任何现有逻辑

class AdClickDetector {
    constructor() {
        // 检测PC环境，只在移动端运行
        this.isMobile = this.detectMobile();
        
        if (!this.isMobile) {
            console.log('Ad Click Detector: PC环境，不启动检测');
            return;
        }
        
        // 配置
        this.REPORT_URL = 'https://script.google.com/macros/s/AKfycbzYA0Fe1-_ihK8E44GHmTrVQBYgjKkNM39sdGpl0DrdhOWxTaaaowf3eEvLXxbq08i1ug/exec';
        
        // 获取历史累计点击次数（永久累加）
        this.totalClickCount = this.getTotalClickCount();
        
        // 当前页面触摸状态
        this.touchData = {
            startTime: 0,
            startX: 0,
            startY: 0,
            isTouching: false,
            moved: false,
            adElement: null
        };
        
        this.init();
    }
    
    // 检测是否为移动设备
    detectMobile() {
        const userAgent = navigator.userAgent.toLowerCase();
        const mobileKeywords = ['mobile', 'android', 'iphone', 'ipad', 'ipod'];
        const isMobile = mobileKeywords.some(keyword => userAgent.includes(keyword));
        const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isSmallScreen = window.screen.width < 1024;
        
        return isMobile || hasTouchScreen || isSmallScreen;
    }
    
    // 获取历史累计点击次数
    getTotalClickCount() {
        const stored = localStorage.getItem('adClickTotalCount');
        return stored ? parseInt(stored) : 0;
    }
    
    // 保存累计点击次数
    saveTotalClickCount() {
        localStorage.setItem('adClickTotalCount', this.totalClickCount.toString());
    }
    
    // 初始化检测
    init() {
        console.log('Ad Click Detector: 初始化完成，历史累计点击:', this.totalClickCount);
        this.setupAdMonitoring();
    }
    
    // 监控所有广告容器
    setupAdMonitoring() {
        // 定期检查新广告
        const checkForAds = () => {
            const adElements = document.querySelectorAll('[id^="div-gpt-ad-"]');
            adElements.forEach(ad => {
                if (!ad.dataset.clickDetectorMonitored) {
                    ad.dataset.clickDetectorMonitored = 'true';
                    this.attachClickDetection(ad);
                }
            });
        };
        
        checkForAds();
        setInterval(checkForAds, 2000);
    }
    
    // 为广告元素附加点击检测（只检测正常广告区域，不检测遮罩）
    attachClickDetection(adElement) {
        // 为每个广告元素单独创建触摸数据追踪
        const adTouchData = {
            startTime: 0,
            startX: 0,
            startY: 0,
            isTouching: false,
            moved: false
        };
        
        // 触摸开始 - 只记录50px以下的触摸
        adElement.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            const adRect = adElement.getBoundingClientRect();
            const relativeY = touch.clientY - adRect.top;
            
            // 只有点击在50px以下才记录触摸数据
            if (relativeY > 50) {
                adTouchData.startTime = Date.now();
                adTouchData.startX = touch.clientX;
                adTouchData.startY = touch.clientY;
                adTouchData.isTouching = true;
                adTouchData.moved = false;
            }
        }, { passive: true });
        
        // 触摸移动（检测是否滑动）
        adElement.addEventListener('touchmove', (e) => {
            if (!adTouchData.isTouching) return;
            
            const touch = e.touches[0];
            const moveX = Math.abs(touch.clientX - adTouchData.startX);
            const moveY = Math.abs(touch.clientY - adTouchData.startY);
            
            // 移动超过10px视为滑动
            if (moveX > 10 || moveY > 10) {
                adTouchData.moved = true;
            }
        }, { passive: true });
        
        // 触摸结束（只处理正常广告区域的点击）
        adElement.addEventListener('touchend', (e) => {
            if (!adTouchData.isTouching) return;
            
            const touchDuration = Date.now() - adTouchData.startTime;
            
            // 点击判定：未移动 + 持续时间50-500ms
            if (!adTouchData.moved && touchDuration > 50 && touchDuration < 500) {
                // 上报为正常广告点击
                this.onAdClickDetected('touchend', adElement, touchDuration, 'normal_ad');
            }
            
            // 延迟重置 isTouching，给 blur/visibilitychange 一点时间触发
            setTimeout(() => {
                adTouchData.isTouching = false;
            }, 100);
        }, { passive: true });
        
        // 触摸取消
        adElement.addEventListener('touchcancel', () => {
            adTouchData.isTouching = false;
        }, { passive: true });
        
        // 页面失焦检测（广告跳转）- 只在当前广告有触摸时触发
        const blurHandler = () => {
            if (adTouchData.isTouching) {
                this.onAdClickDetected('blur', adElement, 0, 'normal_ad');
                adTouchData.isTouching = false;
            }
        };
        window.addEventListener('blur', blurHandler);
        
        // 页面可见性变化（切换应用/标签页）- 只在当前广告有触摸时触发
        const visibilityHandler = () => {
            if (document.hidden && adTouchData.isTouching) {
                this.onAdClickDetected('visibilitychange', adElement, 0, 'normal_ad');
                adTouchData.isTouching = false;
            }
        };
        document.addEventListener('visibilitychange', visibilityHandler);
    }
    
    // 检测到广告点击
    onAdClickDetected(method, adElement, duration, clickArea = 'normal_ad') {
        // 累加点击次数
        this.totalClickCount++;
        this.saveTotalClickCount();
        
        console.log(`🎯 Ad Click Detector: 检测到广告点击！第${this.totalClickCount}次 (方式:${method}, 区域:${clickArea}, 耗时:${duration}ms)`);
        
        // 上报数据到 Google Sheets
        this.reportAdClick(method, adElement, clickArea);
        
        // 上报数据到 Facebook Pixel
        this.reportToFacebookPixel(method, adElement, duration, clickArea);
    }
    
    // 遮罩点击上报（由 chapter.html 调用）
    reportOverlayClick(adElement, duration) {
        this.onAdClickDetected('overlay_touchend', adElement, duration, 'overlay');
    }
    
    // 上报广告点击事件
    async reportAdClick(detectionMethod, adElement, clickArea) {
        try {
            // 获取IP地址
            const userIP = await this.getUserIP();
            
            // 获取设备信息
            const deviceInfo = this.getDeviceInfo();
            
            const data = {
                eventType: 'ad_click_detected',
                page: window.location.href,
                deviceInfo: deviceInfo,
                userIP: userIP,
                totalClickCount: this.totalClickCount,
                detectionMethod: detectionMethod,
                clickArea: clickArea, // 新增：点击区域（overlay 或 normal_ad）
                adElementId: adElement.id || 'unknown',
                timestamp: new Date().toISOString()
            };
            
            console.log('Ad Click Detector: 上报数据', data);
            
            fetch(this.REPORT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            }).then(() => {
                console.log('Ad Click Detector: 上报成功');
            }).catch(error => {
                console.log('Ad Click Detector: 上报失败', error);
            });
            
        } catch (error) {
            console.error('Ad Click Detector: 上报异常', error);
        }
    }
    
    // 上报广告点击到 Facebook Pixel
    reportToFacebookPixel(detectionMethod, adElement, duration, clickArea) {
        try {
            // 检查 Facebook Pixel 是否可用
            if (typeof fbq === 'undefined') {
                console.log('Ad Click Detector: Facebook Pixel 未加载');
                return;
            }
            
            // 3天内只上报一次（72小时防重复机制）
            if (!this.shouldTrackFBEvent('user_c')) {
                console.log('Ad Click Detector: Facebook Pixel user_c 事件在3天内已上报，跳过');
                return;
            }
            
            // 获取当前页面信息
            const pageUrl = window.location.href;
            const pagePath = window.location.pathname;
            
            // 提取章节信息（如果有）
            let chapterInfo = 'unknown';
            const chapterMatch = pageUrl.match(/chapter-(\d+)\.html/);
            if (chapterMatch) {
                chapterInfo = `chapter-${chapterMatch[1]}`;
            }
            
            // 提取小说名称
            let novelName = 'unknown';
            const novelMatch = pageUrl.match(/novels\/([^/]+)\//);
            if (novelMatch) {
                novelName = novelMatch[1];
            }
            
            // 构建上报数据
            const eventData = {
                // 基础信息
                click_count: this.totalClickCount,
                detection_method: detectionMethod,
                click_area: clickArea, // 新增：点击区域（overlay 或 normal_ad）
                touch_duration: duration,
                
                // 页面信息
                novel_name: novelName,
                chapter_info: chapterInfo,
                page_url: pageUrl,
                
                // 广告信息
                ad_element_id: adElement.id || 'unknown',
                
                // 设备信息
                device_type: this.getSimpleDeviceType(),
                screen_width: window.screen.width,
                screen_height: window.screen.height,
                
                // 时间信息
                timestamp: new Date().toISOString(),
                local_time: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
            };
            
            // 发送自定义事件 user_c 到 Facebook
            fbq('trackCustom', 'user_c', eventData);
            
            console.log('🎯 Ad Click Detector: Facebook Pixel 上报成功 (user_c)', eventData);
            
        } catch (error) {
            console.error('Ad Click Detector: Facebook Pixel 上报失败', error);
        }
    }
    
    // Facebook事件3天内防重复检测（72小时机制）
    shouldTrackFBEvent(eventName) {
        const now = new Date();
        const currentPeriod = Math.floor(now.getTime() / (3 * 24 * 60 * 60 * 1000));
        const storageKey = `fb_event_${eventName}`;
        const lastTrackedPeriod = localStorage.getItem(storageKey);
        
        if (!lastTrackedPeriod || parseInt(lastTrackedPeriod) !== currentPeriod) {
            localStorage.setItem(storageKey, currentPeriod.toString());
            return true;
        }
        
        return false;
    }
    
    // 获取简化的设备类型
    getSimpleDeviceType() {
        const ua = navigator.userAgent;
        if (/iPhone/.test(ua)) return 'iPhone';
        if (/iPad/.test(ua)) return 'iPad';
        if (/Android/.test(ua)) return 'Android';
        return 'Other';
    }
    
    // 获取用户IP
    async getUserIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json', {
                method: 'GET',
                cache: 'no-cache'
            });
            const data = await response.json();
            return data.ip || 'Unknown';
        } catch (error) {
            return 'Unknown';
        }
    }
    
    // 获取设备信息
    getDeviceInfo() {
        const ua = navigator.userAgent;
        const platform = navigator.platform || 'Unknown';
        const screenSize = `${window.screen.width}x${window.screen.height}`;
        
        // 简化的设备信息
        let deviceType = 'Unknown';
        if (/iPhone/.test(ua)) deviceType = 'iPhone';
        else if (/iPad/.test(ua)) deviceType = 'iPad';
        else if (/Android/.test(ua)) deviceType = 'Android';
        
        return `${deviceType} | ${platform} | ${screenSize}`;
    }
}

// 自动初始化（页面加载完成后）
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.adClickDetector = new AdClickDetector();
    });
} else {
    window.adClickDetector = new AdClickDetector();
}
