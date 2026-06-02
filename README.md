# LskyPro Image Upload

Automatically upload images to [LskyPro](https://www.lsky.pro/) image hosting from your Obsidian vault. Supports clipboard paste, drag & drop, and batch upload.

通过 [LskyPro](https://www.lsky.pro/) API 自动上传图片到兰空图床，支持剪贴板粘贴、拖拽和批量上传。

> Based on [NekouTarou](https://github.com/NekouTarou)'s version, with additional features: image permission control, storage strategy selection, and album management.

## Features

- 📋 Auto-upload on clipboard paste
- 🖱️ Auto-upload on drag & drop
- 📝 Batch upload all images in current note
- 📚 Batch upload all images in entire vault
- 📥 Download remote images to local
- 🔐 Image permission settings (public/private)
- 💾 Storage strategy selection
- 📷 Upload album selection
- 🔗 Remote image URL replacement
- ⚙️ Image size suffix settings

## Installation

### From Community Plugins

1. Open Obsidian Settings → Community plugins
2. Search for "LskyPro Image Upload"
3. Click Install, then Enable

### Manual Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/laozhangge/obsidian-lskpro/releases/latest)
2. Create a folder `lskypro-image-upload` in your vault's `.obsidian/plugins/` directory
3. Copy the downloaded files into that folder
4. Enable the plugin in Obsidian Settings → Community plugins

## Configuration

1. Open plugin settings and enter your LskyPro server URL (e.g., `https://pic.example.com`)
2. Enter your API Token
3. Click "Test Connection" to verify
4. (Optional) Select storage strategy and upload album
5. (Optional) Set image permission (public/private)

## Usage

### Automatic Upload

- **Paste**: Paste an image from clipboard → auto-uploaded to LskyPro
- **Drag & Drop**: Drag an image file into the editor → auto-uploaded

### Manual Commands

Open the command palette (`Ctrl/Cmd + P`) and search for:

| Command | Description |
|---------|-------------|
| `Upload all images` | Upload all local images in the current note |
| `Download all images` | Download all remote images in the current note to local |
| `Upload all images in all notes (reuse)` | Batch upload all images across the entire vault |

## Credits

- Original author: [NekouTarou](https://github.com/NekouTarou)
- Image hosting: [LskyPro](https://www.lsky.pro/)

## License

MIT License
