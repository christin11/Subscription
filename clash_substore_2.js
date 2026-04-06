/**
 * @name Clash 转换脚本
 * @description 适配 Sub-Store 后端环境，去除 $done 报错
 * @param {string} name - Sub-Store 订阅名
 */

async function operator(proxies) {
    // 1. 容错处理：确保有节点输入
    if (!proxies || proxies.length === 0) {
        console.log("未发现有效节点");
        return []; 
    }

    // 2. 获取参数（如果你在第11步设置了参数）
    const targetSub = $arguments.name;
    console.log(`正在处理订阅: ${targetSub || '所有节点'}`);

    // 3. 直接返回处理后的节点列表
    // Sub-Store 会自动将其注入到你的 .ini 模板中
    return proxies;
}

// 在 Sub-Store 后端环境中，使用这种方式导出函数
module.exports = operator;
