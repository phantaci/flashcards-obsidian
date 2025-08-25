# Flashcards Obsidian 插件安装指南

## 📦 生产版本已编译完成

插件已成功编译为生产版本，生成了以下文件：
- `main.js` - 插件主文件 (680KB)
- `main.js.map` - 源码映射文件
- `manifest.json` - 插件清单文件

## 🚀 安装到正式 Obsidian Vault

### 方法一：手动安装（推荐）

1. **定位你的 Obsidian Vault**
   ```bash
   # 找到你的 vault 路径，例如：
   ~/Documents/MyVault/
   ```

2. **创建插件目录**
   ```bash
   # 进入你的 vault 目录
   cd ~/Documents/MyVault/
   
   # 创建插件目录（如果不存在）
   mkdir -p .obsidian/plugins/flashcards-obsidian
   ```

3. **复制插件文件**
   ```bash
   # 从项目根目录复制必要文件
   cp /Users/wucc/workspace/personal/flashcards-obsidian/main.js ~/Documents/MyVault/.obsidian/plugins/flashcards-obsidian/
   cp /Users/wucc/workspace/personal/flashcards-obsidian/manifest.json ~/Documents/MyVault/.obsidian/plugins/flashcards-obsidian/
   ```

4. **启用插件**
   - 打开 Obsidian
   - 进入 设置 > 社区插件
   - 关闭"安全模式"（如果开启）
   - 在"已安装插件"中找到"Flashcards"
   - 点击开关启用插件

### 方法二：使用脚本自动安装

创建安装脚本：

```bash
#!/bin/bash
# install-plugin.sh

# 设置你的 vault 路径
VAULT_PATH="$HOME/Documents/MyVault"  # 修改为你的实际路径
PLUGIN_NAME="flashcards-obsidian"
SOURCE_DIR="/Users/wucc/workspace/personal/flashcards-obsidian"

# 创建插件目录
mkdir -p "$VAULT_PATH/.obsidian/plugins/$PLUGIN_NAME"

# 复制文件
cp "$SOURCE_DIR/main.js" "$VAULT_PATH/.obsidian/plugins/$PLUGIN_NAME/"
cp "$SOURCE_DIR/manifest.json" "$VAULT_PATH/.obsidian/plugins/$PLUGIN_NAME/"

echo "插件已安装到: $VAULT_PATH/.obsidian/plugins/$PLUGIN_NAME"
echo "请在 Obsidian 中启用插件"
```

## 🔧 插件配置

安装后，你可以在 Obsidian 设置中配置插件：

- **Anki 连接**：确保 Anki 正在运行并安装了 AnkiConnect 插件
- **卡片标签**：默认为 `#card`
- **牌组设置**：配置默认牌组名称
- **源文件支持**：启用后会在卡片中包含来源信息

## 📝 使用方法

1. **创建卡片**：
   ```markdown
   What is TypeScript? #card
   TypeScript is a superset of JavaScript that adds static type checking.
   ```

2. **同步到 Anki**：
   - 使用命令面板 (Cmd/Ctrl + P)
   - 搜索 "Flashcards" 相关命令
   - 选择同步命令

## 🛠️ 故障排除

- **插件未显示**：检查文件路径和权限
- **Anki 连接失败**：确保 AnkiConnect 插件已安装并启用
- **卡片未同步**：检查 Anki 是否正在运行

## 📋 需要的文件清单

确保以下文件存在于插件目录中：
- ✅ `main.js` (680KB)
- ✅ `manifest.json` (255B)
- ❌ `main.js.map` (可选，用于调试)
