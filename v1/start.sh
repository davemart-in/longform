#!/bin/bash
PORT=${1:-8100}
echo "Starting Longform at http://localhost:$PORT"
php -S localhost:$PORT
