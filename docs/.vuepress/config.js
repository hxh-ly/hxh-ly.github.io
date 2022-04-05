module.exports = {
  title: 'Hello VuePress',
  description: 'Just playing around',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' },
      { text: 'External', link: 'https://google.com' },
    ],
    sidebar: [
     
      {
        title: "Vue",  // 必须的
        path: "/guide/",   // 可选的, 应该是一个绝对路径
        collapsable: true, // 可选的, 是否可折叠，默认值是 true，为false时该分组将永远都是展开状态
        sidebarDepth: 2,   // 可选的, 默认值是 1
        children: ["/guide/basic-config/", "/guide/info"] // 可选的，没有时将不会有折叠效果
      },
      {
        title: "VueRouter",  // 必须的
        path: "/vuerouter/",   // 可选的, 应该是一个绝对路径
        collapsable: true, // 可选的, 是否可折叠，默认值是 true，为false时该分组将永远都是展开状态
        sidebarDepth: 2,   // 可选的, 默认值是 1
        children: ["/vuerouter/intro/", "/vuerouter/detail/","/vuerouter/install/"] // 可选的，没有时将不会有折叠效果
      },
      '/about',
      '/',
    ]
  }
}