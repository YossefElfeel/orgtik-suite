# Updates @somion/sos-bar to latest in Somion core + main system repos,
# commits, and pushes to origin/dev.
#
# Usage (from anywhere):
#   powershell -ExecutionPolicy Bypass -File d:\Projects\somion-sos\scripts\update-sos-bar.ps1
#
# Or from somion-sos:
#   .\scripts\update-sos-bar.ps1
#
# Optional:
#   $env:SOMION_PROJECTS_ROOT = "d:\Projects"

$ErrorActionPreference = "Stop"

$ProjectsRoot = if ($env:SOMION_PROJECTS_ROOT) {
    $env:SOMION_PROJECTS_ROOT
} else {
    Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
}

$Projects = @(
    "somion-sos",
    "somion-task-manager",
    "somion-hr-dashboard",
    "new-somion-sales",
    "new-somion-dashboard",
    "tsheck-dashboard",
    "file-manager-dashboard",
    "digital-marketing-frontend"
)

function Invoke-External {
    param(
        [Parameter(Mandatory = $true)][string]$Executable,
        [Parameter(Mandatory = $true)][string[]]$Command
    )

    $previousErrorAction = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        $output = & $Executable @Command 2>&1
        $text = ($output | ForEach-Object { "$_" }) -join [Environment]::NewLine

        return [PSCustomObject]@{
            ExitCode = $LASTEXITCODE
            Output   = $text
        }
    } finally {
        $ErrorActionPreference = $previousErrorAction
    }
}

function Write-Failure {
    param(
        [Parameter(Mandatory = $true)][string]$Message,
        [string]$Reason
    )

    Write-Warning $Message
    if ($Reason) {
        Write-Host $Reason -ForegroundColor Red
    }
}

function Get-DirtyGitSummary {
    $lines = @(git status --porcelain)
    if ($lines.Count -eq 0) {
        return $null
    }

    $files = $lines | ForEach-Object {
        if ($_.Length -gt 3) { $_.Substring(3) } else { $_ }
    }

    return ($files -join ", ")
}

function Get-InstalledSosBarVersion {
    param([string]$ProjectPath)

    Push-Location $ProjectPath
    try {
        $version = node -p "require('./node_modules/@somion/sos-bar/package.json').version" 2>$null
        if ($version) { return $version.Trim() }

        if (Test-Path "package-lock.json") {
            $lock = Get-Content "package-lock.json" -Raw | ConvertFrom-Json
            if ($lock.packages."node_modules/@somion/sos-bar".version) {
                return $lock.packages."node_modules/@somion/sos-bar".version
            }
        }

        return $null
    } finally {
        Pop-Location
    }
}

function Ensure-DevBranch {
    $branch = git rev-parse --abbrev-ref HEAD 2>$null
    if ($branch -eq "dev") {
        return [PSCustomObject]@{ ExitCode = 0; Output = "Already on dev" }
    }

    return Invoke-External -Executable "git" -Command @("checkout", "dev")
}

function Test-GitClean {
    param([string]$ProjectPath)

    Push-Location $ProjectPath
    try {
        $status = git status --porcelain
        return [string]::IsNullOrWhiteSpace($status)
    } finally {
        Pop-Location
    }
}

$results = @()

foreach ($project in $Projects) {
    $projectPath = Join-Path $ProjectsRoot $project
    Write-Host "`n=== $project ===" -ForegroundColor Cyan

    if (-not (Test-Path $projectPath)) {
        Write-Failure "Skipped: directory not found." "Path: $projectPath"
        $results += [PSCustomObject]@{ Project = $project; Status = "Skipped"; Detail = "Directory not found" }
        continue
    }

    if (-not (Test-Path (Join-Path $projectPath "package.json"))) {
        Write-Failure "Skipped: no package.json." "Path: $projectPath"
        $results += [PSCustomObject]@{ Project = $project; Status = "Skipped"; Detail = "No package.json" }
        continue
    }

    Push-Location $projectPath
    try {
        if (-not (Test-Path ".git")) {
            Write-Failure "Skipped: not a git repository." "Path: $projectPath"
            $results += [PSCustomObject]@{ Project = $project; Status = "Skipped"; Detail = "Not a git repo" }
            continue
        }

        if (-not (Test-GitClean $projectPath)) {
            $dirtyFiles = Get-DirtyGitSummary
            Write-Failure "Skipped: working tree is not clean." "Uncommitted changes: $dirtyFiles"
            $results += [PSCustomObject]@{ Project = $project; Status = "Skipped"; Detail = "Dirty: $dirtyFiles" }
            continue
        }

        $checkout = Ensure-DevBranch
        if ($checkout.ExitCode -ne 0) {
            Write-Failure "Skipped: could not checkout branch 'dev'." $checkout.Output
            $results += [PSCustomObject]@{ Project = $project; Status = "Skipped"; Detail = "No dev branch" }
            continue
        }

        Write-Host "Pulling latest from origin/dev ..."
        $pull = Invoke-External -Executable "git" -Command @("pull", "origin", "dev")
        if ($pull.ExitCode -ne 0) {
            Write-Failure "git pull failed (exit $($pull.ExitCode))." $pull.Output
            $results += [PSCustomObject]@{ Project = $project; Status = "Failed"; Detail = "git pull failed" }
            continue
        }

        if ($pull.Output) {
            Write-Host $pull.Output
        }

        Write-Host "Installing @somion/sos-bar@latest ..."
        $npm = Invoke-External -Executable "npm" -Command @("i", "--legacy-peer-deps", "@somion/sos-bar@latest")
        if ($npm.ExitCode -ne 0) {
            Write-Failure "npm install failed (exit $($npm.ExitCode))." $npm.Output
            $results += [PSCustomObject]@{ Project = $project; Status = "Failed"; Detail = "npm exit $($npm.ExitCode)" }
            continue
        }

        if ($npm.Output) {
            Write-Host $npm.Output
        }

        $version = Get-InstalledSosBarVersion $projectPath
        if (-not $version) {
            Write-Failure "Could not resolve installed @somion/sos-bar version." "Checked node_modules and package-lock.json."
            $results += [PSCustomObject]@{ Project = $project; Status = "Failed"; Detail = "Version not found" }
            continue
        }

        $changes = git status --porcelain
        if ([string]::IsNullOrWhiteSpace($changes)) {
            Write-Host "Already up to date ($version). Nothing to commit."
            $results += [PSCustomObject]@{ Project = $project; Status = "Up to date"; Detail = $version }
            continue
        }

        $add = Invoke-External -Executable "git" -Command @("add", "package.json", "package-lock.json")
        if ($add.ExitCode -ne 0) {
            Write-Failure "git add failed (exit $($add.ExitCode))." $add.Output
            $results += [PSCustomObject]@{ Project = $project; Status = "Failed"; Detail = "git add failed" }
            continue
        }

        $commitMessage = "Update sos-bar package automatically to $version"
        $commit = Invoke-External -Executable "git" -Command @("commit", "-m", $commitMessage)
        if ($commit.ExitCode -ne 0) {
            Write-Failure "git commit failed (exit $($commit.ExitCode))." $commit.Output
            $results += [PSCustomObject]@{ Project = $project; Status = "Failed"; Detail = "git commit failed" }
            continue
        }

        Write-Host "Pulling latest from origin/dev before push ..."
        $pullBeforePush = Invoke-External -Executable "git" -Command @("pull", "--rebase", "origin", "dev")
        if ($pullBeforePush.ExitCode -ne 0) {
            Write-Failure "git pull --rebase failed (exit $($pullBeforePush.ExitCode))." $pullBeforePush.Output
            $results += [PSCustomObject]@{ Project = $project; Status = "Failed"; Detail = "git pull before push failed" }
            continue
        }

        if ($pullBeforePush.Output) {
            Write-Host $pullBeforePush.Output
        }

        Write-Host "Pushing to origin/dev ..."
        $push = Invoke-External -Executable "git" -Command @("push", "origin", "dev")
        if ($push.ExitCode -ne 0) {
            Write-Failure "git push failed (exit $($push.ExitCode))." $push.Output
            $results += [PSCustomObject]@{ Project = $project; Status = "Failed"; Detail = "git push failed" }
            continue
        }

        Write-Host "Done: $commitMessage" -ForegroundColor Green
        $results += [PSCustomObject]@{ Project = $project; Status = "Updated"; Detail = $version }
    } finally {
        Pop-Location
    }
}

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
$results | Format-Table -AutoSize

$failed = @($results | Where-Object { $_.Status -eq "Failed" })
if ($failed.Count -gt 0) {
    exit 1
}
