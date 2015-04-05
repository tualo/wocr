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

using namespace v8;

class OCRApi : public node::ObjectWrap {
  public:
    static void Initialize(v8::Handle<v8::Object> target);


  private:
    explicit OCRApi();
    ~OCRApi();

    static void New(const v8::FunctionCallbackInfo<v8::Value>& args);
    static void Init(const FunctionCallbackInfo<Value>& args);
    static void SetImage(const FunctionCallbackInfo<Value>& args);
    static void SetMatrix(const FunctionCallbackInfo<Value>& args);

    static void Recognize(const FunctionCallbackInfo<Value>& args);
    static void GetText(const FunctionCallbackInfo<Value>& args);
    static void GetNumbers(const FunctionCallbackInfo<Value>& args);
    static void GetBarcode(const FunctionCallbackInfo<Value>& args);

    static void Clear(const v8::FunctionCallbackInfo<v8::Value>& args);
    static void End(const v8::FunctionCallbackInfo<v8::Value>& args);
    static v8::Persistent<v8::Function> constructor;

    tesseract::TessBaseAPI* ocr;
    cv::Mat im;
};

#endif
