var addon = require('../build/Release/ocr');
var ocr = new addon.OCR();
var util = require('util');
var cv = require('opencv');
var events = require("events");





var OCR = function(){
  this._image;
  events.EventEmitter.call(this);
}
util.inherits(OCR, events.EventEmitter);

OCR.prototype.start=function(cameraIndex, showWindow){
  var win,camera;
  if (typeof showWindow==="undefined"){
    showWindow=false;
  }
  try {

    camera = new cv.VideoCapture(0);
    ocr.Init("eng")

    if (showWindow===true){
      win = new cv.NamedWindow('Video', 0);
    }
    setInterval(function(){
      camera.read(function(err, im) {
        if (err) throw err;

        console.log('codes: ',ocr.GetBarcode());
        ocr.SetMatrix(im);
        var numbers  = ocr.GetNumbers();//.replace(/\n/g," ");
        var fulltext = ocr.GetText();//.replace(/\n/g," ");
        console.log(fulltext);


        if (showWindow===true){
          if (im.size()[0] > 0 && im.size()[1] > 0){
            win.show(im);
          }
          win.blockingWaitKey(0, 50);
        }
      });
    },100);
  } catch (e){
    throw 'Couldn\'t start camera ';
  }

}

exports.OCR = OCR;


/*

ocr.Init("eng")



var dbc = new classes.DBClient();
dbc.start();

cv.readImage(__dirname+'/files/Letter_2048.png', function(err, im) {
    console.time('opencv');

    ocr.SetMatrix(im);

    var numbers  = ocr.GetNumbers();//.replace(/\n/g," ");
    var fulltext = ocr.GetText();//.replace(/\n/g," ");
    console.log(fulltext);

    var numbersLines  = numbers.split(/\n/);
    var fulltextLines = fulltext.split(/\n/);
    var plz = '';
    var i,found;

    //console.log(numbers,fulltext);
    var matches = numbers.match(/\b\d{5}\b/g);
    console.log(matches);
    if (matches.length>0){
      plz = matches[matches.length -1];
      console.log('zip-code should be:',plz);
      i=0;
      while(i<numbersLines.length){
        if (numbersLines[i].indexOf(plz)>=0){
          found=true;
          break;
        }
        i++;
      }
      if (found){
        var town = fulltextLines[i].replace(plz,'').trim();
        console.log('town should be:', town );
        while (i>=0){
          i--;
          if (fulltextLines[i].trim()!==''){

            break;
          }
        }

        var p = fulltextLines[i].trim().split(' ');
        var hn = p.pop();
        console.log('house number should be:',hn);
        console.log('street should be:',p.join(' '));
        var f = p.join(' ') + ' ' + plz + ' ' + town;
        //f = f.push(plz);
        //f = f.push( fulltextLines[i].replace(plz,'').trim() );

        dbc.findText( f,hn );

      }
    }
    //for(numbers)
    //console.log()

    /*
    console.log('address: ',ocr.GetNumbers().replace(/\n/g," "));
    console.log('address: ',ocr.GetText().replace(/\n/g," "));


    matches = str.match(/\b\d{5}\b/g);

    console.log('codes: ',ocr.GetBarcode());


//    TessBaseAPI::SetVariable("tessedit_char_whitelist", "0123456789");


});

setInterval(function(){
  console.log('.');
},5000);
*/

//process.exit();
