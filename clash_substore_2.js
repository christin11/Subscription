/**
 * @name Clash完整修复脚本
 * @description 强制生成策略组以适配模板规则
 */

async function operator(proxies) {
    if (!proxies || proxies.length === 0) return [];

    // 1. 过滤掉流量信息等无效节点（可选，建议保留纯节点）
    const validProxies = proxies.filter(p => !p.name.includes("剩余流量") && !p.name.includes("重置"));
    const proxyNames = validProxies.map(p => p.name);

    // 2. 这里的组名必须和你 Flyint.txt 规则里的名字完全一致
    const groups = [
        { name: "🚀 节点选择", type: "select", proxies: ["自动选择", "DIRECT", ...proxyNames] },
        { name: "自动选择", type: "url-test", proxies: proxyNames, url: "http://www.gstatic.com/generate_204", interval: 300 },
        { name: "🎬 奈飞视频", type: "select", proxies: ["🚀 节点选择", "DIRECT", ...proxyNames] },
        { name: "🎬 迪士尼+", type: "select", proxies: ["🚀 节点选择", "DIRECT", ...proxyNames] },
        { name: "🎬 YouTube", type: "select", proxies: ["🚀 节点选择", "DIRECT", ...proxyNames] },
        { name: "🎬 Spotify", type: "select", proxies: ["🚀 节点选择", "DIRECT", ...proxyNames] },
        { name: "境外媒体", type: "select", proxies: ["🚀 节点选择", "DIRECT", ...proxyNames] },
        { name: "国内媒体", type: "select", proxies: ["DIRECT", "🚀 节点选择"] },
        { name: "电报信息", type: "select", proxies: ["🚀 节点选择", ...proxyNames] },
        { name: "苹果服务", type: "select", proxies: ["DIRECT", "🚀 节点选择", ...proxyNames] },
        { name: "谷歌服务", type: "select", proxies: ["🚀 节点选择", "DIRECT", ...proxyNames] },
        { name: "微软服务", type: "select", proxies: ["DIRECT", "🚀 节点选择", ...proxyNames] },
        { name: "漏网之鱼", type: "select", proxies: ["🚀 节点选择", "DIRECT", ...proxyNames] }
    ];

    // 3. 返回包含节点和组的对象
    return {
        proxies: validProxies,
        groups: groups
    };
}
