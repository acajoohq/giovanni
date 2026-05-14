#include "../qpdf_wasm.hh"
#include <stdexcept>

emscripten::val splitPages(const emscripten::val& inputArray) {
    try {
        std::vector<uint8_t> inputData = emscripten::vecFromJSArray<uint8_t>(inputArray);

        QPDF pdf;
        pdf.processMemoryFile("input.pdf",
                             reinterpret_cast<const char*>(inputData.data()),
                             inputData.size());

        auto pages = pdf.getAllPages();
        emscripten::val result = emscripten::val::array();

        for (auto& page : pages) {
            QPDF outPdf;
            outPdf.emptyPDF();
            outPdf.addPage(page, false);

            QPDFWriter writer(outPdf);
            writer.setOutputMemory();
            writer.setObjectStreamMode(qpdf_o_generate);
            writer.write();

            std::shared_ptr<Buffer> buffer = writer.getBufferSharedPointer();
            result.call<void>("push", bufferToUint8Array(buffer));
        }

        return result;

    } catch (const std::exception& e) {
        throw std::runtime_error(std::string("PDF split failed: ") + e.what());
    }
}
