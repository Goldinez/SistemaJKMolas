const { app, BrowserWindow } = require("electron");
const path = require("path");
const child_process = require("child_process");

const { app: expressApp, startServer } = require("./index.js");

let mainWindow;

app.on("ready", async () => {
  // Espera o servidor iniciar
  await startServer();

  mainWindow = new BrowserWindow({ width: 1200, height: 800 });
  mainWindow.loadURL("http://localhost:8080");
});
