import labi from '../src/index'

// new Labi({
//   size: '800x565',
//   input: `${__dirname}/f2.jpg`,
//   a: `${__dirname}/f3.jpg`,
//   b: `${__dirname}/f4.jpg`,

//   output: `${__dirname}/o.mp4`
// }).run()

labi({
  src: './test/input.mp4',
  dest: './test/output.mp4',
  size: '750x422',
  cut: [{
    start: '00:00:45',
    duration: 5
  }],
  mute: true,
  stringify: true
})//._result()
.draw().then(e => {
  console.log(e)
})

