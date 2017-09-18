function start(){
	var currTab;
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
	  currTab = tabs[0];
	  if (currTab) {
	  	//console.log(currTab);
		var name=document.querySelector('input#recName').value;
		var selectedoption=document.querySelector('select#SelectedOption').value;
		chrome.extension.getBackgroundPage().startRecieved(currTab.id,name,selectedoption);
		showStopButton();
		}
	});
	document.querySelector('input#recName').readOnly=true;
	document.querySelector('select#SelectedOption').readOnly=true;
}
function showStopButton(){
	var startbutton=document.querySelector('button#start');
    startbutton.classList.add('hidebutton');
    var stopbutton=document.querySelector('button#stop');
    stopbutton.classList.remove('hidebutton');
}
function stop(){
	var startbutton=document.querySelector('button#start');
    startbutton.classList.remove('hidebutton');
    var stopbutton=document.querySelector('button#stop');
    stopbutton.classList.add('hidebutton');
    chrome.extension.getBackgroundPage().stopRecieved();
    document.querySelector('input#recName').readOnly=false;
	document.querySelector('select#SelectedOption').readOnly=false;
}
function init(){
		var date=new Date();
	var currTab;
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
	  currTab = tabs[0];
	  	if (currTab) {
			document.querySelector('input#recName').value=url_domain(currTab.url).split('.').reverse()[1]+' '+date.getMonth()+'_'+date.getDate()+'_'+date.getFullYear()+'_'+Date.now().toString().slice(0,-3).substring(6);
		}
		if(chrome.extension.getBackgroundPage().pending_request_id!=null)
		{
			document.querySelector('input#recName').value=chrome.extension.getBackgroundPage().customName;
			document.querySelector('input#recName').readOnly=true;
			document.querySelector('select#SelectedOption').readOnly=true;
		}
	});
	addHistory();
	if(chrome.extension.getBackgroundPage().pending_request_id!=null)
	{
		showStopButton();
	}
}
function addHistory()
{
	var listgroup=document.querySelector('#listgrp');
	listgroup.innerHTML="";
	chrome.storage.local.get(null, function(items) {
		   items=mapSort(items);
		   //console.log(items);
		   for (key in items) {
		       //console.log(items[key]);
		       var name=key;
		       if(items[key].friendlyName)
		       	name=items[key].friendlyName;
		       listgroup.appendChild(createSingleHistory(key,name));
		   }
		addHistoryEventListeners();
	});
	
}
function mapSort(input)
{
	var ordered = {}
	Object.keys(input).reverse().forEach(function(key) {
  		ordered[key] = input[key];
	});
	return ordered;
}
function addHistoryEventListeners(){
	//console.log('here');
	//All Previews
	var childDivs = document.querySelectorAll("button.but_eye");
    for(i=0; i < childDivs.length; i++)
    {
        var child=childDivs[i];
        child.removeEventListener('click',previewHandler);
        child.addEventListener('click',previewHandler);
    }
  	//All Downloads
  	//TODO
  	childDivs = document.querySelectorAll("button.but_download");
    for(i=0; i < childDivs.length; i++)
    {
        var child=childDivs[i];
        child.removeEventListener('click',downloadHandler);
        child.addEventListener('click',downloadHandler);
    }
  	//Deletes
  	childDivs = document.querySelectorAll("button.but_trash");
    for(i=0; i < childDivs.length; i++)
    {
        var child=childDivs[i];
        child.removeEventListener('click',deleteHandler);
        child.addEventListener('click',deleteHandler);
    }

}
function previewHandler(){
    var videoName=this.getAttribute('lid');
    //console.log(videoName);
    chrome.windows.create(
          		{url:'display.html?localStorageId='+videoName, type: "popup", width: screen.width, height: screen.height
    });

}
function downloadHandler(){
	var videoName=this.getAttribute('lid');
	//TODO
	/*chrome.windows.create(
          		{url:'download.html?localStorageId='+videoName, type: "normal", width: 300, height: 200
    });*/
    chrome.tabs.create({ url: 'download.html?localStorageId='+videoName });
}
function deleteHandler(){
	var videoName=this.getAttribute('lid');
	chrome.storage.local.remove(videoName);
	addHistory();
}

function createSingleHistory(id,name)
{
	var his=document.createElement("div");
	his.className="pointer list-group-item list-group-item-action flex-column align-items-start";
	var nametime=document.createElement("div");
	nametime.className="d-flex w-100 justify-content-between";
	var nme=document.createElement("div");
	nme.className="videoName";
	nme.textContent=name;
	nametime.appendChild(nme);
	var time=document.createElement("small")
	time.className="text-muted";
	var date=new Date(parseInt(id));
	time.textContent=date.toDateString();
	nametime.appendChild(time);
	his.appendChild(nametime);

	var buttons=document.createElement("div");
	buttons.className="form-inline buttongp";
	buttons.appendChild(createButtons('eye',id));
	buttons.appendChild(createButtons('download',id));
	buttons.appendChild(createButtons('trash',id));
	his.appendChild(buttons);
	
	return his;
}
function createButtons(text,id)
{
	var outerdiv=document.createElement("div");
	outerdiv.className="form-group actionButton";
	var button=document.createElement("button");
	button.type="button";
	button.className="btn btn-outline-success btn-sm fa buttonIcons fa-"+text+" but_"+text;
	button.setAttribute("lid",id);
	outerdiv.appendChild(button);
	return outerdiv;
}
document.querySelector('.historyBut').addEventListener('click',function(){
		document.querySelector('.mainPage').style.display="none";
		document.querySelector('.secondPage').style.display="block";
		
});
document.querySelector('.topBar').addEventListener('click',function(){
		document.querySelector('.secondPage').style.display="none";
		document.querySelector('.mainPage').style.display="block";
});
document.querySelector('.uploadBut').addEventListener('click',function(){
		chrome.windows.create(
          		{url:'display.html?uploadVideo=true', type: "popup", width: screen.width, height: screen.height
    	});
});
function url_domain(data) {
  var    a  = document.createElement('a');
         a.href = data;
  return a.hostname;
}
document.querySelector('button#start').addEventListener('click',start);
document.querySelector('button#stop').addEventListener('click',stop);
window.onload = init;
