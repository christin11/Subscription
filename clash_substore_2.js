/**
 * @name Clash 转换脚本
 * @description 引用 Sub-Store 订阅并注入模板
 * @param {string} name - Sub-Store 订阅名
 */

async function operator(proxies) {
    // 获取传递的订阅名参数
    const subName = $arguments.name;
    
    // 基础容错
    if (!proxies || proxies.length === 0) {
        console.log("没有获取到节点数据");
        return [];
    }

    console.log(`成功读取订阅: ${subName}, 开始注入节点...`);

    // 直接返回节点数组，Sub-Store 会自动处理后续的模板注入
    return proxies;
}
