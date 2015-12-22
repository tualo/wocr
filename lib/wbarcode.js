var addon = require('../build/Release/ocr');
var fs = require('fs');
var path = require('path');
var ocr = new addon.OCR();
var cv = require('opencv');
/*
process.argv.forEach(function (val, index, array) {
  console.log(index + ': ' + val);
});
*/
ocr.Init("eng");
win = new cv.NamedWindow('Image', 0);

var filename = path.resolve(process.argv[process.argv.length-1]);
if (fs.existsSync(filename)){
  console.log(filename);
  console.time('total');
  //var codes = xocr.GetBarcode();
  cv.readImage(filename, function(err, im) {
    if (err){
      console.error(err);
    }else{
      console.log('ok');
      //im
      /*
      for(var threshold=80;threshold<150;threshold++){
        for(var maxVal=threshold+1;maxVal<threshold+10;maxVal++){
          var n = im.threshold(threshold,140);
          //n.normalize(0,255);
          ocr.SetMatrix(n);
          var codes = ocr.GetBarcode();
          win.show(n);
          win.blockingWaitKey(0, 1);
          console.log(codes,threshold,maxVal);

        }
      }
      */
      var oneCM = im.width()/28;
      barcode=im.crop(oneCM*16,0,oneCM*3,im.height()/2)
      barcode.convertGrayscale();
      var x = barcode.threshold(60,140);
      x.normalize(0,255);
      barcode = x.clone();
      barcode.gaussianBlur([5,5]);
      ocr.SetMatrix(barcode);

      console.log(ocr.GetBarcode());
      console.timeEnd('total');

      address=im.crop(oneCM*22,im.height()/2,oneCM*6,im.height()/2-1)
      address.convertGrayscale();
      address.gaussianBlur();

      ocr.SetMatrix(address);
      var text = ocr.GetText();
      console.log(text);

      console.timeEnd('total');



      im.convertGrayscale();
      im.gaussianBlur();
      //var n = im.threshold(79,135);
      var n = im.clone();

      n.normalize(0,255);
      ocr.SetMatrix(n);
      var codes = ocr.GetBarcode();
      var text = ocr.GetText();

      console.log(text);
      console.timeEnd('total');
      //console.log(codes);
      win.show(barcode);
      barcode.save('test.tiff')
      win.blockingWaitKey(0, 10000);

    }
  });

}
