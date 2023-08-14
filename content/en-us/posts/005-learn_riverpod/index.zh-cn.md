---
title: "学习riverpod （一）"
date: 2023-02-05T02:55:15+08:00
featured_image: cover.png
summary: "provider的介绍和使用"
tags: ["flutter", "riverpod"]
---

## 介绍

[Riverpod](https://pub.dev/packages/riverpod)是一款提供数据缓存和数据绑定功能的库，由[Provider](https://pub.dev/packages/provider)的作者开发，作为`Provider`的升级版，能解决一些`Provider`难以解决的问题，毕竟`Provider`已经用得太广泛了。

> 官方小彩蛋：`riverpod`这个词是由`provider`单词重新排列顺序后形成的。

`Riverpod`具有以下特点：
* 报错出现在编译期而不是运行期。
* 不需要嵌套监听和绑定的对象。
* 保证代码可测试。

根据[官网](https://riverpod.dev/docs/getting_started)的介绍，`riverpod`一共由三个版本：

* `riverpod`，适合仅包含`dart`，不使用`flutter`的场景。
* `flutter_riverpod`，适合使用`flutter`的场景。
* `hooks_riverpod`，同时使用`flutter_hooks`和`riverpod`。

实际使用中大概都会用到，`Widget`内部用flutter，牵扯到某些方法的时候用hook，其他地方用普通riverpod。

甩一个[官方文档地址](https://docs-v2.riverpod.dev/zh-Hans/docs/getting_started)，注意看v2版本的文档，中文标注了过期，熟悉的时候可以看中文的，之后再过一遍英文的即可。

注意文档里有开启代码生成和关闭代码生成两种模式，页面左上角是控制相关示例代码的开关。这个以前好像没有，现在加了。当关闭代码生成的时候，需要自己写的模板代码比较多，相反，开启的时候，直接加上annotation标注，然后执行`flutter pub run build_runner build`就行了。

推荐打开代码生成（默认就是），写的代码会少一些，看着清晰，也不容易出错。坏处是需要多个开发包，而且在没有生成代码的时候会报错，代码导航也会略微奇怪一点，不过小问题。

还有一个flutter_hooks开关，暂时没明白是干嘛的，以后细说。

## 小试牛刀

在开始之前，先加上依赖：

``` bash
flutter pub add freezed riverpod flutter_riverpod hooks_riverpod riverpod_annotation
flutter pub add build_runner riverpod_generator riverpod_lint custom_lint
```

其中`freezed`同样用来辅助生成代码。因为state是不可变的嘛，freezed是用来生成copy_with函数的。其实这个库用的非常广，一些类似data class性质的库，用它来生成一些固定使用的代码非常方便。

`riverpod_annotation`提供了`@riverpod`注解，标注到类或者实例上才能生成riverpod相关代码。

`riverpod_generator`是riverpod的代码生成器，负责生成provider类和实例。

`build_runner`是代码生成工具，有了它才能利用`freezed`和`riverpod_generator`定下的代码生成规则来生成代码。

[代码生成的相关文档](https://docs-v2.riverpod.dev/zh-Hans/docs/about_code_generation)

`riverpod_lint`提供一些lint规则，在编写代码期间发现潜在的错误。lint rules一般说是多多益善。

要启用`riverpod_lint`提供的规则，需要在`analysis_options.yaml`里加上规则：

``` yaml
analyzer:
  plugins:
    - custom_lint
```

同时建议忽略对代码生成的文件进行lint检查，因为……即使真写的不对，也不应该去改。在`analysis_options.yaml`中添加代码：

``` yaml
analyzer:
  exclude:
    - lib/**.g.dart
    - lib/**.freezed.dart
```

flutter_runner默认会把生成的代码放到`*.g.dart`里，`freezed`生成的代码会在`*.freezed.dart`内。

如果同时使用[surf_lint_rules](https://pub.dev/packages/surf_lint_rules)的话，完整的会是这样：

``` yaml
include:
  package:surf_lint_rules/analysis_options.yaml

analyzer:
  plugins:
    - custom_lint
  exclude:
    - lib/**.g.dart
    - lib/**.freezed.dart
```

完整代码：

``` dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'main.g.dart';

// 我们创建一个 “provider”，它将用于保存一个值（这里是 “Hello world”）。
// 通过使用一个 provider，我们能够模拟或覆盖被暴露的值。
@riverpod
String helloWorld(HelloWorldRef ref) {
  return 'Hello world';
}

void main() {
  runApp(
    // 为了能让组件读取 provider，我们需要将整个
    // 应用都包裹在 “ProviderScope” 组件内。
    // 这里也就是存储我们所有 provider 状态的地方。
    ProviderScope(
      child: MyApp(),
    ),
  );
}

// 扩展来自 Riverpod 的 HookConsumerWidget 而不是 HookWidget
class MyApp extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final String value = ref.watch(helloWorldProvider);

    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(title: const Text('Example')),
        body: Center(
          child: Text(value),
        ),
      ),
    );
  }
}
```

* `MyApp`的`build()`中，`MaterialApp`外面包了一层`ProviderScope`，不包这层的话riverpod的功能用不了。这是一种很常见的做法，很多插件都需要包一层，项目到最后恐怕会包好多层。
* `MyApp`继承`ConsumerWidget`而不是`StatefulWidget`，同时去掉了State，`build`方法加了一个`WidgetRef`参数。
* 原本显示`count`的`Text`现在显示`ref.watch(countProvider)`，而且外面包了一层`Consumer`，而value的初始化方式是`final String value = ref.watch(helloWorldProvider)`。

默认的示例从计数器换成显示静态的文字了（悲），总感觉没什么说服力啊。

手动写一个计数器吧，体验一下：

idea，启动！

然后上来就是：

``` bash
flutter pub add flutter_riverpod riverpod_annotation freezed
flutter pub add build_runner custom_lint riverpod_generator riverpod_lint
```

以下配置添加到`analysis_options.yaml`的末尾(其实中间也彳亍）。

``` yaml
analyzer:
  plugins:
    - custom_lint
  exclude:
    - lib/**.g.dart
    - lib/**.freezed.dart
```

`main.dart`完整代码：

``` dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'main.g.dart';

@riverpod
class Counter extends _$Counter {
  @override
  int build() => 0;

  void incrementCounter() {
    state = state + 1;
  }
}

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ProviderScope(
      child: MaterialApp(
        title: 'Flutter Demo',
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
          useMaterial3: true,
        ),
        home: const MyHomePage(title: 'Flutter Demo Home Page'),
      ),
    );
  }
}

class MyHomePage extends ConsumerStatefulWidget {
  const MyHomePage({super.key, required this.title});

  final String title;

  @override
  ConsumerState<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends ConsumerState<MyHomePage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        title: Text(widget.title),
      ),
      body: Center(
        child: Column(
          children: <Widget>[
            const Text(
              'You have pushed the button this many times:',
            ),
            Text(
              '${ref.watch(counterProvider)}',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          ref.read(counterProvider.notifier).incrementCounter();
        },
        // ref.read(counterProvider).state++
        tooltip: 'Increment',
        child: const Icon(Icons.add),
      ),
    );
  }
}
```

和默认的计数器相比，更改如下：

``` diff
diff --git a/lib/main.dart b/lib/main.dart
index 927d60d..76b9087 100644
--- a/lib/main.dart
+++ b/lib/main.dart
@@ -1,4 +1,18 @@
 import 'package:flutter/material.dart';
+import 'package:flutter_riverpod/flutter_riverpod.dart';
+import 'package:riverpod_annotation/riverpod_annotation.dart';
+
+part 'main.g.dart';
+
+@riverpod
+class Counter extends _$Counter {
+  @override
+  int build() => 0;
+
+  void incrementCounter() {
+    state = state + 1;
+  }
+}
 
 void main() {
   runApp(const MyApp());
@@ -9,35 +23,29 @@ class MyApp extends StatelessWidget {
 
   @override
   Widget build(BuildContext context) {
-    return MaterialApp(
-      title: 'Flutter Demo',
-      theme: ThemeData(
-        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
-        useMaterial3: true,
+    return ProviderScope(
+      child: MaterialApp(
+        title: 'Flutter Demo',
+        theme: ThemeData(
+          colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
+          useMaterial3: true,
+        ),
+        home: const MyHomePage(title: 'Flutter Demo Home Page'),
       ),
-      home: const MyHomePage(title: 'Flutter Demo Home Page'),
     );
   }
 }
 
-class MyHomePage extends StatefulWidget {
+class MyHomePage extends ConsumerStatefulWidget {
   const MyHomePage({super.key, required this.title});
 
   final String title;
 
   @override
-  State<MyHomePage> createState() => _MyHomePageState();
+  ConsumerState<MyHomePage> createState() => _MyHomePageState();
 }
 
-class _MyHomePageState extends State<MyHomePage> {
-  int _counter = 0;
-
-  void _incrementCounter() {
-    setState(() {
-      _counter++;
-    });
-  }
-
+class _MyHomePageState extends ConsumerState<MyHomePage> {
   @override
   Widget build(BuildContext context) {
     return Scaffold(
@@ -52,14 +60,17 @@ class _MyHomePageState extends State<MyHomePage> {
               'You have pushed the button this many times:',
             ),
             Text(
-              '$_counter',
+              '${ref.watch(counterProvider)}',
               style: Theme.of(context).textTheme.headlineMedium,
             ),
           ],
         ),
       ),
       floatingActionButton: FloatingActionButton(
-        onPressed: _incrementCounter,
+        onPressed: () {
+          ref.read(counterProvider.notifier).incrementCounter();
+        },
+        // ref.read(counterProvider).state++
         tooltip: 'Increment',
         child: const Icon(Icons.add),
       ),
```

和默认版本相比：

1. `_counter`的值“被存储到一个类中”，这个类只生成一个`CounterProvider`，作为全局的单例，对这个值的操作只能以`ref.read(counterProvider.notifier).incrementCounter()`的形式，不能直接修改。这里大概是因为底层调用`copyWith`来更新吧，变量整体被改变（替换）了以后通知，更改内部的值是不会通知的（如果是个class的话）。
2. 显示文字的地方使用`ref.watch(counterProvider)`。`counterProvider`看似看不见，实际在生成的代码里。
3. `MaterialApp`外面套了一层`ProviderScope`以启用`riverpod`的功能。这种app外面套一层是常规操作，插件用多了的话会套好几层。
4. `MyHomePage`及其State分别改成`riverpod`相关的类：`ConsumerStatefulWidget`和`ConsumerState`，Widget多了一个成员`ref`，ref用来操作`CounterProvider`。
5. `CounterProvider`的`build`重载会生成保存的值的初始值，这里是0。

比`setState`复杂了不少，多了一个保存和管理状态的类，读写也需要依靠`ref`，修改状态需要依靠专门的类。

`Provider`全局有效，负责提供状态值和修改状态的方法。`Consumer`和普通的`Widget`对标，分为有状态和无状态，多出一个`ref`，通过`ref`来操作全局的`Provider`，思路很清晰。

好处嘛……比如状态暴露成全局状态，提供统一的修改方法。

## Provider

照抄文档了，目前对`Provider`分别适合什么样的场景，没多少概念，没怎么用过。

[Provider的分类](https://docs-v2.riverpod.dev/zh-Hans/docs/concepts/providers)

| Provider 类型 | 创建Provider的函数 | 使用场景 |
| ------------- | ------------------ | ------------ |
| Provider | 返回任意类型 | 服务类 / 计算属性 (过滤的列表) |
| StateProvider | 返回任意类型 | 过滤条件/简单状态对象 |
| FutureProvider | 返回任意类型的Future | API调用的结果 |
| StreamProvider | 返回任意类型的Stream | API返回的Stream |
| StateNotifierProvider | 返回StateNotifier的子类 | 一种复杂的状态对象，除了通过接口之外，它是不可变的 |
| ChangeNotifierProvider | 返回ChangeNotifier的子类 | 需要可变的复杂状态对象 |

大致看来
* 如果是为了提供一个值，减少`Widget`重新构建的频率，用`Provider`。
* 如果仅暴露一个简单的值，比如`0`，或者`"foo"`这样的简单基础的类型a，需要修改，并且不需要复杂的计算和修改，使用`StateProvider`足以。
* 如果是和异步操作相关的简单操作，比如网络请求，使用`FutureProvider`，相当于异步版的`Provider`。
* 如果是用在stream中，那只能用`StreamProvider`。
* 如果需要管理值，值比较复杂或者执行更新时的逻辑并不直接，比如保存一些app全局的状态值，使用`NotifierProvider`，以及异步版本的`AsyncNotifierProvider`。
* 如果需要“可变的状态”，用`ChangeNotifierProvider`。可变是指状态更新不是靠`copyWith`和整体拷贝赋值吧，允许部分更新后通知更新。

文档里提到了，尽量使用`NotifierProvider`而不是`StateNotifierProvider`，`ChangeNotifierProvider`更是容易有性能问题，要尽量避免用。

### Consumer

对标`StatelessWidget`和`StatefulWidget`，`Consumer`也有`ConsumerWidget`和`ConsumerStatefulWidget`，两者使用的区别是前者的`ref`是`build`中作为参数传进去的，而后者则是自己的一个成员。

### Ref

`WidgetRef`是在`Consumer`中操作`Provider`的桥梁，有三种操作`Provider`的方式：

* `ref.watch`：最常用的方式，获取值并且可以更改值，当值改变时相应的`Consumer`会刷新。不应该在异步中或者`Consumer`生命周期中(`initState`、`dispose`等)使用。
* `ref.listen`：监听`Provider`，常用导航切换页面或者当值更改时显示对话框、错误时弹一个toast等。值改变时，它不会通知`Consumer`刷新，而是执行函数（第二个参数）。不应该在异步中或者`Consumer`生命周期中(`initState`、`dispose`等)使用。
* `ref.read`：获取值，它不监听`Provider`，常用在“触发”场景，比如示例中的点击按钮。只作为前两种方式的补充，在前两者不方便使用时才使用，比如`onPressd`这种（异步）回调，或者`initState`和`dispose`这种生命周期内。

