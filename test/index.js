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
  size: '300x156',
  mute: true,
}).draw().then(e => {
  console.log(e)
})
