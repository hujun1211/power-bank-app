#!/bin/bash

# 获取版本号
VERSION=$(grep 'versionName' android/app/build.gradle | sed 's/.*versionName "\([^"]*\)".*/\1/' | xargs)

if [ -z "$VERSION" ]; then
    echo "❌ 错误：无法在 android/app/build.gradle 中找到 versionName。"
    exit 1
fi

# 版本一致性检查逻辑
DEST_BASE_DIR="output/release/${VERSION}"
if [ -d "$DEST_BASE_DIR" ]; then
    echo "--------------------------------------------------------"
    echo "⚠️  警告：检测到目录 $DEST_BASE_DIR 已存在。"
    echo "这说明版本号 [ $VERSION ] 的 APK 可能已经构建并打包过了。"
    echo "--------------------------------------------------------"
    
    # 检查是否为 CI/非交互环境
    if [ -z "$CI" ]; then
        read -p "是否要覆盖现有版本并继续构建？(y/n): " confirm
        if [[ ! "$confirm" =~ ^[yY]$ ]]; then
            echo "🚫 用户取消构建。"
            exit 0
        fi
    else
        echo "检测到 CI 环境，自动跳过确认并继续覆盖构建。"
    fi
fi

# ABI 列表
ABIS=("armeabi-v7a" "arm64-v8a" "x86" "x86_64")

# 开始构建 Release 版本
echo "🚀 正在开始构建 Release APK，版本号：$VERSION ..."
cd android
./gradlew assembleRelease
GRADLE_EXIT_CODE=$?
cd ..

# 检查构建命令执行结果
if [ $GRADLE_EXIT_CODE -ne 0 ]; then
    echo "❌ 错误：Release 构建失败，请检查报错信息。"
    exit 1
fi

# 移动并重命名 Release APK
echo "📂 正在整理 Release APK 文件..."
for ABI in "${ABIS[@]}"; do
    SRC="android/app/build/outputs/apk/release/app-${ABI}-release.apk"
    DEST_DIR="output/release/${VERSION}"
    DEST="${DEST_DIR}/app-release-${VERSION}-${ABI}.apk"
    
    mkdir -p "$DEST_DIR"
    if [ -f "$SRC" ]; then
        mv "$SRC" "$DEST"
        echo "✅ 已成功移动：app-release-${VERSION}-${ABI}.apk"
    else
        echo "⚠️  警告：未找到 $SRC (请检查 build.gradle 中的 abiSplits 配置)"
    fi
done

# 询问是否构建 Debug 版本
echo ""
if [ -z "$CI" ]; then
    read -p "是否需要同时构建 Debug APK？(y/n): " answer
    if [[ "$answer" =~ ^[yY]$ ]]; then
        BUILD_DEBUG=true
    else
        BUILD_DEBUG=false
    fi
else
    BUILD_DEBUG=false
fi

if [ "$BUILD_DEBUG" = true ]; then
    echo "🛠️ 正在构建 Debug APK..."
    cd android
    ./gradlew assembleDebug
    cd ..

    echo "📂 正在整理 Debug APK 文件..."
    for ABI in "${ABIS[@]}"; do
        SRC="android/app/build/outputs/apk/debug/app-${ABI}-debug.apk"
        DEST_DIR="output/debug/${VERSION}"
        DEST="${DEST_DIR}/app-debug-${VERSION}-${ABI}.apk"
        
        mkdir -p "$DEST_DIR"
        if [ -f "$SRC" ]; then
            mv "$SRC" "$DEST"
            echo "✅ 已成功移动：app-debug-${VERSION}-${ABI}.apk"
        else
            echo "⚠️  警告：未找到 $SRC"
        fi
    done
else
    echo "⏭️  跳过 Debug APK 构建。"
fi

echo "--------------------------------------------------------"
echo "🎉 任务完成！版本 $VERSION 的 APK 已全部整理至 output 目录。"
echo "--------------------------------------------------------"