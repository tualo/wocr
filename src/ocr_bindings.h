#ifndef TESSERACT_BINDINGS_H_
#define TESSERACT_BINDINGS_H_

#define REQUIRE_ARG_NUM(num)                                          \
  if (args.Length() < (num))                                          \
    return ThrowException(Exception::Error(                           \
    String::New("At least " #num " argument(s) should be defined.")))

#define REQUIRE_STRING(VAR, pos)                          \
  if (args.Length() <= (pos) || !args[pos]->IsString())   \
    return ThrowException(Exception::TypeError(           \
    String::New("Argument " #pos " must be a string")));  \
  String::Utf8Value VAR(args[pos]->ToString());

#endif
