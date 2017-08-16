Object.assign(global, {
  isDebug: process.env.NODE_ENV !== 'production'
})
