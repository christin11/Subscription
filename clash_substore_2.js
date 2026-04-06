/**
 * @name Clash订阅转换
 * @description 引用Sub-Store订阅并处理节点
 * @param {string} name - Sub-Store中的订阅名称
 */

async function operator(proxies) {
    // 获取订阅名参数，如果没有设置则默认处理传入的所有节点
    const subName = $arguments.name;
    
    if (!proxies || proxies.length === 0) {
        console.log("未发现有效节点");
        return [];
    }

    console.log(`正在处理订阅: ${subName || '全部'}，节点总数: ${proxies.length}`);

    // 这里可以添加你的过滤逻辑，例如：
    // return proxies.filter(p => p.name.includes("香港"));
    
    return proxies;
}

// 在 Sub-Store 后端环境中，直接返回函数执行结果即可，不要使用 $done
module.exports = operator;
