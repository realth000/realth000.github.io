---
title: "简单学习riverpod"
date: 2023-02-05T02:55:15+08:00
tags: ["flutter", "riverpod"]
---

> “在短暂的``flutter``学习中我意识到一件事，越是追求简单越是有报错。”<br>
“说人话。”<br>
“我不用[getx](https://pub.dev/packages/get)做状态管理了，jojo！”

## 为何不用``getx``

``getx``在pub上有一万多个like，足以见得其强大，状态管理是``getx``的主要功能之一。使用``getx``以后可以几乎不写``StatefulWidget``，简单的``.obs``和``Obx()``、``GetController``和``GetBuilder``就能控制好状态管理，对于不想写state的新手来说真是新手福音。同时还有很强的性能：只在数值更新且变化时更新少量组件。

那么为什么不用``getx``呢？

* State算``flutter``很主要的一块内容，脱离State玩自然简单，但是还是和官方的主要方向不和，未来有风险，何况现在``getx``更新很少了（有可能是没bug，但是也没feature啊）。
* 使用``getx``时绑定的数值必须挨个传递，否则就会……``error [Get] the improper use of a GetX has been detected``。实际使用中，这个错误并不少，容易触发。~~我好菜啊~~。
* ``Get.find()``强大，也吓人，任何位置只要调用``Get.find()``就能获取甚至操作绑定的数据，容易出错，而且写多了很乱。我个人觉得这个地方需要加以限制，不能太随意，~~本来菜鸡写得就随意，这下更乱了~~。

## 介绍

[Riverpod](https://pub.dev/packages/riverpod)是一款提供数据缓存和数据绑定功能的库，由[Provider](https://pub.dev/packages/provider)的作者开发，作为``Provider``的升级版，能解决一些``Provider``难以解决的问题，毕竟``Provider``已经用得太广泛了。

> 官方小彩蛋：``riverpod``这个词是由``provider``单词重新排列顺序后形成的。

``Riverpod``具有以下特点：

* 报错出现在编译期而不是运行期。
* 不需要嵌套监听和绑定的对象。
* 保证代码可测试。

根据[官网](https://riverpod.dev/docs/getting_started)的介绍，``riverpod``一共由三个版本：

* ``riverpod``，适合仅包含``dart``，不使用``flutter``的场景。
* ``flutter_riverpod``，适合使用``flutter``的场景。
* ``hook_riverpod``，同时使用``flutter_hooks``和``riverpod``。

嗯……反正用第二个就对了。

## 极速开始

完整代码：

``` dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) => ProviderScope(
        child: MaterialApp(
          title: 'Flutter Demo',
          home: MyHomePage(title: 'Flutter Demo Home Page'),
        ),
      );
}

class Wapper {
  final countProvider = StateProvider((ref) => 0);
}

final globalProvider = StateProvider((ref) => "asd");

class MyHomePage extends ConsumerWidget {
  MyHomePage({super.key, required this.title});

  final String title;

  final countProvider = StateProvider((ref) => 0);
  final w = Wapper();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    print('AAAA rebuild!');

    return Scaffold(
      appBar: AppBar(
        // the App.build method, and use it to set our appbar title.
        title: Text(title),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            const Text(
              'You have pushed the button this many times:',
            ),
            Consumer(
              builder: (context, ref, _) => Text(
                '${ref.watch(countProvider)}, ${ref.watch(w.countProvider)}, ${ref.watch(globalProvider)}',
                style: Theme.of(context).textTheme.headlineMedium,
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          ref.read(countProvider.notifier).state++;
          ref.read(w.countProvider.notifier).state--;
          ref.read(globalProvider.notifier).state += "a";
        },
        tooltip: 'Increment',
        child: const Icon(Icons.add),
      ), // This trailing comma makes auto-formatting nicer for build methods.
    );
  }
}
```

老朋友，``flutter``默认的计数器demo，相比于使用原生的``setState()``，``riverpod``的主要改动点如下：

* ``MyApp``的``build()``中，``MaterialApp``外面包了一层``ProviderScope``。
* ``MyHomePage``继承``ConsumerWidget``而不是``StatefulWidget``，同时去掉了State，``build``方法加了一个``WidgetRef``参数。
* ``MyHomePage``中的``count``改成了``final countProvider = StateProvider((ref) => 0);``，把初始值0包在``StateProvider``里面。
* 原本显示``count``的``Text``现在显示``ref.watch(countProvider)``，而且外面包了一层``Consumer``。
* 按下按钮后原本的``setState``和``count +=1``改成了``ref.read(countProvider.notifier).state++``。

看来``riverpod``主要中``ConsumerWidget``是关键，它让一个``Widget``变成可以使用``riverpod``相关功能的``StatefulWidget``。

需要绑定的数值包在``StateProvider``里，需要读数值时``ref.watch(providerObject)``，需要写入数值时对``ref.read(provider.notifier).state``做操作。

那么``ref``可以理解为一个在观察的搬运工，你我通过``ref.read``告诉``ref``“该更新数值了”，通过``ref.watch()``告诉``ref``“这个位置看好了，数值变了的话记得更新”。

同时也能看出来，``StateProvider``可以隔着Wrapper，也可以是全局的Object，使用起来没有``getx``必须相邻传递的限制，同时也可以方便地遵守各种层级暴露关系，思路不容易乱。

性能也不错，上文代码中更改的部分只有``Consumer``包裹的那一部分，已经和``getx``的性能外表上看上去一样了，同样是手动``setState``最极限小的更新范围。

所以嘛，用上去不比``getx``麻烦多少。

当然，路由管理什么的还是可以用``getx``~~，如果没有其他好用的路由管理包的话~~。

