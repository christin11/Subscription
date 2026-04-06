// Clash 模板注入脚本（文件脚本）
// 参数：name=订阅名称&type=collection（或 subscription）
//
// 脚本链接示例：
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
// - {"type":"ss",...}
// - {"type":"ss",...}
// 现在把这些 JSON 行转成标准 YAML
const lines = raw.split('\n').map(l => l.trim()).filter(Boolean)
const yamlProxyLines = []

for (const line of lines) {
  if (!line.startsWith('-')) continue

  // 取出 { ... } 这一部分
  const braceStart = line.indexOf('{')
  const braceEnd = line.lastIndexOf('}')
  if (braceStart === -1 || braceEnd === -1) continue

  const jsonText = line.slice(braceStart, braceEnd + 1)

  let obj
  try {
    obj = JSON.parse(jsonText)
  } catch (e) {
    log(`⚠️ 解析节点 JSON 失败，原始行：${line}`)
    continue
  }

  // 写入一条 YAML 节点
  yamlProxyLines.push('  -') // 开头的 -，后面再补 key/value

  for (const [key, value] of Object.entries(obj)) {
    const indent = '    ' // 两层缩进：2 空格列表 + 2 空格字段

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      // 简单处理 plugin-opts 这种对象：一层嵌套
      yamlProxyLines.push(`${indent}${key}:`)
      for (const [k2, v2] of Object.entries(value)) {
        yamlProxyLines.push(`${indent}  ${k2}: ${formatYamlScalar(v2)}`)
      }
    } else {
      yamlProxyLines.push(`${indent}${key}: ${formatYamlScalar(value)}`)
    }
  }
}

// 如果没解析出任何节点，就直接抛错
if (!yamlProxyLines.length) {
  throw new Error('未能从订阅中解析出任何节点，请检查 Sub-Store 输出')
}

// 拼成最终的 proxies: 块
const proxiesYaml = 'proxies:\n' + yamlProxyLines.join('\n')

// ── 3. 合并 proxies 块 + 模板 ────────────────────────────────────────────
const result = proxiesYaml.trimEnd() + '\n\n' + template.trimStart()
log('③ 合并完成')

// ── 4. 返回给 Sub-Store 作为最终订阅 ─────────────────────────────────────
$content = result
log('🔚 结束')

function formatYamlScalar(v) {
  // 数字 / 布尔值 直接输出
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (v === null || v === undefined) return 'null'

  // 其他一律当字符串，用双引号包一层，转义内部双引号和反斜杠
  const s = String(v)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
  return `"${s}"`
}

function log(v) {
  console.log(`[🐱 Clash 模板脚本] ${v}`)
}
