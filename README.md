# Obsidian LskyPro 图床插件

Obsidian 自动上传图片到兰空图床(LskyPro)的插件。

> ⚠️ **说明**：该版本是在 [NekouTarou](https://github.com/NekouTarou) 版本基础上进行二次开发，增加了图片权限选择、存储策略选择、相册选择等功能。

**当前版本**: 2.0.0

## 功能特性

- 📋 剪贴板粘贴自动上传图片
- 🖱️ 拖拽图片自动上传
- 📝 批量上传当前笔记中的所有图片
- 📚 批量上传整个仓库中的所有图片
- 📥 下载远程图片到本地
- 🔐 图片权限设置（公开/私有）
- 💾 存储策略选择
- 📷 上传相册选择
- 🔗 网络图片URL替换
- ⚙️ 图片尺寸后缀设置

## 安装

1. 下载 `main.js` 和 `manifest.json` 文件
2. 在 Obsidian 库的 `.obsidian/plugins/` 目录下创建新文件夹（如 `lskypro`）
3. 将下载的文件放入该文件夹
4. 在 Obsidian 设置 → 第三方插件中启用插件

## 配置

1. 在插件设置中填入兰空图床域名（如 `https://pic.example.com`）
2. 填入 API Token
3. 点击"测试连接"验证配置
4. 选择存储策略和上传相册（可选）
5. 设置图片权限（公开/私有）

## 使用方法

### 自动上传
- 粘贴图片时自动上传到图床
- 拖拽图片到编辑器时自动上传

### 手动上传
- 使用命令面板（Ctrl/Cmd+P）搜索以下命令：
  - `Upload all images` - 上传当前笔记中的所有图片
  - `Download all images` - 下载笔记中的远程图片到本地
  - `Upload all images in all notes (reuse)` - 批量上传所有笔记中的图片

## 致谢

- 原作者：[NekouTarou](https://github.com/NekouTarou)
- 兰空图床：[LskyPro](https://www.lsky.pro/)

## 许可证

MIT License
