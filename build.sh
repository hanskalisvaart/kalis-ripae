#!/bin/bash
# build.sh - For Linux/Mac users

# Create output directory
mkdir -p builds

# Build for Windows (64-bit)
GOOS=windows GOARCH=amd64 go build -o builds/rocket-ripae.exe main.go

# Build for Linux (64-bit)
GOOS=linux GOARCH=amd64 go build -o builds/rocket-ripae-linux main.go

# Build for MacOS (64-bit)
GOOS=darwin GOARCH=amd64 go build -o builds/rocket-ripae-mac main.go

# Make Linux binary executable
chmod +x builds/rocket-ripae-linux