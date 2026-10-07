#!/usr/bin/env bash

HERE="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
URL="http://127.0.0.1:8080/"
SYSTEM="$(uname -s)"
ARCH="$(uname -m)"

case "$SYSTEM" in
  Linux)
    case "$ARCH" in
      x86_64|amd64)
        SERVER="$HERE/runtime/linux-x86_64/bhakti-study-server"

        if [ ! -x "$SERVER" ]; then
          echo
          echo "Bhakti Study is not installed for this computer yet."
          echo "Run Install-Bhakti-Study.sh first."
          echo
          exit 1
        fi

        (
          sleep 1
          if command -v xdg-open >/dev/null 2>&1; then
            xdg-open "$URL" >/dev/null 2>&1
          elif command -v gio >/dev/null 2>&1; then
            gio open "$URL" >/dev/null 2>&1
          fi
        ) &

        exec "$SERVER"
        ;;

      *)
        echo "Unsupported Linux architecture: $ARCH"
        exit 1
        ;;
    esac
    ;;

  Darwin)
    PYTHON="/Library/Frameworks/Python.framework/Versions/3.12/bin/python3"

    if [ ! -x "$PYTHON" ]; then
      echo
      echo "Bhakti Study is not installed for this Mac yet."
      echo "Run Install-Bhakti-Study.sh first."
      echo
      exit 1
    fi

    (
      sleep 1
      open "$URL"
    ) &

    exec "$PYTHON" "$HERE/start-academy.py"
    ;;

  *)
    echo "Unsupported operating system: $SYSTEM"
    exit 1
    ;;
esac
