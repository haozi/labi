import ffmpeg from 'fluent-ffmpeg'

const DEFAULTS = {
  videoCodec: 'libx264',
  audioCodec: 'libmp3lame',
  a: null,
  size: '320x240',
  onerror(err) {
    console.log('An error occurred: ' + err.message)
  },
  onend() {
    console.log('Processing finished !')
  }
}

export default class FF {
  constructor (config) {
    this.config = Object.assign({}, DEFAULTS, config)
    this.ffmpeg = ffmpeg(this.config.input)
      .addInput(this.config.a)
      .addInput(this.config.b)
      .loop('0:14.500')
  }

  run () {
    this.ffmpeg.videoCodec(this.config.videoCodec)
    this.ffmpeg.audioCodec(this.config.audioCodec)
    this.ffmpeg.size(this.config.size)
    this.ffmpeg.on('error', this.config.onerror)
    this.ffmpeg.on('end', this.config.onend)
    this.config.audio && this.ffmpeg.noAudio()
    this.ffmpeg.save(this.config.output)
  }
}
