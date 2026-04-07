// Clash 模板注入脚本（文件脚本）
// 参数 name: Sub-Store 里的订阅 / 组合名
// 参数 type: 1 / col / 组合 → collection，其它 → subscription

log('🚀 开始')
let { type, name } = $arguments
log(`传入参数 type=${type}, name=${name}`)
if (!name) throw new Error('缺少参数 name，请在脚本链接后加 #name=你的订阅名')
type = /^1$|col|组合/i.test(type) ? 'collection' : 'subscription'

// 1. 读取模板
let template = $content
if (!template) throw new Error('模板内容为空')
log(`① 模板读取成功，长度 ${template.length}`)

// 2. 从 Sub-Store 拉取完整 Clash YAML
log(`② 从 Sub-Store 拉取 ${type === 'collection' ? '组合' : '单'} 订阅: ${name}`)
let artifact = await produceArtifact({ name, type, platform: 'Clash' })
if (!artifact || !artifact.trim()) throw new Error('Sub-Store 返回内容为空')
log(`② 节点 YAML 获取成功，长度 ${artifact.length}`)

// 3. 从 artifact 里只提取 proxies: 段
// proxies: 段从 "proxies:" 开始，到下一个顶级 key 结束
const proxiesMatch = artifact.match(/^(proxies:[\s\S]*?)(?=^\w)/m)
if (!proxiesMatch) throw new Error('artifact 中找不到 proxies: 段，订阅可能为空或格式异常')
const proxiesBlock = proxiesMatch[1].trimEnd()
log(`③ 提取 proxies 段成功，长度 ${proxiesBlock.length}`)

// 4. 把 proxies 段插入模板
// 模板里如果有旧的 proxies: 先删掉
template = template.replace(
  /^proxies:[\s\S]*?(?=^\w)/m,
  ''
)
// 插入到 proxy-providers: 之前
if (template.includes('proxy-providers:')) {
  template = template.replace('proxy-providers:', proxiesBlock + '\n\nproxy-providers:')
} else {
  template = template.replace('proxy-groups:', proxiesBlock + '\n\nproxy-groups:')
}
log('④ 注入完成')

$content = template
log('🔚 结束')

function log(msg) {
  console.log(`[🐱 Clash 模板脚本] ${msg}`)
}
