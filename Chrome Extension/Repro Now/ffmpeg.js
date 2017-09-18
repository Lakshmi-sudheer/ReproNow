
let ffmpegEncoder = function(encoderArgs, files) {
  let stdout = "";
  let stderr = "";
  let worker = new Worker(chrome.extension.getURL("ffmpeg-webw.js"));

  let globalResolve;
  let videoResolve;

  this.ready = new Promise(function(resolve, reject) {
    globalResolve = resolve;
  });

  this.videoReady = new Promise(function(resolve, reject) {
    videoResolve = resolve;
  });

  this.run = function(files,outputfilename) {

      var args=["-i",files[0].name,"-attach",files[1].name,"-metadata:s:t","mimetype=application/json", outputfilename];

 
    const idealheap = 1024 * 1024 * 1024;
    console.log(files);
    worker.postMessage({
        type: "command",
        arguments: args,
        mem: idealheap,
        Allfiles: files
      });
  };

  worker.onmessage = function(e) {
    var msg = e.data;
    console.log(msg.type, msg.data)
    switch (msg.type) {
    case "ready":
      globalResolve();
      break;
    case "stdout":
      if(this.stderr) this.stderr(msg);
      stdout += msg.data + "\n";
      break;
    case "stderr":
      if(this.stderr) this.stderr(msg);
      stderr += msg.data + "\n";
      break;
    case "done":
      videoResolve(msg.data);
      worker.terminate();
      console.log("done");
      break;
    case "exit":
      console.log("Process exited with code " + msg.data);
      console.log(stderr);
      console.log(stdout);
      break;
    }
  }.bind(this);
};