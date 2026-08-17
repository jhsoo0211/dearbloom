<#
.SYNOPSIS
지정한 개발 포트를 점유한 프로세스를 종료합니다.

.DESCRIPTION
기본값은 Node.js 프로세스만 종료합니다. -Any를 명시하면 Node.js가 아닌 프로세스도
종료할 수 있습니다. taskkill의 종료 코드와 실제 LISTEN 상태를 모두 확인하며, 실패한 종료를
성공으로 집계하지 않습니다.

.PARAMETER Ports
정리할 포트 목록입니다. 기본값은 3000, 3001입니다.

.PARAMETER Any
Node.js가 아닌 점유 프로세스도 종료합니다.

.EXAMPLE
.\scripts\stop.ps1

.EXAMPLE
.\scripts\stop.ps1 -Ports 3000,3400

.EXAMPLE
.\scripts\stop.ps1 -Any
#>
[CmdletBinding()]
param(
  [ValidateRange(1, 65535)]
  [int[]]$Ports = @(3000, 3001),

  [switch]$Any
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'

$terminatedCount = 0
$skippedCount = 0
$failures = @()

function Get-PortListeners {
  param([int]$LocalPort)

  return @(
    Get-NetTCPConnection -LocalPort $LocalPort -State Listen -ErrorAction SilentlyContinue
  )
}

if (-not (Get-Command 'Get-NetTCPConnection' -ErrorAction SilentlyContinue)) {
  throw '[stop] Get-NetTCPConnection을 사용할 수 없습니다. Windows PowerShell 5.1 이상에서 실행하세요.'
}

$taskkillCommand = Get-Command 'taskkill.exe' -ErrorAction SilentlyContinue
if (-not $taskkillCommand) {
  throw '[stop] taskkill.exe를 찾을 수 없습니다.'
}

foreach ($port in ($Ports | Select-Object -Unique)) {
  $connections = @(Get-PortListeners -LocalPort $port)
  if ($connections.Count -eq 0) {
    Write-Host ("[stop] :{0} 비어 있음" -f $port)
    continue
  }

  $processIds = @($connections | Select-Object -ExpandProperty OwningProcess -Unique)
  foreach ($processId in $processIds) {
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    if (-not $process) {
      Write-Host ("[stop] :{0} PID {1}은 이미 종료됨" -f $port, $processId)
      continue
    }

    if (($process.ProcessName -ne 'node') -and (-not $Any)) {
      Write-Warning ("[stop] :{0} PID {1} ({2}) — Node.js가 아니라 건너뜁니다. 의도적으로 종료하려면 -Any를 사용하세요." -f $port, $processId, $process.ProcessName)
      $skippedCount++
      continue
    }

    $savedErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
      $taskkillOutput = @(& $taskkillCommand.Source /PID $processId /T /F 2>&1)
      $taskkillExitCode = $LASTEXITCODE
    }
    finally {
      $ErrorActionPreference = $savedErrorActionPreference
    }
    if ($taskkillExitCode -ne 0) {
      $detail = ($taskkillOutput | ForEach-Object { $_.ToString().Trim() } | Where-Object { $_ }) -join ' '
      $message = "[stop] :{0} PID {1} ({2}) taskkill 실패 (종료 코드 {3})" -f $port, $processId, $process.ProcessName, $taskkillExitCode
      if ($detail) {
        $message = "{0}: {1}" -f $message, $detail
      }
      Write-Warning $message
      $failures += $message
      continue
    }

    $stillListening = $true
    for ($attempt = 0; $attempt -lt 10; $attempt++) {
      $remainingForProcess = @(
        Get-PortListeners -LocalPort $port |
          Where-Object { $_.OwningProcess -eq $processId }
      )
      if ($remainingForProcess.Count -eq 0) {
        $stillListening = $false
        break
      }
      Start-Sleep -Milliseconds 100
    }

    if ($stillListening) {
      $message = "[stop] :{0} PID {1} ({2}) — taskkill 후에도 포트를 점유 중" -f $port, $processId, $process.ProcessName
      Write-Warning $message
      $failures += $message
      continue
    }

    Write-Host ("[stop] :{0} PID {1} ({2}) 프로세스 트리 종료" -f $port, $processId, $process.ProcessName)
    $terminatedCount++
  }

  $remainingConnections = @(Get-PortListeners -LocalPort $port)
  if ($remainingConnections.Count -gt 0) {
    $remainingIds = @($remainingConnections | Select-Object -ExpandProperty OwningProcess -Unique)
    $remainingSummary = ($remainingIds | ForEach-Object {
      $remainingProcess = Get-Process -Id $_ -ErrorAction SilentlyContinue
      $remainingName = if ($remainingProcess) { $remainingProcess.ProcessName } else { 'unknown' }
      "PID {0} ({1})" -f $_, $remainingName
    }) -join ', '
    $message = "[stop] :{0} 포트가 아직 사용 중: {1}" -f $port, $remainingSummary
    Write-Warning $message
    $failures += $message
  }
}

if ($failures.Count -gt 0) {
  throw ("[stop] 완료하지 못함 — {0}건의 실패, {1}개 종료, {2}개 건너뜀" -f $failures.Count, $terminatedCount, $skippedCount)
}

Write-Host ("[stop] 완료 — {0}개 프로세스 트리 종료, {1}개 건너뜀" -f $terminatedCount, $skippedCount)
