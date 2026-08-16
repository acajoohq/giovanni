# syntax=docker/dockerfile:1.7

FROM ubuntu:24.04 AS native-builder

ARG NATIVE_BUILD_MODE=prd
ARG QPDF_VERSION
ARG QPDF_ARCHIVE_URL
ARG QPDF_SHA256=""
ARG QPDF_JOBS=""
ARG GHOSTPDL_VERSION=""
ARG GHOSTPDL_ARCHIVE_URL=""
ARG GHOSTPDL_SHA256=""
ARG GHOSTPDL_JOBS=""

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        autoconf \
        automake \
        bison \
        ca-certificates \
        cmake \
        curl \
        flex \
        g++ \
        libtool \
        make \
        pkg-config \
        tar \
        zlib1g-dev \
        libjpeg-dev \
        libssl-dev && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /src

COPY packages/core/native /src/packages/core/native

RUN set -eux; \
    mkdir -p /src/vendor/qpdf; \
    curl -fsSL "$QPDF_ARCHIVE_URL" -o /tmp/qpdf.tar.gz; \
    if [ -n "$QPDF_SHA256" ]; then \
        echo "$QPDF_SHA256  /tmp/qpdf.tar.gz" | sha256sum -c -; \
    fi; \
    tar -xzf /tmp/qpdf.tar.gz --strip-components=1 -C /src/vendor/qpdf

# ---------------------------------------------------------------------------
# Ghostscript (GhostPDL) — optional. Skipped when GHOSTPDL_ARCHIVE_URL is
# empty, in which case GhostscriptEngine falls back to a stub (see
# targets/native/CMakeLists.txt and impl/ghostscript/gs_engine.cc).
#
# GhostPDL uses autoconf/make, not CMake, so it's built out-of-tree here and
# handed to CMake as a prebuilt static library, mirroring how the WASM target
# (native/ghostscript/docker.Dockerfile) builds it with emconfigure/emmake —
# same "make libgs" target, just compiled for the host instead of wasm32.
# ---------------------------------------------------------------------------

RUN set -eux; \
    if [ -z "$GHOSTPDL_ARCHIVE_URL" ]; then \
        echo "GHOSTPDL_ARCHIVE_URL not set — skipping Ghostscript, GhostscriptEngine will be a stub"; \
        exit 0; \
    fi; \
    mkdir -p /src/vendor/ghostpdl; \
    curl -fsSL "$GHOSTPDL_ARCHIVE_URL" -o /tmp/ghostpdl.tar.gz; \
    if [ -n "$GHOSTPDL_SHA256" ]; then \
        echo "$GHOSTPDL_SHA256  /tmp/ghostpdl.tar.gz" | sha256sum -c -; \
    fi; \
    tar -xzf /tmp/ghostpdl.tar.gz --strip-components=1 -C /src/vendor/ghostpdl; \
    cd /src/vendor/ghostpdl; \
    NOCONFIGURE=1 ./autogen.sh; \
    case "$NATIVE_BUILD_MODE" in \
        dev) GS_OPT_CFLAGS="-O0 -g" ;; \
        prd) GS_OPT_CFLAGS="-O2" ;; \
        *) echo "Unsupported build mode: $NATIVE_BUILD_MODE" >&2; exit 1 ;; \
    esac; \
    CFLAGS="$GS_OPT_CFLAGS -fPIC" \
    CXXFLAGS="$GS_OPT_CFLAGS -fPIC" \
    ./configure \
        --disable-contrib \
        --disable-cups \
        --disable-dbus \
        --disable-fontconfig \
        --disable-gtk \
        --disable-hidden-visibility \
        --disable-threading \
        --with-drivers=pdfwrite,ps2write,eps2write,txtwrite \
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
    BUILD_JOBS="${GHOSTPDL_JOBS:-$(nproc)}"; \
    make -j"$BUILD_JOBS" libgs

RUN set -eux; \
    case "$NATIVE_BUILD_MODE" in \
        dev) CMAKE_BUILD_TYPE=Debug ;; \
        prd) CMAKE_BUILD_TYPE=Release ;; \
        *) echo "Unsupported build mode: $NATIVE_BUILD_MODE" >&2; exit 1 ;; \
    esac; \
    BUILD_DIR=/tmp/native-build; \
    OUT_DIR=/out; \
    BUILD_JOBS="${QPDF_JOBS:-$(nproc)}"; \
    mkdir -p "$BUILD_DIR" "$OUT_DIR"; \
    GHOSTSCRIPT_CMAKE_ARGS=""; \
    if [ -f /src/vendor/ghostpdl/bin/gs.a ]; then \
        GHOSTSCRIPT_CMAKE_ARGS="-DGIOVANNI_GHOSTSCRIPT_LIB=/src/vendor/ghostpdl/bin/gs.a -DGIOVANNI_GHOSTSCRIPT_SOURCE_DIR=/src/vendor/ghostpdl"; \
    fi; \
    cmake \
        -S /src/packages/core/native/targets/native \
        -B "$BUILD_DIR" \
        -DCMAKE_BUILD_TYPE="$CMAKE_BUILD_TYPE" \
        -DCMAKE_POSITION_INDEPENDENT_CODE=ON \
        -DCMAKE_CXX_FLAGS="-fPIC" \
        -DCMAKE_C_FLAGS="-fPIC" \
        -DQPDF_SOURCE_DIR=/src/vendor/qpdf \
        $GHOSTSCRIPT_CMAKE_ARGS; \
    cmake --build "$BUILD_DIR" --parallel "$BUILD_JOBS"; \
    ctest --output-on-failure --test-dir "$BUILD_DIR" -R giovanni_; \
    cp "$BUILD_DIR/libgiovanni_native.a" "$OUT_DIR/"; \
    find "$BUILD_DIR" -name "libqpdf.a" -exec cp {} "$OUT_DIR/" \; ; \
    if [ -f /src/vendor/ghostpdl/bin/gs.a ]; then \
        cp /src/vendor/ghostpdl/bin/gs.a "$OUT_DIR/libgs.a"; \
    fi; \
    cp /src/packages/core/native/targets/native/giovanni_c.h "$OUT_DIR/"

FROM scratch AS export

COPY --from=native-builder /out/ /
