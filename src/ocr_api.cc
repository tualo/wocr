#define BUILDING_NODE_EXTENSION
#include <node.h>
#include <leptonica/allheaders.h>
#include <tesseract/baseapi.h>
#include <tesseract/strngs.h>
#include "ocr_api.h"
#include <nan.h>


using namespace v8;


Nan::Persistent<FunctionTemplate> OCRApi::constructor;


OCRApi::OCRApi() {
  ocr = new tesseract::TessBaseAPI();
};


OCRApi::~OCRApi() {
  //im.release();
  //ocr->Clear();
  //ocr->End();
};

void OCRApi::Initialize(v8::Handle<v8::Object> exports) {
  Isolate* isolate = Isolate::GetCurrent();

  // Prepare constructor template
  //Local<FunctionTemplate> tpl = FunctionTemplate::New(isolate, New);
  //const Nan::FunctionCallbackInfo<v8::Value>& info

  Local<FunctionTemplate> tpl = Nan::New<FunctionTemplate>(OCRApi::New);
  constructor.Reset(tpl);

  tpl->SetClassName(String::NewFromUtf8(isolate, "OCR"));
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  // Prototype
  Nan::SetPrototypeMethod(tpl, "Init", Init);
  Nan::SetPrototypeMethod(tpl, "Clear", Clear);
  Nan::SetPrototypeMethod(tpl, "End", End);

  Nan::SetPrototypeMethod(tpl, "free", Free);

//  Nan::SetPrototypeMethod(tpl, "SetImage", SetImage);
  Nan::SetPrototypeMethod(tpl, "SetMatrix", SetMatrix);
  Nan::SetPrototypeMethod(tpl, "Recognize", Recognize);

  Nan::SetPrototypeMethod(tpl, "GetText", GetText);
  Nan::SetPrototypeMethod(tpl, "GetNumbers", GetNumbers);
  Nan::SetPrototypeMethod(tpl, "GetBarcode", GetBarcode);



  //constructor.Reset(isolate, tpl->GetFunction());
  exports->Set(String::NewFromUtf8(isolate, "OCR"), tpl->GetFunction());
}

void OCRApi::New(const Nan::FunctionCallbackInfo<v8::Value>& info) {
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);

  if (info.IsConstructCall()) {
    // Invoked as constructor: `new MyObject(...)`
    //double value = info[0]->IsUndefined() ? 0 : info[0]->NumberValue();
    OCRApi* obj = new OCRApi();
    obj->Wrap(info.This());
    info.GetReturnValue().Set(info.This());

  } else {
    Nan::ThrowTypeError("Cannot instantiate without new");
    /*
    // Invoked as plain function `MyObject(...)`, turn into construct call.
    const int argc = 1;
    Local<Value> argv[argc] = { info[0] };
    Local<Function> cons = Local<Function>::New(isolate, constructor);
    info.GetReturnValue().Set(cons->NewInstance(argc, argv));
    */
  }
}

void OCRApi::End(const Nan::FunctionCallbackInfo<v8::Value>& info) {
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);

  OCRApi* obj = Nan::ObjectWrap::Unwrap<OCRApi>(info.This());
  obj->ocr->End();
  info.GetReturnValue().Set(info.Holder());
}



void OCRApi::Free(const Nan::FunctionCallbackInfo<v8::Value>& info) {
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);

  OCRApi* obj = Nan::ObjectWrap::Unwrap<OCRApi>(info.This());
  //obj->ocr->End();

  obj->im.release();
  info.GetReturnValue().Set(info.Holder());
}


void OCRApi::Clear(const Nan::FunctionCallbackInfo<v8::Value>& info) {
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);

  OCRApi* obj = Nan::ObjectWrap::Unwrap<OCRApi>(info.This());
  obj->ocr->Clear();
  info.GetReturnValue().Set(info.Holder());
}

void OCRApi::SetMatrix(const Nan::FunctionCallbackInfo<v8::Value>& info) {

  OCRApi* obj = Nan::ObjectWrap::Unwrap<OCRApi>(info.This());
  Matrix *im = Nan::ObjectWrap::Unwrap<Matrix>(info[0]->ToObject());
  cv::Mat mat = im->mat;


  int depth = 0;
  if(mat.depth() == CV_8U){
    depth = 8;
  }

  //cv::Mat gray;




  //cv::cvtColor(mat, gray, CV_YUV420p2GRAY);
  //mat.convertTo(gray,CV_YUV420p2GRAY);

//  try{
//    cv::cvtColor(mat, gray, CV_BGR2GRAY);
//  }catch (Exception& e){
//    cv::cvtColor(mat, gray, CV_YUV420p2GRAY);
//  }

  obj->im = mat.clone();

//  cv::bitwise_not(obj->im, obj->im);
  //double thres = 114;//info[1]->ToNumber();
  //double color = 255;
//  cv::threshold(obj->im, obj->im, thres, color, CV_THRESH_BINARY);


//  obj->ocr->SetPageSegMode(tesseract::PSM_SINGLE_BLOCK);
//  obj->ocr->SetPageSegMode(tesseract::PSM_AUTO_ONLY);
//  obj->ocr->SetPageSegMode(tesseract::PSM_AUTO);
  obj->ocr->SetPageSegMode(tesseract::PSM_AUTO_OSD);
  obj->ocr->SetVariable("min_orientation_margin","0.0");

  obj->ocr->SetImage((uchar*)obj->im.data, obj->im.cols, obj->im.rows, 1, obj->im.cols);

  //gray.release();
  //mat.release();
  //delete mat;
  //im->mat.release();
	info.GetReturnValue().Set(info.Holder());
}

void OCRApi::GetBarcode(const Nan::FunctionCallbackInfo<v8::Value>& info){
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);
  OCRApi* obj = Nan::ObjectWrap::Unwrap<OCRApi>(info.This());
  zbar::ImageScanner scanner;
  scanner.set_config(zbar::ZBAR_NONE, zbar::ZBAR_CFG_ENABLE, 1);
  scanner.set_config(zbar::ZBAR_I25, zbar::ZBAR_CFG_ADD_CHECK, 1);
  uchar *raw = (uchar *)obj->im.data;
  zbar::Image image(obj->im.cols, obj->im.rows, "Y800", raw, obj->im.cols * obj->im.rows);
  // scan the image for barcodes
  int n = scanner.scan(image);
  int i = 0;

  Local<v8::String> str = v8::String::NewFromUtf8(isolate,"");
  Local<v8::Array> result = Array::New(isolate, 0 );
  for(zbar::Image::SymbolIterator symbol = image.symbol_begin(); symbol != image.symbol_end(); ++symbol) {
    Local<Object> obj = Object::New(isolate);
    obj->Set(String::NewFromUtf8(isolate, "code"),       v8::String::NewFromUtf8(isolate,  symbol->get_data().c_str() ) );
    obj->Set(String::NewFromUtf8(isolate, "type"),       v8::String::NewFromUtf8(isolate,  symbol->get_type_name().c_str() ) );
    result->Set(v8::Integer::New(info.GetIsolate(), i), obj);
    i++;
  }
  image.set_data(NULL, 0);
  //image.dispose();
  scanner.recycle_image(image);
  info.GetReturnValue().Set(result);
}

void OCRApi::GetText(const Nan::FunctionCallbackInfo<v8::Value>& info) {
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);
  OCRApi* obj = Nan::ObjectWrap::Unwrap<OCRApi>(info.This());
  obj->ocr->SetVariable("tessedit_char_whitelist", "0123456789ABCDEFGHIJKLMNOPQSRTUVWXYZabcdefghijklmnopqrstuvwxyzäöüÄÖÜß|/éè -");
  obj->ocr->Recognize(NULL);
  char *text = obj->ocr->GetUTF8Text();
  info.GetReturnValue().Set(v8::String::NewFromUtf8(isolate,text));

}


void OCRApi::GetNumbers(const Nan::FunctionCallbackInfo<v8::Value>& info) {
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);
  OCRApi* obj = Nan::ObjectWrap::Unwrap<OCRApi>(info.This());
  obj->ocr->SetVariable("tessedit_char_whitelist", "0123456789");
  obj->ocr->Recognize(NULL);
  char *text = obj->ocr->GetUTF8Text();
  info.GetReturnValue().Set(v8::String::NewFromUtf8(isolate,text));

}

void OCRApi::Recognize(const Nan::FunctionCallbackInfo<v8::Value>& info) {
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);

  OCRApi* obj = Nan::ObjectWrap::Unwrap<OCRApi>(info.This());
  obj->ocr->Recognize(NULL);
  info.GetReturnValue().Set(info.Holder());

}

void OCRApi::Init(const Nan::FunctionCallbackInfo<v8::Value>& info) {
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);
  if (info.Length() == 1){
    OCRApi* obj = Nan::ObjectWrap::Unwrap<OCRApi>(info.This());
    char *lang;
    v8::String::Utf8Value arg_lang(info[0]->ToString());
    if (arg_lang.length()) {
      lang = *arg_lang;
    } else {
      lang = (char *) "eng";
    }
    int ret = obj->ocr->Init(NULL, lang, tesseract::OEM_TESSERACT_ONLY);
    info.GetReturnValue().Set(ret == 0);
  }else{
    info.GetReturnValue().Set(true);
  }
}
