#!/usr/bin/env bash

# ==============================================================================
# Script: package_project.sh
# Deskripsi: Mengompresi seluruh codebase proyek MediQ menjadi mediq-app.zip
#           tanpa menyertakan folder node_modules, build cache, dan file zip.
# ==============================================================================

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_ZIP="$PROJECT_DIR/mediq-app.zip"

echo "=========================================================="
echo " [MediQ] Memulai proses packaging proyek ke mediq-app.zip"
echo " Direktori sumber: $PROJECT_DIR"
echo "=========================================================="

if [ -f "$OUTPUT_ZIP" ]; then
    rm -f "$OUTPUT_ZIP"
fi

cd "$PROJECT_DIR"

if command -v zip >/dev/null 2>&1; then
    echo "Menggunakan utilitas 'zip'..."
    zip -r "$OUTPUT_ZIP" . \
        -x "*/node_modules/*" \
        -x "node_modules/*" \
        -x "*/.git/*" \
        -x ".git/*" \
        -x "*/dist/*" \
        -x "dist/*" \
        -x "*/.cache/*" \
        -x "*.zip"
elif command -v python3 >/dev/null 2>&1; then
    echo "Menggunakan fallback Python 3..."
    python3 -c "
import os, zipfile
output_path = '$OUTPUT_ZIP'
exclude_dirs = {'node_modules', '.git', 'dist', '.cache'}
exclude_files = {'mediq-app.zip'}

with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for file in files:
            if file in exclude_files:
                continue
            filepath = os.path.join(root, file)
            zipf.write(filepath, os.path.relpath(filepath, '.'))
"
elif command -v python >/dev/null 2>&1; then
    echo "Menggunakan fallback Python..."
    python -c "
import os, zipfile
output_path = '$OUTPUT_ZIP'
exclude_dirs = {'node_modules', '.git', 'dist', '.cache'}
exclude_files = {'mediq-app.zip'}

with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for file in files:
            if file in exclude_files:
                continue
            filepath = os.path.join(root, file)
            zipf.write(filepath, os.path.relpath(filepath, '.'))
"
else
    echo "Error: Utilitas zip atau python tidak ditemukan."
    exit 1
fi

if [ -f "$OUTPUT_ZIP" ]; then
    echo "=========================================================="
    echo " SUCCESS! Berkas proyek berhasil dikompresi:"
    echo " Lokasi : $OUTPUT_ZIP"
    echo "=========================================================="
else
    echo " Gagal membuat $OUTPUT_ZIP."
    exit 1
fi

