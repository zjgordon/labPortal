export class Logger {
  private getTimestamp(): string {
    return new Date().toISOString()
  }

  info(message: string, ...args: any[]): void {
    console.log(`[${this.getTimestamp()}] ℹ️  ${message}`, ...args)
  }

  debug(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${this.getTimestamp()}] 🔍 ${message}`, ...args)
    }
  }

  warn(message: string, ...args: any[]): void {
    console.warn(`[${this.getTimestamp()}] ⚠️  ${message}`, ...args)
  }

  error(message: string, ...args: any[]): void {
    console.error(`[${this.getTimestamp()}] ❌ ${message}`, ...args)
  }

  success(message: string, ...args: any[]): void {
    console.log(`[${this.getTimestamp()}] ✅ ${message}`, ...args)
  }
}
