#define BUILDING_NODE_EXTENSION
#include <node.h>
#include <leptonica/allheaders.h>
#include <tesseract/baseapi.h>
#include <tesseract/strngs.h>

#include "ocr_api.h"

using namespace v8;

void InitOCR(Handle<Object> target) {
  OCRApi::Initialize(target);
}

NODE_MODULE(ocr_bindings, InitOCR)
