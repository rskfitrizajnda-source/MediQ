@echo off
title MediQ - Smart Clinic Management System
cd /d "%~dp0"
echo ============================================================
echo           MEMBUKA APLIKASI KLINIK MEDIQ
echo ============================================================
echo.
echo [1/2] Menyiapkan Server Backend & Client Frontend...
echo [2/2] Membuka browser di http://localhost:5173 ...
echo.
echo Tekan Ctrl+C di jendela ini jika ingin mematikan aplikasi.
echo ============================================================
echo.

:: Tunggu 2 detik lalu buka browser
start "" cmd /c "timeout /t 3 >nul && start http://localhost:5173"

:: Jalankan server dan client bersamaan
npm run dev

pause

