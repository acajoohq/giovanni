#include "../qpdf_wasm.hh"
#include <stdexcept>

emscripten::val mergePdfs(const emscripten::val& inputArrays) {
    try {
        int length = inputArrays["length"].as<int>();
        if (length == 0) {
            throw std::runtime_error("No PDFs provided to merge");
        }

        QPDF outPdf;
        outPdf.emptyPDF();

        std::vector<std::vector<uint8_t>> allInputData;
        std::vector<std::unique_ptr<QPDF>> sourcePdfs;
        allInputData.reserve(length);
        sourcePdfs.reserve(length);

        for (int index = 0; index < length; index++) {
            allInputData.emplace_back(emscripten::vecFromJSArray<uint8_t>(inputArrays[index]));
            const auto& inputData = allInputData.back();

            auto sourcePdf = std::make_unique<QPDF>();
            std::string inputName = "input-" + std::to_string(index) + ".pdf";
            sourcePdf->processMemoryFile(inputName.c_str(),
                                         reinterpret_cast<const char*>(inputData.data()),
                                         inputData.size());

            auto pages = sourcePdf->getAllPages();
            for (auto& page : pages) {
                outPdf.addPage(page, false);
            }

            sourcePdfs.push_back(std::move(sourcePdf));
        }

        QPDFWriter writer(outPdf);
        writer.setOutputMemory();
        writer.setObjectStreamMode(qpdf_o_generate);
        writer.write();

        std::shared_ptr<Buffer> buffer = writer.getBufferSharedPointer();

        return bufferToUint8Array(buffer);

    } catch (const std::exception& error) {
        throw std::runtime_error(std::string("PDF merge failed: ") + error.what());
    }
}
