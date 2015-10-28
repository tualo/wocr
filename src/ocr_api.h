/*
 */

#ifndef TESSERACT_BASEAPI_H_
#define TESSERACT_BASEAPI_H_

#include <baseapi.h>
#include <allheaders.h>
#include <zbar.h>
#include <node.h>
#include <node_object_wrap.h>

#include "../node_modules/opencv/src/Matrix.h"
#include "ocr_bindings.h"
#include <nan.h>

using namespace v8;

class OCRApi : public Nan::ObjectWrap {
  public:
    static void Initialize(v8::Handle<v8::Object> target);


  private:
    explicit OCRApi();
    ~OCRApi();

    static void New(const Nan::FunctionCallbackInfo<v8::Value>& info);
    static void Init(const Nan::FunctionCallbackInfo<v8::Value>& info);
    //static void SetImage(const Nan::FunctionCallbackInfo<v8::Value>& info);
    static void SetMatrix(const Nan::FunctionCallbackInfo<v8::Value>& info);

    static void Recognize(const Nan::FunctionCallbackInfo<v8::Value>& info);
    static void GetText(const Nan::FunctionCallbackInfo<v8::Value>& info);
    static void GetNumbers(const Nan::FunctionCallbackInfo<v8::Value>& info);
    static void GetBarcode(const Nan::FunctionCallbackInfo<v8::Value>& info);

    static void Clear(const Nan::FunctionCallbackInfo<v8::Value>& info);
    static void End(const Nan::FunctionCallbackInfo<v8::Value>& info);
    static void Free(const Nan::FunctionCallbackInfo<v8::Value>& info);
    //static v8::Persistent<v8::Function> constructor;

    static Nan::Persistent<FunctionTemplate> constructor;
    tesseract::TessBaseAPI* ocr;
    cv::Mat im;
};

#endif
