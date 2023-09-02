---
title: "(neo)vim使用"
date: 2023-09-03T05:37:16+08:00
featured_image: cover.png
summary: "(neo)vim键位和使用"
---

> 键位太多了吧不能忍了，一拳把地球打爆！！

vim键位虽说有逻辑可循，但是还是太乱，一点点记~~吧~~（文明你我他），用到哪个学哪个

没写的就当是显然的配置吧，这里只写一些细节的，边边角角的，容易忘的。

> [西江月・证明](https://www.zhihu.com/question/506943617)
> 即得易见平凡，仿照上例显然。留作习题答案略，读者自证不难。
> 反之亦然同理，推论自然成立。略去过程Q.E.D.，由上可知证毕。

## 配置

* `scrolloff=5`/`vim.opt.scrolloff=5`: 光标距离顶端和底部距离5行的时候，再移动光标就滚动屏幕
* `scroll=10`/`vim.opt.scroll=10`: `Ctrl + D`和`Ctrl + U`滚动屏幕不再滚动屏幕一半的行数，而是固定滚动10行。这个很有用，滚动半屏幕在找东西时太慢了，看逻辑时半屏幕一滚cache全没了，10行比较合适。
  * 有bug，[解决办法](#修复scroll失效)

* `tabstop=4`/`vim.opt.tabstop=4`: 设置一个tab是4个空格。
* `expandtab``vim.opt.expandtab=true`: 设置用空格代替tab。不太推荐全局，因为一些文件（比如lua和python）一般是用tab缩进。~~有lsp当我没说~~
* `vim.opt.cursor="n-v-c-sm:block,ci-ve:ver25,r-cr-o:hor20,i:block-blinkwait100-blinkon400-blinkoff400"`:
  * 设置光标，neovim里的，[官方文档](https://neovim.io/doc/user/options.html#'guicursor')
  * 设置n v c 和 m模式是块状的光标。i模式是块状光标，并且等待100ms后开始闪烁，亮400浩渺暗400毫秒的频率闪烁。
  * 这个设置本身是不带动画的，在neovide里也没有动画，但是在wenzterm里会有动画，wezterm应该是接管了相应的事件，默认是easeIn和easeOut动画，很好看。
  * 然而wezterm现在在wayland上兼容还不太行，这个动画总卡住，解决办法是关闭wayland支持，用xwayland跑：`config.enable_wayland=false`。

## 选择，查找，删除

这部分比较有逻辑，理清楚以后随心配。

除了常规的`ve`，`v$`等以外：

* `vi"`: 选中光标所在的被`""`包住的范围（不包括双引号）
* `ca'`: 剪切光标所在的被`''`保住的范围（包括单引号），并且进入插入模式

`v`是选择，`c`是剪切并进入插入模式，`i`是选择范围，`a`是append，选择范围并且包含边界的符号，最后跟符号像`''`，`""`，`()`，`[]`，`{}`，都支持，成对的应该都可以，而且可以跨行。

注意是光标被包围的最小的范围，比如如果是`{a1{b1}a2}`，在b1上`vi{`就只会选中b1，而在a1、a2上就可以把外面大括号的内容都选择上，逻辑很清晰。

这个很有用的地方在，位置合适可以直接操作`if`，函数参数，甚至整个函数体。

除了`v`，`c`以外，`d`也支持，删除但是不进入插入模式嘛，同样很有用。

`viw`选择光标所在单词，因为`w`不是成对的符号，不太一样，因此单独提一句。同样`c`和`d`也同样适用：`ciw`，`diw`。

* `dt>`：删除单词，一直删除到`>`（不会删除`>`），如果当前行没有`>`就什么都不做

### 设置相对行号方便删除多行

同时设置行号`nu`和相对行号`rnu`以后，行号是这样的：

<img class="custom_small_image" src="01.png">

现在光标在c这一行。

如果想删除c，d，和e这三行，直接看相对行号，`d2j`即可。`d`是删除，`2`是删除到相对行号是2的地方（2这一行也删除），`j`代表方向向下。

同理删除c，b和a的话，`d2k`即可。

当然`v`也适合，所以开相对行号很方便。

此外相对行号还有一个小技巧，方便看枚举的值，例如以下枚举：

<img class="custom_small_image" src="02.png">

此时光标移动到第一个枚举，该枚举对应的值是默认的0，并且下面的枚举也都是默认增长，没有手动设置。那么此时**相对行号的值正好是枚举的值**，小聪明啊。

> 所以lsp里怎么设置显示枚举的数值呢？好像真没想过。

### `f`和`F`移动到指定字符

* `fa`: 光标移动到本行的下一个a上
* `Fa`: 光标移动到本行的上一个a上
* `;`: 向刚才移动的方向再移动一次
* `,`: 向刚才移动的反方向移动一次

如何本行里没有a，就不动。

> 这个老忘

## 移动屏幕

> 我真的一句也记不住了

* `zt`: 把光标所在行移动到屏幕顶部
* `zz`: 把光标所在行移动到屏幕中间
* `z-`: 把光标所在行移动到屏幕底端

* `H`: 光标移动到屏幕顶端
* `M`: 光标移动到屏幕中间
* `L`: 光标移动到屏幕底端

别和下面这些混了

* `Ctrl+U`: 向上滚动半屏幕或者`scroll`的行数
* `Ctrl+D`: 向下滚动半屏幕或者`scroll`的行数
* `Ctrl+B`: 向上滚动一个屏幕
* `Ctrl+F`: 向下滚动一个屏幕
* `Ctrl+Y`: 光标向上移动一行
* `Ctrl+E`: 光标向下移动一行

## 修复`scroll`失效

根据[Stack Overflow](https://stackoverflow.com/questions/9906328/vim-scroll-setting-overridden)，在窗口resize或者leave和enter以后，`scroll`的值就被重置成0了

想修复的话可以用neovim的`autocmd`，直接[进行一手学的偷](https://github.com/lewis6991/gitsigns.nvim/blob/d927caa075df63bf301d92f874efb72fd22fd3b4/lua/gitsigns.lua#L130)

``` lua
vim.api.nvim_create_autocmd({'VimResized', 'BufRead'}, {
    callback = function()
    vim.cmd [[set scroll = 10]]
    end
})
```

* 由于`WinterLeave`后没有窗口，`set scroll`会报错，因此不挂到leave上面。
* `WindowEnter`会在一些弹出窗口（比如telescope）触发，所以用`BufRead`，测了测没发现问题。
