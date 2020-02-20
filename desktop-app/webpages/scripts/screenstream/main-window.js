// toggle between displaying stream in current or new window
let streamInCurrentWindow = true;

document.getElementById("screenstream-window-toggle-button")
    .addEventListener("click", (event) => {
      if (streamInCurrentWindow) {
        // transfer stream from current window to new window
        screenstreamFrame.src = "";
        streamInCurrentWindow = false;
        ipcRenderer.send("toggle-phone-screen-window", "newWindow");
        event.target.textContent = "Display phone screen in this window";
      } else {
        // transfer stream from new window to current window
        streamInCurrentWindow = true;
        ipcRenderer.send("toggle-phone-screen-window", "sameWindow");
        event.target.textContent = "Display phone screen in new window";
      }
    });
