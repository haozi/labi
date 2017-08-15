# labi
---

## API
```
import labi from 'labi'

labi({
  root: '', // 项目根路径，默认 process.cwd()
  src: './test/input.mp4',
  dest: './test/output.mp4',
  size: '750x422', // 默认 750x422
  mute: false, //  是否消音，默认 false
  stringify: false, // 是否编译成文本文件，默认 false
  zip: true, // 是否压缩，默认 true
  compareOrigin: true // 是否与原始文件对比，如果比原始文件体积大，使用原始文件
  cut: {
    start: '00:50:45',
    duration: 15 // 单位秒
  } // 剪切时长，默认 null
}).draw().then(res => {
  console.log(res)
})

```
