const {app, BrowserWindow} = require('electron')
 function createWindow () {   
    // �������������
    win = new BrowserWindow({width: 800, height: 600, webPreferences: {
      nodeIntegration: true
    }})
    // Ȼ�����Ӧ�õ� index.html
    win.loadFile('index.html')
  }
app.on('ready', createWindow) 