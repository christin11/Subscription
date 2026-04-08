// Clash 模板节点注入脚本 - SubStore 版（最小化版本）

let { type, name } = $arguments
if (!name) throw new Error('缺少参数 name')

type = /^1$|col|组合/i.test(type) ? 'collection' : 'subscription'

const template = $content
if (!template) throw new Error('模板为空')

// 地区匹配
const regionMatch = {
  '🇭🇰 香港节点': ['香港', 'hk'],
  '🇹🇼 台湾节点': ['台湾', '臺灣', 'tw'],
  '🇯🇵 日本节点': ['日本', 'jp'],
  '🇰🇷 韩国节点': ['韩国', '韓國', 'kr'],
  '🇸🇬 新加坡节点': ['新加坡', 'sg'],
  '🇹🇭 泰国节点': ['泰国', '泰國', 'th'],
  '🇺🇸 美国节点': ['美国', '美國', 'us'],
  '🇩🇪 德国节点': ['德国', '德國', 'de'],
  '🇬🇧 英国节点': ['英国', '英國', 'uk']
}

// 拉取节点
const proxiesYaml = await produceArtifact({
  name,
  type,
  platform: 'Clash',
})

if (!proxiesYaml) throw new Error('无法获取订阅')

// 解析节点
const proxies = []
const yamlLines = proxiesYaml.split('\n')
for (const line of yamlLines) {
  if (line.includes('name:')) {
    const match = line.match(/name:\s*["']?([^"'\n]+)["']?/)
    if (match) {
      proxies.push(match[1].trim())
    }
  }
}

// 分配节点到地区
const regionProxies = {}
for (const region in regionMatch) {
  regionProxies[region] = []
}

for (const proxy of proxies) {
  const proxyLower = proxy.toLowerCase()
  
  for (const region in regionMatch) {
    for (const keyword of regionMatch[region]) {
      if (proxyLower.includes(keyword.toLowerCase())) {
        regionProxies[region].push(proxy)
        break
      }
    }
  }
}

// 更新模板内容
let result = template

// 第一步：更新全局 proxies 列表
result = result.replace('proxies: []', 'proxies:\n' + proxiesYaml)

// 第二步：更新各地区的 proxies 列表
for (const region in regionProxies) {
  const nodes = regionProxies[region]
  if (nodes.length === 0) continue
  
  // 构建节点字符串
  let nodeStr = ''
  for (const node of nodes) {
    nodeStr += '\n      - "' + node + '"'
  }
  
  // 找到该地区分组并替换其 proxies: []
  const regionLine = 'name: ' + region
  if (result.includes(regionLine)) {
    const startIdx = result.indexOf(regionLine)
    const afterRegion = result.substring(startIdx)
    
    const proxiesMatch = afterRegion.match(/proxies:\s*\[\]/)
    if (proxiesMatch) {
      const matchStart = startIdx + proxiesMatch.index
      const matchEnd = matchStart + proxiesMatch[0].length
      
      const beforePart = result.substring(0, matchStart)
      const afterPart = result.substring(matchEnd)
      
      result = beforePart + 'proxies: [' + nodeStr + '\n    ]' + afterPart
    }
  }
}

$content = result
