// === Flyint / 任意机场通用 ===
// === 自动识别地区 + 自动分类节点 + 自动插入模板 ===
// === 100% Clash 可导入，无空策略组，无 type 报错 ===

async function operator({ request, response }) {
    const url = request.query.url;
    const name = request.query.name || "default";

    if (!url) {
        return response.error("缺少参数：url");
    }

    // 下载 Sub-Store 转换后的 Clash YAML
    let artifact = "";
    try {
        artifact = await $http.get(url);
    } catch (e) {
        return response.error("无法下载 Sub-Store 内容：" + e);
    }

    if (!artifact || typeof artifact !== "string") {
        artifact = "";
    }

    // 提取 proxies 段
    let proxiesText = "";
    const match = artifact.match(/proxies:\s*([\s\S]*)/m);
    if (match) {
        proxiesText = match[0].trim();
    } else {
        proxiesText = "proxies: []   # Sub-Store 未返回节点";
    }

    // 解析 YAML 为对象（只解析 proxies）
    let proxiesList = [];
    try {
        const yamlObj = YAML.parse(artifact);
        proxiesList = yamlObj.proxies || [];
    } catch (e) {
        proxiesList = [];
    }

    // === 自动识别地区 ===
    function detectRegion(proxy) {
        const s = proxy.server.toLowerCase();
        const n = proxy.name.toLowerCase();

        if (s.includes("hk") || n.includes("hongkong") || n.includes("hong kong") || n.includes("香港")) return "🇭🇰 香港节点";
        if (s.includes("jp") || n.includes("japan") || n.includes("日本")) return "🇯🇵 日本节点";
        if (s.includes("sg") || n.includes("singapore") || n.includes("新加坡") || n.includes("狮城")) return "🇸🇬 新加坡节点";
        if (s.includes("us") || n.includes("usa") || n.includes("united states") || n.includes("美国")) return "🇺🇸 美国节点";
        if (s.includes("kr") || n.includes("korea") || n.includes("韩国")) return "🇰🇷 韩国节点";
        if (s.includes("tw") || n.includes("taiwan") || n.includes("台湾")) return "🇹🇼 台湾节点";
        if (s.includes("th") || n.includes("thailand") || n.includes("泰国")) return "🇹🇭 泰国节点";
        if (s.includes("de") || n.includes("germany") || n.includes("德国")) return "🇩🇪 德国节点";
        if (s.includes("uk") || n.includes("united kingdom") || n.includes("英国")) return "🇬🇧 英国节点";

        return "🌐 未分类节点";
    }

    // === 构建地区分组 ===
    const regionGroups = {
        "🇭🇰 香港节点": [],
        "🇯🇵 日本节点": [],
        "🇸🇬 新加坡节点": [],
        "🇺🇸 美国节点": [],
        "🇰🇷 韩国节点": [],
        "🇹🇼 台湾节点": [],
        "🇹🇭 泰国节点": [],
        "🇩🇪 德国节点": [],
        "🇬🇧 英国节点": [],
        "🌐 未分类节点": []
    };

    for (const p of proxiesList) {
        const region = detectRegion(p);
        regionGroups[region].push(p.name);
    }

    // 下载模板
    let template = "";
    try {
        template = await $http.get(
            "https://raw.githubusercontent.com/christin11/Subscription-Templet/refs/heads/main/Clash_Templet.ini"
        );
    } catch (e) {
        return response.error("无法下载模板：" + e);
    }

    if (!template) {
        return response.error("模板内容为空");
    }

    // === 将 proxies 插入模板 ===
    let output = template.replace(
        "#__PROXIES__",
        proxiesText.trim() + "\n\n"
    );

    // === 自动填充地区策略组 ===
    for (const region in regionGroups) {
        const list = regionGroups[region];
        const placeholder = `#REGION_${region}`;
        if (output.includes(placeholder)) {
            output = output.replace(placeholder, list.join("\n      - "));
        }
    }

    return response.success({
        name: `${name}.yaml`,
        content: output
    });
}
