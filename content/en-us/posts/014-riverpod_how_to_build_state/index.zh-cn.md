---
title: "riverpod学习（二）设置一个合适的state"
date: 2023-10-15T21:52:25+08:00
featured_image: cover.png
summary: "如何存储和表示state才能用起来顺手"
tags: ["flutter", "riverpod"]
---

## 问题

用了riverpod有一段时间，最近在做玩具的时候发觉自己对state这个东西还是把握不住，看了看别人的文章，自己上手写了写，总结了一些方向。

### build中只返回，不修改state

`build`方法需要构建和返回state，尽量把修改state的代码放到notifier里，而state应该只是表示某种状态。

举个例子，比如说账户登录状态，包括登录/注销这一系列动作，都放到notifier里。

``` dart
enum AuthState {
  notAuthorized,
  authorized,
}

@Riverpod()
class Auth extends _$Auth {
  @override
  AuthState build() {
    return _authState;
  }

  Future<void> login() async {
    _authState = AuthState.authorized;
    ref.invalidateSelf();
  }

  Future<void> logout() async {
    _authState = AuthState.authorized;
    ref.invalidateSelf();
  }

  AuthState _authState = AuthState.notAuthorized;
}

// 使用时
// 获取认证状态
final authState = ref.read(authProvider);
// 登录
await ref.read(authProvider.notifier).login();
// 注销
await ref.read(authProvider.notifier).logout();
```

## 错误示例

如果为了省事，直接用build构建state

``` dart
@Riverpod()
class Login extends _$Login {
  @override
  Future<void> build() async {
    // 登录
    return;
  }
}

@Riverpod()
class Logout extends _$Login {
  @override
  Future<void> build() async {
    // 注销
    return;
  }
}

// 使用时
// 登录
await ref.read(loginProvider);
// 注销
await ref.read(logoutProvider);
```

虽然后者的写法在使用的时候可以少些几个字，并且看上去也符合“直觉”：一个build重载就OK，但是在处理认证时会有大问题。

> 当然，一般来说登录/注销等动作是会有一些重复的步骤，分成两个provider会导致重复代码更多，也是一个缺点，这个不是本文要讨论的问题。

**把“动作”放到build里会导致流程难以控制**

此话怎讲？如果是第二种写法，在widget里，不管是`ref.read`还是`ref.watch`还是`ref.listen`这个provider，在执行这条语句的这一刻，登录/注销的动作就开始了，而不能等到用户交互触发回调比如`onPressed`。

``` dart
class LoginPage extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ... = ref.read(loginProvider); // 开始build的时候直接登录
    return ElevatedButton(
             child: Text("登录"),
             onPressed: // 等不到用户触发回调。
           );
  }
}
```

如果`ref.read()`写到`onPressed`里

``` dart
class LoginPage extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ElevatedButton(
             child: Text("登录"),
             onPressed: () async {
               await ref.read(loginProvider);
             }
           );
  }
}
```

看似没问题，但是细想一步，登录和注销这种按钮肯定要做debounce，也就是如果已经在登录过程中了，此时的按钮不能再可以登录，也就是：

``` dart
class LoginPage extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isLoggingIn = ref.watch(isLoggingInProvider);
    return ElevatedButton(
             child: isLoggingIn ? CircleIndicator() : Text("登录"),
             onPressed: isLoggingIn ? null : () async {
               // 标记上“已经在登录过程中”
               ref.read(isLoggingIn.nofitier).state = true;
               // 登录
               await ref.read(loginProvider);
               // 取消状态
               ref.read(isLoggingIn.nofitier).state = false;
             }
           );
  }
}

final isLoggingInProvider = StateProvider((ref) => false);
```

这个`isLoggingIn`的bool值该从哪来？只能放到`loginProvider`外面，因为一旦放到里面，在`ref.watch(loginProvider.notifier).isLoggingIn`的时候，就会执行build方法，开始登录，这时候用户还没点登录按钮呢。

那么就只能把state单独放到另一个provider里存着，比如叫`isLoggingInProvider`，在`onPressd`回调里修改它的state。

看似完美，真的吗？

上述代码有一个很大的问题，因为登录的过程是异步的。

* 在登录之后执行的代码可能由于widget销毁（比如用户切换到了其他页面）而无法执行，毕竟它已经从widget树上unmount了。
* 当widget销毁，ref也会变得不可用。

为了保险，需要加上是否还mount的判断：

``` dart
ref.read(isLoggingInProvider).state = true;
await ref.read(loginProvider);
if (!context.mounted) {
  return;
}
// 取消状态
ref.read(isLoggingIn.nofitier).state = false;
```

又出现了新的问题：一旦widget被unmount，`isLoggingInProvider`里的值将会永远是true，也就是说等下一次再切回登录页面的时候，登录按钮还在转圈。

即使不提前return，强行让ref去把state设置回false，也会在运行时得到一个“已销毁的widget的ref无法使用”的异常。

那么有没有什么脱离ref还能操作provider的办法，比如`ProviderContainer()`？

很遗憾，`ProviderContainer`会创造另一个上下文，它其中provider的值和其他的ref里的provider的值并不一样，即使用`ProviderContainer().read(provider).state = false`修改值，看上去是更改了，下次再ref读时候还是true。

既然脱离ref不行，那我把state的改动放到`loginProvider`内部呢？

``` dart
@Riverpod()
class Login extends _$Login {
  @override
  Future<void> build() async {
    // 登录前把状态设置为true
    ref.read(isLoggingInProvider.notifier).state = true;

    // 登录

    // 登录后把状态设置回false
    ref.read(isLoggingInProvider.notifier).state = false;
    return;
  }
}
```

结果依然是不行，运行时会得到以下异常：

> Providers are not allowed to modify other providers during their initialization.

根据[作者的解释](https://github.com/rrousselGit/riverpod/issues/1505#issuecomment-1191878788)，riverpod的设计为无法在一个provider初始化的过程中修改另一个provider的值。

并且大多数情况下，这种时候是设计的逻辑上有问题，需要在设计上调整。

这时候真的行不通了。

## 正确示例

如第一个例子所写，如果在`build`中只暴露状态，不修改状态，而且把修改状态的动作都放到notifier里，这一套操作就可以如行云流水：

``` dart
enum AuthState {
  notAuthorized,
  authorized,
  loggingIn,
  loggingOut,
}

@Riverpod()
class Auth extends _$Auth {
  @override
  AuthState build() {
    return _authState;
  }

  Future<void> login() async {
    // 登录前设置状态
    _authState = AuthState.loggingIn;
    ref.invalidateSelf();

    // 登录

    // 登录后设置状态
    _authState = AuthState.authorized;
    ref.invalidateSelf();
  }

  AuthState _authState = AuthState.notAuthorized;
}

class LoginPage extends ConsuemrWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isLoggingIn = ref.read(authProvider) == AuthState.loggingIn; //此时只会watch状态，不会开始登录
    return ElevatedButton(
             child: isLoggingIn ? CircleProgressIndicator() : Text("登录"),
             onPressed: isLoggingIn ? null : () async => ref.read(authProvider).login(),
           );
  }
}
```

可以正确实现debounce，并且即使widget销毁重建了也没有问题，因为状态值存在`authProvider`内，并且不存在在build过程中修改另一个provider的问题。

## 总结

避免在build里改变状态，如果确实不需要状态，那就把build的返回值改成`void`吧。

这样一来，在UI里，可以把“触发改变状态”放到异步的回调内，在跑回调之前可以随意read和watch这个provider。

## 题外话

想到debounce这个事，一方面确实是觉得需要这个事情，另一方面是最近读到了一些不错的flutter文章：https://codewithandrea.com/

里面讲到了这个话题，并且不是用FutureBuilder而是用riverpod自带的AsyncValue来做，很优雅。

在仿照实现的过程中发现怎么写怎么别扭，这才意识到之前的state设置得不够合理。

code with andrea上的教程写得很清晰，也都是一些难以意识到的地方，看了以后有如拨云见日茅塞顿开。

另外，其实我很想把上面的文章翻译成中文放到这个博客里，已经发了邮件询问是否允许搬运，顺利的话下周就可以开始搬了。
