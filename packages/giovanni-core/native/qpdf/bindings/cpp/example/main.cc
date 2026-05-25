// example/main.cc — minimal usage example for pdfly_qpdf
//
// Build with PDFLY_BUILD_EXAMPLE=ON:
//
//   cmake -B build -DQPDF_SOURCE_DIR=../../../../../vendor/qpdf -DPDFLY_BUILD_EXAMPLE=ON
//   cmake --build build
//   ./build/pdfly_example input.pdf output.pdf

#include <pdfly/pdfly_qpdf.h>

#include <fstream>
#include <iostream>
#include <iterator>
#include <stdexcept>

static std::vector<uint8_t> readFile(const std::string& path) {
    std::ifstream f(path, std::ios::binary);
    if (!f) throw std::runtime_error("Cannot open: " + path);
    return { std::istreambuf_iterator<char>(f), {} };
}

static void writeFile(const std::string& path, const std::vector<uint8_t>& data) {
    std::ofstream f(path, std::ios::binary);
    if (!f) throw std::runtime_error("Cannot write: " + path);
    f.write(reinterpret_cast<const char*>(data.data()),
            static_cast<std::streamsize>(data.size()));
}

int main(int argc, char** argv) {
    if (argc < 3) {
        std::cerr << "Usage: pdfly_example <input.pdf> <output.pdf>\n";
        return 1;
    }

    try {
        std::cout << "qpdf version: " << pdfly::getVersion() << "\n";

        auto input = readFile(argv[1]);

        // Inspect
        auto info = pdfly::getDocumentInfo(input);
        std::cout << "Pages      : " << info.numPages << "\n";
        std::cout << "PDF version: " << info.pdfVersion << "\n";
        std::cout << "Encrypted  : " << (info.isEncrypted ? "yes" : "no") << "\n";
        std::cout << "Linearized : " << (info.isLinearized ? "yes" : "no") << "\n";

        // Compress
        pdfly::WriteOptions opts;
        opts.linearize = true;
        auto output = pdfly::writePdf(input, opts);
        writeFile(argv[2], output);
        std::cout << "Wrote " << output.size() << " bytes to " << argv[2] << "\n";

        // Extract images
        auto images = pdfly::extractImages(input);
        std::cout << "Images found: " << images.size() << "\n";
        for (const auto& img : images) {
            std::cout << "  [" << img.xobjectKey << "] "
                      << img.width << "x" << img.height
                      << " " << img.filter
                      << " strategy=" << img.strategy << "\n";
        }

    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << "\n";
        return 1;
    }

    return 0;
}
