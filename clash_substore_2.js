// ============================================
// Clash 模板节点注入脚本 - SubStore 版
// ============================================
// 功能：将订阅中的代理节点智能分配到地区分组
// 使用：在 SubStore 中配置脚本参数 #name=订阅名称
// ============================================

log('🚀 开始处理 Clash 配置...')

// ── 1. 获取参数和模板 ──────────────────────
let { type, name } = $arguments
log(`📝 参数: name="${name}", type="${type}"`)

if (!name) {
  throw new Error('❌ 缺少参数 name，请在脚本链接后加 #name=你的订阅名')
}

type = /^1$|col|组合/i.test(type) ? 'collection' : 'subscription'
const template = $content
if (!template) throw new Error('❌ 模板内容为空')

// ── 2. 定义地区分组和匹配规则 ──────────────
const regionConfig = {
  '🇭🇰 香港节点': /(?i)香港|HK|Hong Kong|Hongkong/,
  '🇹🇼 台湾节点': /(?i)台湾|臺灣|TW|Taiwan/,
  '🇯🇵 日本节点': /(?i)日本|JP|Japan|東京|大阪|京都/,
  '🇰🇷 韩国节点': /(?i)韩国|韓國|KR|Korea|首尔|釜山/,
  '🇸🇬 新加坡节点': /(?i)新加坡|SG|Singapore|狮城/,
  '🇹🇭 泰国节点': /(?i)泰国|泰國|TH|Thailand|曼谷/,
  '🇺🇸 美国节点': /(?i)美国|美國|US|United States|美|洛杉矶|纽约|西雅图/,
  '🇩🇪 德国节点': /(?i)德国|德國|DE|Germany|柏林/,
  '🇬🇧 英国节点': /(?i)英国|英國|UK|United Kingdom|伦敦/
}

// ── 3. 拉取订阅中的代理节点（Clash 格式） ───
log('📥 拉取订阅节点...')
let proxiesYaml = await produceArtifact({
  name,
  type,
  platform: 'Clash',
})

if (!proxiesYaml) {
  throw new Error('❌ 无法拉取订阅节点，请检查订阅 URL 和参数')
}

// 解析 YAML 格式的 proxies
const proxyLines = proxiesYaml.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'))
const proxies = []

for (const line of proxyLines) {
  // 检查是否是代理项的开始 (name: "xxx")
  const nameMatch = line.match(/^\s*-\s+name:\s*["']?([^"']+)["']?/)
  if (nameMatch) {
    proxies.push(nameMatch[1].trim())
  }
}

log(`✅ 获取到 ${proxies.length} 个代理节点`)

if (proxies.length === 0) {
  log('⚠️  警告：未找到任何代理节点，继续处理...')
}

// ── 4. 分配节点到地区分组 ─────────────────
log('🌍 开始节点地区分配...')
const regionProxies = {}

// 初始化地区分组
Object.keys(regionConfig).forEach(region => {
  regionProxies[region] = []
})

// 智能分配节点
proxies.forEach(proxyName => {
  let assigned = false
  
  for (const [region, regex] of Object.entries(regionConfig)) {
    if (regex.test(proxyName)) {
      regionProxies[region].push(proxyName)
      log(`  ✓ "${proxyName}" → ${region}`)
      assigned = true
      break // 每个节点只分配到一个地区
    }
  }
  
  if (!assigned) {
    log(`  ℹ️  "${proxyName}" 未匹配任何地区（需要在节点名中包含地区信息）`)
  }
})

// ── 5. 注入代理到模板 ──────────────────────
log('📝 注入代理到模板...')
let result = template

for (const [region, nodeNames] of Object.entries(regionProxies)) {
  if (nodeNames.length === 0) continue
  
  // 找到地区分组的 proxies: [] 并替换
  const pattern = new RegExp(
    `(^\\s*-\\s+name:\\s*["']?${region.replace(/[.*+?^${}()|\\[\]\\]/g, '\\$&')}["']?\\s*(?:\\n|$)[\\s\\S]*?)(proxies:\\s*\\[\\])(\\s*(?:\\n|$))`,
    'gm'
  )
  
  // 构建替换的代理列表
  const proxyList = nodeNames.map(node => `\n      - "${node}"`).join('')
  const replacement = `$1proxies: [${proxyList}\n    ]$3`
  
  const originalResult = result
  result = result.replace(pattern, replacement)
  
  if (originalResult === result) {
    // 如果没有匹配到，可能是格式不同，尝试另一种方式
    log(`  ⚠️  未能匹配到 "${region}" 的 proxies 字段`)
  } else {
    log(`  ✓ ${region}: 注入 ${nodeNames.length} 个节点`)
  }
})

// ── 6. 在 proxies 部分添加所有节点（备份方案） ──
log('📦 更新全局 proxies 列表...')

// 生成 proxies 部分的完整内容
let allProxiesContent = ''
for (const line of proxyLines) {
  allProxiesContent += line + '\n'
}

// 替换 proxies: [] 为实际的节点列表
result = result.replace(
  /^proxies:\s*\[\]$/m,
  `proxies:\n${allProxiesContent}`
)

// ── 7. 输出结果 ───────────────────────────
log('✅ 处理完成')
log(`总计注入: ${proxies.length} 个节点`)
Object.entries(regionProxies).forEach(([region, nodes]) => {
  if (nodes.length > 0) {
    log(`  ${region}: ${nodes.length} 个节点`)
  }
})

$content = result
