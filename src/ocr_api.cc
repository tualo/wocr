#define BUILDING_NODE_EXTENSION
#include <node.h>
#include <leptonica/allheaders.h>
#include <tesseract/baseapi.h>
#include <tesseract/strngs.h>
#include "ocr_api.h"



using namespace v8;


Persistent<Function> OCRApi::constructor;


OCRApi::OCRApi() {
  ocr = new tesseract::TessBaseAPI();
};


OCRApi::~OCRApi() {
  //ocr->Clear();
  //ocr->End();
};

void OCRApi::Initialize(v8::Handle<v8::Object> exports) {
  Isolate* isolate = Isolate::GetCurrent();

  // Prepare constructor template
  Local<FunctionTemplate> tpl = FunctionTemplate::New(isolate, New);
  tpl->SetClassName(String::NewFromUtf8(isolate, "OCR"));
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  // Prototype
  NODE_SET_PROTOTYPE_METHOD(tpl, "Init", Init);
  NODE_SET_PROTOTYPE_METHOD(tpl, "Clear", Clear);
  NODE_SET_PROTOTYPE_METHOD(tpl, "End", End);

  NODE_SET_PROTOTYPE_METHOD(tpl, "SetImage", SetImage);
  NODE_SET_PROTOTYPE_METHOD(tpl, "SetMatrix", SetMatrix);
  NODE_SET_PROTOTYPE_METHOD(tpl, "Recognize", Recognize);

  NODE_SET_PROTOTYPE_METHOD(tpl, "GetText", GetText);
  NODE_SET_PROTOTYPE_METHOD(tpl, "GetNumbers", GetNumbers);
  NODE_SET_PROTOTYPE_METHOD(tpl, "GetBarcode", GetBarcode);



  constructor.Reset(isolate, tpl->GetFunction());
  exports->Set(String::NewFromUtf8(isolate, "OCR"), tpl->GetFunction());
}

void OCRApi::New(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);

  if (args.IsConstructCall()) {
    // Invoked as constructor: `new MyObject(...)`
    //double value = args[0]->IsUndefined() ? 0 : args[0]->NumberValue();
    OCRApi* obj = new OCRApi();
    obj->Wrap(args.This());
    args.GetReturnValue().Set(args.This());

  } else {

    // Invoked as plain function `MyObject(...)`, turn into construct call.
    const int argc = 1;
    Local<Value> argv[argc] = { args[0] };
    Local<Function> cons = Local<Function>::New(isolate, constructor);
    args.GetReturnValue().Set(cons->NewInstance(argc, argv));

  }
}

void OCRApi::End(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);

  OCRApi* obj = ObjectWrap::Unwrap<OCRApi>(args.This());
  obj->ocr->End();
  NanReturnValue(args.Holder());
}


void OCRApi::Clear(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);

  OCRApi* obj = ObjectWrap::Unwrap<OCRApi>(args.This());
  obj->ocr->Clear();
  NanReturnValue(args.Holder());
}

void OCRApi::SetMatrix(const FunctionCallbackInfo<Value>& args) {

  OCRApi* obj = ObjectWrap::Unwrap<OCRApi>(args.This());

  Matrix *im = ObjectWrap::Unwrap<Matrix>(args[0]->ToObject());
  cv::Mat mat = im->mat;


  int depth = 0;
  if(mat.depth() == CV_8U){
    depth = 8;
  }

  cv::Mat gray;
  cv::cvtColor(mat, gray, CV_BGR2GRAY);
  obj->im = gray.clone();

//  cv::bitwise_not(obj->im, obj->im);
  double thres = 114;//args[1]->ToNumber();
  double color = 255;
  cv::threshold(obj->im, obj->im, thres, color, CV_THRESH_BINARY);


  obj->ocr->SetPageSegMode(tesseract::PSM_SINGLE_BLOCK);
//  obj->ocr->SetPageSegMode(tesseract::PSM_AUTO_ONLY);
//  obj->ocr->SetPageSegMode(tesseract::PSM_AUTO);
//  obj->ocr->SetPageSegMode(tesseract::PSM_AUTO_OSD);


  obj->ocr->SetImage((uchar*)obj->im.data, obj->im.cols, obj->im.rows, 1, obj->im.cols);

	NanReturnValue(args.Holder());
}

void OCRApi::GetBarcode(const FunctionCallbackInfo<Value>& args){

  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);
  OCRApi* obj = ObjectWrap::Unwrap<OCRApi>(args.This());

  zbar::ImageScanner scanner;
  scanner.set_config(zbar::ZBAR_NONE, zbar::ZBAR_CFG_ENABLE, 1);
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
    result->Set(v8::Integer::New(args.GetIsolate(), i), obj);
    i++;
  }
  NanReturnValue(result);
}

void OCRApi::GetText(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);
  OCRApi* obj = ObjectWrap::Unwrap<OCRApi>(args.This());
  obj->ocr->SetVariable("tessedit_char_whitelist", "0123456789ABCDEFGHIJKLMNOPQSRTUVWXYZabcdefghijklmnopqrstuvwxyz -");
  obj->ocr->Recognize(NULL);
  char *text = obj->ocr->GetUTF8Text();


  /*
  std::cout << "***" << text << std::endl;
*/

  NanReturnValue(v8::String::NewFromUtf8(isolate,text));

}


void OCRApi::GetNumbers(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);
  OCRApi* obj = ObjectWrap::Unwrap<OCRApi>(args.This());
  obj->ocr->SetVariable("tessedit_char_whitelist", "0123456789");
  obj->ocr->Recognize(NULL);
  char *text = obj->ocr->GetUTF8Text();


  /*
  std::cout << "***" << text << std::endl;
*/

  NanReturnValue(v8::String::NewFromUtf8(isolate,text));

}


void OCRApi::SetImage(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);

  PIX* pix = NULL;

  if (args.Length() == 1){
    if (args[0]->IsString()) {
      pix = pixRead(strdup(*(String::Utf8Value(args[0]))));
    } else {
      //PixWrap* pixWrap = ObjectWrap::Unwrap<PixWrap>(args[0]->ToObject());
      //pix = pixWrap->data();
    }
  }

  if (pix == NULL) {
    //return ThrowException(Exception::Error(String("Image was not found or has unsupported format."));
    return;
  }

  OCRApi* obj = ObjectWrap::Unwrap<OCRApi>(args.This());
  obj->ocr->SetImage(pix);
  NanReturnValue(args.Holder());
}


void OCRApi::Recognize(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);

  OCRApi* obj = ObjectWrap::Unwrap<OCRApi>(args.This());
  obj->ocr->Recognize(NULL);
  NanReturnValue(args.Holder());

}

/*
int depth;
 if(subImage.depth() == CV_8U)
    depth = 8;
 //other cases not considered yet

 PIX* pix = pixCreateHeader(subImage.size().width, subImage.size().height, depth);
 pix->data = (l_uint32*) subImage.data;
*/

void OCRApi::Init(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);


  if (args.Length() == 1){
    OCRApi* obj = ObjectWrap::Unwrap<OCRApi>(args.This());
    char *lang;
    v8::String::Utf8Value arg_lang(args[0]->ToString());

    if (arg_lang.length()) {
      lang = *arg_lang;
    } else {
      lang = (char *) "eng";
    }

    // int ret = obj->ocr->Init(NULL, lang, tesseract::OEM_DEFAULT);
    // int ret = obj->ocr->Init(NULL, lang, tesseract::OEM_CUBE_ONLY);
    // int ret = obj->ocr->Init(NULL, lang, tesseract::OEM_TESSERACT_CUBE_COMBINED);
    int ret = obj->ocr->Init(NULL, lang, tesseract::OEM_TESSERACT_ONLY);

    args.GetReturnValue().Set(Boolean::New(isolate, ret == 0));
  }else{
    args.GetReturnValue().Set(Boolean::New(isolate, false ));
  }
}
