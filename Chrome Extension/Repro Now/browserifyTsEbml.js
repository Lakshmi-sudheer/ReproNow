// For compiling: browserify browserifyTsEbml.js -o bundle.js 
const ebml = require("ts-ebml");

var decoder = new ebml.Decoder();
var encoder = new ebml.Encoder();
var enc = new TextEncoder("utf-8");
var dec = new TextDecoder("utf-8");
window.mergeAndDownload = mergeAndDownload;
window.getJson = getJson;
//console.log('here');
  /*fetch('abc.webm')
  .then((res)=> res.arrayBuffer() )
  .then((buf)=>{
      //mergeAndDownload('test',buf,'blah 123 blah');
      console.log(getJson(buf));
  });*/
  function init()
  {
    decoder = new ebml.Decoder();
    encoder = new ebml.Encoder();
    enc = new TextEncoder("utf-8");
    dec = new TextDecoder("utf-8");
  }
  function mergeAndDownload(name,videoBuffer,jsonString)
  {
    init();
    var ebmlElms = decoder.decode(videoBuffer);
    console.log(ebmlElms);
    ebmlElms=createArray(ebmlElms,name,jsonString);
    var arry=encoder.encode(ebmlElms);
    var decodedVal = decoder.decode(arry);
    console.log(decodedVal);
    downloadMpeg(arry,name);
  }
  function getJson(videoBuffer)
  {
    init();
    var ebmlElms = decoder.decode(videoBuffer);
    console.log(ebmlElms);
    var name=null;
    var data=null;
    ebmlElms.forEach(function(entry) {
        if(entry.name=="FileName")
          name=dec.decode(entry.data);
        if(entry.name=="FileData")
          data=dec.decode(entry.data);
    });
    console.log(name);
    if(name!=null && data!=null)
    {
      var ele={};
      ele.name=name;
      ele.data=data;
      return ele;
    }
    return null;
  }
  function createArray(elements,name,jsonString)
  {
    //var elements=[];
    var MasterElement={};
    MasterElement.name="Attachments";
    MasterElement.type="m";
    MasterElement.isEnd=false;
    elements.push(MasterElement);
    MasterElement={};
    MasterElement.name="AttachedFile";
    MasterElement.type="m";
    MasterElement.isEnd=false;
    elements.push(MasterElement);


    var childElement={};
    childElement.name="FileName";
    childElement.type="8";
    //childElement.data=enc.encode("test.json");
    //childElement.data=new Buffer("test.json");
    childElement.data=new Buffer(name+'.json');
    elements.push(childElement);

    childElement={};
    childElement.name="FileMimeType";
    childElement.type="s";
    childElement.data=new Buffer("application/json");
    elements.push(childElement);

    childElement={};
    childElement.name="FileData";
    childElement.type="b";
    //childElement.data=new Buffer("blah blah blah");
    childElement.data=new Buffer(jsonString);
    elements.push(childElement);

    childElement={};
    childElement.name="FileUID";
    childElement.type="u";
    childElement.data=new Buffer(""+Math.floor(Math.random() * 123123413));
    elements.push(childElement);


    MasterElement={};
    MasterElement.name="AttachedFile";
    MasterElement.type="m";
    MasterElement.isEnd=true;
    elements.push(MasterElement);
    MasterElement={};
    MasterElement.name="Attachments";
    MasterElement.type="m";
    MasterElement.isEnd=true;
    elements.push(MasterElement);
    
    return elements;
  }
  function downloadMpeg(recordedBlobs,name){
  var blob = new Blob([recordedBlobs], {type: 'video/webm'});
  //var blob = new Blob([recordedBlobs], {type: 'video/x-matroska'});
  var url = window.URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = name+'.mkv';
  document.body.appendChild(a);
  a.click();
  setTimeout(function() {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
}