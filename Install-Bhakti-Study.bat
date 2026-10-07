@echo off
setlocal
cd /d "%~dp0"

echo.
echo Bhakti Study Academy
echo ====================
echo.
echo Preparing Bhakti Study for this computer...
echo.

REM First try the Windows Python launcher.
where py >nul 2>nul
if %errorlevel%==0 (
    py -3.12 -c "import sys; exit(0 if sys.version_info[:2] == (3,12) else 1)" >nul 2>nul
    if %errorlevel%==0 (
        echo Python 3.12 is already available.
        echo Bhakti Study is ready to use.
        echo.
        call "%~dp0Start-Bhakti-Study.bat"
        goto :end
    )
)

REM Then try python.exe directly.
where python >nul 2>nul
if %errorlevel%==0 (
    python -c "import sys; exit(0 if sys.version_info[:2] == (3,12) else 1)" >nul 2>nul
    if %errorlevel%==0 (
        echo Python 3.12 is already available.
        echo Bhakti Study is ready to use.
        echo.
        call "%~dp0Start-Bhakti-Study.bat"
        goto :end
    )
)

echo Bhakti Study needs Python 3.12.
echo.
echo Windows may ask for permission to install the required runtime.
echo.

choice /C YN /N /M "Continue with setup? [Y/N] "
if errorlevel 2 goto :cancel

where winget >nul 2>nul
if errorlevel 1 goto :no_winget

echo.
echo Installing Python 3.12...
echo.

winget install --id Python.Python.3.12 -e --source winget --accept-source-agreements --accept-package-agreements

if errorlevel 1 goto :install_failed

echo.
echo Python 3.12 installation completed.
echo Starting Bhakti Study...
echo.

REM Refresh command lookup after installation.
where py >nul 2>nul
if %errorlevel%==0 (
    call "%~dp0Start-Bhakti-Study.bat"
    goto :end
)

where python >nul 2>nul
if %errorlevel%==0 (
    call "%~dp0Start-Bhakti-Study.bat"
    goto :end
)

echo.
echo Windows installed Python, but this window has not detected it yet.
echo Close this window and run Install-Bhakti-Study.bat again.
echo.
pause
goto :end

:no_winget
echo.
echo Automatic installation is not available on this Windows system.
echo Windows Package Manager ^(winget^) was not found.
echo.
pause
goto :end

:install_failed
echo.
echo Python 3.12 installation did not complete successfully.
echo.
pause
goto :end

:cancel
echo.
echo Installation cancelled.
echo.

:end
endlocal
