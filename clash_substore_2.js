// === 完整修复版：保留全部分类 + 自动删除空组 + 删除未分类 ===

async function operator({ request, response }) {
    const url = request.query.url;
    const name = request.query.name || "default";

    if (!url) {
        return response.error("缺少参数：url");
    }

    let artifact = "";
    try {
        artifact = await $http.get(url);
    } catch (e) {
        return response.error("无法下载 Sub-Store 内容：" + e);
    }

    if (!artifact || typeof artifact !== "string") {
        artifact = "";
    }

    // 提取 proxies
    let proxiesText = "";
    const match = artifact.match(/proxies:\s*([\s\S]*)/m);
    if (match) {
        proxiesText = match[0].trim();
    } else {
        proxiesText = "proxies: []";
    }

    // 解析 proxies
    let proxiesList = [];
    try {
        const yamlObj = YAML.parse(artifact);
        proxiesList = yamlObj.proxies || [];
    } catch (e) {
        proxiesList = [];
    }

    // === 地区识别（完整保留）===
    function detectRegion(proxy) {
        const s = (proxy.server || "").toLowerCase();
        const n = (proxy.name || "").toLowerCase();

        if (s.includes("hk") || n.includes("hongkong") || n.includes("hong kong") || n.includes("香港")) return "🇭🇰 香港节点";
        if (s.includes("jp") || n.includes("japan") || n.includes("日本")) return "🇯🇵 日本节点";
        if (s.includes("sg") || n.includes("singapore") || n.includes("新加坡") || n.includes("狮城")) return "🇸🇬 新加坡节点";
        if (s.includes("us") || n.includes("usa") || n.includes("united states") || n.includes("美国")) return "🇺🇸 美国节点";
        if (s.includes("kr") || n.includes("korea") || n.includes("韩国")) return "🇰🇷 韩国节点";
        if (s.includes("tw") || n.includes("taiwan") || n.includes("台湾")) return "🇹🇼 台湾节点";
        if (s.includes("th") || n.includes("thailand") || n.includes("泰国")) return "🇹🇭 泰国节点";
        if (s.includes("de") || n.includes("germany") || n.includes("德国")) return "🇩🇪 德国节点";
        if (s.includes("uk") || n.includes("united kingdom") || n.includes("英国")) return "🇬🇧 英国节点";

        return null; // ❌ 不再使用“未分类”
    }

    // === 完整分组（与你原模板一致）===
    const regionGroups = {
        "🇭🇰 香港节点": [],
        "🇯🇵 日本节点": [],
        "🇸🇬 新加坡节点": [],
        "🇺🇸 美国节点": [],
        "🇰🇷 韩国节点": [],
        "🇹🇼 台湾节点": [],
        "🇹🇭 泰国节点": [],
        "🇩🇪 德国节点": [],
        "🇬🇧 英国节点": []
    };

    // === 分配节点（忽略未分类）===
    for (const p of proxiesList) {
        const region = detectRegion(p);
        if (region && regionGroups[region]) {
            regionGroups[region].push(p.name);
        }
    }

    // === 下载 YAML 模板 ===
    let template = "";
    try {
        template = await $http.get(
            "https://ghproxy.com/https://raw.githubusercontent.com/christin11/Subscription-Templet/refs/heads/main/Clash_Templet.yaml"
        );
    } catch (e) {
        return response.error("无法下载模板：" + e);
    }

    if (!template) {
        return response.error("模板内容为空");
    }

    // 插入 proxies
    let output = template.replace(
        "#__PROXIES__",
        proxiesText.trim() + "\n\n"
    );

    // === 核心：空分组直接删除 ===
    for (const region in regionGroups) {
        const list = regionGroups[region];
        const placeholder = `#REGION_${region}`;

        if (!output.includes(placeholder)) continue;

        if (list.length === 0) {
            // 删除整行占位（避免空 group）
            const regex = new RegExp(`.*${placeholder}.*\\n?`, "g");
            output = output.replace(regex, "");
        } else {
            // 正常填充
            output = output.replace(
                placeholder,
                list.map(p => `- ${p}`).join("\n      ")
            );
        }
    }

    return response.success({
        name: `${name}.yaml`,
        content: output
    });
}
