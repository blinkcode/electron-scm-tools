import { app, autoUpdater, BrowserWindow } from "electron";
import { CustomScheme } from "./CustomScheme";
import { Updater } from "./Updater";
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true";
let mainWindow: BrowserWindow;
app.whenReady().then(() => {
  let config = {
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false,
      allowRunningInsecureContent: true,
      contextIsolation: false,
      webviewTag: true,
      spellcheck: false,
      disableHtmlFullscreenWindowResize: true
    },
    width:900,
    height:750,
    resizable: false,
  };
  mainWindow = new BrowserWindow(config);
  // mainWindow.webContents.openDevTools({ mode: "undocked" });

  if (process.argv[2]) {
    mainWindow.loadURL(process.argv[2]);
  } else {
    CustomScheme.registerScheme();
    mainWindow.loadURL(`app://index.html`);
    Updater.check();
  }
});
