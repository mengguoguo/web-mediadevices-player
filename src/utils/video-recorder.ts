import moment from 'moment/moment'

export class VideoRecorder {
  public videoElement: HTMLVideoElement
  public mediaRecorder: MediaRecorder | null
  private recordedChunks: any[]
  aniId: number | undefined
  canvasElement: HTMLCanvasElement | undefined
  constructor(videoElement: HTMLVideoElement) {
    this.videoElement = videoElement
    this.mediaRecorder = null
    this.recordedChunks = []
    console.log('[VideoRecorder]', this)
  }

  private handleDataAvailable = (event) => {
    if (event.data.size > 0) {
      this.recordedChunks.push(event.data)
    }
  }
  useCanvasCapture() {
    const that = this
    const video = this.videoElement
    const canvas = document.createElement('canvas')
    this.canvasElement = canvas
    const ctx = canvas.getContext('2d')
    function captureFrame() {
      // 设置 canvas 尺寸与视频相同
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      // 在 canvas 上绘制视频当前帧
      ctx!.drawImage(video, 0, 0, canvas.width, canvas.height)
      // 这里可以继续处理 canvas 上的内容，比如编码为视频流
      // 使用 requestAnimationFrame 来尝试达到目标帧率
      that.aniId = requestAnimationFrame(captureFrame)
    }
    // 开始捕获帧
    captureFrame()
  }
  stopCanvasCapture() {
    if (this.aniId) {
      cancelAnimationFrame(this.aniId)
    }
    if (this.canvasElement) {
      this.canvasElement.remove()
    }
  }
  start() {
    const stream = this.videoElement.srcObject
    this.mediaRecorder = new MediaRecorder(stream, {
      audioBitsPerSecond: 320000,
      videoBitsPerSecond: 8000000,
      mimeType: 'video/webm',
    })
    this.mediaRecorder.addEventListener('dataavailable', this.handleDataAvailable)
    // this.mediaRecorder.ondataavailable = this.handleDataAvailable

    this.mediaRecorder.onstop = () => {
      console.log('record stop', this.mediaRecorder)
      const blob = new Blob(this.recordedChunks, {type: 'video/webm'})
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      if ((window as any).taskId) {
        link.download = `record_${(window as any).taskId}.webm`
      } else {
        link.download = `record_${moment().format('YYYY-MM-DD_HH-mm-ss')}.webm`
      }
      // 修改后的实现
      link.onclick = () => {
        setTimeout(() => {
          URL.revokeObjectURL(url) // 延迟 3s 确保下载已触发
        }, 3000)
      }
      link.click()
      this.mediaRecorder = null
      this.recordedChunks = []
    }

    this.recordedChunks = []
    this.mediaRecorder.start(1000)
    console.log('record start', this.mediaRecorder)
  }

  stop() {
    if (this.mediaRecorder) {
      this.mediaRecorder.requestData() // 强制保存最后的数据块
      this.mediaRecorder.stop()
      this.mediaRecorder.removeEventListener('dataavailable', this.handleDataAvailable)
    }
  }
}
