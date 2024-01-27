---
title: "从riverpod到bloc"
date: 2024-01-06T22:01:58+08:00
summary: "关于从riverpod迁移到bloc这件事"
featured_image: cover.png
tags: ["flutter", "bloc", "riverpod"]
---

## 起因

riverpod和bloc都是flutter的状态管理库，前者使用`ref`和`provider`，后者使用`Bloc`。

自从005以后，这一年一直在用riverpod，近期一个个人项目的代码量写得比较多，大约有一万两千行（不包括代码生成跑出来的），这时候已经明显感觉维护越来越吃力，原因在于：

* 对riverpod使用方法不当。说起来可能有些搞笑，用了一年多用到现在还在纠正一些不正确的用法和思路，而且也没纠正完。
* 项目结构很乱。看上去按功能的模块分了文件夹，但是功能和需求之间相互交叉，分层不明显，改动起来牵一发而动全身，容易影响一些看不到的地方。
* 一些预想的想加进来的功能按照目前的结构很难加进来。比如加一个数据源，目前只有一个数据源，预计要加另外一个，而这一个数据源很难加进来，因为没有在数据源和使用数据源之间分层，也就是缺少repository这一层。
* 没有任何测试，小问题比较多。看上去没问题，但加一点功能就要把相关的东西全测一遍，状态比较多，也很麻烦。

其实这些并不是riverpod的问题，而是用项目在开发过程中长歪了。

既然想重构，自然想到之前几次想学但又被劝退的bloc。

## Bloc和Riverpod的区别

[Bloc](https://bloclibrary.dev)不仅是一个状态管理框架，还提供了一套完备的设计模式。

正如[reddit上的帖子](https://www.reddit.com/r/FlutterDev/comments/16sswy6/comment/k2be44w/?utm_source=share&utm_medium=web2x&context=3)所说，riverpod很棒，同时也给了使用者很大的自由。但是如果使用者没有任何设计模式或者项目架构的话，维护起来就灾难了。

也因此，近期[抄了一遍bloc的demo](https://github.com/realth000/bloc_demo)，把这项目里的一万两千行代码从riverpod迁移到bloc，有枣没枣打三竿子。

之前嫌弃bloc是因为写的代码量太多，后来写着写着居然不自觉地在靠近bloc写的state和event，那就迁移吧！

bloc的设计模式很完整，按着这个结构写，所有人写出来的样子都差不多。害，这就是软件工程的力量。

> 质疑java，理解java，成为java

可惜bloc没有代码生成，写出来的非常麻烦，想念riverpod的第一天。

## Bloc的设计模式

Bloc的设计模式似乎被官方叫做bloc architecture。分成presentation（UI层），logic（逻辑层）和repository（这个叫domain层吧）。

其实这样的分层不是第一次见，之前帖子提到有一个riverpod的教程网站[code with Andrea](https://codewithandrea.com/)的作者也提出了一个类似的架构。

这三层里最迷糊的是repository，这个词可以理解为源，或者仓库。如果熟悉debian或者fedora等linux发行版上的软件源应该见过这个词。在这个设计模式里，它的是隔离了软件业务逻辑和数据来源的一层。上面是业务逻辑，指拿到了数据以后怎么加工，怎么扔给UI。下面是数据的来源，比如远程的API，或者本机的数据库。

还有一点是，推荐的项目结构分层是按照feature来分。这种分法目前也很常见，前文提到的code with Andrea作者提到的架构模式，以及著名的clean architecture都是按这个来的。而传统的分法，是按照功能模块来，比如：models，providers，widgets，pages，utils。按feature分的话，就是诸如auth, login，product等。

借用前文提到的code with Andrea作者的一句话：按照feature分，是根据用户能做的事情来分开存放代码，实现相关功能的代码尽量放到一起，共享的代码放到顶层。

这样做会让项目代码变得很多的时候也有清晰的分层。

同时，[作者提到](https://github.com/felangel/bloc/issues/2436#issuecomment-830993494):

* 最好是每个数据源一个data provider，每个domain一个repository，每个feature一个bloc。避免bloc之间，data provider之间，以及repository之间相互依赖。
* 如果有交叉的情况，就组合，比如一个bloc可以用多个repository，一个repository可以用多个data provider。

> 可以的，非常SOLID。

## 迁移

迁移过程以[tsdm_client](https://github.com/realth000/tsdm_client)为例。

tsdm_client是一个客户端，主要功能是访问TSDM，然后将得到的网页解析成flutter的widget并组成页面。在这种前提下，有这样几个大的原则：

* 每个页面提供的功能要大致和网页端一样，除非网页的内容难以布局才拆分，否则要保证功能都在这一个页面里。
* 因为数据来源于网页页面，而不同的网页页面主题有相似但又不同的dom，因此实际上是多个数据源。以前这块是见招拆招，没有按网页主题区分，数据解析做完以后很乱，不知道哪一块是哪个主题。
* 刚才提到的预想的新功能是网页自身提供的archiver模式。该模式下网页结构非常简单，但是访问速度很快，该功能是用来克服访问速度慢的问题。本质上也是多数据源。

那么有哪些feature呢？先梳理功能。

已有的功能：

* 看首页，论坛，帖子，用户信息等页面。
* 用户登录和退出。
* 回帖。
* 查看提醒。
* 购买帖子。
* 签到。
* 搜索。
* UI变更，如改变语言和主题颜色。

要做的功能：

* archiver模式。
* 多用户登录。
* 收发用户消息。
* 查看购买记录。
* 修改个人设置。

按照用户能做什么的原则来分成feature：

* 认证（登录和退出）。
* 首页。
* 论坛。
* 帖子。
* 用户信息。
* 签到。
* 提醒。
* 购买。
* 搜索。
* 设置。
* 国际化。
* 更新。

然后根据feature来添加repository：

```dart
class AuthenticationRepository {
  AuthenticationRepository(this.netClient);

  /// 执行网络请求的provider，由外部注入，方便测试。
  final NetClient netClient;

  /// 用户登录
  Future<void> login() async {}
  /// 用户退出登录
  Future<void> logout() async{}
}
```

对应的event:

```dart
sealed class AuthenticationEvent extends Equatable {
  const AuthenticationEvent();

  @override
  List<Object?> get props => [];
}

/// 登录event，用户点击登录时触发。
final class AuthenticationLoginRequested extends AuthenticationEvent {
  const AuthenticationLoginRequested(this.userCredential) : super();

  /// 携带用户登录的凭据，用户名和密码等。
  final UserCredential userCredential
}

/// 退出登录event，用户点击退出登录时触发。 
final class AuthenticationLogoutRequested extends AuthenticationEvent {}
```

对应的state:

```dart
/// 表示当前用户登录的状态
enum AuthenticationStatus {
  /// 初始状态
  initial,

  /// 正在登录或退出登录
  loading,

  /// 登录成功或退出登录成功。
  success,

  /// 登录失败或退出登录失败。
  failed,
}

final class AuthenticationState extends Equatable {

  const AuthenticationState({
    this.status = AuthenticationStatus.initial,
    this.loggedUser,
  });

  /// 包含状态
  final AuthenticationStatus status;

  /// 当前已登录的用户信息
  final Userinfo? loggedUser;

  /// 方便更新状态。
  AuthenticationState copyWith({
    AuthenticationStatus? status,
    Userinfo? userinfo,
  }) {
    return AuthenticationState({
      status: status ?? this.status,
      userinfo: userinfo ?? this.userinfo,
    });
  }

  @override
  List<Object?> get props => [status, loggedUser];
}
```

对应的ui：

```dart
return BlocProvider(
  // 提供bloc。
  create: (context) => AuthenticationBloc(
    authenticationRepo: RepositoryProvider.of(context),
  ),
  child: BlocListener<AuthenticationBloc, AuthenticationState>(
    listen: (context, state) {
      // listener监听到任务失败时会显示snackbar。
      if (state.status == AuthenticationStatus.failed): {
        /// 操作失败时显示snackbar，实际肯定要显示更详细的信息，这里仅作演示。
        ScaffoldMessenger.of(context).showSnackbar(Snackbar(content: Text("操作失败")));
      }
    }
    child: BlocBuilder<AuthenticationBloc, AuthenticationState>(
      builder: (context, state) {
        // 使用bloc构建ui。
        final body = switch (state.status) {
            AuthenticationStatus.initial || AuthenticationStatus.loading =>
                const Center(child: CircleProgressIndicator()),
            AuthenticationStatus.success => SomeContent(),
            AuthenticationStatus.failed => RetryWidget(),
        };

        return Scaffold(
            appBar: AppBar(title: Text("title")),
            body: body,
        );
      }
    ),
  ),
)
```

可以看得出来，废话代码非常多，由于各种原因copywith这部分也没用代码生成，但是效果是有的，各种交互逻辑很清晰。

## 结果

大致上迁移步骤就是将各个provider的功能分离到bloc和repository中，然后重新组建流程。

迁移前：

```bash
✿ cloc . --exclude-dir=generated
     123 text files.
     123 unique files.
       1 file ignored.

github.com/AlDanial/cloc v 1.98  T=0.46 s (269.1 files/s, 35613.0 lines/s)
-------------------------------------------------------------------------------
Language                     files          blank        comment           code
-------------------------------------------------------------------------------
Dart                           120           1628           1527          12180
JSON                             3              0              0            945
-------------------------------------------------------------------------------
SUM:                           123           1628           1527          13125
-------------------------------------------------------------------------------
```

迁移后：

```bash
✿ cloc . --exclude-dir=generated
     214 text files.
     214 unique files.
       1 file ignored.

github.com/AlDanial/cloc v 1.98  T=0.16 s (1350.8 files/s, 130544.5 lines/s)
-------------------------------------------------------------------------------
Language                     files          blank        comment           code
-------------------------------------------------------------------------------
Dart                           211           2104           2003          15608
JSON                             3              0              0            966
-------------------------------------------------------------------------------
SUM:                           214           2104           2003          16574
-------------------------------------------------------------------------------
```

代码量上涨30%，甚至不包括test，因为还没写……

不过项目结构和业务逻辑比以前清楚了很多，清除了所有的多余刷新页面的问题，总体来说非常值得。
