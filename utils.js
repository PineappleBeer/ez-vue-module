class Utils {
  /**入口 */
  static install(Vue) {
    let _this = this;
    Vue.mixin({
      beforeCreate: function () {
        /**因为只有异步组件才可以在created钩子执行前加载完所有外部文件，但是假如根组件也想拥有加载mixins、加载services、加载scripts方法，那么就应该把根组件变成一个异步组件。
         * 所以将根节点的innerHTML及根组件的script抽离出来，注册成一个新组件，这样才可以将根组件变成一个异步组件，但是同时script又不能在初始化vue实例时被执行。
         * 因此这里的思路就是新建一个key，用来记录根组件的option,这样在初始化vue实例的时候，也不会被执行 */
        if (this.$options.childComponent) {
          this.$options.customizeComponents = {};
          let $el = document.querySelector(this.$options.el), dom = $el.innerHTML, optionStr = '';
          for (let k in this.$options.childComponent) { //将根组件script拼接成字符串
            if (_this.getType(this.$options.childComponent[k]) === 'Function') {
              let fnStr = this.$options.childComponent[k].toString();
              optionStr += (/^function/.test(fnStr.trim()) ? `${k}:${fnStr}` : fnStr) + ',';
            } else {
              optionStr += `${k}:${JSON.stringify(this.$options.childComponent[k])},`;
            }
          }
          let vueFileStr = [
            `<template><div id="app_${this._uid}">${dom}</div></template>
            <script>{${optionStr}}</script>`
          ];
          /**将拼接后的html及script转成blob对象，然后再给blob对象创建url，这样就可以像请求vue文件一样请求这些拼接后额字符串并组合成组件了 */
          let blobUrl = new Blob(vueFileStr, { type: 'text/html', endings: "transparent" });
          $el.innerHTML = `<app_${this._uid} />`;
          this.$options.customizeComponents['app_' + this._uid] = URL.createObjectURL(blobUrl);
        }
        let components = this.$options.customizeComponents, prefixUrl = this.$options.prefixUrl || '';
        for (let name in components) {
          if (_this.getType(components[name]) === 'String') {
            Vue.component(name, resolve => {
              /**如果有引入的外部文件，那么会先加载完所有文件后才会执行自定义组件 */
              _this.vueCompiler(prefixUrl + components[name], name).then(component => {
                resolve(component);
              })
            });
          }
        }
      }
    });
  }

  /**ajax get */
  static ajaxGet(url) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    return new Promise((resolve) => {
      xhr.onreadystatechange = () => {
        if (xhr.readyState == 4 && (xhr.status == 0 || hr.status == 200 || xhr.status == 304)){
          resolve(xhr.responseText);
        }
      };
      xhr.send();
    });
  }

  /**实现eval */
  static evil(fn) {
    if (this.getType(fn) !== 'String') {
      return () => { }
    } else {
      fn = fn.trim().replace(/;$/g, '');
    }
    let res = undefined;
    try {
      res = new Function(`return (${fn})`)()();
    } catch (er) {
      try{
        res = new Function(`return (${fn})`)();
      } catch (err) {
        res = new Function(`return (${fn})`);      
      }
    }
    return res;
  }

  /**获取类型 */
  static getType(variable) {
    let res = Object.prototype.toString.call(variable).match(/object\s(.*)\]/);
    return res ? res[1] : res;
  }

  static vueCompiler(url, name) {
    return new Promise(async resolve => {
      function resolveRuntime({ component, optionFn, template }) {
        component = {
          template: template[0].innerHTML,
          ...optionFn,
          name
        };
        resolve(component);
      }

      function createStyle(styleText) {
        let styleEl = document.createElement('style');
        styleEl.innerHTML = styleText;
        document.head.appendChild(styleEl);
      }

      function formateStatement(str) {
        return (str || '').replace(/export default/g, '');
      }

      /**根据路径加载vue文件 */
      let resStr = await this.ajaxGet(url);
      let componentRes = this.loadXMLString(resStr),
        template = componentRes.filter(v => v.nodeName === 'TEMPLATE'),
        option = componentRes.filter(v => v.nodeName === 'SCRIPT'),
        style = componentRes.filter(v => v.nodeName === 'STYLE'),
        component = undefined;

      if (style.length > 0) {
        createStyle(style[0].innerHTML);
      }

      let optionFn = option.length === 0 ? {} : this.evil(formateStatement(option[0].innerHTML)); //得到函数体
      let srcList = []; //需要请求的文件路径集合
      let asyncArr = []; //请求文件的promise集合
      let prefixUrl = optionFn.prefixUrl || '';

      /**处理mixins */
      if (this.getType(optionFn.customizeMixins) === 'Array') {
        srcList = srcList.concat(optionFn.customizeMixins);
      } else {
        optionFn.customizeMixins = [];//后面处理asyncArr的时候，需要获取集合长度，所以如果为undefined可能导致报错
      }

      /**处理services */
      if (this.getType(optionFn.customizeServices) === 'Array') {
        srcList = srcList.concat(optionFn.customizeServices);
      } else {
        optionFn.customizeServices = [];
      }

      /**处理外部引入css */
      if (this.getType(optionFn.customizeCss) === 'Array') {
        srcList = srcList.concat(optionFn.customizeCss);
      } else {
        optionFn.customizeCss = [];
      }

      if (this.getType(optionFn.customizeScripts) === 'Array') {
        srcList = srcList.concat(optionFn.customizeScripts);
      } else {
        optionFn.customizeScripts = [];
      }

      /**请求所有文件，并将它们装到集合里，方便使用Promise.all */
      for (let index in srcList) {
        if (this.getType(srcList[index]) === 'String') {
          asyncArr.push(this.ajaxGet(prefixUrl + srcList[index]));
        }
      }

      /**如果有引入文件则处理引入文件，没有则直接resolve */
      if (asyncArr.length > 0) {
        /**因为下面处理customizeMixins和services都需要mixins选项，防止mixins为undefined */
        if (optionFn.mixins === undefined) {
          optionFn.mixins = [];
        }
        Promise.all(asyncArr).then(syncArr => {
          /**如果有很多个services文件，会把他们合并到一起 */
          let services = {};
          syncArr.forEach((sync, index) => {
            if (index < optionFn.customizeMixins.length) {
              let obj = this.evil(formateStatement(sync));
              optionFn.mixins.push(obj);
            } else if (index >= optionFn.customizeMixins.length && index < (optionFn.customizeMixins.length + optionFn.customizeServices.length)) {
              let obj = this.evil(formateStatement(sync));
              Object.assign(services, obj);
            } else if (index >= (optionFn.customizeMixins.length + optionFn.customizeServices.length) && index < (optionFn.customizeMixins.length + optionFn.customizeServices.length + optionFn.customizeCss.length)) {
              createStyle(sync);
            } else {
              this.evil(formateStatement(sync))();
            }
          });

          /**通过mixins的方式将services导入组件 */
          if (Object.keys(services).length > 0) {
            let serviceRes = {};
            serviceRes['services'] = services;
            optionFn.mixins.push({ data() { return serviceRes } });
          }
          resolveRuntime({ component, optionFn, template });
        });
      } else {
        resolveRuntime({ component, optionFn, template });
      }
    });
  }

  /**将字符串转成dom */
  static loadXMLString(txt) {
    let temp = document.createElement('template');
    temp.innerHTML = txt;
    return Array.from(temp.content.childNodes);
  }
}
