#!/usr/bin/env bash

HERE="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
SYSTEM="$(uname -s)"
ARCH="$(uname -m)"

echo
echo "Bhakti Study Academy"
echo "===================="
echo
echo "Preparing Bhakti Study for this computer..."
echo

# Linux can use the bundled native runtime without installing Python.
if [ "$SYSTEM" = "Linux" ]; then
    case "$ARCH" in
        x86_64|amd64)
            SERVER="$HERE/runtime/linux-x86_64/bhakti-study-server"

            if [ -x "$SERVER" ]; then
                echo "Bundled Bhakti Study runtime found."
                echo "No additional software is required."
                echo
                exec "$HERE/Start-Bhakti-Study.sh"
            fi
            ;;
    esac
fi

# Linux fallback: use an existing system Python when no bundled runtime is available.
if [ "$SYSTEM" = "Linux" ] && command -v python3 >/dev/null 2>&1; then
    echo "Python 3 is already available."
    echo "Bhakti Study is ready to use."
    echo
    exec "$HERE/Start-Bhakti-Study.sh"
fi

# macOS: install the official pinned Python runtime when needed.
if [ "$SYSTEM" = "Darwin" ]; then
    PYTHON_VERSION="3.12.10"
    PYTHON_PKG="python-${PYTHON_VERSION}-macos11.pkg"
    PYTHON_URL="https://www.python.org/ftp/python/${PYTHON_VERSION}/${PYTHON_PKG}"
    PYTHON_FILE="${TMPDIR:-/tmp}/${PYTHON_PKG}"

    echo "Bhakti Study needs Python 3.12 to run on this Mac."
    echo
    echo "The official Python.org installer will be downloaded."
    echo "macOS will ask for administrator permission to install it."
    echo

    read -r -p "Continue with setup? [Y/n] " answer

    case "$answer" in
        n|N|no|NO)
            echo "Installation cancelled."
            exit 1
            ;;
    esac

    echo
    echo "Downloading Python ${PYTHON_VERSION} from Python.org..."

    if ! curl -fL "$PYTHON_URL" -o "$PYTHON_FILE"; then
        echo
        echo "Python download failed."
        exit 1
    fi

    echo
    echo "Installing Python ${PYTHON_VERSION}..."
    echo "macOS may now ask for your administrator password."
    echo

    if ! sudo /usr/sbin/installer -pkg "$PYTHON_FILE" -target /; then
        rm -f "$PYTHON_FILE"
        echo
        echo "Python installation did not complete successfully."
        exit 1
    fi

    rm -f "$PYTHON_FILE"

    PYTHON_BIN="/Library/Frameworks/Python.framework/Versions/3.12/bin/python3"

    if [ ! -x "$PYTHON_BIN" ]; then
        echo
        echo "Python was installed, but Bhakti Study could not locate it."
        exit 1
    fi

    echo
    echo "Python ${PYTHON_VERSION} installed successfully."
    echo "Bhakti Study is ready to use."
    echo

    exec "$HERE/Start-Bhakti-Study.sh"
fi

# Linux without Python and without a bundled compatible runtime.
if [ "$SYSTEM" = "Linux" ]; then
    echo "Bhakti Study needs Python 3 on this Linux system."
    echo
    echo "Your operating system may ask for administrator permission."
    echo

    read -r -p "Allow Bhakti Study to install Python 3? [Y/n] " answer

    case "$answer" in
        n|N|no|NO)
            echo "Installation cancelled."
            exit 1
            ;;
    esac

    if command -v apt-get >/dev/null 2>&1; then
        sudo apt-get update &&
        sudo apt-get install -y python3
    elif command -v dnf >/dev/null 2>&1; then
        sudo dnf install -y python3
    elif command -v pacman >/dev/null 2>&1; then
        sudo pacman -S --needed python
    else
        echo
        echo "Automatic installation is not available for this Linux distribution."
        exit 1
    fi

    if command -v python3 >/dev/null 2>&1; then
        echo
        echo "Bhakti Study is ready to use."
        echo
        exec "$HERE/Start-Bhakti-Study.sh"
    fi

    echo
    echo "Python installation did not complete successfully."
    exit 1
fi

echo "Unsupported operating system: $SYSTEM"
exit 1
