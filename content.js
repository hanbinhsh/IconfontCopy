// content.js - 多色高清修复版

// 1. 创建提示框
const toast = document.createElement('div');
toast.className = 'copy-toast';
document.body.appendChild(toast);

function showToast(msg, type = 'success') {
    toast.textContent = msg;
    toast.style.opacity = '1';
    toast.style.backgroundColor = type === 'success' ? '#333' : '#f5222d';
    setTimeout(() => { toast.style.opacity = '0'; }, 2000);
}

// 2. 将 SVG 转换为 Canvas 并写入剪贴板
async function convertAndCopy(svgElement) {
    return new Promise((resolve, reject) => {
        // --- 核心修复：基于 DOM 操作而不是正则替换 ---
        
        // 1. 克隆节点，防止修改页面原本的显示
        const clone = svgElement.cloneNode(true);
        
        // 2. 强制设置高清尺寸 (1000x1000)
        clone.setAttribute('width', '1000');
        clone.setAttribute('height', '1000');
        clone.removeAttribute('style'); // 移除可能限制大小的 style
        clone.style.overflow = 'visible'; // 防止某些图标被裁剪

        // 3. 处理颜色 (智能模式)
        // 获取页面上该图标原本显示的文字颜色 (用于替换 currentColor)
        const computedStyle = window.getComputedStyle(svgElement);
        const parentColor = computedStyle.color || '#000000';

        // 遍历克隆出来的 SVG 内部所有元素
        const allElements = clone.querySelectorAll('*');
        
        // 这里的逻辑是：
        // 如果元素明确指定了颜色(如 #FF0000)，我们不动它。
        // 如果元素是 currentColor，或者是空的(继承)，我们才给它上色。
        allElements.forEach(el => {
            const fill = el.getAttribute('fill');
            const stroke = el.getAttribute('stroke');

            // 处理填充色
            if (fill === 'currentColor') {
                el.setAttribute('fill', parentColor);
            }
            // 处理描边色
            if (stroke === 'currentColor') {
                el.setAttribute('stroke', parentColor);
            }
        });

        // 4. 序列化为字符串
        const serializer = new XMLSerializer();
        let svgString = serializer.serializeToString(clone);

        // 确保有命名空间
        if (!svgString.includes('xmlns=')) {
            svgString = svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        
        // 转换为 Base64
        const base64Svg = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svgString)));
        
        // 5. 绘图
        const img = new Image();
        img.onload = function() {
            try {
                const canvas = document.createElement('canvas');
                // 保持 1000x1000 高清分辨率
                canvas.width = 1000;
                canvas.height = 1000;
                const ctx = canvas.getContext('2d');
                
                ctx.drawImage(img, 0, 0);
                
                canvas.toBlob(async (blob) => {
                    if (!blob) {
                        reject(new Error('Canvas 转换失败'));
                        return;
                    }
                    try {
                        const item = new ClipboardItem({ 'image/png': blob });
                        await navigator.clipboard.write([item]);
                        resolve();
                    } catch (err) {
                        reject(err);
                    }
                }, 'image/png');
                
            } catch (e) {
                reject(e);
            }
        };

        img.onerror = (e) => reject(new Error('图片加载失败'));
        img.src = base64Svg;
    });
}

// 3. 核心触发逻辑
async function handleCopy(liElement) {
    try {
        const svgEl = liElement.querySelector('svg');
        if (!svgEl) {
            showToast('未找到图标', 'error');
            return;
        }

        // 处理 <use> 标签的情况 (针对 Shadow DOM 图标)
        // 如果是 use 标签，我们需要把原来定义的 symbol 内容取出来
        // 替换当前的 svgEl，然后再传给 convertAndCopy
        const useTag = svgEl.querySelector('use');
        let targetSvg = svgEl;
        
        if (useTag) {
            const symbolId = useTag.getAttribute('xlink:href') || useTag.getAttribute('href');
            if (symbolId) {
                const symbolEl = document.querySelector(symbolId);
                if (symbolEl) {
                    // 创建一个新的 SVG 来包裹 Symbol 的内容
                    const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                    tempSvg.innerHTML = symbolEl.innerHTML;
                    
                    // 复制 viewBox
                    const viewBox = symbolEl.getAttribute('viewBox');
                    if (viewBox) tempSvg.setAttribute('viewBox', viewBox);
                    
                    targetSvg = tempSvg; 
                }
            }
        }

        showToast('正在生成高清图...', 'success');
        
        // 传入 DOM 节点进行处理
        await convertAndCopy(targetSvg);
        
        showToast('✅ 已复制 (保留原色)', 'success');

    } catch (err) {
        console.error('Copy Error:', err);
        showToast('❌ 出错: ' + err.message, 'error');
    }
}

// 4. 监听 DOM
const observer = new MutationObserver((mutations) => {
    const actionBars = document.querySelectorAll('.icon-cover:not(.has-copy-plugin)');

    actionBars.forEach(bar => {
        bar.classList.add('has-copy-plugin');

        const copyBtn = document.createElement('span');
        copyBtn.className = 'cover-item iconfont cover-item-line plugin-copy-btn'; 
        copyBtn.title = '复制高清图片到 PPT';
        copyBtn.style.fontSize = '16px';
        
        // 图标保持不变
        copyBtn.innerHTML = `
            <svg viewBox="0 0 1024 1024" width="1em" height="1em" fill="currentColor" style="vertical-align: -0.15em;">
                <path d="M720 192h-544A80.096 80.096 0 0 0 96 272v608C96 924.128 131.904 960 176 960h544c44.128 0 80-35.872 80-80v-608C800 227.904 764.128 192 720 192z m16 688c0 8.8-7.2 16-16 16h-544a16.032 16.032 0 0 1-16-16v-608a16.032 16.032 0 0 1 16-16h544c8.8 0 16 7.2 16 16v608z" />
                <path d="M848 64h-544a32 32 0 0 0 0 64h544a16.032 16.032 0 0 1 16 16v608a32 32 0 1 0 64 0v-608C928 99.904 892.128 64 848 64z" />
            </svg>
        `;

        copyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const liElement = bar.closest('li');
            if (liElement) handleCopy(liElement);
        });

        bar.appendChild(copyBtn);
    });
});

observer.observe(document.body, { childList: true, subtree: true });