----

title: install详解

tags: VueRouter

---

# use

使用

```js
import VueRouter from 'VueRouter'
Vue.use(VueRouter)
```

实现

```js
Vue.use=function(plugin) {
    //获取Vue实例的_installedPlugins属性，没有就初始化一个
    const installPlugins= (this._installedPlugins||(this._installedPlugins=[]))
    //注册过了就return
    if(installPlugins.indexOf(plugin)>-1)
    {return}
    //收集其他参数
    var args=toArray(arguments,1)
    args.unshift(this)
    //判断类型 并执行
    if(typeof plugin.install=='function')
		{
             plugin.install.apply(plugin,args)
        }
    else if(typeof plugin =='function')
		{
            plugin.apply(null,plugin,args)
        }
    //加入安装的插件数组
    installPlugins.push(plugin)
    return this
}
```





# install

使用

vue实现插件的两种方式：

1.实现一个有install方法的对象

2.实现一个install方法。

```js
//实现一个button作为插件全局注册
// button.vue
export default defineComponent( {
    name:'my-btn',
    install:function(Vue){
    //实现自己的业务逻辑
    Vue.component('my-btn',this)
}
})

//main.js
import button from 'xxx'
Vue.use(button)
```

实现：

```js
//在use内部将Vue推到args的首部去了
export function install (Vue) {
    //注册过了不用在注册
  if (install.installed && _Vue === Vue) return
  install.installed = true

  _Vue = Vue

  const isDef = v => v !== undefined

  const registerInstance = (vm, callVal) => {
    let i = vm.$options._parentVnode
    if (isDef(i) && isDef(i = i.data) && isDef(i = i.registerRouteInstance)) {
      i(vm, callVal)
    }
  }
   //1 使用mixin混入2个生命周期的逻辑
  Vue.mixin({
    beforeCreate () {
      if (isDef(this.$options.router)) {
        this._routerRoot = this
        this._router = this.$options.router
        this._router.init(this)
        Vue.util.defineReactive(this, '_route', this._router.history.current)
      } else {
        this._routerRoot = (this.$parent && this.$parent._routerRoot) || this
      }
      registerInstance(this, this)
    },
    destroyed () {
      registerInstance(this)
    }
  })
//2 给每个vue实例添加$router
  Object.defineProperty(Vue.prototype, '$router', {
    get () { return this._routerRoot._router }
  })
//给每个vue实例添加$route
  Object.defineProperty(Vue.prototype, '$route', {
    get () { return this._routerRoot._route }
  })
//3 全局注册2个组件
  Vue.component('RouterView', View)
  Vue.component('RouterLink', Link)

//4 组件的导航守卫
  const strats = Vue.config.optionMergeStrategies
  // use the same hook merging strategy for route hooks
  strats.beforeRouteEnter = strats.beforeRouteLeave = strats.beforeRouteUpdate = strats.created
}


```

