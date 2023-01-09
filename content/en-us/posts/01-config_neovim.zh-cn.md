---
title: "配置neovim"
date: 2023-01-09T23:30:12+08:00
---

# 配置neovim

[neovim](https://neovim.io/)是一款强大且轻量的基于vim的tui编辑器，相比vim有更现代的设置和插件系统。今天neovim的生态已然非常广泛。

## 安装neovim

### Linux

* [neovim release page](https://github.com/neovim/neovim/releases/tag/stable)上提供了*.deb和*.tar.gz，安装非常方便。
  - 不推荐通过``apt``等包管理软件安装neovim，版本太老。

### Windows

* release page上提供了Windows可用的*.zip，使用Qt制作了GUI。
* 然而GUI太不vim了，想在Linux的shell里使用vim怎么办？可以采用wezterm + msys2 + 从源码编译neovim的组合技，可以复刻Linux shell中90%的操作。
  - 编译方法见[neovim wiki](https://github.com/neovim/neovim/wiki/Building-Neovim#windows--msys2--mingw)，大概命令如下：
``` bash
pacman -S mingw-w64-x86_64-{gcc,libtool,cmake,make,perl,python2,pkg-config,ninja,diffutils}
mkdir .deps
cd .deps
cmake -G Ninja ..\cmake.deps\
ninja
cd ..

mkdir build
cd build
cmake -G Ninja -D CMAKE_BUILD_TYPE=RelWithDebInfo ..
ninja
ninja install
```
  - 亲测在Win10上一次编过，编完以后neovim的二进制会install到shell启动默认目录下的nvim-win64/bin内。找不到的话用Everything找一下就行了。加到PATH里即可顺利玩耍。

## 关于neovim插件

STOP！我说停停，到这里解释一下neovim插件相关的概念，为啥呢？网上教装插件的教程不少，但可能是我太笨吧，看完了也看得云里雾里，包括原生vim的插件也是很迷。

### (neo)vim的插件

* 插件指的是给(neo)vim提供额外功能的“软件”，一般是vimscript（适用于vim）和lua（适用于neovim）编写的，这两种都是脚本语言，下载插件也就是下载源码，一般从github上克隆到指定目录即可。
* neovim也可以使用vimscript制作的插件，但是vimscript的效率比较低，装多了卡，而且远不如lua好理解，哪怕一点也不懂lua（比如我），看一看也能照猫画虎写，不推荐在neovim里用太多vimscript编写的插件。

### (neo)vim的插件管理器

* 插件管理器是指提供下载插件、管理插件加载的特殊插件，一般也是从github上安装，直接``curl``下来就行。
* [vim-plug](https://github.com/junegunn/vim-plug)是一款插件管理器，可以用于vim和neovim。在vim上算最好用的插件，但是在neovim里并不推荐，因为它用的是vimscript，和满处lua的neovim有点格格不入。
* [packer.vim](https://github.com/wbthomason/packer.nvim)也是一款插件管理器，可以用于neovim，采用lua编写，配置的可读性强，好上手，neovim上首推。

## 安装neovim插件

### 安装packer.vim

先安装插件管理器才方便装插件嘛，直接进行一个命令行的装：
``` bash
git clone --depth 1 https://github.com/wbthomason/packer.nvim\
 ~/.local/share/nvim/site/pack/packer/start/packer.nvim
```

至此，packer安装完成，那么如何通过它管理插件呢？
Linux上neovim会从``~/.config/nvim/init.lua``或者``~/.config/nvim/init.vim``读取配置，用lua写配置就是前者的路径了。
实际上配置路径好像很多，但是用这两个就行。
<br>

~~Windows的配置文件路径以后会补充，现在可以去官网看~~
<br>

先进到``~/.config/nvim/``文件夹里，不出意外里面有一个叫做``lua``的文件夹，用来存放我们将要写的lua脚本。
<br>

把它想象成“项目根目录”，比如：
* 我写了一个``lua/basic.lua``，那么在加载``basic.lua``时应该写类似``#include<basic.lua>``而不是``#include<lua/basic.lua>``。
<br>

没有这个文件夹就自己建一个。
<br>

看过一些neovim配置示例，按惯例：
* ``init.lua``（``~/.config/nvim/init.lua``）里只写要加载哪些lua脚本，比如包含vim行号搜索缩进等基本配置的``basic.lua``、包含想加载的插件的``plugins.lua``，举个例子：
``` lua
require('basic.lua')
require('plugins.lua')
```
* ``basic.lua``（``~/.config/nvim/lua/basic.lua``）加载vim基本配置，举个栗子：
``` lua
vim.opt.nu = true
vim.opt.rnu = true
vim.opt.hls = true
vim.opt.incsearch = true
```

相当于vim的``~/.vimrc``里的：

``` vimscript
set nu
set rnu
set hls
set incsearch
```

不能说一模一样，只能说完全相同。
* ``plugins.lua``（``~/.config/nvim/lua/plugins.lua``）里面写想加载的插件及其配置，还是举例子：
``` lua
return require('packer').startup(function()
  -- 加载packer
  use 'wbthomason/packer.vim'
  -- 加载主题 可以用大括号包起来
  use { 'navarasu/onedark.vim' }
  -- 加载onedark主题的配置文件：~/.config/nvim/lua/plugins_config/one-dark.lua
  require('plugins_config.one-dark')
  -- 以下省略
)
```

写好配置了，然后怎么安装呢？
<br>

运行``nvim``，然后输入vim的命令：``:PackerSync``即可自动从github上下载插件并把旧插件升到最新版本。

## 安装LSP

neovim安装LSP比较方便，LSP是指"Language Server Protocol"，虽然是协议，可以理解为一种在后台进行静态代码分析的server，提供显示代码错误、代码补全建议的功能，非常好用。
<br>

Idea、VS Code太重了，难道我写个demo还要打开这些笨蛋看着内存疯狂上涨吗？
<br>

如果把vim和LSP结合在一起，岂不是双倍快乐？大项目不谈，写个小demo又会带来更多快乐。

neovim可以安装LSP，vim也可以，可惜后者似乎安装有些麻烦，还是前者吧，这也是我想从vim转到neovim的原因之一。

### LSP插件组成

虽然叫LSP插件组成，这里实际是想讲整个LSP套件的组成，需要哪些插件。

* LSP Server：刚才说了，我们想要的显示代码错误、代码补全建议的功能就是它提供的。
  - 需要指出的是，不同的语言需要启用不同的LSP，比如C/CPP可以用Clangd，Go可以用gopls，Rust可以用rust-analyzer，Python可以用pyright。
  - 需要安装。
* LSP Client：大概是处理Server发来的信息呗，这部分不用管，neovim自带整个功能。
  - 不需要安装。
* LSP Server管理器：一个neovim插件，可以方便的管理各种LSP Server。
  - 需要安装。
* LSP Server下载器：neovim'插件，提供下载LSP Server功能。
  - 需要安装。
* 代码补全建议插件：neovim不带这部分，LSP Server也不包含这部分，所以需要额外下一个neovim插件：
  - 需要安装。

放到今天的示例里，对应关系为：
* LSP Server：按需下载，列表在[nvim-lspconfig的文档](https://github.com/neovim/nvim-lspconfig/blob/master/doc/server_configurations.md)。
* LSP Server管理器：[nvim-lspconfig](https://github.com/neovim/nvim-lspconfig)。
* LSP Server下载器：[mason.vim](https://github.com/williamboman/mason.nvim)。
* 代码补全建议插件：[nvim-cmp](https://github.com/hrsh7th/nvim-cmp)。

最后提供一个示例：[realth000/config](https://github.com/realth000/config/tree/master/014-nvim)
