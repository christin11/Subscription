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

// ── 1. 读取模板（GitHub 托管的 Clash_Templet.ini）────────────────────────
const template = $content
if (!template) throw new Error('模板内容为空')
log(`① 模板读取成功，长度 ${template.length}`)

// ── 2. 从 Sub-Store 拉取当前订阅的 Clash 节点 ───────────────────────────
log(`② 读取${type === 'collection' ? '组合' : ''}订阅: ${name}`)
let proxiesYaml = await produceArtifact({
  name,
  type,
  platform: 'Clash',
})
log(`② 节点数据获取成功，长度 ${proxiesYaml.length}`)

// Sub-Store 一般返回的是完整的：
// proxies:
//   - type: ss
//     ...
// 这里保持原样即可；如果没有 proxies: 头，就补一行
if (!/^proxies:/m.test(proxiesYaml)) {
  proxiesYaml = 'proxies:\n' + proxiesYaml
}

// ── 3. 组合最终 Clash 配置 ───────────────────────────────────────────────
// 直接把 proxies 块放在模板前面，模板里继续用 include-all/filter 做分组
let result = proxiesYaml.trimEnd() + '\n\n' + template.trimStart()

log('③ 合并完成')

// ── 4. 文件脚本用 $content 返回 ─────────────────────────────────────────
$content = result
log('🔚 结束')

function log(v) {
  console.log(`[🐱 Clash 模板脚本] ${v}`)
}
