/**
 * Clash 模板注入脚本 - 极致兼容稳定版
 * 特点：补全不规范正则，解决内存溢出，适配多种参数读取方式
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

  // 3. 增强版匹配规则 (补全 Hongkong, Kingdom 及主流城市名)
  const regionMatch = {
    '🇭🇰 香港节点': ['香港', 'HK', 'Hong Kong', 'Hongkong', '🇭🇰'],
    '🇹🇼 台湾节点': ['台湾', '臺灣', 'TW', 'Taiwan', '新北', '彰化', '高雄', '🇹🇼'],
    '🇯🇵 日本节点': ['日本', 'JP', 'Japan', '东京', '大阪', '名古屋', '埼玉', '福冈', '🇯🇵'],
    '🇰🇷 韩国节点': ['韩国', '韓國', 'KR', 'Korea', '首尔', '春川', '🇰🇷'],
    '🇸🇬 新加坡节点': ['新加坡', 'SG', 'Singapore', '狮城', '🇸🇬'],
    '🇹🇭 泰国节点': ['泰国', '泰國', 'TH', 'Thailand', '曼谷', '🇹🇭'],
    '🇺🇸 美国节点': ['美国', '美國', 'US', 'United States', 'America', '圣何塞', '洛杉矶', '西雅图', '芝加哥', '纽约', '🇺🇸'],
    '🇩🇪 德国节点': ['德国', '德國', 'DE', 'Germany', '法兰克福', '柏林', '杜塞尔多夫', '🇩🇪'],
    '🇬🇧 英国节点': ['英国', '英國', 'UK', 'United Kingdom', 'Kingdom', 'Britain', 'GB', '伦敦', '🇬🇧']
  };

  // 4. 构建全局节点 YAML
  let proxiesYaml = "";
  proxies.forEach(p => {
    const { subStoreConfig, ...cleanProxy } = p;
    proxiesYaml += `  - ${JSON.stringify(cleanProxy)}\n`;
  });

  // 5. 执行模板替换
  let result = content;

  // 替换全局节点列表
  if (result.includes('proxies: []')) {
    result = result.replace('proxies: []', 'proxies:\n' + proxiesYaml);
  }

  // 分别注入各个地区分组
  for (const groupName in regionMatch) {
    const matchedNames = proxies
      .filter(p => {
        const n = p.name.toLowerCase();
        return regionMatch[groupName].some(k => n.includes(k.toLowerCase()));
      })
      .map(p => `      - "${p.name}"`);

    if (matchedNames.length > 0) {
      // 使用正则精准定位策略组名下的空 proxies: [] 并替换
      const groupRegex = new RegExp(`(name:\\s*"?${groupName}"?[\\s\\S]*?proxies:\\s*)\\[\\]`, 'g');
      result = result.replace(groupRegex, `$1\n${matchedNames.join('\n')}`);
    }
  }

  return result;
}

// Sub-Store 统一执行入口
if (typeof $content !== 'undefined') {
  operator($content, $arguments || {})
    .then(res => { $content = res; })
    .catch(() => { /* 即使出错也返回原内容，防止订阅中断 */ });
}
