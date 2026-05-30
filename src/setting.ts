import { App, PluginSettingTab, Setting, Notice } from "obsidian";
import imageAutoUploadPlugin from "./main";
import { t } from "./lang/helpers";

export interface PluginSettings {
  uploadByClipSwitch: boolean;
  uploadServer: string;
  token: string;
  strategy_id: string;
  album_id: string;
  permission: number;
  imageSizeSuffix: string;
  uploader: string;
  workOnNetWork: boolean;
  newWorkBlackDomains: string;
  fixPath: boolean;
  applyImage: boolean;
  deleteSource: boolean;
  _strategies?: Array<{id: number, name: string}>;
  _albums?: Array<{id: number, name: string}>;
  [propName: string]: any;
}

export const DEFAULT_SETTINGS: PluginSettings = {
  uploadByClipSwitch: true,
  uploader: "LskyPro",
  token: "",
  strategy_id: "",
  album_id: "",
  permission: 1,
  uploadServer: "https://lsky.xxxx",
  imageSizeSuffix: "",
  workOnNetWork: false,
  fixPath: false,
  applyImage: true,
  newWorkBlackDomains: "",
  deleteSource: false,
};

export class SettingTab extends PluginSettingTab {
  plugin: imageAutoUploadPlugin;

  constructor(app: App, plugin: imageAutoUploadPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  async loadStrategiesAndAlbums() {
    const strategies = await this.plugin.lskyUploader.getStrategies();
    this.plugin.settings._strategies = strategies;
    const albums = await this.plugin.lskyUploader.getAlbums();
    this.plugin.settings._albums = albums;
    this.display();
  }

  display(): void {
    let { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: t("Plugin Settings") });

    // === 剪切板自动上传开关 ===
    new Setting(containerEl)
      .setName(t("Auto pasted upload"))
      .setDesc("启用该选项后，黏贴图片时会自动上传到lsky图床")
      .addToggle((toggle: any) =>
        toggle
          .setValue(this.plugin.settings.uploadByClipSwitch)
          .onChange(async (value: boolean) => {
            this.plugin.settings.uploadByClipSwitch = value;
            await this.plugin.saveSettings();
          })
      );

    // === 上传器选择 ===
    new Setting(containerEl)
      .setName(t("Default uploader"))
      .setDesc(t("Default uploader"))
      .addDropdown((cb: any) =>
        cb
          .addOption("LskyPro", "LskyPro")
          .setValue(this.plugin.settings.uploader)
          .onChange(async (value: string) => {
            this.plugin.settings.uploader = value;
            this.display();
            await this.plugin.saveSettings();
          })
      );

    if (this.plugin.settings.uploader === "LskyPro") {

      // === API 地址 ===
      new Setting(containerEl)
        .setName("LskyPro 域名")
        .setDesc("LskyPro 域名（不需要填写完整的API路径）")
        .addText((text: any) =>
          text
            .setPlaceholder("请输入LskyPro 域名")
            .setValue(this.plugin.settings.uploadServer)
            .onChange(async (key: string) => {
              this.plugin.settings.uploadServer = key;
              await this.plugin.saveSettings();
            })
        );

      // === Token ===
      new Setting(containerEl)
        .setName("LskyPro Token")
        .setDesc("LskyPro Token")
        .addText((text: any) =>
          text
            .setPlaceholder("请输入LskyPro Token")
            .setValue(this.plugin.settings.token)
            .onChange(async (key: string) => {
              this.plugin.settings.token = key;
              await this.plugin.saveSettings();
            })
        );

      // === 测试连接按钮 ===
      new Setting(containerEl)
        .setName("测试连接")
        .setDesc("点击测试 API 地址和 Token 是否正确")
        .addButton((btn: any) =>
          btn
            .setButtonText("测试连接")
            .setCta()
            .onClick(async () => {
              btn.setButtonText("测试中...");
              btn.setDisabled(true);
              // 同步当前设置到 uploader（用户可能还没保存）
              this.plugin.lskyUploader.settings = this.plugin.settings;
              this.plugin.lskyUploader.lskyToken = "Bearer " + this.plugin.settings.token;
              const result = await this.plugin.lskyUploader.testConnection();
              btn.setDisabled(false);
              if (result.success) {
                new Notice("✅ 连接成功" + (result.name ? "：" + result.name : ""));
                btn.setButtonText("✅ 成功");
                // 加载策略和相册列表
                await this.loadStrategiesAndAlbums();
              } else {
                new Notice("❌ " + result.message);
                btn.setButtonText("❌ 失败");
              }
              setTimeout(() => btn.setButtonText("测试连接"), 3000);
            })
        );

      // === 图片权限 ===
      new Setting(containerEl)
        .setName("图片权限")
        .setDesc("设置上传图片的公开/私有权限")
        .addDropdown((dropdown: any) =>
          dropdown
            .addOption("1", "公开 - 所有人可见")
            .addOption("0", "私有 - 仅自己可见")
            .setValue(String(this.plugin.settings.permission ?? 1))
            .onChange(async (value: string) => {
              this.plugin.settings.permission = Number(value);
              await this.plugin.saveSettings();
            })
        );

      // === 存储策略下拉 ===
      new Setting(containerEl)
        .setName("存储策略")
        .setDesc("选择上传使用的存储策略（需先测试连接加载列表）")
        .addDropdown((dropdown: any) => {
          dropdown.addOption("", "默认策略");
          const strategies = this.plugin.settings._strategies || [];
          strategies.forEach((s: {id: number, name: string}) => {
            dropdown.addOption(String(s.id), s.name + " (ID:" + s.id + ")");
          });
          dropdown.setValue(this.plugin.settings.strategy_id || "");
          dropdown.onChange(async (value: string) => {
            this.plugin.settings.strategy_id = value;
            await this.plugin.saveSettings();
          });
        });

      // === 相册下拉 ===
      new Setting(containerEl)
        .setName("上传相册")
        .setDesc("选择上传到指定相册（需先测试连接加载列表）")
        .addDropdown((dropdown: any) => {
          dropdown.addOption("", "不指定相册");
          const albums = this.plugin.settings._albums || [];
          albums.forEach((a: {id: number, name: string}) => {
            dropdown.addOption(String(a.id), a.name + " (ID:" + a.id + ")");
          });
          dropdown.setValue(this.plugin.settings.album_id || "");
          dropdown.onChange(async (value: string) => {
            this.plugin.settings.album_id = value;
            await this.plugin.saveSettings();
          });
        });
    }

    // === 图片大小后缀 ===
    new Setting(containerEl)
      .setName(t("Image size suffix"))
      .setDesc(t("Image size suffix Description"))
      .addText((text: any) =>
        text
          .setPlaceholder(t("Please input image size suffix"))
          .setValue(this.plugin.settings.imageSizeSuffix)
          .onChange(async (key: string) => {
            this.plugin.settings.imageSizeSuffix = key;
            await this.plugin.saveSettings();
          })
      );

    // === 应用网络图片 ===
    new Setting(containerEl)
      .setName(t("Work on network"))
      .setDesc(t("Work on network Description"))
      .addToggle((toggle: any) =>
        toggle
          .setValue(this.plugin.settings.workOnNetWork)
          .onChange(async (value: boolean) => {
            this.plugin.settings.workOnNetWork = value;
            this.display();
            await this.plugin.saveSettings();
          })
      );

    // === 网络图片域名黑名单 ===
    new Setting(containerEl)
      .setName(t("Network Domain Black List"))
      .setDesc(t("Network Domain Black List Description"))
      .addTextArea((textArea: any) =>
        textArea
          .setValue(this.plugin.settings.newWorkBlackDomains)
          .onChange(async (value: string) => {
            this.plugin.settings.newWorkBlackDomains = value;
            await this.plugin.saveSettings();
          })
      );

    // === 剪切板同时有文本和图片时是否上传 ===
    new Setting(containerEl)
      .setName(t("Upload when clipboard has image and text together"))
      .setDesc(
        t(
          "When you copy, some application like Excel will image and text to clipboard, you can upload or not."
        )
      )
      .addToggle((toggle: any) =>
        toggle
          .setValue(this.plugin.settings.applyImage)
          .onChange(async (value: boolean) => {
            this.plugin.settings.applyImage = value;
            this.display();
            await this.plugin.saveSettings();
          })
      );

    // === 上传后删除源文件 ===
    new Setting(containerEl)
      .setName(t("Delete source file after you upload file"))
      .setDesc(t("Delete source file in ob assets after you upload file."))
      .addToggle((toggle: any) =>
        toggle
          .setValue(this.plugin.settings.deleteSource)
          .onChange(async (value: boolean) => {
            this.plugin.settings.deleteSource = value;
            this.display();
            await this.plugin.saveSettings();
          })
      );
  }
}
