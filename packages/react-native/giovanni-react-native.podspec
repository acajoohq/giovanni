require "json"
package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "giovanni-react-native"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = "https://github.com/acajoohq/giovanni"
  s.license      = { :type => "Apache-2.0" }
  s.authors      = { "qpdf contributors" => "" }
  s.platforms    = { :ios => "13.4" }
  s.source       = { :git => "https://github.com/acajoohq/giovanni.git", :tag => "v#{s.version}" }

  s.source_files = "ios/**/*.{h,mm,cpp}", "../../packages/core/native/targets/jsi/qpdf/*.{h,cpp}"

  s.dependency "React-Core"
  s.dependency "React-callinvoker"
  s.dependency "ReactCommon/turbomodule/core"

  # Path to the pre-built giovanni_jsi static library (produced by targets/jsi/qpdf CMakeLists.txt)
  s.vendored_libraries = "ios/libs/libgiovanni_jsi.a"

  # qpdf and giovanni interface headers
  s.pod_target_xcconfig = {
    "HEADER_SEARCH_PATHS" => "$(PODS_ROOT)/../../packages/core/native/interface/include $(PODS_ROOT)/../../packages/core/native/impl/qpdf",
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++20",
    "OTHER_CPLUSPLUSFLAGS" => "-DGIOVANNI_JSI_ENABLED=1"
  }
end
