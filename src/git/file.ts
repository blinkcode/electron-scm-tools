const fs = require("fs");
const path = require("path");
const process = require("process");
export function mkdir(dirpath: string, rootPath: string): Promise<void> {
  return new Promise((resolve) => {
    console.log("开始创建文件夹....", dirpath);
    console.log("基础路径...", rootPath);
    if (!fs.existsSync(rootPath + dirpath)) {
      fs.mkdirSync(rootPath + dirpath, { recursive: true });
      resolve();
    } else {
      resolve();
    }
  });
}

export function copyFile(files: string[], target: string, rootPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let errMsg = "";
    files.forEach((file, index) => {
      const fileArr = file.split("/");
      let filePath = "";
      let fileName: any = "";
      // 说明有文件路径
      if (fileArr.length > 1) {
        fileName = fileArr.pop();
        filePath = fileArr.join("/");
      } else {
        fileName = fileArr[0];
      }
      console.log("复制文件from", rootPath + `/${file}`);
      console.log("复制文件tooo", rootPath + target + `/${filePath}`);
      fs.cp(rootPath + `/${file}`, rootPath + target + `/${filePath}/${fileName}`, { recursive: true }, function (err: any) {
        if (err) {
          errMsg += err;
          errMsg += "复制文件失败，可能是git中的删除操作，请检查原文件是否存在即可\r\n";
          console.log("error", errMsg);
        }
        if (index === files.length - 1) {
          resolve(errMsg);
        }
      });
    });
  });
}

export function createPatchFileScm(patchFile: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      // 检查web、server
      if (fs.existsSync(`${patchFile}/publish/web`)) {
        await copyFile1(`${patchFile}/publish/web`, `${patchFile}/scm补丁文件/root/web`);
      }
      if (fs.existsSync(`${patchFile}/publish/server`)) {
        await copyFile1(`${patchFile}/publish/server`, `${patchFile}/scm补丁文件/root/server`);
        // 检查DBO
        copyDbo(`${patchFile}/publish/server/apps/scm`, `${patchFile}/scm补丁文件/DBUpdateFiles/Dbo`);
        // 删除server下的DBO
        deleteDbo(`${patchFile}/scm补丁文件/root/server`);
      }
      // 检查元数据
      if (fs.existsSync(`${patchFile}/publish/metadata`)) {
        await copyFile1(`${patchFile}/publish/metadata`, `${patchFile}/scm补丁文件/DBUpdateFiles/MetaData`);
      }
      // 检查IDP
      if (fs.existsSync(`${patchFile}/idp`)) {
        await copyFile1(`${patchFile}/idp`, `${patchFile}/scm补丁文件/DBUpdateFiles/IDP`);
      }
      // 检查data
      if (fs.existsSync(`${patchFile}/publish/tools/setup/db`)) {
        await copyFile1(`${patchFile}/publish/tools/setup/db`, `${patchFile}/scm补丁文件/DBUpdateFiles/Data`);
      }
      // 检查sql
      if (fs.existsSync(`${patchFile}/publish/sql`)) {
        copySql(`${patchFile}/publish/sql`, `${patchFile}/scm补丁文件/DBUpdateFiles`);
      }
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

export async function createPatchFileDf(patchFile: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      // 检查web、server
      if (fs.existsSync(`${patchFile}/publish_df/web`)) {
        await copyFile1(`${patchFile}/publish_df/web`, `${patchFile}/df补丁文件/root/web`);
      }
      if (fs.existsSync(`${patchFile}/publish_df/server`)) {
        await copyFile1(`${patchFile}/publish_df/server`, `${patchFile}/df补丁文件/root/server`);
        // 检查DBO
        copyDbo(`${patchFile}/publish_df/server/apps/bf`, `${patchFile}/df补丁文件/DBUpdateFiles/Dbo`);
        // 删除server下的DBO
        deleteDbo(`${patchFile}/df补丁文件/root/server`);
      }
      // 检查元数据
      if (fs.existsSync(`${patchFile}/publish_df/metadata`)) {
        await copyFile1(`${patchFile}/publish_df/metadata`, `${patchFile}/df补丁文件/DBUpdateFiles/MetaData`);
      }
      // 检查IDP
      if (fs.existsSync(`${patchFile}/idp_bf`)) {
        await copyFile1(`${patchFile}/idp_bf`, `${patchFile}/df补丁文件/DBUpdateFiles/IDP`);
      }
      // 检查data
      if (fs.existsSync(`${patchFile}/publish_df/tools/setup/db`)) {
        await copyFile1(`${patchFile}/publish_df/tools/setup/db`, `${patchFile}/df补丁文件/DBUpdateFiles/Data`);
      }
      // 检查sql
      if (fs.existsSync(`${patchFile}/publish_df/sql`)) {
        copySql(`${patchFile}/publish_df/sql`, `${patchFile}/df补丁文件/DBUpdateFiles`);
      }

      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

function copyFile1(from: string, to: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.cp(from, to, { recursive: true }, function (err: any) {
      if (err) {
        reject("复制文件失败：" + err);
      } else {
        resolve();
      }
    });
  });
}

function deleteFolder(filePath: string) {
  if (fs.existsSync(filePath)) {
    const files = fs.readdirSync(filePath);
    files.forEach((file: any, index: any) => {
      var curPath = path.join(filePath, file);
      if (fs.statSync(curPath).isDirectory()) {
        deleteFolder(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    // 删除空文件夹
    fs.rmdirSync(filePath);
  }
}

function copyDbo(filePath: string, toPath: string) {
  //根据文件路径读取文件，返回文件列表
  fs.readdir(filePath, function (err: string, files: any[]) {
    if (err) return console.error("Error:(spec)", err);
    files.forEach((filename: string) => {
      //获取当前文件的绝对路径
      const filedir = path.join(filePath, filename);
      // fs.stat(path)执行后，会将stats类的实例返回给其回调函数。
      fs.stat(filedir, (eror: string, stats: any) => {
        if (eror) return console.error("Error:(spec)", err);
        // 是否是文件
        const isFile = stats.isFile();
        // 是否是文件夹
        const isDir = stats.isDirectory();
        if (isFile) {
          if (filename.includes(".dbo")) {
            const pathArr = filePath.includes("/") ? filePath.split("/") : filePath.split("\\");
            pathArr.pop();
            // 获取上一层文件夹的名称
            const lastFileDir = pathArr.pop();

            copyFile1(filedir, `${toPath}/${lastFileDir}/${filename}`);
          }
        }
        // 如果是文件夹
        if (isDir) copyDbo(filedir, toPath);
      });
    });
  });
}

function deleteDbo(filePath: string) {
  //根据文件路径读取文件，返回文件列表
  fs.readdir(filePath, function (err: string, files: any[]) {
    if (err) return console.error("Error:(spec)", err);
    files.forEach((filename: string) => {
      //获取当前文件的绝对路径
      const filedir = path.join(filePath, filename);
      fs.stat(filedir, (eror: string, stats: any) => {
        if (eror) return console.error("Error:(spec)", err);
        // 是否是文件夹
        const isDir = stats.isDirectory();
        // 如果是文件夹
        if (isDir) {
          if (filename.toLocaleLowerCase() === "dbo") {
            deleteFolder(filedir);
          } else {
            deleteDbo(filedir);
          }
        }
      });
    });
  });
}
function copySql(filePath: string, toPath: string) {
  //根据文件路径读取文件，返回文件列表
  fs.readdir(filePath, function (err: string, files: any[]) {
    if (err) return console.error("Error:(spec)", err);
    files.forEach((filename: string) => {
      //获取当前文件的绝对路径
      const filedir = path.join(filePath, filename);
      // fs.stat(path)执行后，会将stats类的实例返回给其回调函数。
      fs.stat(filedir, (eror: string, stats: any) => {
        if (eror) return console.error("Error:(spec)", err);
        // 是否是文件
        const isFile = stats.isFile();
        // 是否是文件夹
        const isDir = stats.isDirectory();
        if (isFile) {
          if (filename.includes(".sql")) {
            const pathArr = filePath.includes("/") ? filePath.split("/") : filePath.split("\\");
            // 获取上一层文件夹的名称(DDL、DML)
            const lastFileDir = pathArr.pop();
            const dbNames = {
              mss: "MSSSQL",
              ora: "ORASQL",
              pg: "PGSQL",
              dm: "DMSQL",
              mysql: "MYSQL",
              shentong: "OSCARSQL",
              kb: "KINGBASE",
              db2: "DB2",
            };
            let filepath = "";
            if (filename.includes("mss")) {
              filepath = dbNames["mss"];
            } else if (filename.includes("ora")) {
              filepath = dbNames["ora"];
            } else if (filename.includes("pg")) {
              filepath = dbNames["pg"];
            } else if (filename.includes("mysql")) {
              filepath = dbNames["mysql"];
            } else if (filename.includes("shentong")) {
              filepath = dbNames["shentong"];
            } else if (filename.includes("kb")) {
              filepath = dbNames["kb"];
            } else if (filename.includes("db2")) {
              filepath = dbNames["db2"];
            } else if (filename.includes("dm_")) {
              // 达梦的名称会和dml重复,判断条件修改一下
              filepath = dbNames["dm"];
            }
            copyFile1(filedir, `${toPath}/${filepath}_${lastFileDir}/${filename}`);
          }
        }
        // 如果是文件夹
        if (isDir) copySql(filedir, toPath);
      });
    });
  });
}
