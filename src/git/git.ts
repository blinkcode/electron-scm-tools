const { exec } = require("child_process");
const process = require("process");
const xlsx = require("node-xlsx");
const fs = require("fs");
export function gitPull(cmdPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let workerProcess;
    const cmdStr = "git pull";
    let msg = "";
    workerProcess = exec(cmdStr, { cwd: cmdPath }, (err: any, stdout: string, stderr: any) => {
      if (stdout) {
        msg = stdout;
      }
    });
    workerProcess.on("close", function (code: number) {
      if (!code) {
        resolve(msg);
      } else {
        resolve("拉取仓库失败，请检查，仍然尝试继续往下执行");
      }
    });
  });
}
// 当前分支
export function gitBranch(cmdPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let msg = "";
    let workerProcess;
    const cmdStr = "git branch";
    workerProcess = exec(cmdStr, { cwd: cmdPath }, (err: any, stdout: string, stderr: any) => {
      if (err) {
      } else if (stdout) {
        if (stdout) {
          let flag = false;
          const strs = stdout.split(" ");
          strs.forEach((str, index) => {
            if (str === "*" && !flag) {
              flag = true;
              msg = strs[index + 1];
            }
          });
        }
      } else if (stderr) {
      }
    });
    workerProcess.on("close", function (code: number) {
      if (!code) {
        resolve(msg);
      } else {
        reject("查询分支失败，请检查");
      }
    });
  });
}

export function gitBeginCommit(beginDate: string, cmdPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let workerProcess;
    const cmdStr = `git log --before="${beginDate}" -1 --pretty="%h"`;
    let msg = "";
    workerProcess = exec(cmdStr, { cwd: cmdPath }, (err: any, stdout: string, stderr: any) => {
      if (err) {
      } else if (stdout) {
        if (stdout) {
          msg = stdout;
        }
      } else if (stderr) {
      }
    });
    workerProcess.on("close", function (code: number) {
      if (!code) {
        resolve(msg.trim());
      } else {
        reject("查询git日志失败，请检查");
      }
    });
  });
}

export function gitEndCommit(endDate: string, cmdPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let workerProcess;
    const cmdStr = `git log --before="${endDate}" -1 --pretty="%h"`;
    let msg = "";
    workerProcess = exec(cmdStr, { cwd: cmdPath }, (err: any, stdout: string, stderr: any) => {
      if (err) {
      } else if (stdout) {
        if (stdout) {
          msg = stdout;
        }
      } else if (stderr) {
      }
    });
    workerProcess.on("close", function (code: number) {
      if (!code) {
        resolve(msg.trim());
      } else {
        reject("查询git日志失败1，请检查");
      }
    });
  });
}

export function gitDiff(beginCommit: string, endCommit: string, cmdPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let workerProcess;
    // const cmdStr = `git diff ${beginCommit} ${endCommit} --name-only | xargs -i cp '{}' ./patch/${patch}/ --parents`;
    const cmdStr = `git diff ${beginCommit} ${endCommit} --name-only`;
    let msg = "";
    workerProcess = exec(cmdStr, { cwd: cmdPath }, (err: any, stdout: string, stderr: any) => {
      if (err) {
      } else if (stdout) {
        if (stdout) {
          msg = stdout;
        }
      } else if (stderr) {
      }
    });
    workerProcess.on("close", function (code: number) {
      if (!code) {
        resolve(msg.trim());
      } else {
        reject("对比文件失败，请检查");
      }
    });
  });
}

export function gitLog(beginCommit: string, endCommit: string, cmdPath: string, date: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let workerProcess;
    // const cmdStr = `git log ${beginCommit}..${endCommit} --date=short --pretty="%cd|%an|%s" > ${cmdPath}/patch/${date}/log.log`;
    const cmdStr = `git log ${beginCommit}..${endCommit} --date=short --pretty="%cd||%an||%s"`;
    let msg = "";
    workerProcess = exec(cmdStr, { cwd: cmdPath }, (err: any, stdout: string, stderr: any) => {
      if (err) {
      } else if (stdout) {
        if (stdout) {
          msg = stdout;
          const logs: string[][] = [];
          stdout.split("\n").forEach((log: string) => {
            logs.push(log.split("||"));
          });
          //定义列宽，使用默认列宽，可以忽略
          let sheetOptions = { "!cols": [{ wch: 15 }, { wch: 10 }, { wch: 200 }] };
          //生成buffer
          let buffer = xlsx.build([{ name: "commit提交记录", data: logs, options: sheetOptions }]);
          //导出
          fs.writeFileSync(`${cmdPath}/patch/${date}/log.xlsx`, buffer, { flag: "w" });
        }
      } else if (stderr) {
      }
    });
    workerProcess.on("close", function (code: number) {
      if (!code) {
        resolve("");
      } else {
        reject("对比文件失败，请检查");
      }
    });
  });
}
