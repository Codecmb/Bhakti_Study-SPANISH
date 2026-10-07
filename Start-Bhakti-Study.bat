@echo off
setlocal
cd /d "%~dp0"

set "URL=http://127.0.0.1:8080/"

REM Prefer Python 3.12 through the Windows Python launcher.
where py >nul 2>nul
if %errorlevel%==0 (
    py -3.12 -c "import sys" >nul 2>nul
    if %errorlevel%==0 (
        start "" "%URL%"
        py -3.12 "%~dp0start-academy.py"
        goto :end
    )
)

REM Fall back to python.exe only if it is Python 3.12.
where python >nul 2>nul
if %errorlevel%==0 (
    python -c "import sys; exit(0 if sys.version_info[:2] == (3,12) else 1)" >nul 2>nul
    if %errorlevel%==0 (
        start "" "%URL%"
        python "%~dp0start-academy.py"
        goto :end
    )
)

echo.
echo Bhakti Study is not installed for this computer yet.
echo.
echo Please run:
echo     Install-Bhakti-Study.bat
echo.
pause

:end
endlocal
