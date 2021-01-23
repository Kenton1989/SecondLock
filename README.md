Chrome Extension - TimeLock 时间锁
=====
Inspired by [Mr. He's video][mr_he_video].  
灵感来自[何同学的视频][mr_he_video]。
-----

# Introduction

觉得何同学介绍的[时间锁][mr_he_app]软件的概念挺实用的，可惜[时间锁][mr_he_app]只有安卓版的软件。就自己想个Chrome插件。

也算是Web开发菜鸡的练习（

也许又是一个开了就不填的坑（

咕咕咕咕咕咕咕咕咕咕咕

# Functionality

插件功能与何同学的时间锁App相似，用于在浏览含有大量信息流，容易过度消耗时间的网页（如各种视频网站，社交平台）之前，先给自己设定时间限额，时间到了之后，自动阻止浏览。

各个网站默认不需要拦截，除了被加入到黑名单中的网站。毕竟有能力提供大量信息流供人消遣的网站在世界上其实占少数。

# Update

### 2021/01/24
- 完善动态页面实现
- 实现用户浏览页面监视模块(browsing-page-monitor.js)

### 2021/01/22
- 实现动态页面内容(dynamic-page.js & dynamic-page-backend.js)

### 2021/01/21
- 初步完成UI设计

### 2021/01/20
- 加了一堆意义不明的CSS
- 初步确定前后端（？）结构

### 2021/01/17
- 确定了拦截页面的策略：通过打开一个新tab来挡住页面。
- 初步确定了侦测页面切换的逻辑。
- 现存Bug：
  - 一次窗口内Tab切换可能触发两次拦截（谜之bug）。
  - 同时出现窗口切换和Tab切换时可能会触发两次拦截。

### 2021/01/16
- 开坑
- 画了一个草率的Logo
- 嗯学 Chrome Extension 开发

# TODO

以下按优先级从高到低排序
- [x] 功能整体思路
- [x] UI设计
- [ ] 整体模块框架设计
- [ ] 打开网站前要确定使用时间(核心功能1)
- [ ] 白名单/黑名单(核心功能2)
- [ ] 倒计时显示
- [ ] 自由时间（和限制时间？）
- [ ] 弄个好看的icon
- [ ] 弄好Readme（格式和语言）
- [ ] 多国语言支持
- [ ] 格言集合
- [ ] 累计用时显示/限制
- 进阶功能（大概率并不会做）
  - [ ] 数据统计

[mr_he_video]: https://www.bilibili.com/video/BV1ev411x7en
[mr_he_app]: http://download.yitangyx.cn/test/student-he/new.html?202001
