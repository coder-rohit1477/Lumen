import { logStartupEnvironment } from './lib/startup.mjs'

let registered = false

export async function register() {
  if (registered) return
  registered = true

  if (process.env.LUMEN_STARTUP_VALIDATED !== '1') {
    logStartupEnvironment()
  }
}
