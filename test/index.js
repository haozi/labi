import labi from '../src/index'

labi({
  src: './test/input.mp4',
  dest: './test/output.mp4',
  size: '750x422',
  watermask: {
    pic: './test/watermask.png',
    // direction: 'ct', tl, tr, br, bl, ct
    size: '_x40'
  },
  cut: [{
    start: '00:00:45',
    duration: 5
  }],
  mute: true,
  stringify: true
}).draw().then(e => {
  console.log(e)
})
