var addon = require('../build/Release/ocr');
var ocr = new addon.OCR();
var util = require('util');
var cv = require('opencv');
var events = require("events");





var OCR = function(index,width,height){
  if (typeof index==='undefined'){ index = -1; }

  this._image;
  this.index = index;
  this.width = width;
  this.height = height;
  this.plz = '';
  //console.log(this.width*1.0,this.height*1.0);

  events.EventEmitter.call(this);
}
util.inherits(OCR, events.EventEmitter);

OCR.prototype.start=function(showWindow){
  var win,camera,lastCodes=[],codes=[],lastReg=0;
  var me=this;
  if (typeof showWindow==="undefined"){
    showWindow=false;
  }
  try {

    camera = new cv.VideoCapture(me.index*1);

    if (me.width){
      if (me.height){
        console.log(me.width*1.0,me.height*1.0);
        camera.setWidth(me.width*1.0);
        camera.setHeight(me.height*1.0);
      }
    }


    ocr.Init("eng");

    if (showWindow===true){
      win = new cv.NamedWindow('Video', 0);
    }
    setInterval(function(){
      camera.read(function(err, im) {
        if (err) throw err;

        //console.log('codes: ',ocr.GetBarcode());
        ocr.SetMatrix(im);


        codes = ocr.GetBarcode();
        //console.log('codes: ',codes);

        //
        var numbers  = ocr.GetNumbers();//.replace(/\n/g," ");
        //var fulltext = ocr.GetText();//.replace(/\n/g," ");
        //console.log(fulltext);


        if (showWindow===true){
          if (im.size()[0] > 0 && im.size()[1] > 0){
            if (codes.length>0){
              lastCodes = codes;
              lastReg = (new Date().getTime());
            }else{

            }
            for(var ci=0;ci<lastCodes.length;ci++){

              im.putText(lastCodes[ci].code,20,120+ci*60,"HERSEY_SIMPLEX",[0, 255, 0]);
              im.putText(lastCodes[ci].type,320,120+ci*60,"HERSEY_SIMPLEX",[0, 255, 0]);
              im.putText( ((new Date().getTime()) - lastReg) +"ms",400,120+ci*60,"HERSEY_SIMPLEX",[0, 255, 0]);

            }
            im.putText( im.size()[1] + " x " + im.size()[0] ,20,60,"HERSEY_SIMPLEX",[255, 0, 0]);


            if (codes.length>0){
              me.regonizePostal();
            }
            im.putText( 'zip-code should be:'+me.plz ,20,460,"HERSEY_SIMPLEX",[200, 100, 0]);
            // cvPutText(result, "Differencing the two images.", cvPoint(30,30), &font, GREEN);
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


OCR.prototype.regonizePostal = function(){
  var me = this;
  var plz = '';
  var i,found;
  var numbers  = ocr.GetNumbers();//.replace(/\n/g," ");
  var numbersLines  = numbers.split(/\n/);
  var matches = numbers.match(/\b\d{5}\b/g);
  if (matches){
    if (matches.length>0){
      plz = matches[matches.length -1];
      me.plz = plz;
      i=0;
      while(i<numbersLines.length){
        if (numbersLines[i].indexOf(plz)>=0){
          found=true;
          break;
        }
        i++;
      }
    }
  }
}

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
