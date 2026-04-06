// Clash 模板注入脚本（文件脚本）
// 参数：name=订阅名称&type=collection（或 subscription）
//
// 脚本链接示例：
// https://raw.githubusercontent.com/christin11/Subscription-Templet/refs/heads/main/clash_substore.js#name=我的机场&type=collection

log('🚀 开始')

let { type, name } = $arguments
log(`传入参数 type: ${type}, name: ${name}`)

if (!name) throw new Error('缺少参数 name，请在脚本链接后加 #name=你的订阅名')
type = /^1$|col|组合/i.test(type) ? 'collection' : 'subscription'

// ── 1. 读取模板 ──────────────────────────────────────────────────────────
const template = $content
if (!template) throw new Error('模板内容为空')
log(`① 模板读取成功，长度 ${template.length}`)

// ── 2. 拉取订阅节点（Clash 格式）────────────────────────────────────────
log(`② 读取${type === 'collection' ? '组合' : ''}订阅: ${name}`)
let proxiesYaml = await produceArtifact({
  name,
  type,
  platform: 'Clash',
})
log(`② 节点数据获取成功，长度 ${proxiesYaml.length}`)

// ── 2.1 去掉顶层的 `proxies:` 头，只保留节点列表 ───────────────────────
// 一般形如：
// proxies:
//   - name: xxx
//     type: ss
//   - name: yyy
//     ...
proxiesYaml = proxiesYaml.replace(/^proxies:\s*\n/, '')

// ── 3. 构建 proxy-providers 块 ───────────────────────────────────────────
// 现在 proxiesYaml 理论上是：
// - name: 节点1
//   type: ss
// - name: 节点2
//   ...
// 我们把每一行缩进 6 个空格，塞到 inline provider 里
const indentedProxies = proxiesYaml
  .split('\n')
  .filter(l => l.trim())           // 去掉空行
  .map(l => '      ' + l)          // 每行前加 6 个空格
  .join('\n')

// 用一个唯一一点的名字，避免和别的脚本冲突
const clashTemplateProviderBlock = `proxy-providers:
  ${name}:
    type: inline
    proxies:
${indentedProxies}
`
log(`③ proxy-providers 块构建完成`)

// ── 4. 注入模板，替换 proxy-providers 区块 ───────────────────────────────
let result = template

// 模板里现在是： proxy-providers: {}
// 后面紧跟 proxy-groups:，我们把这一小段整体替换掉
const pattern = /^proxy-providers:.*?(?=^[a-zA-Z])/ms
if (pattern.test(result)) {
  result = result.replace(pattern, clashTemplateProviderBlock)
} else {
  // 模板里没有 proxy-providers，就在 proxy-groups: 前面插入
  result = result.replace('proxy-groups:', clashTemplateProviderBlock + 'proxy-groups:')
}
log(`④ 注入完成`)

// ── 5. 文件脚本用 $content 赋值返回 ─────────────────────────────────────
$content = result
log('🔚 结束')

function log(v) {
  console.log(`[🐱 Clash 模板脚本] ${v}`)
}
