#!/bin/bash
# 自动提取 i18n 文件夹并强制推送到远程
git subtree split --prefix=i18n -b temp-i18n
git push i18n-origin temp-i18n:main --force
git branch -D temp-i18n
echo "✅ i18n 同步完成！"