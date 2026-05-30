# Obsidian LskyPro 插件二次开发实施计划

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** 为 obsidian-lskypro 插件添加测试连接、图片权限、存储策略下拉、相册下拉四个功能。

**Architecture:** 在现有 `uploader.ts` 中添加 API 调用方法（测试连接/获取策略/获取相册），在 `setting.ts` 中添加 UI 元素（按钮/下拉框），在 `setting.ts` 的接口中添加新字段。所有兰空 API 调用统一使用 V1 版本（策略和相册列表只有 V1 有）。

**Tech Stack:** TypeScript, Obsidian API, Rollup

---

## Task 1: 扩展 PluginSettings 接口，添加新配置字段

**Objective:** 在设置接口中添加 permission、album_id 字段，以及策略/相册列表缓存字段。

**Files:**
- Modify: `src/setting.ts:5-32`

**Step 1: 修改 PluginSettings 接口**

在 `src/setting.ts` 的 `PluginSettings` 接口中添加新字段：

```typescript
export interface PluginSettings {
  uploadByClipSwitch: boolean;
  uploadServer: string;
  token: string;
  strategy_id: string;
  album_id: string;            // 新增：相册ID
  permission: number;          // 新增：图片权限 1=公开 0=私有
  imageSizeSuffix: string;
  uploader: string;
  workOnNetWork: boolean;
  newWorkBlackDomains: string;
  fixPath: boolean;
  applyImage: boolean;
  deleteSource: boolean;
  // 以下为运行时缓存，不持久化
  _strategies?: Array<{id: number, name: string}>;
  _albums?: Array<{id: number, name: string}>;
  [propName: string]: any;
}
```

**Step 2: 修改 DEFAULT_SETTINGS**

```typescript
export const DEFAULT_SETTINGS: PluginSettings = {
  uploadByClipSwitch: true,
  uploader: "LskyPro",
  token: "",
  strategy_id: "",
  album_id: "",                // 新增
  permission: 1,               // 新增：默认公开
  uploadServer: "https://lsky.xxxx",
  imageSizeSuffix: "",
  workOnNetWork: false,
  fixPath: false,
  applyImage: true,
  newWorkBlackDomains: "",
  deleteSource: false,
};
```

**Step 3: Commit**

```bash
git add src/setting.ts
git commit -m "feat: add permission and album_id to PluginSettings"
```

---

## Task 2: 在 uploader.ts 中添加 API 调用方法

**Objective:** 添加 testConnection、getStrategies、getAlbums 三个方法。

**Files:**
- Modify: `src/uploader.ts`

**Step 1: 添加通用请求头方法**

在 `LskyProUploader` 类中添加：

```typescript
private getApiBaseUrl(): string {
  return this.settings.uploadServer.endsWith("/")
    ? this.settings.uploadServer
    : this.settings.uploadServer + "/";
}

// 测试连接 - GET /api/v1/profile
async testConnection(): Promise<{success: boolean, message: string, name?: string}> {
  const url = this.getApiBaseUrl() + "api/v1/profile";
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": this.lskyToken,
        "Accept": "application/json",
      },
    });
    const data = await response.json();
    if (data.status) {
      return { success: true, message: "连接成功", name: data.data?.name };
    }
    return { success: false, message: data.message || "连接失败" };
  } catch (error) {
    return { success: false, message: "网络错误: " + String(error) };
  }
}

// 获取存储策略列表 - GET /api/v1/strategies
async getStrategies(): Promise<{id: number, name: string}[]> {
  const url = this.getApiBaseUrl() + "api/v1/strategies";
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": this.lskyToken,
        "Accept": "application/json",
      },
    });
    const data = await response.json();
    if (data.status && data.data?.strategies) {
      return data.data.strategies.map((s: any) => ({ id: s.id, name: s.name }));
    }
    return [];
  } catch (error) {
    console.error("获取策略列表失败:", error);
    return [];
  }
}

// 获取相册列表 - GET /api/v1/albums
async getAlbums(): Promise<{id: number, name: string}[]> {
  const url = this.getApiBaseUrl() + "api/v1/albums";
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": this.lskyToken,
        "Accept": "application/json",
      },
    });
    const data = await response.json();
    if (data.status && data.data?.data) {
      return data.data.data.map((a: any) => ({ id: a.id, name: a.name }));
    }
    return [];
  } catch (error) {
    console.error("获取相册列表失败:", error);
    return [];
  }
}
```

**Step 2: 修改 getRequestOptions，添加 permission 和 album_id 参数**

将现有 `getRequestOptions` 方法改为：

```typescript
getRequestOptions(file: File) {
  let headers = new Headers();
  headers.append("Authorization", this.lskyToken);
  headers.append("Accept", "application/json");

  let formdata = new FormData();
  formdata.append("file", file);
  if (this.settings.strategy_id) {
    formdata.append("strategy_id", this.settings.strategy_id);
  }
  if (this.settings.album_id) {
    formdata.append("album_id", this.settings.album_id);
  }
  // 图片权限：必须同时发送 permission 和 is_public
  const perm = this.settings.permission ?? 1;
  formdata.append("permission", String(perm));
  formdata.append("is_public", String(perm));

  return {
    method: "POST",
    headers: headers,
    body: formdata,
  };
}
```

**Step 3: Commit**

```bash
git add src/uploader.ts
git commit -m "feat: add testConnection, getStrategies, getAlbums methods"
```

---

## Task 3: 在设置面板添加测试连接按钮

**Objective:** 添加一个"测试连接"按钮，点击后调用 testConnection()，显示结果。

**Files:**
- Modify: `src/setting.ts`

**Step 1: 在 Token 输入框后面添加测试连接按钮**

在 `setting.ts` 的 `display()` 方法中，Token 输入框的 `new Setting(containerEl)` 后面添加：

```typescript
// 测试连接按钮
const testConnSetting = new Setting(containerEl)
  .setName("测试连接")
  .setDesc("点击测试 API 地址和 Token 是否正确");
const testBtn = testConnSetting.addButton(btn =>
  btn
    .setButtonText("测试连接")
    .setCta()
    .onClick(async () => {
      btn.setButtonText("测试中...");
      btn.setDisabled(true);
      // 临时更新 uploader 的 settings（用户可能还没保存）
      this.plugin.lskyUploader.settings = this.plugin.settings;
      this.plugin.lskyUploader.lskyToken = "Bearer " + this.plugin.settings.token;
      const result = await this.plugin.lskyUploader.testConnection();
      btn.setDisabled(false);
      if (result.success) {
        new Notice("✅ 连接成功" + (result.name ? "：" + result.name : ""));
        btn.setButtonText("✅ 连接成功");
        // 加载策略和相册列表
        await this.loadStrategiesAndAlbums();
      } else {
        new Notice("❌ " + result.message);
        btn.setButtonText("❌ 连接失败");
      }
      setTimeout(() => btn.setButtonText("测试连接"), 3000);
    })
);
```

**Step 2: 添加 loadStrategiesAndAlbums 方法**

在 `SettingTab` 类中添加：

```typescript
async loadStrategiesAndAlbums() {
  // 加载策略
  const strategies = await this.plugin.lskyUploader.getStrategies();
  this.plugin.settings._strategies = strategies;
  // 加载相册
  const albums = await this.plugin.lskyUploader.getAlbums();
  this.plugin.settings._albums = albums;
  // 刷新设置面板以更新下拉菜单
  this.display();
}
```

**Step 3: Commit**

```bash
git add src/setting.ts
git commit -m "feat: add test connection button in settings"
```

---

## Task 4: 添加图片权限选项（公开/私有）

**Objective:** 在设置面板添加图片权限单选/下拉选项。

**Files:**
- Modify: `src/setting.ts`

**Step 1: 在测试连接按钮后面添加权限选项**

```typescript
new Setting(containerEl)
  .setName("图片权限")
  .setDesc("设置上传图片的公开/私有权限")
  .addDropdown(dropdown =>
    dropdown
      .addOption("1", "公开 - 所有人可见")
      .addOption("0", "私有 - 仅自己可见")
      .setValue(String(this.plugin.settings.permission ?? 1))
      .onChange(async value => {
        this.plugin.settings.permission = Number(value);
        await this.plugin.saveSettings();
      })
  );
```

**Step 2: Commit**

```bash
git add src/setting.ts
git commit -m "feat: add image permission dropdown (public/private)"
```

---

## Task 5: 将策略ID手动输入改为下拉菜单

**Objective:** 将 strategy_id 的文本输入框改为下拉菜单，选项从 API 动态加载。

**Files:**
- Modify: `src/setting.ts`

**Step 1: 替换 strategy_id 的 Setting**

将原来的文本输入：

```typescript
new Setting(containerEl)
  .setName("LskyPro Strategy id")
  .setDesc("LskyPro 存储策略ID（非必填）")
  .addText(text => ...)
```

替换为：

```typescript
new Setting(containerEl)
  .setName("存储策略")
  .setDesc("选择上传使用的存储策略（需先测试连接加载列表）")
  .addDropdown(dropdown => {
    dropdown.addOption("", "默认策略");
    const strategies = this.plugin.settings._strategies || [];
    strategies.forEach(s => {
      dropdown.addOption(String(s.id), s.name + " (ID:" + s.id + ")");
    });
    dropdown.setValue(this.plugin.settings.strategy_id || "");
    dropdown.onChange(async value => {
      this.plugin.settings.strategy_id = value;
      await this.plugin.saveSettings();
    });
  });
```

**Step 2: Commit**

```bash
git add src/setting.ts
git commit -m "feat: replace strategy_id text input with dropdown"
```

---

## Task 6: 添加相册下拉菜单

**Objective:** 添加相册选择下拉菜单，选项从 API 动态加载。

**Files:**
- Modify: `src/setting.ts`

**Step 1: 在存储策略下拉后面添加相册下拉**

```typescript
new Setting(containerEl)
  .setName("上传相册")
  .setDesc("选择上传到指定相册（需先测试连接加载列表）")
  .addDropdown(dropdown => {
    dropdown.addOption("", "不指定相册");
    const albums = this.plugin.settings._albums || [];
    albums.forEach(a => {
      dropdown.addOption(String(a.id), a.name + " (ID:" + a.id + ")");
    });
    dropdown.setValue(this.plugin.settings.album_id || "");
    dropdown.onChange(async value => {
      this.plugin.settings.album_id = value;
      await this.plugin.saveSettings();
    });
  });
```

**Step 2: Commit**

```bash
git add src/setting.ts
git commit -m "feat: add album dropdown in settings"
```

---

## Task 7: 更新中文翻译

**Objective:** 添加新功能的中文翻译。

**Files:**
- Modify: `src/lang/locale/zh-cn.ts`

**Step 1: 添加翻译条目**

在 `zh-cn.ts` 的导出对象中添加：

```typescript
"Test Connection": "测试连接",
"Test Connection Description": "点击测试 API 地址和 Token 是否正确",
"Image Permission": "图片权限",
"Image Permission Description": "设置上传图片的公开/私有权限",
"Public": "公开 - 所有人可见",
"Private": "私有 - 仅自己可见",
"Storage Strategy": "存储策略",
"Storage Strategy Description": "选择上传使用的存储策略（需先测试连接加载列表）",
"Default Strategy": "默认策略",
"Upload Album": "上传相册",
"Upload Album Description": "选择上传到指定相册（需先测试连接加载列表）",
"No Album": "不指定相册",
```

**Step 2: Commit**

```bash
git add src/lang/locale/zh-cn.ts
git commit -m "feat: add Chinese translations for new features"
```

---

## Task 8: 构建验证

**Objective:** 确保代码编译通过，无类型错误。

**Step 1: 安装依赖**

```bash
cd /root/obsidian-lskypro && npm install
```

**Step 2: 构建**

```bash
npm run build
```

**Step 3: 验证输出**

```bash
ls -la main.js
# 确认 main.js 生成且大小合理
```

**Step 4: Commit**

```bash
git add -A
git commit -m "build: v1.1.0 with test connection, permission, strategy/album dropdowns"
```

---

## 实施顺序总结

| 序号 | 任务 | 改动文件 | 预计时间 |
|------|------|----------|----------|
| 1 | 扩展接口字段 | setting.ts | 2min |
| 2 | 添加API方法+上传参数 | uploader.ts | 5min |
| 3 | 测试连接按钮 | setting.ts | 3min |
| 4 | 图片权限下拉 | setting.ts | 2min |
| 5 | 策略下拉菜单 | setting.ts | 2min |
| 6 | 相册下拉菜单 | setting.ts | 2min |
| 7 | 中文翻译 | zh-cn.ts | 1min |
| 8 | 构建验证 | - | 2min |

## API 参考

```
GET  /api/v1/profile     → 测试连接（返回用户信息）
GET  /api/v1/strategies  → 存储策略列表（data.strategies[]）
GET  /api/v1/albums      → 相册列表（data.data[]，分页）
POST /api/v1/upload      → 上传（需同时传 permission + is_public）
```

所有请求头：`Authorization: Bearer {token}`
