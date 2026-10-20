@echo off
title MediQ - Smart Clinic System
cd /d "%~dp0"
echo ============================================================
echo           SEDANG MEMBUKA APLIKASI KLINIK MEDIQ
echo ============================================================
echo.
echo Mohon tunggu sebentar, server sedang dijalankan...
echo Browser akan otomatis terbuka ke http://localhost:5173
echo.
echo (Biarkan jendela ini tetap berjalan selama memakai aplikasi)
echo ============================================================
echo.

start "" "http://localhost:5173"

npm run dev
pause
