<#
.SYNOPSIS
dearbloom 개발 서버를 지정한 포트에서 안전하게 실행합니다.

.DESCRIPTION
기본 실행은 이미 점유된 포트를 종료하지 않습니다. 이전 dearbloom 서버를 정리해야 할 때만
-Clean을 명시하세요. Node.js 24 이상, npm.cmd, 로컬 Next.js 실행 파일을 먼저 확인한 뒤
프로젝트 루트에서 `npm.cmd run dev -- --port <Port>`를 실행합니다.

.PARAMETER Port
개발 서버가 사용할 포트입니다. 기본값은 3000입니다.

.PARAMETER Clean
실행 전에 선택한 포트를 stop.ps1로 정리합니다. 명시하지 않으면 어떤 프로세스도 종료하지 않습니다.

.EXAMPLE
.\scripts\dev.ps1

.EXAMPLE
.\scripts\dev.ps1 -Port 3400

.EXAMPLE
.\scripts\dev.ps1 -Clean
#>
[CmdletBinding()]
param(
  [ValidateRange(1, 65535)]
  [int]$Port = 3000,

  [switch]$Clean
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$stopScript = Join-Path $PSScriptRoot 'stop.ps1'
$packageJson = Join-Path $projectRoot 'package.json'
$nextBinary = Join-Path $projectRoot 'node_modules\.bin\next.cmd'
$exitCode = 1
$locationPushed = $false

function Get-PortListeners {
  param([int]$LocalPort)

  return @(
    Get-NetTCPConnection -LocalPort $LocalPort -State Listen -ErrorAction SilentlyContinue
  )
}

function Format-ListenerSummary {
  param([object[]]$Listeners)

  $summaries = @()
  $processIds = @($Listeners | Select-Object -ExpandProperty OwningProcess -Unique)
  foreach ($processId in $processIds) {
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    $processName = if ($process) { $process.ProcessName } else { 'unknown' }
    $summaries += ("PID {0} ({1})" -f $processId, $processName)
  }

  return ($summaries -join ', ')
}

try {
  if (-not (Test-Path -LiteralPath $packageJson -PathType Leaf)) {
    throw ("프로젝트 루트에서 package.json을 찾을 수 없습니다: {0}" -f $packageJson)
  }

  $nodeCommand = Get-Command 'node.exe' -ErrorAction SilentlyContinue
  if (-not $nodeCommand) {
    throw 'Node.js를 찾을 수 없습니다. Node.js 24 이상을 설치한 뒤 다시 실행하세요.'
  }

  $nodeVersionText = (& $nodeCommand.Source --version 2>&1 | Select-Object -First 1).ToString().Trim()
  if (($LASTEXITCODE -ne 0) -or ($nodeVersionText -notmatch '^v(?<major>\d+)\.')) {
    throw ("Node.js 버전을 확인하지 못했습니다: {0}" -f $nodeVersionText)
  }

  $nodeMajor = [int]$Matches['major']
  if ($nodeMajor -lt 24) {
    throw ("Node.js 24 이상이 필요합니다. 현재 버전: {0}" -f $nodeVersionText)
  }

  $npmCommand = Get-Command 'npm.cmd' -ErrorAction SilentlyContinue
  if (-not $npmCommand) {
    throw 'npm.cmd를 찾을 수 없습니다. Node.js 설치 상태와 PATH를 확인하세요.'
  }

  if (-not (Test-Path -LiteralPath $nextBinary -PathType Leaf)) {
    throw ("로컬 Next.js 실행 파일이 없습니다. 먼저 프로젝트 루트에서 `npm.cmd ci`를 실행하세요: {0}" -f $nextBinary)
  }

  if (-not (Get-Command 'Get-NetTCPConnection' -ErrorAction SilentlyContinue)) {
    throw 'Get-NetTCPConnection을 사용할 수 없습니다. Windows PowerShell 5.1 이상에서 실행하세요.'
  }

  Push-Location -LiteralPath $projectRoot
  $locationPushed = $true

  $listeners = @(Get-PortListeners -LocalPort $Port)
  if ($listeners.Count -gt 0) {
    if (-not $Clean) {
      $listenerSummary = Format-ListenerSummary -Listeners $listeners
      throw (":{0} 포트가 이미 사용 중입니다: {1}. 기본 실행은 다른 프로젝트를 종료하지 않습니다. 이전 dearbloom 서버가 맞다면 `scripts\dev.cmd -Clean -Port {0}`을 사용하세요." -f $Port, $listenerSummary)
    }

    Write-Host ("[dev] :{0} 정리 요청 (-Clean)" -f $Port)
    & $stopScript -Ports @($Port)

    $listeners = @(Get-PortListeners -LocalPort $Port)
    if ($listeners.Count -gt 0) {
      $listenerSummary = Format-ListenerSummary -Listeners $listeners
      throw (":{0} 포트를 정리하지 못했습니다: {1}" -f $Port, $listenerSummary)
    }
  }

  Write-Host ("[dev] Node {0} · http://localhost:{1}" -f $nodeVersionText, $Port)
  & $npmCommand.Source run dev -- --port $Port
  $exitCode = $LASTEXITCODE

  if ($exitCode -ne 0) {
    Write-Host ("[dev] 개발 서버가 종료 코드 {0}(으)로 끝났습니다." -f $exitCode) -ForegroundColor Red
  }
}
catch {
  Write-Host ("[dev] 실행 실패 — {0}" -f $_.Exception.Message) -ForegroundColor Red
  $exitCode = 1
}
finally {
  if ($locationPushed) {
    Pop-Location
  }
}

exit $exitCode
