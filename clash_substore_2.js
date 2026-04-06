/**
 * @name Clash 订阅转换脚本
 * @description 引用 Sub-Store 订阅并注入 Clash 模板
 */

async function operator(proxies) {
    // 确保有节点输入，否则返回空数组防止崩溃
    if (!proxies || proxies.length === 0) {
        console.log("未检测到有效节点 [cite: 329]");
        return [];
    }
    
    // 这里可以添加你的节点过滤或重命名逻辑
    return proxies.map(p => {
        p.name = p.name.replace(/订阅|机场/g, ""); // 示例：净化节点名
        return p;
    });
}

// 修复会导致重启的退出逻辑
try {
    // Sub-Store 内部变量名为 $proxies
    $done(operator($proxies)); 
} catch (e) {
    console.log("脚本执行出错: " + e);
    $done([]); // 出错时返回空，确保服务不重启
}
