/**
 * @name Clash零简化脚本
 * @description 1:1 还原模板结构，不做任何策略组修改，仅填充节点
 */

async function operator(proxies) {
    // 1. 仅过滤掉非节点信息（如流量、有效期提示）
    const validProxies = proxies.filter(p => !/流量|重置|过期|套餐/.test(p.name));
    
    // 2. 直接返回节点数组。
    // Sub-Store 在 Mihomo/Clash 模式下，会自动将这些节点填入模板中所有 proxies: [] 的地方
    return validProxies;
}
