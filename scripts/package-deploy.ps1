# dearbloom 소스 zip 스냅샷 — deploy/dearbloom-source-<날짜>.zip
#
# git archive 기반이라 git이 추적하는 파일만 담긴다:
#   .env(API 키)·node_modules·.next 는 구조적으로 포함될 수 없다.
# 용도는 백업·이관이다 — Netlify 실배포는 git 연결로 한다(deploy/README.md).
#
# 실행:  powershell -File scripts/package-deploy.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$stamp = Get-Date -Format 'yyyy-MM-dd'
$out = Join-Path $root "deploy\dearbloom-source-$stamp.zip"

if (Test-Path $out) { Remove-Item $out -Force }

git archive --format=zip --output=$out HEAD
if ($LASTEXITCODE -ne 0) { throw 'git archive 실패 — 커밋되지 않은 상태인지 확인하세요.' }

$size = [math]::Round((Get-Item $out).Length / 1MB, 1)
Write-Output "[deploy] $out ($size MB)"
Write-Output '[deploy] 포함: git 추적 파일 전부 (.env.example 포함)'
Write-Output '[deploy] 제외: .env(키), node_modules, .next, .agents, deploy/*.zip'
Write-Output '[deploy] 키는 Netlify 환경변수로만 — deploy/README.md 표 참조'
