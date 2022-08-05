
# 概述
这是一个不需要webpack等模块打包器就可以实现vue模块化的工具。

# 原理
使用vue的异步组件功能，将vue文件的内容通过字符串拼接、执行组合成component对象，再注册成全局组件供调用。核心代码：

      Vue.mixin({
        beforeCreate: function() {
          Vue.component(name, resolve => {
            resolve(component);
          });
        }
      });

# 适用场景
有几点要求才适合真正使用这个工具。
* 使用vue2.3.0+版本。
* 项目没有使用模块打包器管理，业务块代码都写在一个html文件里，有几千行（屎山）。
* html文件太多，逐个编写编译配置文件很麻烦。
* 需要兼容旧版本浏览器。（如果不需要兼容，可以了解一些[ES Module的使用技巧](https://juejin.cn/post/7070339012933713956)，万一用得上呢）

# demo
整个项目拉取下来就是一个demo，只需要启动一个**web服务器**，以index.html作为入口即可跑起来。

# 食用方法

## 关键字

介绍一下自定义的关键字，可以根据作用自行修改也没关系。

| 字段               | 作用                                                                                     |
| ------------------ | ---------------------------------------------------------------------------------------- |
| customizeComponent | vue文件                                                                                  |
| customizeMixins    | mixin模块                                                                                |
| customizeServices  | 可以通过this.services访问到的内容 (``因此如果要使用这个功能，注意services变量不要赋值``) |
| customizeScripts   | 外部引入js文件，会在created前加载完毕，不需要担心异步问题                                |
| customizeCss       | 外部引入css文件，同上                                                                    |
| childComponent     | 根组件需要使用模块化功能时，将根组件的options写到这个字段的内容里                        |

其他字段则与vue的关键字一样正常使用即可。

## html文件
如何引入工具。

首先在头部引入两个js文件。

    <script src="./utils.js"></script>
    <script src="./vue.js"></script>

然后在实例化vue对象前，use一下：

    Vue.use(Utils);
    new Vue({});

这样就可以开始使用工具了。

在写html的时候会有两种情况：
* 一种是只需要引入vue组件即可。
* 一种是不仅需要引入vue组件，还需要使用mixin等功能将代码模块化。

针对两种情况，html中初始化vue对象也有两种方法：

    let app = new Vue({
      el: '#app',
      customizeComponent: {
        halo: './halo.vue'
      },
      data() {
        return {
          speak: 'halo'
        }
      }
    });

    let app = new Vue({
      el: '#app',
      childComponent: {
        customizeComponent: {
          halo: './halo.vue'
        },
        customizeMixins: ['./minxins.js'],
        data() {
          return {
            speak: 'halo'
          }
        }
      }
    });

可以看到，第二种写法除了el，其他内容都写进了**childComponent** 字段里，原因是除了要写**customizeComponent**，还写了**customizeMixins**，如果不写进**childComponent**则**mixin**功能不会生效。

下面介绍一些文件的模板

## vue文件

    <template></template>
    <script>
    export default {
      data() { return { } }
    }
    </script>
    <style></style>

## mixin文件

    export default {
      data() { return { } }
    }

## services文件

    export default {
      getData() { }
    }

## script文件

    () => {
      let a = 123;
      window.a = a;
    }
