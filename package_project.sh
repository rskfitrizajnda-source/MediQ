#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_ZIP="$PROJECT_DIR/mediq-app.zip"

echo "[MediQ] Membuat paket source yang tidak menyertakan file rahasia..."

rm -f "$OUTPUT_ZIP"
cd "$PROJECT_DIR"

if command -v python3 >/dev/null 2>&1; then
  PROJECT_DIR="$PROJECT_DIR" OUTPUT_ZIP="$OUTPUT_ZIP" python3 - <<'PY'
import os
import zipfile

project_dir = os.environ["PROJECT_DIR"]
output_path = os.environ["OUTPUT_ZIP"]
exclude_dirs = {
    ".git", "node_modules", "dist", ".cache", "coverage", ".vercel",
    ".render", "__pycache__"
}

def is_secret_env_file(filename):
    # Simpan template *.env.example, tapi jangan sertakan .env atau .env.production/local.
    return filename == ".env" or (
        filename.startswith(".env.") and not filename.endswith(".example")
    )

with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(project_dir):
        dirs[:] = [directory for directory in dirs if directory not in exclude_dirs]
        for filename in files:
            if filename == os.path.basename(output_path) or is_secret_env_file(filename):
                continue
            full_path = os.path.join(root, filename)
            relative_path = os.path.relpath(full_path, project_dir)
            zipf.write(full_path, relative_path)

print(f"Paket berhasil dibuat: {output_path}")
PY
elif command -v zip >/dev/null 2>&1; then
  # Fallback aman: pola ini mengecualikan semua .env*, termasuk template.
  zip -r "$OUTPUT_ZIP" . \
    -x "*/node_modules/*" "node_modules/*" \
    -x "*/.git/*" ".git/*" \
    -x "*/dist/*" "dist/*" \
    -x "*/.cache/*" ".cache/*" \
    -x ".env*" "*/.env*" \
    -x "*.zip" "*/coverage/*" "coverage/*"
else
  echo "Error: Python 3 atau utilitas zip tidak ditemukan."
  exit 1
fi

echo "[MediQ] Paket source selesai dibuat."
