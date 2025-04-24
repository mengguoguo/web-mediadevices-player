import moment from 'moment/moment'

export class VideoRecorder {
  public videoElement: HTMLVideoElement
  public mediaRecorder: MediaRecorder | null
  private recordedChunks: any[]

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
      link.download = `record_${moment().format('YYYY-MM-DD_HH-mm-ss')}.webm`
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
