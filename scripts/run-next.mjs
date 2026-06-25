import { spawn, spawnSync } from 'node:child_process'
import path from 'node:path'
import { logStartupEnvironment } from '../lib/startup.mjs'

const [, , command = 'dev', ...args] = process.argv
const cwd = process.cwd()
const nextBin = path.join(cwd, 'node_modules', 'next', 'dist', 'bin', 'next')
const nextBinForFilter = nextBin.replace(/\\/g, '\\\\')

let child = null
let shuttingDown = false
let forceKillTimer = null
let pendingExitCode = 0

function runCommand(commandName, commandArgs, options = {}) {
  const result = spawnSync(commandName, commandArgs, {
    cwd,
    stdio: 'ignore',
    shell: false,
    windowsHide: true,
    ...options,
  })
  return result.status === 0
}

function killStaleNextProcesses() {
  if (process.platform === 'win32') {
    const script = [
      '$ErrorActionPreference = "SilentlyContinue"',
      '$processes = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -and $_.CommandLine -like "*' + nextBinForFilter + '*" }',
      'foreach ($process in $processes) { Stop-Process -Id $process.ProcessId -Force }',
    ].join('; ')
    runCommand('powershell', ['-NoProfile', '-NonInteractive', '-Command', script])
    return
  }

  runCommand('pkill', ['-f', nextBin])
}

function killTree(pid) {
  if (!pid) return
  if (process.platform === 'win32') {
    runCommand('taskkill', ['/PID', String(pid), '/T', '/F'])
    return
  }

  try {
    process.kill(pid, 'SIGTERM')
  } catch {
    return
  }
}

async function shutdown(exitCode = 0) {
  if (shuttingDown) return
  shuttingDown = true
  pendingExitCode = exitCode
  if (child && !child.killed) {
    try {
      child.kill('SIGINT')
    } catch {
      // Fall back to a hard kill below if the signal cannot be delivered.
    }
    forceKillTimer = setTimeout(() => {
      if (child && !child.killed) {
        killTree(child.pid)
      }
      process.exit(exitCode)
    }, 5000)
    forceKillTimer.unref?.()
    return
  }
  process.exit(exitCode)
}

function exitCodeFromSignal(signal) {
  if (signal === 'SIGINT') return 130
  if (signal === 'SIGTERM') return 143
  if (signal === 'SIGHUP') return 129
  return 1
}

async function main() {
  logStartupEnvironment()
  killStaleNextProcesses()

  child = spawn(process.execPath, [nextBin, command, ...args], {
    cwd,
    stdio: 'inherit',
    env: {
      ...process.env,
      LUMEN_STARTUP_VALIDATED: '1',
    },
    windowsHide: false,
  })

  const stop = (signal) => {
    void shutdown(exitCodeFromSignal(signal))
  }

  process.once('SIGINT', stop)
  process.once('SIGTERM', stop)
  process.once('SIGHUP', stop)

  child.on('exit', (code, signal) => {
    if (forceKillTimer) clearTimeout(forceKillTimer)
    if (signal) {
      process.exit(shuttingDown ? pendingExitCode : exitCodeFromSignal(signal))
      return
    }
    process.exit(shuttingDown ? pendingExitCode : (typeof code === 'number' ? code : 0))
  })

  child.on('error', async (error) => {
    console.error(error)
    await shutdown(1)
  })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
