#!/bin/bash

HERE="$(cd -- "$(dirname -- "$0")" && pwd)"

echo
echo "Bhakti Study Academy"
echo "===================="
echo
echo "Starting the Bhakti Study installer for macOS..."
echo

exec "$HERE/Install-Bhakti-Study.sh"
