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

// 防御：如果模板里不小心带了顶层 proxies:，先整体删掉，避免重复
// 匹配从 "proxies:" 开始到下一个顶层键（mode/log-level/dns/...）之前的内容
template = template.replace(
  /^proxies:[\s\S]*?(?=^(mode|log-level|dns|proxy-providers|proxy-groups|rule-providers|rules|http):)/m,
  ''
)

// ── 2. 从 Sub-Store 拉 Clash 节点 ────────────────────────────────────────
log(`② 读取${type === 'collection' ? '组合' : ''}订阅: ${name}`)
let proxiesYaml = await produceArtifact({
  name,
  type,
  platform: 'Clash',
})
log(`② 节点数据获取成功，长度 ${proxiesYaml.length}`)

// Sub-Store 这边一般返回的是若干行：
// - { "type": "ss", ... }
// - { "type": "ss", ... }
//
// 如果没有带头部，就补上 "proxies:"；如果已经有 "proxies:" 就直接用
if (!/^proxies:/m.test(proxiesYaml)) {
  proxiesYaml = 'proxies:\n' + proxiesYaml
}

// 为了保证 YAML 干净，把结尾多余空行去掉
proxiesYaml = proxiesYaml.trimEnd()

// ── 3. 组合最终 Clash 配置：proxies 块 + 模板────────────────────────────
const result = proxiesYaml + '\n\n' + template.trimStart()
log('③ 合并完成')

// ── 4. 返回给 Sub-Store 作为最终订阅 ─────────────────────────────────────
$content = result
log('🔚 结束')

function log(v) {
  console.log(`[🐱 Clash 模板脚本] ${v}`)
}
