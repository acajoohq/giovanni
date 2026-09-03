# syntax=docker/dockerfile:1.7
#
# Builds libgiovanni_jsi_gs.so — the Ghostscript JSI adapter for React Native.
# JSI headers are fetched directly from the react-native npm tarball.
# Override the version with REACT_NATIVE_VERSION.
# Ghostscript is built from source (GhostPDL). Override with GHOSTPDL_VERSION.

FROM ubuntu:24.04 AS jsi-gs-builder

ARG JSI_BUILD_MODE=prd
ARG GHOSTPDL_VERSION
ARG GHOSTPDL_ARCHIVE_URL
ARG GHOSTPDL_SHA256=""
ARG GHOSTPDL_JOBS=""
ARG REACT_NATIVE_VERSION=0.76.0

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        autoconf \
        automake \
        ca-certificates \
        cmake \
        curl \
        g++ \
        libtiff-dev \
        libjpeg-dev \
        libpng-dev \
        make \
        pkg-config \
        tar && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /src

COPY packages/core/native /src/packages/core/native

# Fetch and build GhostPDL as a shared library
RUN set -eux; \
    mkdir -p /src/vendor/ghostpdl; \
    curl -fsSL "$GHOSTPDL_ARCHIVE_URL" -o /tmp/ghostpdl.tar.gz; \
    if [ -n "$GHOSTPDL_SHA256" ]; then \
        echo "$GHOSTPDL_SHA256  /tmp/ghostpdl.tar.gz" | sha256sum -c -; \
    fi; \
    tar -xzf /tmp/ghostpdl.tar.gz --strip-components=1 -C /src/vendor/ghostpdl

RUN set -eux; \
    BUILD_JOBS="${GHOSTPDL_JOBS:-$(nproc)}"; \
    cd /src/vendor/ghostpdl; \
    ./autogen.sh; \
    ./configure --disable-cups --disable-gtk \
        --without-x --without-tesseract; \
    make -j"$BUILD_JOBS" so; \
    cp sobin/libgs.so.* /usr/local/lib/; \
    ldconfig

# Fetch JSI headers from the react-native npm tarball (no dep tree download)
RUN set -eux; \
    mkdir -p /tmp/rn-pkg; \
    curl -fsSL "https://registry.npmjs.org/react-native/-/react-native-${REACT_NATIVE_VERSION}.tgz" \
        -o /tmp/rn.tgz; \
    tar -xzf /tmp/rn.tgz --strip-components=1 -C /tmp/rn-pkg; \
    test -f /tmp/rn-pkg/ReactCommon/jsi/jsi/jsi.h

RUN set -eux; \
    case "$JSI_BUILD_MODE" in \
        dev) CMAKE_BUILD_TYPE=Debug ;; \
        prd) CMAKE_BUILD_TYPE=Release ;; \
        *) echo "Unsupported build mode: $JSI_BUILD_MODE" >&2; exit 1 ;; \
    esac; \
    BUILD_DIR=/tmp/jsi-gs-build; \
    OUT_DIR=/out; \
    BUILD_JOBS="${GHOSTPDL_JOBS:-$(nproc)}"; \
    mkdir -p "$BUILD_DIR" "$OUT_DIR"; \
    cmake \
        -S /src/packages/core/native/targets/jsi/ghostscript \
        -B "$BUILD_DIR" \
        -DCMAKE_BUILD_TYPE="$CMAKE_BUILD_TYPE" \
        -DJSI_INCLUDE_DIR=/tmp/rn-pkg/ReactCommon \
        -DGIOVANNI_GHOSTSCRIPT_LIB=/usr/local/lib/libgs.so \
        -DGIOVANNI_GHOSTSCRIPT_SOURCE_DIR=/src/vendor/ghostpdl; \
    cmake --build "$BUILD_DIR" --parallel "$BUILD_JOBS"; \
    cp "$BUILD_DIR/libgiovanni_jsi_gs.so" "$OUT_DIR/"; \
    cp /src/packages/core/native/targets/jsi/ghostscript/gs_jsi.h "$OUT_DIR/"

FROM scratch AS export

COPY --from=jsi-gs-builder /out/ /
