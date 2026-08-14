# dearbloom — 개발 서버 포트 정리 스크립트 (Windows PowerShell 5.1+)
#
# 사용:
#   .\scripts\stop.ps1                # 기본 포트 3000, 3001 정리
#   .\scripts\stop.ps1 -Ports 3000    # 특정 포트만
#   .\scripts\stop.ps1 -Any           # node 가 아닌 점유 프로세스도 강제 종료
#   npm run stop                      # package.json 스크립트로도 동일
#
# 동작: 지정 포트를 LISTEN 중인 프로세스를 찾아 프로세스 트리째(taskkill /T) 종료한다.
#       기본값은 node 프로세스만 종료 대상 — 다른 앱이 포트를 쓰고 있으면 건너뛰고 알려준다.

param(
  [int[]]$Ports = @(3000, 3001),
  [switch]$Any
)

$total = 0
foreach ($port in $Ports) {
  $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  if (-not $conns) {
    Write-Host ("[stop] :{0}  비어 있음" -f $port)
    continue
  }
  $procIds = @($conns | Select-Object -ExpandProperty OwningProcess -Unique)
  foreach ($procId in $procIds) {
    $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
    if (-not $proc) { continue }
    if (($proc.ProcessName -ne 'node') -and (-not $Any)) {
      Write-Host ("[stop] :{0}  PID {1} ({2}) — node 가 아니라 건너뜀. 강제 종료는 -Any" -f $port, $procId, $proc.ProcessName)
      continue
    }
    taskkill /PID $procId /T /F 2>$null | Out-Null
    Write-Host ("[stop] :{0}  PID {1} ({2}) 프로세스 트리 종료" -f $port, $procId, $proc.ProcessName)
    $total++
  }
}
Write-Host ("[stop] 완료 — {0}개 프로세스 트리 종료" -f $total)
