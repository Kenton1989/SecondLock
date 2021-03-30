<img src="./src/pages/images/logo.svg" alt="Logo of the project" align="right" width="128px">

# SecondLock (Chrome Extension)

[简体中文版简介](README.zh_CN.md)

---

A brand new time management tool introduced in [the video by @老师好我叫何同学][mr_he_video]. You need to set time limit every time before entering those fancy websites.

With SecondLock, before entering any fancy website, you must set a time limit for browsing that page. **That is the last second your are mindful, you should think twice before setting.** Then, enjoy your mindless time. SecondLock will block the webpage when time's up and try to remind you.

Common time management extensions either block those fancy website completely, or set gross time limit. The former ones deny the necessity of relaxation. The latter ones only show effect when the time limit is coming to an end. SecondLock avoids both problem, it remind you every time.

> Ask yourself before opening an app:
>
> - Why do you open it?
> - How long will you spend?
> - Do you have any alternative to do?
>
> -- [@老师好我叫何同学][mr_he_channel]

Three questions above also applies before browsing any website.

# Features

- Automatic webpage monitoring, blocking, timing and unblocking
- Customize website blacklist & whitelist
- Functional popup
  - Countdown display
  - Stop timing earlier
- Customize unlock duration selection page
- Customize time's up page

# Installation

The extension haven't been published in Chrome Web Store.

The extension haven't been published in Firefox Browser Add-ons.

# Requirement

Use the latest Chrome & Firefox is definitely fine.

The extension is tested on Chrome 89.0 & Firefox 86.0

I'm just too lazy to test capability on old version browser (XD.

Capability on other Chromium-based browser haven't been tested.

# Update

- v0.4.0
  - Rewrite frontend with React.js
  - Support customized message on times up page
  - Support leave one tab when all tabs are closed by SecondLock

- v0.3.0
  - Add capability: Firefox

- v0.2.1

  - change extension name.
  - bug fix: whitelist does not work when manually stop timing.

- v0.2.0

  - Support simplified Chinese (zh-CN)
  - Stop timing earlier manually
  - Display local storage usage

- v0.1.2

  - Customize website whitelist

- v0.1.1

  - Customize default unlock durations choices

- v0.1.0
  - Automatic webpage monitoring, blocking, timing and unblocking
  - Customize website blacklist
  - Countdown display

# TODO

- [ ] popup: add current website to blacklist
- [ ] user manual
- [ ] notification on ending time approaching
- [ ] calm down time
- [ ] customize monitor working days
- [ ] customize mottos set
- [ ] option exporting & importing
- [ ] option syncing
- [ ] options: customize blocking page on time's up
- [ ] options: set the message on time's up when setting unlock duration
- [x] options: close website on time's up without showing time's up page
- [x] display customized motto on blocking page
- [x] options: leave one newtab when all tabs in current window are closed
- [x] rewrite frontend with a framework
- [x] support Firefox
- [x] selection page：set unlock time by ending point
- [x] internationalization (at least zh-CN + en)
- [x] refine README.md
- [x] customize default unlock time
- [x] acknowledgement in options page
- [x] stop timer earlier manually
- [x] monitor whitelist
- [x] select time and unlock before entering website in blacklist
- [x] customize blacklist
- [x] popup: countdown display
- [x] polish the extension icon
- The functionalities that are unlikely to appear
  - [ ] limited local storage
  - [ ] set accumulated time limit
  - [ ] browsing history statistic

# Acknowledge

Here I present my great thanks to the following people:

- [@老师好我叫何同学][mr_he_channel]: the source of inspiration of this extension.
- [@KeithHenry](https://github.com/KeithHenry): support transforming the callback-based API in chrome to promise-based. [[Source]](https://github.com/KeithHenry/chromeExtensionAsync)
- [@lxieyang](https://github.com/lxieyang/): provide web extension boilerplate with React.js. [[Source]](https://github.com/lxieyang/chrome-extension-boilerplate-react)

[mr_he_channel]: https://www.youtube.com/c/hetongxue
[mr_he_video]: https://www.youtube.com/watch?v=mCEjEkgU1AA
[mr_he_app]: http://download.yitangyx.cn/test/student-he/new.html?202001
