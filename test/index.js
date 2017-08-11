import labi from '../src/index'

// new Labi({
//   size: '800x565',
//   input: `${__dirname}/f2.jpg`,
//   a: `${__dirname}/f3.jpg`,
//   b: `${__dirname}/f4.jpg`,

//   output: `${__dirname}/o.mp4`
// }).run()

labi({
  src: './test/f.mp4',
  dest: './test/output.mp4'
})
.zip()
.mute()
.draw()

// 12.6M
