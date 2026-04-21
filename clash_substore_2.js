
```javascript
/**
 * Clash 模板注入脚本 - 稳定修复版
 * 特点：补全全局/手动/自动注入，精准定位全局 proxies，解决异步陷阱
 */

async function operator(content, args) {
  // 1. 获取参数（兼容 name=机场名）
  const name = args.name || (typeof $arguments !== 'undefined' ? $arguments.name : null);
  if (!name) return content;

  // 2. 安全读取订阅缓存
  const target = $artifacts.find(a => a.name === name);
  if (!target) return content;

  const proxies = await target.getProxies();
  if (!proxies || proxies.length === 0) return content;

  // 3. 增强版匹配规则
  const regionMatch = {
    '🇭🇰 香港节点': ['香港', 'HK', 'Hong Kong', 'Hongkong', '🇭🇰'],
    '🇹🇼 台湾节点': ['台湾', '臺灣', 'TW', 'Taiwan', '新北', '彰化', '高雄', '🇹🇼'],
    '🇯🇵 日本节点': ['日本', 'JP', 'Japan', '东京', '大阪', '名古屋', '埼玉', '福冈', '🇯🇵'],
    '🇰🇷 韩国节点': ['韩国', '韓國', 'KR', 'K
