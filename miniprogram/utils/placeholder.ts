/**
 * 占位符图片生成工具
 * 用于生成本地 SVG 占位符,避免外部图片加载失败错误
 */

/**
 * 生成商品占位图
 * @param text 文字内容
 * @param width 宽度 (px)
 * @param height 高度 (px)
 * @returns Data URI 格式的 SVG 图片
 */
export function generateProductPlaceholder(
  text: string,
  width: number = 300,
  height: number = 300
): string {
  // 使用淡雅的渐变色
  const gradients = [
    { id: 'g1', start: '#667eea', end: '#764ba2' },
    { id: 'g2', start: '#f093fb', end: '#4facfe' },
    { id: 'g3', start: '#fa709a', end: '#fee140' },
    { id: 'g4', start: '#a8edea', end: '#fed6e3' },
    { id: 'g5', start: '#ffecd2', end: '#fcb69f' }
  ]
  
  // 根据文字内容选择渐变色
  const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const gradient = gradients[hash % gradients.length]
  
  const fontSize = Math.min(width, height) / 6
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <defs>
        <linearGradient id="${gradient.id}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${gradient.start}"/>
          <stop offset="100%" style="stop-color:${gradient.end}"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#${gradient.id})"/>
      <text 
        x="50%" 
        y="50%" 
        font-size="${fontSize}" 
        fill="white" 
        text-anchor="middle" 
        dominant-baseline="middle" 
        font-family="Arial, sans-serif"
        opacity="0.9"
      >${text}</text>
    </svg>
  `.trim()
  
  // 转换为 Data URI
  return 'data:image/svg+xml,' + encodeURIComponent(svg)
}

/**
 * 生成空状态占位图
 * @param icon emoji 图标
 * @param width 宽度
 * @param height 高度
 * @returns Data URI 格式的 SVG 图片
 */
export function generateEmptyPlaceholder(
  icon: string = '📦',
  width: number = 160,
  height: number = 160
): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect width="${width}" height="${height}" fill="#f7f8fa"/>
      <text 
        x="50%" 
        y="50%" 
        font-size="${width / 2}" 
        text-anchor="middle" 
        dominant-baseline="middle"
      >${icon}</text>
    </svg>
  `.trim()
  
  return 'data:image/svg+xml,' + encodeURIComponent(svg)
}

/**
 * 为图片 URL 添加容错处理
 * 如果图片 URL 为空、外部链接或加载失败,返回占位符
 * @param url 原始图片 URL
 * @param fallbackText 占位符文字
 * @returns 处理后的图片 URL
 */
export function safeImageUrl(url: string | null | undefined, fallbackText: string): string {
  // 空值检查
  if (!url || url.trim() === '') {
    return generateProductPlaceholder(fallbackText)
  }
  
  // 检测外部图片链接(via.placeholder.com, img.yzcdn.cn 等)
  // 这些链接在开发环境可能因为代理/网络问题加载失败
  const externalDomains = [
    'via.placeholder.com',
    'placeholder.com',
    'img.yzcdn.cn',
    'dummyimage.com',
    'lorempixel.com'
  ]
  
  const isExternal = externalDomains.some(domain => url.includes(domain))
  
  if (isExternal) {
    return generateProductPlaceholder(fallbackText)
  }
  
  return url
}
