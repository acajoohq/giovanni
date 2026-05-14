// thin Ghostscript wrapper around the gsapi_* embedding surface

#include "../ghostscript_wasm.hh"

#include <emscripten/val.h>

extern "C" {
#include "base/gserrors.h"
#include "psi/iapi.h"
}

#include <atomic>
#include <cstdio>
#include <filesystem>
#include <fstream>
#include <stdexcept>
#include <string>
#include <vector>

using namespace emscripten;

namespace {

struct GhostscriptRunContext {
    std::string stdoutText;
    std::string stderrText;
};

std::atomic<unsigned long> tempFileCounter{0};

std::string nextTempPdfPath(const char* prefix)
{
    const auto id = tempFileCounter.fetch_add(1, std::memory_order_relaxed) + 1;
    return std::string("/") + prefix + "-" + std::to_string(id) + ".pdf";
}

std::vector<unsigned char> uint8ArrayToVector(const val& inputArray)
{
    const auto length = inputArray["length"].as<unsigned>();
    std::vector<unsigned char> bytes(length);
    val memoryView{typed_memory_view(bytes.size(), bytes.data())};
    memoryView.call<void>("set", inputArray);
    return bytes;
}

val vectorToUint8Array(const std::vector<unsigned char>& bytes)
{
    val array = val::global("Uint8Array").new_(bytes.size());
    val memoryView{typed_memory_view(bytes.size(), bytes.data())};
    array.call<void>("set", memoryView);
    return array;
}

std::vector<std::string> toArgStrings(const val& argsArray)
{
    const auto length = argsArray["length"].as<unsigned>();
    std::vector<std::string> args;
    args.reserve(length + 1);
    args.emplace_back("gs");

    for (unsigned i = 0; i < length; ++i) {
        args.emplace_back(argsArray[i].as<std::string>());
    }

    return args;
}

std::vector<char*> toArgv(std::vector<std::string>& args)
{
    std::vector<char*> argv;
    argv.reserve(args.size());

    for (std::string& arg : args) {
        argv.push_back(arg.data());
    }

    return argv;
}

void writeBinaryFile(const std::string& path, const std::vector<unsigned char>& bytes)
{
    std::ofstream file(path, std::ios::binary | std::ios::trunc);
    if (!file) {
        throw std::runtime_error("Failed to create Ghostscript input file");
    }

    file.write(reinterpret_cast<const char*>(bytes.data()), static_cast<std::streamsize>(bytes.size()));
    if (!file) {
        throw std::runtime_error("Failed to write Ghostscript input file");
    }
}

std::vector<unsigned char> readBinaryFile(const std::string& path)
{
    std::ifstream file(path, std::ios::binary);
    if (!file) {
        throw std::runtime_error("Failed to read Ghostscript output file");
    }

    return std::vector<unsigned char>(std::istreambuf_iterator<char>(file), std::istreambuf_iterator<char>());
}

void removeFileIfPresent(const std::string& path)
{
    std::error_code error;
    std::filesystem::remove(path, error);
}

int stdoutCallback(void* callerHandle, const char* str, int len)
{
    if (callerHandle != nullptr && str != nullptr && len > 0) {
        auto* context = static_cast<GhostscriptRunContext*>(callerHandle);
        context->stdoutText.append(str, static_cast<std::size_t>(len));
    }

    return len;
}

int stderrCallback(void* callerHandle, const char* str, int len)
{
    if (callerHandle != nullptr && str != nullptr && len > 0) {
        auto* context = static_cast<GhostscriptRunContext*>(callerHandle);
        context->stderrText.append(str, static_cast<std::size_t>(len));
    }

    return len;
}

std::string trimTrailingWhitespace(std::string text)
{
    while (!text.empty() && (text.back() == '\n' || text.back() == '\r' || text.back() == '\t' || text.back() == ' ')) {
        text.pop_back();
    }

    return text;
}

std::string buildFailureMessage(int code, const GhostscriptRunContext& context)
{
    std::string message = "Ghostscript failed";

    if (code == gs_error_Info) {
        message = "Ghostscript returned informational output";
    } else if (code < 0) {
        message += " with error ";
        message += std::to_string(code);
        message += " (";
        message += gs_errstr(code);
        message += ")";
    }

    const std::string detail = trimTrailingWhitespace(context.stderrText.empty() ? context.stdoutText : context.stderrText);
    if (!detail.empty()) {
        message += ": ";
        message += detail;
    }

    return message;
}

void throwIfError(int code, const GhostscriptRunContext& context)
{
    if (code < 0 && code != gs_error_Quit) {
        throw std::runtime_error(buildFailureMessage(code, context));
    }
}

} // namespace

std::string getGhostscriptVersion()
{
    gsapi_revision_t revision{};
    const int code = gsapi_revision(&revision, sizeof(revision));
    if (code < 0) {
        throw std::runtime_error("Failed to read Ghostscript revision");
    }

    return std::to_string(revision.revision / 100) + "." + std::to_string(revision.revision % 100);
}

val rewritePdf(const val& inputArray, const val& argsArray)
{
    const std::vector<unsigned char> input = uint8ArrayToVector(inputArray);
    std::vector<std::string> args = toArgStrings(argsArray);
    val outputBytes = val::undefined();

    const std::string inputPath = nextTempPdfPath("gs-input");
    const std::string outputPath = nextTempPdfPath("gs-output");

    GhostscriptRunContext context{};
    void* instance = nullptr;
    bool instanceCreated = false;
    bool initialized = false;

    try {
        writeBinaryFile(inputPath, input);

        args.emplace_back("-sOutputFile=" + outputPath);
        args.emplace_back(inputPath);

        int code = gsapi_new_instance(&instance, &context);
        if (code < 0 || instance == nullptr) {
            throw std::runtime_error("Failed to create Ghostscript instance");
        }
        instanceCreated = true;

        code = gsapi_set_stdio_with_handle(instance, nullptr, stdoutCallback, stderrCallback, &context);
        throwIfError(code, context);

        code = gsapi_set_arg_encoding(instance, GS_ARG_ENCODING_UTF8);
        throwIfError(code, context);

        std::vector<char*> argv = toArgv(args);
        code = gsapi_init_with_args(instance, static_cast<int>(argv.size()), argv.data());

        if (code != gs_error_Info) {
            initialized = true;
        }

        int finalCode = code;
        if (code == 0 || code == gs_error_Quit || code <= gs_error_Fatal) {
            const int exitCode = gsapi_exit(instance);
            initialized = false;

            if (code == 0 || code == gs_error_Quit) {
                finalCode = exitCode;
            }
            if (finalCode == gs_error_Quit) {
                finalCode = 0;
            }
        }

        throwIfError(finalCode, context);

        const std::vector<unsigned char> output = readBinaryFile(outputPath);
        outputBytes = vectorToUint8Array(output);
    } catch (...) {
        if (initialized && instance != nullptr) {
            gsapi_exit(instance);
        }
        if (instanceCreated && instance != nullptr) {
            gsapi_delete_instance(instance);
            instance = nullptr;
            instanceCreated = false;
        }

        removeFileIfPresent(inputPath);
        removeFileIfPresent(outputPath);
        throw;
    }

    if (instanceCreated && instance != nullptr) {
        gsapi_delete_instance(instance);
    }
    removeFileIfPresent(inputPath);
    removeFileIfPresent(outputPath);
    return outputBytes;
}
