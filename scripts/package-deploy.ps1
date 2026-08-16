# dearbloom 배포용 zip 만들기 — 두 가지 zip 이 있고 **쓰임이 다르다.**
#
#   powershell -File scripts/package-deploy.ps1
#     → deploy/dearbloom-source-<날짜>.zip  (소스 스냅샷)
#       git archive 기반이라 git이 추적하는 파일만 담긴다:
#       .env(API 키)·node_modules·.next 는 구조적으로 포함될 수 없다.
#       용도는 백업·이관이다 — Netlify 실배포는 git 연결로 한다(deploy/README.md).
#
#   powershell -File scripts/package-deploy.ps1 -Static
#     → deploy/dearbloom-static-demo-<날짜>.zip  (정적 드롭 데모)
#       `npm run build:static` 을 돌려 `out/` 을 통째로 담는다. 서버 없이 도는 사이트라
#       Netlify 드롭 존에 그대로 끌어다 놓으면 열린다. 추천·그룹까지 실제로 동작하고,
#       다른 점은 멘트가 준비된 예문이라는 것뿐이다(LLM 없음 — deploy/README.md 의 표).
#
# ⚠ 두 zip 어디에도 키는 들어가지 않는다. 소스 zip 은 git 미추적이라, 정적 zip 은
#   빌드 산출물이라 그렇다(브라우저로 나가는 코드에 키를 심는 길은 열지 않는다).

param(
  [switch]$Static
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$stamp = Get-Date -Format 'yyyy-MM-dd'

if ($Static) {
  $out = Join-Path $root "deploy\dearbloom-static-demo-$stamp.zip"
  $siteDir = Join-Path $root 'out'

  Write-Output '[deploy] 정적 데모를 새로 빌드합니다 (npm run build:static)'
  npm run build:static
  if ($LASTEXITCODE -ne 0) { throw '정적 빌드 실패 — 위 로그를 보세요.' }
  if (-not (Test-Path $siteDir)) { throw "빌드는 끝났는데 out/ 이 없습니다: $siteDir" }

  if (Test-Path $out) { Remove-Item $out -Force }

  # ── zip 을 손으로 쌓는 이유 ────────────────────────────────────────────
  # `Compress-Archive` 는 항목 이름에 **역슬래시**를 쓴다(`flowers\rose-red.html`).
  # ZIP 규격은 경로 구분자를 `/` 로 못박아 두었고, 규격대로 읽는 압축 해제기는 그것을
  # 폴더가 아니라 **이름에 역슬래시가 든 파일 하나**로 풀어 버린다 — 사이트가 통째로
  # 납작해지고 링크가 전부 깨진다. 드롭 배포는 남의 기계에서 풀리는 일이라
  # "우리 탐색기에서는 멀쩡하더라"로는 부족하다. 그래서 항목마다 이름을 정규화해 넣는다.
  #
  # 담는 것은 `out/` 의 **안쪽**이다. 폴더째 넣으면 사이트가 한 겹 안으로 들어가
  # index.html 이 루트에 없다(Netlify 드롭은 zip 루트를 사이트 루트로 읽는다).
  Add-Type -AssemblyName System.IO.Compression | Out-Null
  Add-Type -AssemblyName System.IO.Compression.FileSystem | Out-Null

  $base = (Resolve-Path $siteDir).Path.TrimEnd('\') + '\'
  $zip = [System.IO.Compression.ZipFile]::Open($out, 'Create')
  try {
    $count = 0
    foreach ($file in Get-ChildItem -Path $siteDir -Recurse -File) {
      $entry = $file.FullName.Substring($base.Length).Replace('\', '/')
      [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
        $zip, $file.FullName, $entry, [System.IO.Compression.CompressionLevel]::Optimal
      ) | Out-Null
      $count++
    }
  } finally {
    $zip.Dispose()
  }

  $size = [math]::Round((Get-Item $out).Length / 1MB, 1)
  Write-Output "[deploy] 담은 파일 $count 개"
  Write-Output "[deploy] $out ($size MB)"
  Write-Output '[deploy] 드롭: app.netlify.com → Sites → zip 을 드롭 존에 끌어다 놓기'
  Write-Output '[deploy] 되는 것: 추천 3안 · 그룹(각각/단체 부케) · 도감 · 이야기 · 편지'
  Write-Output '[deploy] 다른 것: 멘트가 준비된 예문 (LLM 호출 없음 — 키를 브라우저에 심지 않는다)'
  Write-Output '[deploy] ⚠ .next 를 지웠습니다 — 본배포 빌드는 `npm run build` 로 다시 만드세요.'
  exit 0
}

$out = Join-Path $root "deploy\dearbloom-source-$stamp.zip"

if (Test-Path $out) { Remove-Item $out -Force }

git archive --format=zip --output=$out HEAD
if ($LASTEXITCODE -ne 0) { throw 'git archive 실패 — 커밋되지 않은 상태인지 확인하세요.' }

$size = [math]::Round((Get-Item $out).Length / 1MB, 1)
Write-Output "[deploy] $out ($size MB)"
Write-Output '[deploy] 포함: git 추적 파일 전부 (.env.example 포함)'
Write-Output '[deploy] 제외: .env(키), node_modules, .next, .agents, deploy/*.zip'
Write-Output '[deploy] 키는 Netlify 환경변수로만 — deploy/README.md 표 참조'
