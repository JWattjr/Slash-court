param([switch]$Production)
$ErrorActionPreference = 'Stop'
$releaseRepo = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$releaseCommit = (git -c safe.directory=* -C $releaseRepo rev-parse HEAD).Trim()
if ($LASTEXITCODE -ne 0) { throw 'Could not resolve source revision' }
$releaseBase = Join-Path $releaseRepo 'artifacts'
$releaseDirectory = Join-Path $releaseBase ('pipeline-frontend-' + $releaseCommit.Substring(0,12))
$releaseArchive = Join-Path $releaseBase ('pipeline-frontend-' + $releaseCommit.Substring(0,12) + '.tar')
if (Test-Path -LiteralPath $releaseDirectory) { throw 'Release directory already exists; inspect rather than overwrite' }
New-Item -ItemType Directory -Path $releaseDirectory | Out-Null
git -c safe.directory=* -C $releaseRepo archive --format=tar --output=$releaseArchive HEAD frontend
if ($LASTEXITCODE -ne 0) { throw 'Clean source archive failed' }
tar -xf $releaseArchive -C $releaseDirectory
if ($LASTEXITCODE -ne 0) { throw 'Archive extraction failed' }
$releaseApp = Join-Path $releaseDirectory 'frontend'
$releaseLink = Join-Path $releaseApp '.vercel'
New-Item -ItemType Directory -Path $releaseLink | Out-Null
Copy-Item -LiteralPath (Join-Path $releaseRepo 'frontend/.vercel/project.json') -Destination (Join-Path $releaseLink 'project.json')
Push-Location $releaseApp
try {
  vercel project inspect --non-interactive
  if ($LASTEXITCODE -ne 0) { throw 'Linked project verification failed' }
  $releaseArgs = @('deploy','--yes','--scope','wattxs-projects','--build-env',"NEXT_PUBLIC_SLASHCOURT_SOURCE_REVISION=$releaseCommit")
  $releaseConfig = Get-Content -LiteralPath (Join-Path $releaseApp 'lib/pipeline/deployment.json') -Raw | ConvertFrom-Json
  $releasePublicEnvironment = @{
    NEXT_PUBLIC_SLASH_COURT_ADDRESS = '0x56e26ec256afe37199fe9845e039f5DEdd9e955a'
    NEXT_PUBLIC_OPERATOR_BOND_VAULT_ADDRESS = '0xb1fD046CA7D92b84b16f66bdE676f442cA599Aa7'
    NEXT_PUBLIC_PIPELINE_CHARTER = $releaseConfig.charter
    NEXT_PUBLIC_PIPELINE_COURT = $releaseConfig.court
    NEXT_PUBLIC_OPERATOR_RECORD = $releaseConfig.record
    NEXT_PUBLIC_GENLAYER_RPC_URL = 'https://studio.genlayer.com/api'
    NEXT_PUBLIC_GENLAYER_CHAIN_ID = '61999'
  }
  foreach ($releaseEntry in $releasePublicEnvironment.GetEnumerator()) {
    $releaseArgs += @('--build-env', "$($releaseEntry.Key)=$($releaseEntry.Value)")
  }
  if ($Production) { $releaseArgs += '--prod' }
  & vercel @releaseArgs
  if ($LASTEXITCODE -ne 0) { throw 'Vercel deployment failed' }
} finally { Pop-Location }
