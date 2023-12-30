---
title: "github action搭建flutter流水线"
date: 2023-12-30T16:11:08+08:00
summary: "搭建构建和发布flutter应用的流水线"
featured_image: cover.png
tags: ["flutter", "github", "workflow"]
---


## 问题

众所周知github的流水线功能很强，能够自动执行构建、编译、发布等动作，每月有2000分钟的免费时长。而flutter涉及多平台的产物构建比较麻烦，需要跑到每个平台上手动编译。用github流水线来自动编译flutter应用就非常方便了。

本文主要解决以下几个问题：

* 在github action里编译Android，Linux和Windows平台的flutter产物。
* 创建能够跟随仓库的push提交，tag提交，以及手动触发的流水线。
* 创建能够自动上传artifact的测试流水线。
* 创建能够自动发布release，及其产物的正式流水线。
* 如何在release流水线里自动加上changelog。
* flutter Android产物编译时如何自动加上密钥签名。

本文主要参考的项目：

* [mikan_flutter](https://github.com/iota9star/mikan_flutter)
* [musify](https://github.com/gokadzev/Musify)
* [spotube](https://github.com/KRTirtho/spotube)
* [yuki](https://github.com/containers/youki)

最终完成的配置可到[realth000/tsdm_client](https://github.com/realth000/tsdm_client)查看。

## 编译流程

编译流程分两步，一是flutter编译环境的搭建，二是编译。

### 环境配置

第一步直接使用action：[subosito/flutter-action@v2](https://github.com/subosito/flutter-action)，使用方式如下：

```yaml
env:
  CI_FLUTTER_VERSION: '3.16.x'

jobs:
  build-linux-android:
    name: Build Linux and Android
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: 'zulu'
          java-version: '11'
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: ${{env.CI_FLUTTER_VERSION}}
          cache: true
      - run: |
          sudo apt update -y
          sudo apt install -y ninja-build libgtk-3-dev
  build-windows:
     name: Build Windows
     runs-on: windows-latest
     steps:
       - uses: actions/checkout@v4
       - uses: subosito/flutter-action@v2
         with:
           flutter-version: ${{env.CI_FLUTTER_VERSION}}
 ```

需要注意的地方：

1. flutter想编译安卓自然是MacOS，Linux和Windows上都能编译，本文以在Linux上编译安卓为例。
   * 因为我没有mac所以MacOS不在考虑范围内，同时windows上编译太慢了,不适合在windowsg上编译。
2. 在linux上用这个flutter action时需要先配置java环境，而这一步里官方例子写的是`setup-java@v2`，实际上用最新的`v4`最好，不然会有警告“node version太旧”。
3. 在linux上用这个flutter action还需要手动安装`ninja-build`和`libgtk-3-dev`两个依赖，ubuntu上如此，其他发行版也类似。
4. `flutter-version`放到了环境变量里，以让两个job共享用。
5. `flutter-version`可以选`stable`，这样就不需要手动指定flutter版本号了，但是作为依赖还是显示指定比较好。
6. 同理`ubuntu-latest`和`windows-latest`也可以改，改旧一点也没关系，甚至更好，不然老平台无法支持，但是我就偷个懒用最新的了。
7. 只有linux上启用了`cache`把flutter安装包缓存到github action内，这样可以减少编译时间，但是windows上这么缓存甚至会增加编译时长所以仅在linux上缓存。

### 编译

编译就按需求来，一般是`flutter pub get`还有`flutter build`两步，用到build_runner就加一个`flutter build_runner build`。

```yaml
jobs:
  build-linux-android:
    #...
      - name: Precompile
        run: |
          flutter pub get
          dart run build_runner build
      - name: Build Linux
        run: flutter build linux --release
 
  build-windows:
    #...
      - name: Precompile
        run: |
          flutter pub get
          dart run build_runner build
      - name: Build Windows
        run: flutter build windows --release
```

### 安卓release签名

安卓的产物还是签个名比较好，哪怕是自己的玩具项目，release模式编译时最好也签个名。

#### 生成签名密钥

生成密钥就使用官方的工具`keytool`，这个在配置好安卓环境以后应该就已经能够用了。

```bash
keytool -genkey -v -keystore key.jks -alias my_app_key -keyalg RSA -keysize 4096 -validity 36500
```

讲讲参数：

* `-genkey`：生成密钥
* `-v`：详细输出
* `-keystore`：格式为`keystore`，这是安卓签名存放的格式
* `-alias`：密钥的别名， 推荐一个仓库单独用一个密钥，因此也要用单独的别名。别名在签名过程中用得到所以**千万别忘，也别随便填**。
* `-keyalg`：指定密钥生成算法，就用RSA就行。
* `-keysize`：签名密钥长度，RSA的话至少2048吧，本文用4096，更安全一些。
* `-validity`：签名有效时间，多少天。这个根据需求来，一般来说给个20年是可以的，20年后这个项目八成就不在了。本文偷懒，定了100年，时间太久但是自己个人项目的话也行吧。

然后keytool会要求输出一些签名配置信息，同时还要求输入密码，这个密码是`keystore`的密码，**需要足够复杂**，千万别忘了。

完成后会在当前目录下生成一个叫做`key.jks`的文件，到这一步，安卓签名已经完成三分之一了。

注意：

* **切记要将key.jks保存到安全的位置，单独存放，不要加到版本控制里**。
* 由于密码很特殊，**极其不推荐直接在命令行参数里加上密码参数**，一定要让keytool主动询问密码，这时候手动输入。
* 严格来说别名`-alias`的值也不应该暴露到命令行参数中，但是不加的话会使用默认的别名，因为只能在参数里加上。

#### 配置gradle给应用签名

现在只有密钥，还需要告诉gradle，在编译过程中用这个密钥给产物签名。

打开项目的`android/app/build.gradle`，在大约是26行的位置（也就是 `apply from: "$flutterRoot/ ... / flutter.gradle"）这一行之后添加配置：

大概是这个位置就行。

```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

然后在下方的 `android {}`里面的`defaultConfig{}`和`buildTypes{}`之间加一块代码：

```gradle
signingConfig {
    release {
        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
        storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
        storePassword keystoreProperties['storePassword']
    }
}
```

来配置签名的配置。

同时在`buildTypes{}`的`release{}`里配置只有release的时候才签名，并且用刚才的releae签名配置：

```gradle
buildTypes {
    debug {
        ndk {
            abiFilters "arm64-v8a", "armeabi-v7a", "x86_64"
        }
    }
    release {
        signingConfig signingConfigs.release
        ndk {
            abiFilters "arm64-v8a"
        }
    }
}
```

上面的配置里，release中的signingConfig使用上方定义的`signingConfigs.release`。

同时还把android abi分开了，这部分做不做都行。

最后把刚才的`key.jks`放到`android/app`文件夹里，并且创建文件`android/key.properties`写入以下内容

```jproperties
storePassword=xxx
keyPassword=xxx
keyAlias=my_app_key
storeFile=key.jks
```

其中`storePassword`和`keyPassword`是调用`keyTool`命令生成签名时输入的密码，`keyAlias`也是生成时用的alias，`storeFile`就填密钥的名字`key.jks`。

注意：

* 两个password一定要保存好，不要丢失，更不要泄露。
* `keyAlias`严格来说也不要泄露。
* 这个文件和`key.jks`**千万不要加到版本控制里，一定要单独存放**，不然传到github上就废了。

到这一步，安卓签名完成了三分之二，就差在流水线里配置了

#### 流水线签名配置

打开github项目地址，在settings -> Security -> Secrets and variables -> Actions内添加两个`Repository secrets`。

一个叫`KEYSTROE`，里面的存放刚才写好的`key.jis`的值，但是由于这是个签名密钥，类似为二进制，不是文本文件，不方便直接存到secrets里，需要base64转个码：

```bash
base64 < key.jks
```

把输出的一长串文本当作`KEYSTORE`这个secrets的值。

另一个叫`KEY_PROPERTIES`，里面直接存刚才的`key.properties`文件的内容就好。

注意：

* 其实这两个secrets叫什么都行，只要和流水线配置里能对得上。

最后在流水线配置里，编译安卓的步骤前加上导出密钥的步骤：

```yaml
      - name: Setup Android sign key
        run: |
          echo '${{ secrets.KEYSTORE }}' | base64 --decode > android/app/key.jks
          echo '${{ secrets.KEY_PROPERTIES }}' > android/key.properties
```

到此为止就配置完了。

#### 配置解读

但是这个配置是什么意思呢？按流程来说是这样的：

1. `android/app/build.gradle`是flutter在安卓平台构建时使用的配置，里面加上了从`android/key.properties`读取签名密钥的方法，也就是`signingConfigs`和`buildTypes`里加的两段。
2. gradle在编译过程中根据配置找到了`android/key.properties`，并根据里面的配置找到`android/app/key.jks`这个签名文件。
3. 然后对app签名。
4. 在github的流水线中也是这个流程，只不过多了将`key.properties` 和`key.jks`的内容从secrets到出到文件的过程。

### 上传编译产物

到此，编译和签名过程都配置好了，作为测试流水线，需要将编译产物上传为artifacts供下载。

用`actions/upload-artifact@v3`这个官方action。

同时在linux和windows平台的产物上，推荐自己再打一层压缩包。

```yaml
jobs:
  build-linux-android:
    #...
    - name: Pre Packing
        run: |
          pushd build/linux/x64/release/
          mv bundle tsdm_client
          popd
      - name: Pack Linux tarball
        uses: thedoctor0/zip-release@master
        with:
          type: 'tar'
          filename: tsdm_client-linux.tar.gz
          directory: build/linux/x64/release/
          path: tsdm_client
      - name: Upload Linux artifacts
        uses: actions/upload-artifact@v3
        with:
          name: tsdm_client-linux-tarball
          path: build/linux/x64/release/tsdm_client-linux.tar.gz
  build-windows:
    #...
     - name: Pre Packing
        shell: pwsh
        run: |
          cd build/windows/x64/runner
          Rename-Item Release tsdm_client
          cd ../../../../
      - name: Pack Windows tarball
        uses: thedoctor0/zip-release@master
        with:
          type: 'zip'
          filename: tsdm_client-windows.zip
          directory: build/windows/x64/runner
          path: tsdm_client
      - name: Upload Windows artifacts
        uses: actions/upload-artifact@v3
        with:
          name: tsdm_client-windows-tarball
          path: build/windows/x64/runner/tsdm_client-windows.zip
```

做了两件事，先把生成的产物放到一个干净的文件夹里，然后打包，Linux上是.tar.gz，windows上是.zip。

注意：

* `upload-artifact`这个action会在打包产物上再打一个压缩包，而且这个功能无法关闭。

### 配置触发流水线的方式

一般来说，最好是一个commit跑一次测试流水线：

```yaml
on:
  push:
    branches: ["master"]
```

但是那种流水线是跑测试的，编译打包上传尤其是上传artifact没有必要做。

而且还有一个严重问题，发release的时候也会触发这种上传artifact的测试流水线，显然多余了，用`tags-ignore`也避免不了。

所以推荐用手动触发的方式：

```yaml
on:
  workflow_dispatch:
```

来手动触发。

github app还不支持这种操作，只能在网页上触发。

### 正式流水线

和测试流水线的大部分工作内容相同，只是最后不需要上传artifact，而是生成release。

生成release的action我挑了很久，需要满足以下几个要求：

1. 能在一个workflow的多个job里同时进行，因为flutter的编译是无法在一个job里完成的。
2. 能上传和修改release的产物，只上传还不够，不止一个job意味着不止一次上传，还需要修改。
3. 能自动发布release notes，自己还要写太蠢了。

一番查找之后，[subosito/flutter-action](https://github.com/subosito/flutter-action)和[ffurrer2/extract-release-notes](https://github.com/ffurrer2/extract-release-notes)完全满足要求。

直接上配置：

```yaml
job:
  release:
    name: Create release
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Extract release notes
        id: extract-release-notes
        uses: ffurrer2/extract-release-notes@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - name: Create release
        uses: ncipollo/release-action@v1
        with:
          allowUpdates: true
          body: '${{ steps.extract-release-notes.outputs.release_notes }}'
  build-linux-android:
    #...
       - name: Release Android artifacts
        uses: ncipollo/release-action@v1
        with:
          allowUpdates: true
          omitBody: true
          omitBodyDuringUpdate: true
          artifacts: 'build/app/outputs/flutter-apk/tsdm_client-arm64_v8a.apk,build/app/outputs/flutter-apk/tsdm_client-armeabi_v7a.apk'
  build-windows:
    #...
       - name: Release Windows artifacts
        uses: ncipollo/release-action@v1
        with:
          allowUpdates: true
          omitBody: true
          omitBodyDuringUpdate: true
          artifacts: 'build/windows/x64/runner/tsdm_client-windows.zip'
```

上述配置，多了一个叫release的job，用于生成release，并填写release notes更新说明。更新说明的内容从`CHANGLOS.md`自动读取，很方便。

注意要求`CHANGLOG.md`的格式符合[keep-a-changelog](https://keepachangelog.com/en/1.1.0/)的格式，这个格式我也比较推荐，很清晰，而生成release说明时会自动读取最新一截发布的版本的说明，完全自动。

参数含义：

* `allowUpdates`：允许更新release内容，包括修改更新说明和修改更新产物两方面。
* `body`：更新说明的内容，从之前的release changelog的步骤输出里获取。
* `omitBody`：不修改release notes，因为上传各平台的编译产物时更新说明为空，所以要忽略修改这部分，不然更新说明就被空文本覆盖了。
* `omitBodyDuringUpdate`：实际应该是这个选项生效吧，还是把两个选项都加上e了。
* `artifacts`：要上传到release的编译产物的路径，多个产物用逗号隔开。

#### 配置触发方式

release就根据tag来好了：

```yaml
on:
  push:
    tags:
      - 'v*'
```

在`git push origin --tags`的时候会触发。

## 总结

完整配置可到[test_build.yml](https://github.com/realth000/tsdm_client/blob/master/.github/workflows/test_build.yml)和[release_build.yml](https://github.com/realth000/tsdm_client/blob/master/.github/workflows/relase_build.yml)查看。
