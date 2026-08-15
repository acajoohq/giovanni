#include "gs_engine.h"

#include <stdexcept>

#ifdef GIOVANNI_HAVE_GHOSTSCRIPT

extern "C" {
#include "base/gserrors.h"
#include "psi/iapi.h"
}

#include <atomic>
#include <filesystem>
#include <fstream>

namespace giovanni {

namespace {

struct GhostscriptRunContext {
    std::string stdoutText;
    std::string stderrText;
};

std::atomic<unsigned long> tempFileCounter{0};

std::string nextTempPdfPath(const char* prefix) {
    const auto id = tempFileCounter.fetch_add(1, std::memory_order_relaxed) + 1;
    const auto dir = std::filesystem::temp_directory_path();
    return (dir / (std::string(prefix) + "-" + std::to_string(id) + ".pdf")).string();
}

void writeBinaryFile(const std::string& path, const std::vector<uint8_t>& bytes) {
    std::ofstream file(path, std::ios::binary | std::ios::trunc);
    if (!file) throw std::runtime_error("Failed to create Ghostscript input file");
    file.write(reinterpret_cast<const char*>(bytes.data()), static_cast<std::streamsize>(bytes.size()));
    if (!file) throw std::runtime_error("Failed to write Ghostscript input file");
}

std::vector<uint8_t> readBinaryFile(const std::string& path) {
    std::ifstream file(path, std::ios::binary);
    if (!file) throw std::runtime_error("Failed to read Ghostscript output file");
    return std::vector<uint8_t>(std::istreambuf_iterator<char>(file), std::istreambuf_iterator<char>());
}

void removeFileIfPresent(const std::string& path) {
    std::error_code error;
    std::filesystem::remove(path, error);
}

int stdoutCallback(void* callerHandle, const char* str, int len) {
    if (callerHandle != nullptr && str != nullptr && len > 0) {
        static_cast<GhostscriptRunContext*>(callerHandle)->stdoutText.append(str, static_cast<std::size_t>(len));
    }
    return len;
}

int stderrCallback(void* callerHandle, const char* str, int len) {
    if (callerHandle != nullptr && str != nullptr && len > 0) {
        static_cast<GhostscriptRunContext*>(callerHandle)->stderrText.append(str, static_cast<std::size_t>(len));
    }
    return len;
}

std::string trimTrailingWhitespace(std::string text) {
    while (!text.empty() && (text.back() == '\n' || text.back() == '\r' || text.back() == '\t' || text.back() == ' ')) {
        text.pop_back();
    }
    return text;
}

std::string buildFailureMessage(int code, const GhostscriptRunContext& context) {
    std::string message = "Ghostscript failed";
    if (code == gs_error_Info) {
        message = "Ghostscript returned informational output";
    } else if (code < 0) {
        message += " with error " + std::to_string(code) + " (" + gs_errstr(code) + ")";
    }

    const std::string detail = trimTrailingWhitespace(context.stderrText.empty() ? context.stdoutText : context.stderrText);
    if (!detail.empty()) message += ": " + detail;
    return message;
}

void throwIfError(int code, const GhostscriptRunContext& context) {
    if (code < 0 && code != gs_error_Quit) throw std::runtime_error(buildFailureMessage(code, context));
}

std::vector<char*> toArgv(std::vector<std::string>& args) {
    std::vector<char*> argv;
    argv.reserve(args.size());
    for (std::string& arg : args) argv.push_back(arg.data());
    return argv;
}

} // namespace

std::string GhostscriptEngine::getVersion() {
    gsapi_revision_t revision{};
    const int code = gsapi_revision(&revision, sizeof(revision));
    if (code < 0) throw std::runtime_error("Failed to read Ghostscript revision");
    return std::to_string(revision.revision / 100) + "." + std::to_string(revision.revision % 100);
}

std::vector<uint8_t> GhostscriptEngine::rewritePdf(
    const std::vector<uint8_t>& input,
    const std::vector<std::string>& args) {
    const std::string inputPath = nextTempPdfPath("gs-input");
    const std::string outputPath = nextTempPdfPath("gs-output");

    GhostscriptRunContext context{};
    void* instance = nullptr;
    bool instanceCreated = false;
    bool exitRequired = false;
    bool exited = false;

    std::vector<std::string> argv{"gs"};
    argv.insert(argv.end(), args.begin(), args.end());
    argv.emplace_back("-sOutputFile=" + outputPath);
    argv.emplace_back(inputPath);

    try {
        writeBinaryFile(inputPath, input);

        int code = gsapi_new_instance(&instance, &context);
        if (code < 0 || instance == nullptr) throw std::runtime_error("Failed to create Ghostscript instance");
        instanceCreated = true;

        code = gsapi_set_stdio_with_handle(instance, nullptr, stdoutCallback, stderrCallback, &context);
        throwIfError(code, context);

        code = gsapi_set_arg_encoding(instance, GS_ARG_ENCODING_UTF8);
        throwIfError(code, context);

        std::vector<char*> cArgs = toArgv(argv);
        code = gsapi_init_with_args(instance, static_cast<int>(cArgs.size()), cArgs.data());
        exitRequired = true;

        int finalCode = code;
        const int exitCode = gsapi_exit(instance);
        exited = true;
        if (code >= 0 || code == gs_error_Quit) finalCode = exitCode;
        if (finalCode == gs_error_Quit) finalCode = 0;

        throwIfError(finalCode, context);

        std::vector<uint8_t> output = readBinaryFile(outputPath);

        gsapi_delete_instance(instance);
        removeFileIfPresent(inputPath);
        removeFileIfPresent(outputPath);
        return output;
    } catch (...) {
        if (exitRequired && !exited && instance != nullptr) gsapi_exit(instance);
        if (instanceCreated && instance != nullptr) gsapi_delete_instance(instance);
        removeFileIfPresent(inputPath);
        removeFileIfPresent(outputPath);
        throw;
    }
}

} // namespace giovanni

#else // !GIOVANNI_HAVE_GHOSTSCRIPT

// No Ghostscript library was configured for this build (GIOVANNI_GHOSTSCRIPT_LIB
// not set in CMake) — fall back to a stub so the rest of the native target
// still builds. See targets/native/CMakeLists.txt and docker.Dockerfile.
namespace giovanni {

std::string GhostscriptEngine::getVersion() {
    throw std::runtime_error("Ghostscript support is not compiled into this build");
}

std::vector<uint8_t> GhostscriptEngine::rewritePdf(
    const std::vector<uint8_t>&,
    const std::vector<std::string>&) {
    throw std::runtime_error("Ghostscript support is not compiled into this build");
}

} // namespace giovanni

#endif // GIOVANNI_HAVE_GHOSTSCRIPT
