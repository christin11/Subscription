/**
 * @name Clash 完整配置转换
 * @description 自动生成代理组并注入模板
 */

async function operator(proxies) {
    if (!proxies || proxies.length === 0) return [];

    // 1. 获取所有节点名称
    const allProxyNames = proxies.map(p => p.name);

    // 2. 定义策略组 (这是 Clash 能够运行的关键)
    // Sub-Store 在 Mihomo/Clash 类型下支持返回一个包含 proxies 和 groups 的对象
    const groups = [
        {
            name: "🚀 节点选择",
            type: "select",
            proxies: ["URL-Test", ...allProxyNames]
        },
        {
            name: "URL-Test",
            type: "url-test",
            url: "http://www.gstatic.com/generate_204",
            interval: 300,
            proxies: allProxyNames
        },
        {
            name: "🎬 奈飞视频",
            type: "select",
            proxies: ["🚀 节点选择", ...allProxyNames]
        },
        {
            name: "境外媒体",
            type: "select",
            proxies: ["🚀 节点选择", ...allProxyNames]
        }
        // 你可以根据 Flyint.txt 里的 rules 需求继续添加组
    ];

    // 3. 返回给 Sub-Store
    // 这种格式会自动填充到 Clash 模板的对应位置
    return {
        proxies: proxies,
        groups: groups
    };
}
