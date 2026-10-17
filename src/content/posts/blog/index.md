---
title: 使用Astro Fuwari从0到1搭建部署自动的个人博客
published: 2026-10-17
description: "怎么使用Astro Fuwari去搭建个人博客"
image: ""
tags: ["Fuwari", "Blogging", "Customization"]
category: 开发
draft: false
---

## 项目模板
# 基于 Astro 开发的静态博客模板。
::github{repo="saicaca/fuwari"}

## 环境依赖
- Node.js <= 22
- pnpm <= 9

## 一、初始化项目
```sh
pnpm create fuwari@latest
```
### 依次输入
1. 项目名（文件夹名）
2. 网站标题
3. 副标题
4. 网站语言
5. 是否安装依赖（推荐安装）
6. 是否初始化Git（推荐安装）

![初始化项目](https://raw.githubusercontent.com/0ZAWSZE0/resource/main/inklog-astro/posts/blog/init.png)

## 二、本地运行启动

### 指令合集

下列指令均需要在项目根目录执行：

| Command                           | Action                            |
|:----------------------------------|:----------------------------------|
| `pnpm install` 并 `pnpm add sharp` | 安装依赖                              |
| `pnpm dev`                        | 在 `localhost:4321` 启动本地开发服务器      |
| `pnpm build`                      | 构建网站至 `./dist/`                   |
| `pnpm preview`                    | 本地预览已构建的网站                        |
| `pnpm new-post <filename>`        | 创建新文章                             |
| `pnpm astro ...`                  | 执行 `astro add`, `astro check` 等指令 |
| `pnpm astro --help`               | 显示 Astro CLI 帮助                   |

```sh title="运行项目"
pnpm dev
```

## 三、编译项目

```sh title="编译项目"
pnpm build
```
根目录生成dist文件夹

## 四、部署到GitHub Pages
1. 创建.github/workflows/deploy.yml

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [master]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          run_install: false

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build with Astro
        run: pnpm astro build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

2. 登录github打开对应仓库
- Setting->Pages->Build and deployment->soure选择Github Actions
![GitHub设置](https://raw.githubusercontent.com/0ZAWSZE0/resource/main/inklog-astro/posts/blog/img_1.png)

3. 提交并推送代码自动部署页面

## 五、新建文章
```sh
pnpm new-post <filename>
```
- 文件会新建到`src/content/posts`目录下
- 语法参考markdown语法

