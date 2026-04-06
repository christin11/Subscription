// Clash 模板注入脚本（文件脚本）
log('🚀 开始执行脚本');

// ── 修改后的参数获取逻辑 ────────────────────────────────────────────────
let { type, name } = $arguments;

// 如果没有手动传 #name 参数，则尝试从 Sub-Store 的环境变量中自动获取
if (!name) {
    if (typeof $artifact !== 'undefined' && $artifact.name) {
        name = $artifact.name;
        log(`💡 未检测到 #name 参数，自动关联订阅名: ${name}`);
    } else {
        // 如果环境变量也拿不到，再报错（防止空运行）
        throw new Error('无法识别订阅名，请在脚本链接后手动添加 #name=你的订阅名');
    }
}

type = /^1$|col|组合/i.test(type) ? 'collection' : 'subscription';
log(`传入参数 type: ${type}, name: ${name}`);

// ── 1. 读取模板 ──────────────────────────────────────────────────────────
const template = $content;
if (!template) throw new Error('模板内容为空，请检查文件设置中的内容');
log(`① 模板读取成功，长度 ${template.length}`);

// ── 2. 拉取订阅节点（Clash 格式）────────────────────────────────────────
log(`② 读取${type === 'collection' ? '组合' : ''}订阅: ${name}`);
const proxiesYaml = await produceArtifact({
  name,
  type,
  platform: 'Clash',
});
log(`② 节点数据获取成功，长度 ${proxiesYaml.length}`);

// ── 3. 构建 proxy-providers 块 ───────────────────────────────────────────
// 保持你原有的 6 格缩进逻辑
const indentedProxies = proxiesYaml
  .split('\n')
  .filter(l => l.trim())
  .map(l => '      ' + l)
  .join('\n');

const providerBlock = `proxy-providers:\n  ${name}:\n    type: inline\n    proxies:\n${indentedProxies}`;
log(`③ proxy-providers 块构建完成`);

// ── 4. 注入模板，替换 proxy-providers 区块 ───────────────────────────────
let result = template;

// 检查模板中是否存在该占位符
if (result.includes('proxy-providers:')) {
    result = result.replace(/proxy-providers:[\s\S]*?(?=\n\n|\nrules:|$)/, providerBlock);
    log(`④ 已替换现有 proxy-providers 区块`);
} else {
    // 如果模板没写，则插在开头（或按需调整位置）
    result = providerBlock + '\n\n' + result;
    log(`④ 模板未发现占位符，已在开头插入 proxy-providers`);
}

// ── 5. 输出结果 ─────────────────────────────────────────────────────────
log('✅ 脚本执行完毕');
$content = result;
