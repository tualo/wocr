{
    "targets": [
    {
      "target_name": "ocr",
      "sources": [
        "src/ocr_bindings.cc",
        "src/ocr_api.cc"
      ],


      "conditions": [
          ['OS=="mac"', {
            'xcode_settings': {
              'OTHER_CPLUSPLUSFLAGS': [
                '-std=c++11',
                '-stdlib=libc++'
              ],
              'OTHER_LDFLAGS': [
                '-stdlib=libc++'
              ],
              'GCC_ENABLE_CPP_EXCEPTIONS': 'YES',
              'GCC_ENABLE_CPP_RTTI': 'YES',
              'MACOSX_DEPLOYMENT_TARGET': '10.7'
            }
           }]
      ],

      "include_dirs": [
          "<!(node -e \"require('nan')\")",
          '/usr/include/leptonica',
          '/usr/include/tesseract',
          '/usr/local/include/leptonica',
          '/usr/local/include/tesseract',
          "/usr/local/Cellar/leptonica/1.71_1/include",
          "/usr/local/Cellar/tesseract/3.02.02_3/include",
      ],

      "libraries": [
          "-L/usr/local/lib"
      ],


      "link_settings": {
        "libraries": [
            "<!@(pkg-config --libs opencv)",
            "-llept", "-ltesseract", "-lzbar"
        ]
      }

    }



    ]

}
