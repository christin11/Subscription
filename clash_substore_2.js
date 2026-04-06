// Clash 模板注入脚本（文件脚本）
// 参数：name=订阅名称&type=collection（或 subscription）
//
// 用法示例：
// https://raw.githubusercontent.com/christin11/Subscription-Templet/refs/heads/main/clash_substore_2.js#name=我的机场&type=collection

log('🚀 开始')

let { type, name } = $arguments
log(`传入参数 type: ${type}, name: ${name}`)

if (!name) throw new Error('缺少参数 name，请在脚本链接后加 #name=你的订阅名')
type = /^1$|col|组合/i.test(type) ? 'collection' : 'subscription'

// ── 1. 读取模板（Clash_Templet.ini 内容）──────────────────────────────────
let template = $content
if (!template) throw new Error('模板内容为空')
log(`① 模板读取成功，长度 ${template.length}`)

// 防御：如果模板里自己带了 proxies: 块，先删掉，避免重复 key
template = template.replace(
  /^proxies:[\s\S]*?(?=^(mode|log-level|dns|proxy-providers|proxy-groups|rule-providers|rules|http):)/m,
  ''
)

// ── 2. 从 Sub-Store 拉 Clash 节点（JSON inline 形式）────────────────────
log(`② 读取${type === 'collection' ? '组合' : ''}订阅: ${name}`)
let raw = await produceArtifact({
  name,
  type,
  platform: 'Clash',
})
log(`② 节点数据获取成功，长度 ${raw.length}`)

// 期望 raw 大致长这样：
// proxies:
//   - {"type":"ss",...}
//   - {"type":"ss",...}
// 或者：
//   - {"type":"ss",...}
//   - {"type":"ss",...}

raw = raw.trim()

// 去掉可能存在的开头 "proxies:" 行，只保留后面的 - {...}
if (raw.startsWith('proxies:')) {
  raw = raw.replace(/^proxies:\s*/m, '')
}

// 拆行，每一行应该是一个 `- {...}` 节点
const
