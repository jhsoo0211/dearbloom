# dearbloom — 포트 정리 후 개발 서버 실행 (Windows PowerShell 5.1+)
#
# 사용:
#   .\scripts\dev.ps1        # 3000·3001 정리 후 npm run dev
#
# 남아 있던 이전 dev 서버 때문에 포트가 3001로 밀리는 상황을 방지한다.

& (Join-Path $PSScriptRoot 'stop.ps1')
Set-Location (Split-Path $PSScriptRoot -Parent)
npm run dev
