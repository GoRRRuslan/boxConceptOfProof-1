#!/usr/bin/env bash
# Fetches the prebuilt Filament/Bullet3 native binaries for the vendored react-native-filament.
# Source: the official react-native-filament@1.11.0 npm tarball (same binaries as the v2 branch uses).
# Idempotent: skips work when the libraries are already installed.
set -euo pipefail

FILAMENT_BINARIES_VERSION="1.11.0"
ROOT_DIRECTORY="$(cd "$(dirname "$0")/.." && pwd)"
TARGET_DIRECTORY="${ROOT_DIRECTORY}/node_modules/react-native-filament"
CACHE_DIRECTORY="${ROOT_DIRECTORY}/.cache/filament"
TARBALL_PATH="${CACHE_DIRECTORY}/react-native-filament-${FILAMENT_BINARIES_VERSION}.tgz"

if [ ! -d "${TARGET_DIRECTORY}" ]; then
  echo "[filament] ${TARGET_DIRECTORY} not found, skipping (run yarn install first)."
  exit 0
fi

if [ -d "${TARGET_DIRECTORY}/ios/libs/filament/lib" ] && [ -d "${TARGET_DIRECTORY}/android/libs/filament/lib" ]; then
  echo "[filament] native binaries already installed."
  exit 0
fi

mkdir -p "${CACHE_DIRECTORY}"

if [ ! -f "${TARBALL_PATH}" ]; then
  echo "[filament] downloading react-native-filament@${FILAMENT_BINARIES_VERSION} (~300 MB, one time)..."
  (cd "${CACHE_DIRECTORY}" && npm pack "react-native-filament@${FILAMENT_BINARIES_VERSION}" --silent >/dev/null)
fi

EXTRACT_DIRECTORY="$(mktemp -d)"
trap 'rm -rf "${EXTRACT_DIRECTORY}"' EXIT

tar -xzf "${TARBALL_PATH}" -C "${EXTRACT_DIRECTORY}" package/ios/libs package/android/libs

rm -rf "${TARGET_DIRECTORY}/ios/libs" "${TARGET_DIRECTORY}/android/libs"
mkdir -p "${TARGET_DIRECTORY}/ios" "${TARGET_DIRECTORY}/android"
cp -R "${EXTRACT_DIRECTORY}/package/ios/libs" "${TARGET_DIRECTORY}/ios/libs"
cp -R "${EXTRACT_DIRECTORY}/package/android/libs" "${TARGET_DIRECTORY}/android/libs"

# gltfio/math.h clashes with the system <math.h> on case-insensitive file systems.
if [ -f "${TARGET_DIRECTORY}/ios/libs/filament/include/gltfio/math.h" ]; then
  mv "${TARGET_DIRECTORY}/ios/libs/filament/include/gltfio/math.h" "${TARGET_DIRECTORY}/ios/libs/filament/include/gltfio/gltfio-math.h"
fi

echo "[filament] native binaries installed."
