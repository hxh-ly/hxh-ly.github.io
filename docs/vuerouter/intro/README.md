---
title: VueRouter介绍
tags: VueRouter
---
# 核心原理

## 1.什么是前端路由

在SPA(single page  application)中，描述`URL`和`UI`的映射关系。url的改变引起ui的变化，并且无需刷新页面。（即**局部刷新**）

## 2.如何实现前端路由

1. 如何改变页面而不引起刷新？
2. 如何检测url的变化？

### hash实现

#### hash概述

- hash是url后面(#)的部分，
- 常用hash（锚点）来做页面导航，
- **改变url后面的hash部分不会引起页面刷新**

- URL的变化会触发`hashChange`

改变url的方式

- <a>
- 浏览器前进后退
- window.location

### history实现

#### history概述

- h5提供可以添加历史记录,而不引起页面刷新的api
- pushState （name,title,url）
- replaceState(name,title,url)
- popState 详解
  - 1.浏览器前进后退会触发popState
  - pushState和replaceState和<a>不会触发
  - 可以拦截 pushState  replaceState 调用 和a的点击 来 检测
  - go back  forward 会触发

## 3.实现简单前端路由

hash实现

```html
<body>
  <ul>
    <li><a href="#/foo">foo</a></li>
    <li><a href="#/home">home</a></li>
  </ul>

  <div id="content">内容</div>

  <script>
    /* 
    就是监听hash的改变，去改变视图
    */
    var divv = content
    window.addEventListener('hashchange', function (e) {
      divv.textContent = window.location.hash
    })
    window.addEventListener('DOMContentLoaded', function (e) {
      if (!window.location.hash) {
        location.hash = '/'
      }else {
        divv.textContent = window.location.hash
      }
    })
  </script>
</body>
```

history实现

```html
<body>
  <ul>
    <li><a href="/foo">foo</a></li>
    <li><a href="/home">home</a></li>
  </ul>

  <div id="content">内容</div>
  <script>
    var divv = content
    // push replace a
    // go back forward
    window.addEventListener('popState', function (e) {
      // hash pathname host ...
      divv.textContent = location.pathname
    })
    window.addEventListener('DOMContentLoaded', function (e) {
      divv.textContent = location.pathname
      let linkList = document.querySelectorAll('a[href]')
      linkList.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault()
          //也就是说history实现 ：就多一步 我们自己操作记录
          history.pushState(null, '', item.getAttribute("href"))
          divv.textContent = location.pathname
        })
      })
    })
  </script>
</body>
```



# 实现

## 使用1：路由的引入

```js
Vue.use(VueRouter)
//use需要VueRouter实现install进行注册
```

实现install

```js
//引入2个组件
import View from './components/view'
import Link from './components/link'

let Vue=null
class VueRouter {
    
}
VueRouter.install=function(v) {
  //保存Vue
    Vue=v
    
  //注册2个组件
    Vue.component('router-link',Link
    })
    Vue.component('router-view',View
    })
}
```

完善install

`$router`和`$route` 有什么区别？

- router是VueRouter的实例对象，全局对象
- route是当前路由对象，route是router的一个属性

- 每个组件添加的 `router`是同一个，每个组件添加的`route`也是同一个的

**那如何给每个实例都添加上**`router``route`?

### 处理$router

```js
VueRouter.install=function(v){
    //添加的代码
    Vue.mixin({
        beforeCreate(){
        //给根组件添加_router属性，
        //每个子组件通过_root._router拿到全局router对象    
        if(this.$options&& this.$options.router) {
			 		//如果是根组件，
            this._root=this
            this._router=this.$options.router
        }else {
            this._root=this.$parent&&this.$parent._router
        }
           Object.defineProperty(this,'$router',{
               get:function(){
                   return this._root._router
               }
           } 
          Object.defineProperty(this,'$route',{
               get:function(){
               //注意：history在构造函数中根据mode模式创建的
                   return this._root._router.history.current
               }
           }                     
		) 
            
        },
        destory(){
            
        }
    })
}
```



## 使用2：路由对象的配置

```js
new VueRouter ({
    route: [
        {
            name:'foo',
            path:'/foo',
            component:Foo
        }
    ],
    mode:'hash' 
})
```

完善构造函数

```js
class VueRouter {
    constructor(options) {
        this.mode=options.mode||hash
       //处理路由配置
       this.matcher = createMatcher(options.routes || [], this)
    }
}
```

### 处理route

```js
//  /src/createMatcher.js
// 改方法返回多个处理函数
export function createMatcher(routes,router){
    
    const {pathList,pathMap,nameMap}= createRouteMap(routes)
	
    function addRoute(parentOrRoute,route){}
    
    function addRoutes(route){}

    function match(){}
    
    function getRoutes(){}
    
    return {
        match,
        addRoute,
        getRoutes,
        addRoutes
    }
 }
```

接下来看 `createRouteMap` 

- 创建映射表
- 将每一项路由配置 转换成 record
- 并且递归子配置，扁平化所有配置到引射表
- 如果 配置项有别名，同样生成另一条配置转换为record，加入map

```ts
pathList:路由路径列表
pathMap:路径到路由的映射
nameMap:名字到路由的映射
export function createRouteMap (
  routes: Array<RouteConfig>,
  oldPathList?: Array<string>,
  oldPathMap?: Dictionary<RouteRecord>,
  oldNameMap?: Dictionary<RouteRecord>,
  parentRoute?: RouteRecord
): {
  pathList: Array<string>,
  pathMap: Dictionary<RouteRecord>,
  nameMap: Dictionary<RouteRecord>
} {
  //控制路径匹配的优先级
  const pathList: Array<string> = oldPathList || []
  // $flow-disable-line
  const pathMap: Dictionary<RouteRecord> = oldPathMap || Object.create(null)
  // $flow-disable-line
  const nameMap: Dictionary<RouteRecord> = oldNameMap || Object.create(null)
  //遍历路由记录(toute) 调用addRouteRecord
  routes.forEach(route => {
    addRouteRecord(pathList, pathMap, nameMap, route, parentRoute)
  })

  // 确保通配符在最后面
  for (let i = 0, l = pathList.length; i < l; i++) {
    if (pathList[i] === '*') {
      pathList.push(pathList.splice(i, 1)[0])
      l--
      i--
    }
  }
	...
  return {
    pathList,
    pathMap,
    nameMap
  }
}
```

接下来看`addRouteRecord`

- 生成 record
- 添加nameMap和pathMap

```ts
function addRouteRecord (
  pathList: Array<string>,
  pathMap: Dictionary<RouteRecord>,
  nameMap: Dictionary<RouteRecord>,
  route: RouteConfig,
  parent?: RouteRecord,
  matchAs?: string
) {
  const { path, name } = route

  const pathToRegexpOptions: PathToRegexpOptions =
    route.pathToRegexpOptions || {}
  const normalizedPath = normalizePath(path, parent, pathToRegexpOptions.strict)

  if (typeof route.caseSensitive === 'boolean') {
    pathToRegexpOptions.sensitive = route.caseSensitive
  }
//生成record
  const record: RouteRecord = {
    path: normalizedPath,
    regex: compileRouteRegex(normalizedPath, pathToRegexpOptions),
    components: route.components || { default: route.component },
    alias: route.alias
      ? typeof route.alias === 'string'
        ? [route.alias]
        : route.alias
      : [],
    instances: {},
    enteredCbs: {},
    name,
    parent,
    matchAs,
    redirect: route.redirect,
    beforeEnter: route.beforeEnter,
    meta: route.meta || {},
    props:
      route.props == null
        ? {}
        : route.components
          ? route.props
          : { default: route.props }
  }
	//递归子配置项
    route.children.forEach(child => {
      const childMatchAs = matchAs
        ? cleanPath(`${matchAs}/${child.path}`)
        : undefined
      addRouteRecord(pathList, pathMap, nameMap, child, record, childMatchAs)
    })
  }
	//加入pathMap
  if (!pathMap[record.path]) {
    pathList.push(record.path)
    pathMap[record.path] = record
  }

    
    }
  }
  //配置项别名 也生成一条新的record
   if (route.alias !== undefined) {
    const aliases = Array.isArray(route.alias) ? route.alias : [route.alias]
    for (let i = 0; i < aliases.length; ++i) {
      const alias = aliases[i]
      if (process.env.NODE_ENV !== 'production' && alias === path) {
        warn(
          false,
          `Found an alias with the same value as the path: "${path}". You have to remove that alias. It will be ignored in development.`
        )
        // skip in dev to make it work
        continue
      }

      const aliasRoute = {
        path: alias,
        children: route.children
      }
      addRouteRecord(
        pathList,
        pathMap,
        nameMap,
        aliasRoute,
        parent,
        record.path || '/' // matchAs
      )
    }
  }
 //加入nameMap
  if (name) {
    if (!nameMap[name]) {
      nameMap[name] = record
    } else if (process.env.NODE_ENV !== 'production' && !matchAs) {
      warn(
        false,
        `Duplicate named routes definition: ` +
          `{ name: "${name}", path: "${record.path}" }`
      )
    }
  }
}
```

### 处理 mode 

`HTML5History` `HashHistory` `AbstractHistory` 用来记录路由的历史记录

```js
class VueRouter {
    constructor(options){
        this.mode=options.mode
        
         switch (mode) {
      case 'history':
        this.history = new HTML5History(this, options.base)
        break
      case 'hash':
        this.history = new HashHistory(this, options.base, this.fallback)
        break
      case 'abstract':
        this.history = new AbstractHistory(this, options.base)
        break
      default:
        if (process.env.NODE_ENV !== 'production') {
          assert(false, `invalid mode: ${mode}`)
        }
    }
    }
}
```

## 使用3： 导航守卫

```js
const route= new VueRouter({
    route:[
        {
            name:'foo',
            path:'/foo',
            //独享
    		beforeEnter:()=>{}        
        }
    ]
})
//全局
route.beforeEach(from,to,next) {
    
}
route.beforeEach(from,to,next) {
    
}
route.beforeEach(from,to,next) {
    
}
```

### 处理路由改变时导航守卫的调用

```
路由改变 
window.addEventListener('popState',handleRoutingEvent)

//handleRoutingEvent调用transitionTo
```

```js
//在路由改变时被  handleRoutingEvent（）调用
//执行按顺序路由守卫方法
function transitionTo() {
    const { updated, deactivated, activated } = resolveQueue(
      this.current.matched,
      route.matched
    )
  
//按解析顺序放入队列中
const queue:Array<?NavigationGuard> = [].concat(
2 extractLeaveGuards(deactivated)
3 this.router.beforeHooks,
4 extractUpdateHooks(updated),
5 activated.map(m=>m.beforeEnter)
6 resolveAsyncComponents(activated)
)

//尝试执行和做tryCatch处理
iterator(){}

runQueue(queue,iterator,()=>{
   //7，8
    const enterGuards=extractEnterGuards(activated)
    const queue = enterGuards.concat(this.router.resolveHooks)
	runQueue(queue,iterator , ()=>{
        9 确认  onComplete(route)
        ///10 afterEach在哪执行？
         if (this.router.app) {
          this.router.app.$nextTick(() => {
          11 更新视图  handleRouteEntered(route)
          })
        }

    })
    })   
}  

```



```js
class VueRouter {
    constructor(options){
        
      // 存放 各种全局路由守卫的函数钩子的队列
      this.beforeHooks = []
    this.resolveHooks = []
    this.afterHooks = []
    }
      beforeEach (fn: Function): Function {
    return registerHook(this.beforeHooks, fn)
  }

  beforeResolve (fn: Function): Function {
    return registerHook(this.resolveHooks, fn)
  }

  afterEach (fn: Function): Function {
    return registerHook(this.afterHooks, fn)
  }

}
```

下面看`registerHook`

- 将钩子函数添加到函数队列
- 返回删除钩子函数的方法

```js
function registerHook (list: Array<any>, fn: Function): Function {
  list.push(fn)
  return () => {
    const i = list.indexOf(fn)
    if (i > -1) list.splice(i, 1)
  }
}
```

## 使用4：Router-view

```js
<router-link to='/foo' />
//渲染 foo组件    
<router-view >    
```

### 实现Router-View

每个组件都有`_root`, 可以通过`_root`拿到`_router`,再拿到`history` 最后拿到`current`

```ts
// View组件 
export default {
    name:'RouterView',
    functional:true,
    prop:{
        name:{
            type:String,
            default:'default'
        }
    },
    render(){
     //从history获取current
     //根据routeMap获取对应的组件
     //return h( routeMap[current] )   
    }    
}

```

```js
Q:当current路径变化，不能响应式修改视图。所以需要将`histroy`变成响应式数据
//在install方法里
Vue.mixin({
    beforeCreate(){
        if (this.$options && this.$options.router){ 
            this._root = this; 
            this._router = this.$options.router;
           //！！ 关键 新增代码
            Vue.util.defineReactive(this,"_route",this._router.history)
        }else { 
            this._root= this.$parent && this.$parent._root
        }
        Object.defineProperty(this,'$router',{
            get(){
                return this._root._router
            }
        });
        Object.defineProperty(this,'$route',{
            get(){
                //要将 this._router.history变成响应式
                return this._root._route.current
            }
        })
    }
})
```

## 使用5： Router-link

```js
<router-link to='/foo' />
//渲染 foo组件    
<router-view >    
```

### 实现Router-link

```js
export default {
  name: 'RouterLink',
  props: {
    to: {
      type: toTypes,
      required: true
    },
    event: {
      type: eventTypes,
      default: 'click'
    }
  },
  render (h: Function) {
   //简单实现
     let to =  this._root.$router.mode =='hash' ? `#${this.to}`:this.to
     return h('a',{attr:{href:to}},this.$slots.default)
  }
}
```





