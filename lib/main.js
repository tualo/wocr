var addon = require('../build/Release/ocr');
var ocr = new addon.OCR();
var util = require('util');
var path = require('path');
var fs = require('fs');
var glob = require('glob');
var cv = require('opencv');
var events = require("events");
var scaling = 2;




var OCR = function(index,width,height,scale){
  if (typeof index==='undefined'){ index = -1; }

  this._image;
  this.index = index;
  this.width = width;
  this.height = height;
  this.plz = '';

  if (typeof scale==='number'){
    scaling = scale;
  }
  //console.log(this.width*1.0,this.height*1.0);

  events.EventEmitter.call(this);
}
util.inherits(OCR, events.EventEmitter);

OCR.prototype.glob = function(pattern,path){
  var me=this;
  ocr.Init("deu");
  glob(pattern,{
    cwd: path
  },function(err,matches){
    me.win = new cv.NamedWindow('Image', 0);
    me.win2 = new cv.NamedWindow('Orig', 0);
    me.rect(path,matches,0);
    /*
    var fileName = path.join(pattern,matches[index]);

    cv.readImage(fileName, function(err, im) {

    }
    */


  })
}

OCR.prototype.rect = function(pathName,files,index){
  var me = this;
  if (typeof index==='undefined'){
    index=0;
  }
  if (index<files.length){
    var fileName = path.join(pathName,files[index]);
    if (path.extname(fileName) === '.gige' ){

      fs.readFile(fileName, function (err, data) {
        if (err) throw err;
        var im = new cv.Matrix(data.length / 2048,2048,cv.Constants.CV_8UC1);
        im.put(data);
        me.processImage(im,pathName,files,index);
      });

    }else{

      cv.readImage(fileName, function(err, im) {
        im.convertGrayscale();
        me.processImage(im,pathName,files,index);
      });

    }
  }else{
    console.log('done');
  }
}

OCR.prototype.processImage = function(im,pathName,files,index){
  var me = this;
    //im.normalize(20,185);
    //im.equalizeHist();

  im.resize(im.width(),im.height() * scaling);
  //me.ocr(im);

  var borders =  me.findBorders( im.clone() );

  var ratio =borders.height  / borders.width;
  var type = 'DINLANG';
  if ( ratio > 1.2){
    if ( (borders.width * 28/2048) < 14){
      type = 'DINLANG';
      //console.log('seems to be din lang letter');
    }else{
      type = 'UNKOWN';
      //console.log('large letter');
    }
  }else{
    if ( (borders.width * 28/2048) < 14){
      type = 'POSTCARD';
      //console.log('seems to be postcard');
    }else{
      type = 'UNKOWN';
      //console.log('large letter');
    }
  }


  //var ocrim = im.clone();
  var ocrim = im.crop(borders.x,borders.y,borders.width,borders.height);
  ocrim.rotate(270);

  ocr.SetMatrix(ocrim);
  codes = ocr.GetBarcode();


if (type === 'DINLANG'){
  var w_ratio = borders.width/11;
  var h_ratio = borders.height/22;

  //console.log(borders,w_ratio,h_ratio);
  //console.log(borders.x + w_ratio*3 ,borders.y + 11*h_ratio, w_ratio*5, h_ratio*10);

  var ocrim = im.crop(borders.x + w_ratio*5 ,borders.y + 11*h_ratio, w_ratio*5, h_ratio*10);
  ocrim.rotate(270);
  //ocrim.normalize(90,140);
  ocrim = ocrim.threshold(40,45,"Binary");
  ocrim.equalizeHist();
  ocr.SetMatrix(ocrim);
  console.log(ocr.GetText());

  //ocrim = ocrim.threshold(80,125,"Binary");
  me.win.show(ocrim);
  me.win.blockingWaitKey(0, 50);
}
  console.log(files[index],'codes: ',codes,borders,'ca. ', borders.width * 28/2048 ,'cm' );

  /*
  //crop = im.clone();
  im = im.threshold(40,155,"Binary");
  im.equalizeHist();

//      console.log(borders,im);

console.log(borders);
  var crop = im.crop(borders.x,borders.y,borders.width,borders.height);
  crop.resize(crop.width() * 0.5,crop.height());

  crop.rotate(270);

  if (crop.width()/crop.height() > 1.5){
    console.log('seems to be din lang letter');
  }else{
    console.log('seems to be postcard');
  }

  //crop.resize(crop.width()/2,crop.height()/2);

  me.win.show(crop);
  me.win.blockingWaitKey(0, 50);
  */


  setTimeout(function(){
    me.rect(pathName,files,index+1);
  },10);
}

OCR.prototype.findBorders = function(img,scale){
  if (typeof scale==='undefined'){
    scale = 10;
  }
  var origHeight = img.height();
  var width = img.width()/scale;
  var height = img.height()/scale;
  var avg = [];
  var avgAll = 0;

  img.resize(width,height);
  width = img.width();
  height = img.height();
  var buf = img.getData();
  for(var y=0;y<height;y++){
    for(var x=0;x<width;x++){
      if (typeof avg[x]==='undefined'){
        avg[x]=0;
      }
      avg[x]+=buf[x + width*y];
      avgAll += buf[x + width*y];
    }
  }

  for(var x=0;x<width;x++){
    avg[x]/=height;
  }
  avgAll/=buf.length;

  xEnd = 0;
  xStart = 0;

  for(var x=width;x>=0;x--){
    if (xEnd===0){
      if (avg[x]>avgAll*1.1){
        xEnd = x;
      }
    }else{
      if (avg[x]<avgAll*0.9){
        xStart = x;
        break;
      }
    }
  }

  if (xStart>0)
    xStart-=1;

  if (xEnd<width)
    xEnd+=1;

  xStart*=scale;
  xEnd*=scale;

  return {
    x: xStart,
    y: 0,
    width: xEnd-xStart,
    height: origHeight
  }
}


OCR.prototype.ocr = function(im){
  var me=this;
  im = im.clone();

  ocr.SetMatrix(im);

  codes = ocr.GetBarcode();
  console.log('codes: ',codes);

  //
  if (codes.length>0){
    var numbers  = ocr.GetNumbers();//.replace(/\n/g," ");
    var fulltext = ocr.GetText();//.replace(/\n/g," ");

    /*
    if (im.size()[0] > 0 && im.size()[1] > 0){
      for(var ci=0;ci<codes.length;ci++){
        im.putText(codes[ci].code,20,120+ci*60,"HERSEY_SIMPLEX",[0, 255, 0]);
        im.putText(codes[ci].type,320,120+ci*60,"HERSEY_SIMPLEX",[0, 255, 0]);
        //im.putText( ((new Date().getTime()) - lastReg) +"ms",400,120+ci*60,"HERSEY_SIMPLEX",[0, 255, 0]);
      }
      //im.putText( im.size()[1] + " x " + im.size()[0] ,20,60,"HERSEY_SIMPLEX",[255, 0, 0]);
        line = me.regonizePostal(numbers);
        console.log('PLZ/ Ort:',(fulltext.split("\n"))[line]);
        console.log('Strasse:',(fulltext.split("\n"))[line-1]);
        console.log('Name:',(fulltext.split("\n"))[line-2]);
      //im.putText( 'zip-code should be:'+me.plz ,20,460,"HERSEY_SIMPLEX",[200, 100, 0]);
    }
    */
  }
  console.timeEnd('total');
}

OCR.prototype.singleFile=function(fileName,showWindow){
  var win,camera,lastCodes=[],codes=[],lastReg=0;
  var me=this;
  ocr.Init("eng");
  cv.readImage(fileName, function(err, im) {
    //im.resize(im.width()/1.5,im.height()/1.5)

    // im.convertGrayscale();
    if (showWindow===true){
      win = new cv.NamedWindow('Image', 0);
    }
      if (err) throw err;

      console.time('total');
      ocr.SetMatrix(im);
      codes = ocr.GetBarcode();
      console.log('codes: ',codes);
      //
      //var numbers  = ocr.GetNumbers();//.replace(/\n/g," ");
      var fulltext = ocr.GetText();//.replace(/\n/g," ");
      var numbers = fulltext;
      console.log(fulltext);


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
            line = me.regonizePostal(numbers);
            console.log('PLZ/ Ort:',(fulltext.split("\n"))[line]);
            console.log('Strasse:',(fulltext.split("\n"))[line-1]);
            console.log('Name:',(fulltext.split("\n"))[line-2]);
          }
          im.putText( 'zip-code should be:'+me.plz ,20,460,"HERSEY_SIMPLEX",[200, 100, 0]);
          // cvPutText(result, "Differencing the two images.", cvPoint(30,30), &font, GREEN);
          if (showWindow===true){
            win.show(im);
            win.blockingWaitKey(0, 50);
          }
      }
      console.timeEnd('total');
  })
  if (showWindow===true){
    setInterval(function(){

    },1000);
  }
}

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
        var fulltext = ocr.GetText();//.replace(/\n/g," ");
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
              var line = me.regonizePostal(numbers);
              console.log((fulltext.split("\n"))[line]);
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


OCR.prototype.regonizePostal = function(numbers){
  var me = this;
  var plz = '';
  var i,found;
//  var numbers  = ocr.GetNumbers();//.replace(/\n/g," ");
  var numbersLines  = numbers.split(/\n/);

  var matches = numbers.match(/\b\d{5}\b/g);
  console.log(numbersLines,matches);

  if (matches){
    if (matches.length>0){
      plz = matches[matches.length -1];
      me.plz = plz;
      console.log('*found plz:',plz);
      i=0;
      while(i<numbersLines.length){
        if (numbersLines[i].indexOf(plz)>=0){
          found=true;
          return i;
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
