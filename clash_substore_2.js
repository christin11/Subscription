// 极简版：只负责把节点订阅内容 + 模板拼起来
// 参数 name: Sub-Store 里的订阅 / 组合名
// 参数 type: 1 / col / 组合 → collection，其它 → subscription

log('🚀 开始')

let { type, name } = $arguments
log(`传入参数 type=${type}, name=${name}`)

if (!name) throw new Error('缺少参数 name，请在脚本链接后加 #name=你的订阅名')
type = /^1$|col|组合/i.test(type) ? 'collection' : 'subscription'

// 1. 模板内容（Clash_Temple1.ini）
let template = $content
if (!template) throw new Error('模板内容为空')
log(`① 模板读取成功，长度 ${template.length}`)

// 2. 从 Sub-Store 拉 Clash 节点（已经是完整 YAML）
log(`② 从 Sub-Store 拉取 ${type === 'collection' ? '组合' : '单'} 订阅: ${name}`)
let artifact = await produceArtifact({
  name,
  type,
  platform: 'Clash',
})
if (!artifact || !artifact.trim()) throw new Error('Sub-Store 返回的 Clash 内容为空')
log(`② 节点 YAML 获取成功，长度 ${artifact.length}`)

// 2.1 防御：如果模板里自带 proxies:，先删掉，避免双 proxies:
template = template.replace(
  /^proxies:[\s\S]*?(?=^(mode|log-level|dns|proxy-providers|proxy-groups|rule-providers|rules|http):)/m,
  ''
)

// 3. 合并：先是 Sub-Store 产出的 Clash，再是模板
let result = artifact.trimEnd() + '\n\n' + template.trimStart()
log('③ 合并完成')

// 4. 返回给 Sub-Store
$content = result
log('🔚 结束')

function log(msg) {
  console.log(`[Flyint Clash 模板脚本] ${msg}`)
}
