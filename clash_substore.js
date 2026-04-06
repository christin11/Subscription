/**
 * Sub Store 文件脚本 - Clash 模板注入
 * ─────────────────────────────────────
 * 正确用法：文件脚本用 $content = 赋值，不用 $done()
 *
 * 参数编辑中添加：
 *   key:   name
 *   value: 你在 Sub Store 里的订阅或组合订阅名称
 *
 *   key:   type
 *   value: collection（组合订阅）或 subscription（单条订阅）
 */

async function main() {
  // ── 1. 解析参数 ─────────────────────────────────────────────────────────
  const args = parseArgument($argument);
  const name = args['name'];
  const type = args['type'] || 'collection';

  if (!name) throw new Error('缺少参数 name');

  // ── 2. 通过 produceArtifact 拉取节点（Sub Store 内置函数）───────────────
  // 这里拉 Clash 格式的节点列表（proxies 段）
  const proxies = await produceArtifact({
    type,           // 'subscription' 或 'collection'
    name,           // 订阅名称
    platform: 'Clash',
  });

  // proxies 是 YAML 格式的 proxies 列表字符串，例如：
  // - name: 节点1
  //   type: ss
  //   ...

  // ── 3. 构建 proxy-provider 块（用 inline 方式直接嵌入节点）────────────
  // 用 content 类型的 provider，把节点直接内嵌，不需要外部 URL
  const providerBlock = [
    'proxy-providers:',
    `  ${name}:`,
    '    type: inline',
    '    proxies:',
    // 把每行节点缩进到 proxies: 下面
    ...proxies.split('\n').filter(l => l.trim()).map(l => '      ' + l),
  ].join('\n');

  // ── 4. 注入到模板 ────────────────────────────────────────────────────────
  let template = $content;
  const pattern = /^proxy-providers:[\s\S]*?(?=^\w)/m;

  if (pattern.test(template)) {
    template = template.replace(pattern, providerBlock + '\n');
  } else {
    template = template.replace('proxy-groups:', providerBlock + '\nproxy-groups:');
  }

  // ── 5. 文件脚本用 $content 赋值返回 ─────────────────────────────────────
  $content = template;
}

function parseArgument(argument) {
  const result = {};
  if (!argument) return result;
  argument.split('&').forEach(pair => {
    const [key, ...rest] = pair.split('=');
    if (key) result[decodeURIComponent(key)] = decodeURIComponent(rest.join('='));
  });
  return result;
}

main().catch(err => {
  console.error('[clash_substore] ' + err.message);
  // 出错时不修改 $content，保持模板原样
});
