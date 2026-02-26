// ==========================================
// 再探！前端 API 配置
// ==========================================
// 部署后端后，将 API_BASE_URL 替换为你的后端地址
// 然后复制以下内容到 zaitan-h5/index.html 的 <script> 标签中

const CONFIG = {
  // 后端 API 地址
  // 本地开发: 'http://localhost:3000'
  // Vercel部署: 'https://your-project.vercel.app'
  // Railway部署: 'https://your-project.railway.app'
  API_BASE_URL: 'https://your-backend-url.vercel.app',
  
  // API 版本
  API_VERSION: '/api',
  
  // 完整 API 地址
  get API_URL() {
    return this.API_BASE_URL + this.API_VERSION;
  },
  
  // 微信登录配置（可选）
  WECHAT: {
    // 微信开放平台申请的 AppID
    APPID: 'wx[YOUR-WECHAT-APPID]',
    // 授权回调地址（需要与微信后台配置一致）
    REDIRECT_URI: encodeURIComponent('https://ronzhao-tech.github.io/zaitan-h5/wechat-callback')
  }
};

// 使用示例:
// fetch(`${CONFIG.API_URL}/auth/login`, {...})
