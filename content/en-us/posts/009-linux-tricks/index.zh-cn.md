---
title: "Linux技巧笔记"
date: 2023-07-22T09:31:42+08:00
featured_image: cover.jpg
summary: "Linux小聪明啊，我劝这位朋友耗子尾汁，长期更新"
tags: ["linux"]
---

## 前言

好记性不如烂笔头，长期更新Linux使用日常中遇到的犄角旮旯的东西。

这里可能很多条目都写明了具体发行版，实际上很通用，不必拘泥于版本。

## Arch Wayland配置Fcitx5中文输入法

折腾了很久，各自帖子都看了，好久才完全折腾好。

Fcitx5本身没什么问题，问题在于Wayland不完善，以及各自软件使用的技术差异很大，需要各自配置。

### 基础配置

安装fcitx (AUR)：

```
fcitx5 5.0.23-1
fcitx5-breeze 2.0.0-1
fcitx5-chinese-addons 5.0.17-1
fcitx5-configtool 5.0.17-1
fcitx5-gtk 5.0.23-1
fcitx5-pinyin-sougou 20210320-1
fcitx5-pinyin-zhwiki 1:0.2.4.20230329-1
fcitx5-qt 5.0.17-1
```

系统环境变量，写入到`/etc/security/pam_env.conf`。

``` bash
#
# What I wanted was the REMOTEHOST variable set, purely for selfish
# reasons, and AGM didn't want it added to the SimpleApps login
# program (which is where I added the patch). So, my first concern is
# that variable, from there there are numerous others that might/would
# be useful to be set: NNTPSERVER, LESS, PATH, PAGER, MANPAGER .....
#
# Of course, these are a different kind of variable than REMOTEHOST in
# that they are things that are likely to be configured by
# administrators rather than set by logging in, how to treat them both
# in the same config file?
#
# Here is my idea:
#
# Each line starts with the variable name, there are then two possible
# options for each variable DEFAULT and OVERRIDE.
# DEFAULT allows an administrator to set the value of the
# variable  to some default value, if none is supplied then the empty
# string is assumed. The OVERRIDE option tells pam_env that it should
# enter in its value (overriding the default value) if there is one
# to use. OVERRIDE is not used, "" is assumed and no override will be
# done. # # VARIABLE   [DEFAULT=[value]]  [OVERRIDE=[value]]
#
# (Possibly non-existent) environment variables may be used in values
# using the ${string} syntax and (possibly non-existent) PAM_ITEMs may
# be used in values using the @{string} syntax. Both the $ and @
# characters can be backslash escaped to be used as literal values
# values can be delimited with "", escaped " not supported.
# Note that many environment variables that you would like to use
# may not be set by the time the module is called.
# For example, HOME is used below several times, but
# many PAM applications don't make it available by the time you need it.
#
#
# First, some special variables
#
# Set the REMOTEHOST variable for any hosts that are remote, default
# to "localhost" rather than not being set at all
#REMOTEHOST	DEFAULT=localhost OVERRIDE=@{PAM_RHOST}
#
# Set the DISPLAY variable if it seems reasonable
#DISPLAY		DEFAULT=${REMOTEHOST}:0.0 OVERRIDE=${DISPLAY}
#
#
#  Now some simple variables
#
#PAGER		DEFAULT=less
#MANPAGER	DEFAULT=less
#LESS		DEFAULT="M q e h15 z23 b80"
#NNTPSERVER	DEFAULT=localhost
#PATH		DEFAULT=${HOME}/bin:/usr/local/bin:/bin\
#:/usr/bin:/usr/local/bin/X11:/usr/bin/X11
#
# silly examples of escaped variables, just to show how they work.
#
#DOLLAR		DEFAULT=\$
#DOLLARDOLLAR	DEFAULT=	OVERRIDE=\$${DOLLAR}
#DOLLARPLUS	DEFAULT=\${REMOTEHOST}${REMOTEHOST}
#ATSIGN		DEFAULT=""	OVERRIDE=\@
#
# This file is parsed by pam_env module
#
# Syntax: simple "KEY=VAL" pairs on separate lines
#
#
# http_proxy=http://127.0.0.1:7890/
# https_proxy=http://127.0.0.1:7890/
# ftp_proxy=http://127.0.0.1:7890/
# HTTP_PROXY=http://127.0.0.1:7890/
# HTTPS_PROXY=http://127.0.0.1:7890/
# FTP_PROXY=http://127.0.0.1:7890/
# XMODIFIRES=@im=fcitx
# QT_IM_MODULE=fcitx
# GTK_IM_MODULE=fcitx
# SDL_IM_MODULE=fcitx

#GTK_IM_MODULE DEFAULT=fcitx
#QT_IM_MODULE  DEFAULT=fcitx
#XMODIFIERS    DEFAULT=\@im=fcitx
#SDL_IM_MODULE DEFAULT=fcitx
# Wayland compatibility
QT_QPA_PLATFORM         DEFAULT=wayland
CLUTTER_BACKEND         DEFAULT=wayland
SDL_VIDEODRIVER         DEFAULT=wayland
MOZ_ENABLE_WAYLAND      DEFAULT=1
MOZ_WEBRENDER           DEFAULT=1
XDG_SESSION_TYPE        DEFAULT=wayland
XDG_CURRENT_DESKTOP     DEFAULT=sway

# QT-related theming
QT_QPA_PLATFORMTHEME    DEFAULT=qt5ct

# FCITX input-related
#GLFW_IM_MODULE         DEFAULT=ibus
GLFW_IM_MODULE          DEFAULT=fcitx
GTK_IM_MODULE           DEFAULT=fcitx
INPUT_METHOD            DEFAULT=fcitx
XMODIFIERS              DEFAULT=@im=fcitx
IMSETTINGS_MODULE       DEFAULT=fcitx
QT_IM_MODULE            DEFAULT=fcitx
SDL_IM_MODULE           DEFAULT=fcitx
#
# This file is parsed by pam_env module
#
# Syntax: simple "KEY=VAL" pairs on separate lines
#
#
```

### 浏览器

浏览器推荐使用Firefox，不需要做额外更改就可以使用Fcitx5输入中文。

chrome需要在启动中加参数```--gtk-version=4```，并且存在输入法候选框不跟着光标的问题，此外114版本的chrome加上如上flag后会在启动时崩溃。

### Intellij全家桶

配置过基础环境变量后基本可以使用，但是会有候选框不跟随光标的问题，需要更换ide的java runtime

1. 在[RikudouPatrickstar/JetBrainsRuntime-for-Linux-x64](https://github.com/RikudouPatrickstar/JetBrainsRuntime-for-Linux-x64)下载，并解压。
2. idea中按下`Ctrl + Shift + \\`，在弹出的对话框中选择“操作”，输入`runtime`，更换runtime。

![设置java runtime](pics/select-idea-runtime.png)

## Fcitx5配置

默认配置有些地方不好用，需要改

### 输入中文标点

默认情况下，即使在输入中文时，打出来的标点符号也是英文的。

按下`Ctrl + .`切换到全角标点（中文标点）。

### 切换中英文

默认是`Ctrl + Space`，建议再加一个shift切换中英文。不然中文模式下想输入一点英文还要按两个键。

配置 -> 全局选项 -> 快捷键 -> 切换/禁用输入法 项。

### 输入中文时上屏一些英文单词

[参考地址](https://groups.google.com/g/fcitx/c/yPZv2I3Zq58?pli=1)

输入中文时，按下`Shift + Enter`可以把当前这点英文上屏。

## Debian12同时开启多张网卡

在`/etc/network/interfaces`中添加配置，自动连接并设置为DHCP。

``` bash
# This file describes the network interfaces available on your system
# and how to activate them. For more information, see interfaces(5).

source /etc/network/interfaces.d/*

# The loopback network interface
auto lo
iface lo inet loopback
auto enp0s3
iface enp0s3 inet dhcp
auto enp0s8
iface enp0s8 inet dhcp
```

## grub设置默认timeout

前几天发生了个小插曲，想在办公本上把DE换成wayland，结果DM不支持导致进不去，并且grub也没开（timeout=0），这就奇怪了，我记得我之前已经设置过timeout了啊，原来是每次升级内核在重新生成grub.cfg时timeout被重置了。

默认timeout在`/etc/default/grub`，把`GRUB_TIMEOUT=0`值改掉即可。

## 设置主题和图标主题

之前多是用图形界面的配置来设置主题，现在用arch + hyprland需要从终端设置。

其实也简单：

``` bash
gsettings set org.gnome.desktop.interface gtk-theme <theme name>
gsettings set org.gnome.desktop.interface icon-theme <icon theme name>
```

其中主题放在`/usr/share/themes`，图标放在`/usr/share/icons`，名字就是文件夹的名字。

另外推荐主题`Qogir-dark`和图标主题`ePapirus-Dark`，后者包含一个工具用来改变主题：

``` bash
# -C后是文件夹图标颜色，-u代表刷新缓存，-t后跟papirus主题名
papirus-folders -C darkcyan -u -t ePapirus-Dark
```

项目地址：

* [Qogir Theme](https://github.com/vinceliuice/Qogir-theme)
* [Papirus Icon Theme](https://github.com/PapirusDevelopmentTeam/papirus-icon-theme)
* [Papirus Folder Icon](https://github.com/PapirusDevelopmentTeam/papirus-folders)
