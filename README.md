# wocr

[![Build Status](https://secure.travis-ci.org/tualo/wocr.png)](http://travis-ci.org/tualo/wocr)
[![endorse](https://api.coderwall.com/thomashoffmann1979/endorsecount.png)](https://coderwall.com/thomashoffmann1979)

An ocr package for node. This package uses opencv, tesseract and zbarimg.


## Install
  You'll need OpenCV 2.3.1 or newer, tesseract 3.02.02 or newer, leptonica 1.71 or newer and zbar 0.10.0 or newer.

  ```
  npm install wocr
  ```

## Usage

  ```
  OCR = require('wocr')
  var ocr = new OCR();
  ocr.Init('eng');
  ocr.SetMatrix(myImage); // need to be an node-opencv matrix
  var codes = ocr.GetBarcode();
  var text = ocr.GetText();
  ```
