// Clash 模板注入脚本（修复 regionGroups 未定义问题）
// 参数：name=订阅名称&type=collection（或 subscription）

log('🚀 开始注入流程')

let { type, name } = $arguments
log(`传入参数 type: ${type}, name: ${name}`)

if (!name) throw new Error('缺少参数 name，请在脚本链接后加 #name=你的订阅名')
type = /^1$|col|组合/i.test(type) ? 'collection' : 'subscription'

// ── 1. 定义区域分组名称（必须与 YAML 模板中的 name 一致） ──
const regionGroups = [
  "🇭🇰 香港节点",
  "🇹🇼 台湾节点",
  "🇯🇵 日本节点",
  "🇰🇷 韩国节点",
  "🇸🇬 新加坡节点",
  "🇹🇭 泰国节点",
  "🇺🇸 美国节点",
  "🇩🇪 德国节点",
  "🇬🇧 英国节点"
];

// ── 2. 读取模板 ──────────────────────────────────────────
const template = $content
if (!template) throw new Error('模板内容为空')

// ── 3. 拉取订阅节点（Clash 格式） ───────────────────────
const proxiesYaml = await produceArtifact({
  name,
  type,
  platform: 'Clash',
})

// ── 4. 构建 proxy-providers 块 ──────────────────────────
const indentedProxies = proxiesYaml
  .split('\n')
  .filter(l => l.trim())
  .map(l => '      ' + l)
  .join('\n')

const providerBlock = `proxy-providers:\n  ${name}:\n    type: inline\n    proxies:\n${indentedProxies}`

// ── 5. 注入模板逻辑 ─────────────────────────────────────
let result = template

// A. 替换占位符或追加 provider 块
if (result.includes('proxy-providers:')) {
  result = result.replace(/proxy-providers:[\s\S]*/, providerBlock)
} else {
  result += `\n\n${providerBlock}`
}

// B. 自动将订阅名注入到各个地区分组中（解决 include-all 匹配问题）
// 遍历 regionGroups，确保每个分组的 use 列表里都有这个订阅名
regionGroups.forEach(groupName => {
  const groupRegex = new RegExp(`name:\\s*"?${groupName}"?[\\s\\S]*?use:`, 'g')
  if (result.match(groupRegex)) {
    // 如果已有 use 字段，则把订阅名加进去
    const replaceRegex = new RegExp(`(name:\\s*"?${groupName}"?[\\s\\S]*?use:\\s*\\[)(.*?)(\\])`, 'g')
    result = result.replace(replaceRegex, (match, p1, p2, p3) => {
      if (p2.includes(name)) return match; // 已存在则不添加
      const comma = p2.trim().length > 0 ? ', ' : '';
      return `${p1}${p2}${comma}${name}${p3}`;
    });
  }
})

log(`✅ 注入完成，订阅 [${name}] 已加入区域分组`)
$content = result
