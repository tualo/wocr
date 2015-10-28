#ifndef TESSERACT_BINDINGS_H_
#define TESSERACT_BINDINGS_H_

#define REQUIRE_ARG_NUM(num)                                          \
  if (info.Length() < (num))                                          \
    return ThrowException(Exception::Error(                           \
    String::New("At least " #num " argument(s) should be defined.")))

#define REQUIRE_STRING(VAR, pos)                          \
  if (info.Length() <= (pos) || !info[pos]->IsString())   \
    return ThrowException(Exception::TypeError(           \
    String::New("Argument " #pos " must be a string")));  \
  String::Utf8Value VAR(info[pos]->ToString());

#endif
