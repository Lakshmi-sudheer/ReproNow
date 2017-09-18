	  const ffmpeg = new ffmpegEncoder();
      let fileInput;
      var outputFileName="output.mkv";
      var params = {};

	  if (location.search) {
	      var parts = location.search.substring(1).split('&');

	      for (var i = 0; i < parts.length; i++) {
	          var nv = parts[i].split('=');
	          if (!nv[0]) continue;
	          params[nv[0]] = nv[1] || true;
	      }
	  }

	  const logEl = document.getElementById('output');
      ffmpeg.stderr = function(msg) {
          logEl.innerText += msg.data + "\n";
          logEl.scrollTop = logEl.scrollHeight;
      };
	  function convertDataURIToBinary(dataURI) {
		  var BASE64_MARKER = ';base64,';
		  var base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
		  var base64 = dataURI.substring(base64Index);
		  var raw = window.atob(base64);
		  //ì	<1>+u,<{X±Cconsole.log(raw);
		  var rawLength = raw.length;
		  var array = new Uint8Array(new ArrayBuffer(rawLength));

		  for(i = 0; i < rawLength; i++) {
		    array[i] = raw.charCodeAt(i);
		  }
		  return array;

		}
	function dataURLtoBlob(dataurl) {
    	var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    	while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    	}
    	return u8arr;
	 }
      function passToFFmpeg(json,video,nameOfVideo)
      {
        

      	  var jsonarraybuffer=new TextEncoder('utf-8').encode(json);
      	  nameOfVideo=nameOfVideo.split(' ').join('_');
      	  var videoArrayBuffer=dataURLtoBlob(video);

      	  		ffmpeg.run([
              		{name: nameOfVideo+'.webm', data: videoArrayBuffer},
              		{name: nameOfVideo+'.json', data: jsonarraybuffer}
              		],nameOfVideo+'.mkv'
          		);
      	  
      }
      function passToFFmpegv2(json,video,nameOfVideo)
      {

          nameOfVideo=nameOfVideo.split(' ').join('_');
          //var videoArrayBuffer=dataURLtoBlob(video);
          fetch(video)
          .then((res)=> res.arrayBuffer() )
          .then((buf)=>{
              mergeAndDownload(nameOfVideo,buf,json);
          });
          //mergeAndDownload(nameOfVideo,video,json);
      }
      onload = function() {

        ffmpeg.ready.then(function() {
          if(params.localStorageId)
          {
          	var videoName=params.localStorageId;
          	chrome.storage.local.get(videoName,function(result){
          		passToFFmpeg(result[videoName].json,result[videoName].video,result[videoName].friendlyName);
          	});
          }
          else
          {
          	document.querySelector('#inputFiles').classList.remove('hidden');
          	document.querySelector('#dataloading').classList.add('hidden');
          }
        });

      };

      ffmpeg.videoReady.then(function(data) {
        //document.querySelector('#dataloading').classList.add('hidden');
        var buffers = data;
	      if (buffers.length) {
	       }
	       buffers.forEach(function(file) {
	        download(file.data, file.name);
	       });
         document.querySelector('#dataloading').classList.add('hidden');
      });
      function download(buffer,name) {
      	var blob= new Blob( [ buffer ], { type: "video/mkv" } );
        var url = window.URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 100);
      }
      