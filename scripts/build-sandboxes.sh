#!/bin/bash

echo "🔨 Building sandbox images..."

# Define images
declare -A images=(
    ["lightexec-python:3.11"]="sandbox-images/python"
    ["lightexec-node:20"]="sandbox-images/node"
    ["lightexec-cpp:gcc13"]="sandbox-images/cpp"
    ["lightexec-c:gcc13"]="sandbox-images/c"
    ["lightexec-java:21"]="sandbox-images/java"
    ["lightexec-go:1.21"]="sandbox-images/go"
    ["lightexec-rust:1.75"]="sandbox-images/rust"
    ["lightexec-php:8.3"]="sandbox-images/php"
    ["lightexec-ruby:3.3"]="sandbox-images/ruby"
)

# Build each image
for image in "${!images[@]}"; do
    echo "Building $image..."
    docker build -t "$image" "${images[$image]}"
    if [ $? -eq 0 ]; then
        echo "✅ Successfully built $image"
    else
        echo "❌ Failed to build $image"
        exit 1
    fi
done

echo "✅ All sandbox images built successfully!"
