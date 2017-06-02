import Labi from '../src/index'

new Labi({
  size: '800x565',
  input: `${__dirname}/f2.jpg`,
  a: `${__dirname}/f3.jpg`,
  b: `${__dirname}/f4.jpg`,

  output: `${__dirname}/o.mp4`
}).run()
