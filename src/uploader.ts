import { PluginSettings } from "./setting";
import { App, TFile } from "obsidian";
//兰空上传器
export class LskyProUploader {
  settings: PluginSettings;
  lskyUrl: string;
  lskyToken: string;
  app: App;

  constructor(settings: PluginSettings,app: App) {
    this.settings = settings;
    this.lskyUrl = this.settings.uploadServer.endsWith("/")
      ? this.settings.uploadServer + "api/v2/upload"
      : this.settings.uploadServer + "/api/v2/upload";
    this.lskyToken = "Bearer " + this.settings.token;
    this.app = app;
  }

  private getApiBaseUrl(): string {
    return this.settings.uploadServer.endsWith("/")
      ? this.settings.uploadServer
      : this.settings.uploadServer + "/";
  }

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

  //上传请求配置
  getRequestOptions(file: File) {
    let headers = new Headers();
    headers.append("Authorization", this.lskyToken);
    headers.append("Accept", "application/json");

    let formdata = new FormData();
    formdata.append("file", file);
    if (this.settings.strategy_id) {
      formdata.append("storage_id", this.settings.strategy_id);
    }
    if (this.settings.album_id) {
      formdata.append("album_id", this.settings.album_id);
    }
    const perm = this.settings.permission ?? 1;
    formdata.append("permission", String(perm));
    formdata.append("is_public", String(perm));

    return {
      method: "POST",
      headers: headers,
      body: formdata,
    };
  }
  //上传文件，返回promise对象
  promiseRequest(file: File) {
    let requestOptions = this.getRequestOptions(file);
    return new Promise(resolve => {
      fetch(this.lskyUrl, requestOptions).then(response => {
        response.json().then(value => {
          if (!value.status) {
            return resolve({
              code: -1,
              msg: value.message,
              data: value.data,
            });
          } else {
            return resolve({
              code: 0,
              msg: "success",
              data: value.data?.public_url,
              fullResult: [],
            });
          }
        });
      });
    }).catch(error => {
      console.log("error", error);
      return {
        code: -1,
        msg: error,
        data: "",
      };
    });
  }
  //通过路径创建文件
  async createFileObjectFromPath(path: string): Promise<File> {
    return new Promise<File>(resolve => {
      if(path.startsWith('https://') || path.startsWith('http://')){
        return fetch(path).then(response => {
          return response.blob().then(blob => {
            resolve(new File([blob], path.split("/").pop()));
          });
        });
      }
      let obsfile = this.app.vault.getAbstractFileByPath(path);
      //@ts-ignore
      this.app.vault.readBinary(obsfile).then(data=>{
        const fileName = path.split("/").pop(); // 获取文件名
        const fileExtension = fileName.split(".").pop(); // 获取后缀名
        const blob = new Blob([data], { type: "image/" + fileExtension });
        const file = new File([blob], fileName);
        resolve(file);
      }).catch(err=>{
        console.error("Error reading file:", err);
        return;
      });
    });
  }

  async uploadFilesByPath(fileList: string[]): Promise<any> {
    let promiseArr = fileList.map(async (filepath: string) => {
      let file = await this.createFileObjectFromPath(filepath);
      return this.promiseRequest(file);
    });
    try {
      let reurnObj = await Promise.all(promiseArr);
      return {
        result: reurnObj.map((item: { data: string }) => item.data),
        success: true,
      };
    } catch (error) {
      return {
        success: false,
      };
    }
  }
  async uploadFiles(fileList: Array<File>): Promise<any> {
    let promiseArr = fileList.map(async file => {
      return this.promiseRequest(file);
    });
    try {
      let reurnObj = await Promise.all(promiseArr);
      let failItem:any = reurnObj.find((item: { code: number })=>item.code===-1);
      if (failItem) {
        throw {err:failItem.msg}
      }
      return {
        result: reurnObj.map((item: { data: string }) => item.data),
        success: true,
      };
    } catch (error) {
      return {
        success: false,
      };
    }
  }
  async uploadFileByClipboard(evt: ClipboardEvent): Promise<any> {
    let files = evt.clipboardData.files;
    let file = files[0];
    return this.promiseRequest(file);
  }
}