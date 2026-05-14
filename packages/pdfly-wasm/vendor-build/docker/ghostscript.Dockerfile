# syntax=docker/dockerfile:1.7

FROM emscripten/emsdk:5.0.7 AS ghostscript-builder

ARG GHOSTSCRIPT_BUILD_MODE=dev
ARG GHOSTPDL_VERSION
ARG GHOSTPDL_ARCHIVE_URL
ARG GHOSTPDL_SHA256=""
ARG JOBS=1

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        autoconf \
        automake \
        bison \
        ca-certificates \
        curl \
        flex \
        libtool \
        make \
        perl \
        pkg-config \
        python3 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /src

RUN set -eux; \
    mkdir -p /src/vendor/ghostpdl; \
    curl -fsSL "$GHOSTPDL_ARCHIVE_URL" -o /tmp/ghostpdl.tar.gz; \
    if [ -n "$GHOSTPDL_SHA256" ]; then \
        echo "$GHOSTPDL_SHA256  /tmp/ghostpdl.tar.gz" | sha256sum -c -; \
    fi; \
    tar -xzf /tmp/ghostpdl.tar.gz --strip-components=1 -C /src/vendor/ghostpdl

RUN set -eux; \
    case "$GHOSTSCRIPT_BUILD_MODE" in \
        dev) \
            export GS_OPT_CFLAGS="-O0 -g3 -gsource-map"; \
            export GS_OPT_LDFLAGS="-O0 -gsource-map -sASSERTIONS=1"; \
            ;; \
        prd) \
            export GS_OPT_CFLAGS="-O3 -flto"; \
            export GS_OPT_LDFLAGS="-O3 -flto"; \
            ;; \
        *) \
            echo "Unsupported Ghostscript build mode: $GHOSTSCRIPT_BUILD_MODE" >&2; \
            exit 1; \
            ;; \
    esac; \
    export SOURCE_DIR=/src/vendor/ghostpdl; \
    export OUT_DIR=/out; \
    export HOST_TRIPLE=wasm32-unknown-emscripten; \
    mkdir -p "$OUT_DIR"; \
    cd "$SOURCE_DIR"; \
    NOCONFIGURE=1 ./autogen.sh; \
    export BUILD_TRIPLE="$("$SOURCE_DIR/config.guess")"; \
    CC=emcc \
    CXX=em++ \
    AR=emar \
    RANLIB=emranlib \
    CCAUX=cc \
    CFLAGS="$GS_OPT_CFLAGS" \
    CXXFLAGS="$GS_OPT_CFLAGS" \
    LDFLAGS="$GS_OPT_LDFLAGS -sWASM=1 -sMODULARIZE=1 -sEXPORT_ES6=1 -sEXPORT_NAME=createGhostscriptModule -sENVIRONMENT=web,worker,node -sALLOW_MEMORY_GROWTH=1 -sFORCE_FILESYSTEM=1 -sEXPORTED_RUNTIME_METHODS=['FS','callMain']" \
    emconfigure ./configure \
        --host="$HOST_TRIPLE" \
        --build="$BUILD_TRIPLE" \
        --disable-contrib \
        --disable-cups \
        --disable-dbus \
        --disable-fontconfig \
        --disable-gtk \
        --disable-hidden-visibility \
        --disable-threading \
        --with-drivers=pdfwrite,ps2write,eps2write,txtwrite \
        --with-exe-ext=.js \
        --with-libiconv=no \
        --with-local-brotli \
        --with-local-zlib \
        --without-ijs \
        --without-libtiff \
        --without-libidn \
        --without-libpaper \
        --without-pcl \
        --without-pdftoraster \
        --without-tesseract \
        --without-xps \
        --without-x; \
    export BUILD_LOG=/tmp/ghostscript-build.log; \
    if ! emmake make -j"$JOBS" >"$BUILD_LOG" 2>&1; then \
        tail -n 200 "$BUILD_LOG"; \
        exit 1; \
    fi; \
    if [ ! -f "$SOURCE_DIR/bin/gs.js" ]; then \
        echo "Expected Ghostscript JS launcher not found at $SOURCE_DIR/bin/gs.js" >&2; \
        exit 1; \
    fi; \
    if [ ! -f "$SOURCE_DIR/bin/gs.wasm" ]; then \
        echo "Expected Ghostscript WASM binary not found at $SOURCE_DIR/bin/gs.wasm" >&2; \
        exit 1; \
    fi; \
    cp "$SOURCE_DIR/bin/gs.js" "$OUT_DIR/ghostscript.js"; \
    cp "$SOURCE_DIR/bin/gs.wasm" "$OUT_DIR/ghostscript.wasm"; \
    if [ -f "$SOURCE_DIR/config.log" ]; then cp "$SOURCE_DIR/config.log" "$OUT_DIR/config.log"; fi; \
    if [ -f "$SOURCE_DIR/configaux.log" ]; then cp "$SOURCE_DIR/configaux.log" "$OUT_DIR/configaux.log"; fi; \
    cat > "$OUT_DIR/manifest.json" <<EOF
{
  "buildMode": "${GHOSTSCRIPT_BUILD_MODE}",
  "sourceVersion": "${GHOSTPDL_VERSION}",
  "host": "${HOST_TRIPLE}",
  "build": "${BUILD_TRIPLE}",
  "artifacts": [
    "ghostscript.js",
    "ghostscript.wasm"
  ]
}
EOF

FROM scratch AS export

COPY --from=ghostscript-builder /out/ /
