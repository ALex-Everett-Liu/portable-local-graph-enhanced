const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");

// Import the Express server
require("./server");

let mainWindow;

app.commandLine.appendSwitch("disable-gpu");
app.commandLine.appendSwitch("disable-software-rasterizer");

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadURL("http://localhost:6825");

  // Wait for everything to load before attempting DevTools
  mainWindow.webContents.on("did-finish-load", () => {
    setTimeout(() => {
      try {
        console.log("Opening DevTools after page load");
        mainWindow.webContents.openDevTools();
      } catch (error) {
        console.error("Error opening DevTools after load:", error);
      }
    }, 2000);
  });

  mainWindow.on("closed", function () {
    mainWindow = null;
  });

  // Create custom menu with DevTools option
  const menuTemplate = [
    {
      label: "File",
      submenu: [
        {
          label: "Quit",
          accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: "Developer",
      submenu: [
        {
          label: "Toggle DevTools",
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.toggleDevTools();
            }
          },
          accelerator: "F12",
        },
        {
          label: "Reload",
          click: () => {
            if (mainWindow) {
              mainWindow.reload();
            }
          },
          accelerator: "Ctrl+R",
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
}

app.on("ready", async () => {
  createWindow();
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", function () {
  if (mainWindow === null) createWindow();
});
