// Copyright 2013 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


function WebRequest () {};
// global vars
var req;
var startTime=0;
var recordedBlobs = [];
var pending_request_id=null;
var mediaRecorder=null;
var tabidRecieved;
var videoName=Date.now();
var customName;

//options
var tabRecordOnlyNewTab=true; //capture only traffic of new tabs opened (ignore previous tab traffic)
var recordCurrentTabOnly=false; //record only selected tab
var recordAlltabs=false; //record all tabs

//Network Requests Captures starts her
function addWebReq(details)
{
	
	if(!req.get(details.requestId))
	{	
		var temp=new WebRequest();
		if(details.requestBody) temp.requestBody=details.requestBody;
		if(details.method) temp.method=details.method;
		if(details.url) temp.url=details.url;
		temp.requesttime=(new Date().valueOf()-startTime)/1000;
		if(details.responseHeaders) temp.responseHeaders=details.responseHeaders;
		if(details.statusCode) temp.statusCode=details.statusCode;
		if(details.statusLine) temp.statusLine=details.statusLine;
		req.set(details.requestId,temp);
	}
	else
	{
		if(details.requestBody)
			req.get(details.requestId).requestBody=details.requestBody;
		if(details.requestHeaders)
			req.get(details.requestId).requestHeaders=details.requestHeaders;
		if(details.responseHeaders)
			req.get(details.requestId).responseHeaders=details.responseHeaders;
		if(details.statusCode)
		{
			req.get(details.requestId).statusCode=details.statusCode;
			req.get(details.requestId).responseTime=(new Date().valueOf()-startTime)/1000;
		}
		if(details.statusLine)
			req.get(details.requestId).statusLine=details.statusLine;
	}
};
function tabChanged(info) {
    var tabid    = info.tabId;
    //if recold previous recorded tabs
    if(tabRecordOnlyNewTab)
    	removeListeners();
    addEventListenters(tabid);
    //console.log('tab changed:'+tabid);
}
function listenerForNewTab(tab)
{
	addEventListenters(tab.id);
	//console.log('tabid created'+tab.id);
}
function startRecording(tabid){
	console.log(tabid);
	req= new Map();
	startTime=0;

	//if record all tabs is seleted
	if(recordAlltabs)
	{
		chrome.tabs.query({}, function(tabs) { 
			for(i=0; i < tabs.length; i++)
		    {
		    	addEventListenters(tabs[i].id);
		    	
		    }
		});
		chrome.tabs.onCreated.addListener(listenerForNewTab);
	}
	else
	{
		//if recording only one tab
		addEventListenters(tabid);
	}
	//if recording has to move with new tab
	if(!recordCurrentTabOnly)
		chrome.tabs.onActivated.addListener(tabChanged);


}

function addEventListenters(tabid)
{
	chrome.webRequest.onBeforeRequest.addListener(addWebReq,
	{
		urls:["<all_urls>"],
		tabId:tabid,
		types:["main_frame","sub_frame","xmlhttprequest"]
	}
	,
	['requestBody']
	);
	chrome.webRequest.onBeforeSendHeaders.addListener(addWebReq,
	{
		urls:["<all_urls>"],
		tabId:tabid,
		types:["main_frame","sub_frame","xmlhttprequest"]

	}
	,
	['requestHeaders']
);
chrome.webRequest.onHeadersReceived.addListener(addWebReq,
	{
		urls:["<all_urls>"],
		tabId:tabid,
		types:["main_frame","sub_frame","xmlhttprequest"]
	}
	,
	['responseHeaders']
);
}
function stopNetworkRecording(){
	removeListeners();
	chrome.tabs.onActivated.removeListener(tabChanged);
	if(recordAlltabs)
	{
		chrome.tabs.onCreated.removeListener(listenerForNewTab);
	}
}
function removeListeners(){
	chrome.webRequest.onBeforeRequest.removeListener(addWebReq);
	chrome.webRequest.onBeforeSendHeaders.removeListener(addWebReq);
	chrome.webRequest.onResponseStarted.removeListener(addWebReq);
}
//Video Recoding Starts Here
function startScreenRecording(){
	mediaRecorder = null;
	window.stream=null;
	recordedBlobs = [];

	var SelectedDesktopOption=new Array();
	if(recordCurrentTabOnly)
		SelectedDesktopOption.push('tab');
	else
		SelectedDesktopOption.push('screen');

	pending_request_id = chrome.desktopCapture.chooseDesktopMedia(
      SelectedDesktopOption, onAccessApproved);
}

function onAccessApproved(id, options) {
  if (!id) {
    console.log('Access rejected.');
    stopRecieved();
    return;
  }

  var audioConstraint = {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: id
      }
  };

  //console.log(options.canRequestAudioTrack);
  //if (options.canRequestAudioTrack)
    //audioConstraint = true;

  navigator.webkitGetUserMedia({
    audio: audioConstraint,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: id,
        maxWidth:screen.width,
        maxHeight:screen.height} }
  }, gotStream, getUserMediaError);
}

function getUserMediaError(error) {
  console.log('navigator.webkitGetUserMedia() error: ', error);
  stopRecieved();
}

// Capture video/audio of media and initialize RTC communication.
function gotStream(stream) {
  
  window.stream = stream;
  startActualRecording();
  // somebody clicked on "Stop sharing"
  stream.getVideoTracks()[0].onended = function () {
    console.info("Recording has ended");
    stopRecieved();
  };
}
function handleDataAvailable(event) {
  if (event.data && event.data.size > 0) {
    recordedBlobs.push(event.data);
  }
}
function handleStop(event) {
  console.log('Recorder stopped: ', event);
  stopRecieved();
}
  

function startActualRecording() {
  
  //var options = {mimeType: 'video/mpeg'};
  //if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    //console.log(options.mimeType + ' is not Supported');
    var options = {mimeType: 'video/webm; codecs=vp8'};
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      console.log(options.mimeType + ' is not Supported');
      options = {mimeType: 'video/webm; codecs=h264'};
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.log(options.mimeType + ' is not Supported');
        options = {mimeType: 'video/webm'};
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          console.log(options.mimeType + ' is not Supported');
          options = {mimeType: ''};
        }
      }
    }
  //}
  try {
    mediaRecorder = new MediaRecorder(window.stream, options);
  } catch (e) {
    console.error('Exception while creating MediaRecorder: ' + e);
    alert('Exception while creating MediaRecorder: '
      + e + '. mimeType: ' + options.mimeType);
    return;
  }
  mediaRecorder.onstop = handleStop;
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.start(10); // collect 10ms of data
  startNetworkRecording();
  //console.log('MediaRecorder started', mediaRecorder);
}
function stopScreenRecording(){
	
	if (pending_request_id != null) {
    	chrome.desktopCapture.cancelChooseDesktopMedia(pending_request_id);
  		pending_request_id=null;
  		if(mediaRecorder.state=="recording")
  			mediaRecorder.stop();
  		if(window.stream)
  			window.stream.getTracks().forEach(track => track.stop());
  		if(recordedBlobs.length>0)
  			gatherEverything();
  	}
  	
}
function gatherEverything(){
	//var superBuffer = new Blob(recordedBlobs, {type: 'video/mpeg'});
	console.log(recordedBlobs);
	var superBuffer = new Blob(recordedBlobs, {type: 'video/webm'});
  	var recordedobjectURL=window.URL.createObjectURL(superBuffer);
  	var recorded_json=JSON.stringify(convertMapToObject(req));
  	var blob = new Blob([recorded_json], {type: "application/json"});
    var recordedJsonURL = window.URL.createObjectURL(blob);
    launchPreview(recordedobjectURL,recordedJsonURL);
    saveToLocalStorage();
}
function launchPreview(videoURL,jsonURL){
	chrome.windows.create(
          {url:'display.html?mp4='+videoURL+'&json='+jsonURL+'&customname='+encodeURIComponent(customName), type: "popup", width: screen.width, height: screen.height
        });
}
function saveToLocalStorage()
{
  //var superBuffer = new Blob(recordedBlobs, {type: 'video/mpeg'});
  var superBuffer = new Blob(recordedBlobs, {type: 'video/webm'});
  var reader = new window.FileReader();
  reader.readAsDataURL(superBuffer); 
  reader.onloadend = function() {
                var base64data = reader.result;                
                //console.log(base64data );
	            function videoObj () {};
                var vidObj=new videoObj();
                vidObj.video=base64data;
                //vidObj.abc='test';
                var recorded_json=JSON.stringify(convertMapToObject(req));
                vidObj.json=recorded_json;
                vidObj.friendlyName=customName;
                
                var tempmap={};
                tempmap[videoName]=vidObj;
                chrome.storage.local.set(tempmap, function() {
                        // Notify that we saved.
                        console.log('video Saved saved');
                });
  }
  
}
function startNetworkRecording(){
	
	startRecording(tabidRecieved);
	startTime=new Date().valueOf();
}

function startRecieved(tabid,name,option){
	//startRecoding(tabid);
	//console.log(tabid);
	videoName=Date.now();
	customName=name;
	console.log(option);
	if(option=='ActiveAndNavigated')
	{
		tabRecordOnlyNewTab=false;
		recordCurrentTabOnly=false;
		recordAlltabs=false; 
	}
	if(option=='OnlyActive')
	{
		tabRecordOnlyNewTab=true;
		recordCurrentTabOnly=false;
		recordAlltabs=false; 
	}
	if(option=='OnlySelected')
	{
		tabRecordOnlyNewTab=false;
		recordCurrentTabOnly=true;
		recordAlltabs=false; 
	}
	if(option=='AllTabs')
	{
		tabRecordOnlyNewTab=false;
		recordCurrentTabOnly=false;
		recordAlltabs=true; 
	}
	tabidRecieved=tabid;
	startScreenRecording();
}
function stopRecieved(){
	stopNetworkRecording();
	stopScreenRecording();
}
//Message Hangler
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log(message);
  if(message.includes('startRecoding'))
  {
  	startRecording(parseInt(message.split("#")[1]));
  	startTime=new Date().valueOf();
  }
  if(message.includes('stopRecording'))
  {
  	console.log(req);
  	sendResponse({tabtraffic: JSON.stringify(convertMapToObject(req))});
  	stopNetworkRecording();
  	/*chrome.windows.create(
      {url:'display.html?', type: "popup", width: 1200, height: 800});*/
  }
});
function RequestObj(){
	requestid;
	webReq;
}

function convertMapToObject(map_var){
	var objectlist=[];
	map_var.forEach(function(i,k){
		console.log(k);
		//var temp=new RequestObj();
		//RequestObj.requestid=k;
		//RequestObj.webReq=i;
		objectlist.push({'requestid':k,'webReq':i});
	});
	return objectlist;
}

