$ErrorActionPreference = 'Stop'

Write-Host "Building qpdf WASM from source..." -ForegroundColor Green

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

function Get-ToolPath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name
    )

    # Windows-safe: only accept real executables/wrappers, not extensionless scripts.
    $candidates = @("$Name.bat", "$Name.cmd", "$Name.exe")
    foreach ($candidate in $candidates) {
        $cmd = Get-Command $candidate -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($cmd -and $cmd.Source) {
            return $cmd.Source
        }
    }

    return $null
}

function Test-Command {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name
    )

    return $null -ne (Get-ToolPath -Name $Name)
}

function Invoke-Tool {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name,
        [Parameter()]
        [string[]]$Args = @()
    )

    $toolPath = Get-ToolPath -Name $Name
    if (-not $toolPath) {
        throw "Tool not found: $Name"
    }

    $escapedTool = '"' + $toolPath.Replace('"', '""') + '"'
    $escapedArgs = foreach ($arg in $Args) {
        if ($arg -match '[\s"]') {
            '"' + $arg.Replace('"', '""') + '"'
        }
        else {
            $arg
        }
    }

    $commandLine = ($escapedTool + ' ' + ($escapedArgs -join ' ')).Trim()
    & cmd /d /c $commandLine

    if ($LASTEXITCODE -ne 0) {
        throw "Command failed with exit code ${LASTEXITCODE}: $Name"
    }
}

function Run-Step {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Label,
        [Parameter(Mandatory = $true)]
        [scriptblock]$Action
    )

    Write-Host $Label -ForegroundColor Yellow
    & $Action
}

function Import-EmsdkEnvFromBat {
    param(
        [Parameter(Mandatory = $true)]
        [string]$BatPath
    )

    # Import environment variables from cmd into current PowerShell process.
    $envOutput = cmd /d /c "`"$BatPath`" >nul && set"
    foreach ($line in $envOutput) {
        if ($line -match '^(?<name>[^=]+)=(?<value>.*)$') {
            $name = $Matches.name
            $value = $Matches.value
            if (-not [string]::IsNullOrWhiteSpace($name) -and -not $name.StartsWith('=')) {
                Set-Item -Path "Env:$name" -Value $value
            }
        }
    }
}

function Get-EmccVersionLine {
    $output = & cmd /d /c "emcc --version"
    $exit = $LASTEXITCODE
    if ($exit -ne 0) {
        return $null
    }

    return ($output | Select-Object -First 1)
}

function Has-EmscriptenTools {
    return (Test-Command -Name 'emcc') -and (Test-Command -Name 'emcmake') -and (Test-Command -Name 'emmake')
}

function Try-InitializeEmscripten {
    if (Has-EmscriptenTools) {
        $version = Get-EmccVersionLine
        if ($version) {
            return $true
        }
    }

    $candidateRoots = @()
    if ($env:EMSDK) {
        $candidateRoots += $env:EMSDK
    }

    $candidateRoots += @(
        (Join-Path $env:USERPROFILE 'emsdk'),
        'C:\\emsdk',
        (Join-Path $scriptRoot '..\\..\\emsdk')
    )

    foreach ($root in ($candidateRoots | Where-Object { $_ } | Select-Object -Unique)) {
        $fullRoot = [System.IO.Path]::GetFullPath($root)
        if (-not (Test-Path -Path $fullRoot -PathType Container)) {
            continue
        }

        $ps1Path = Join-Path $fullRoot 'emsdk_env.ps1'
        $batPath = Join-Path $fullRoot 'emsdk_env.bat'

        if (Test-Path -Path $ps1Path -PathType Leaf) {
            Write-Host "Trying to activate Emscripten via $ps1Path" -ForegroundColor Yellow
            . $ps1Path | Out-Null
            if (Has-EmscriptenTools) {
                $version = Get-EmccVersionLine
                if ($version) {
                    return $true
                }
            }
        }

        if (Test-Path -Path $batPath -PathType Leaf) {
            Write-Host "Trying to activate Emscripten via $batPath" -ForegroundColor Yellow
            Import-EmsdkEnvFromBat -BatPath $batPath
            if (Has-EmscriptenTools) {
                $version = Get-EmccVersionLine
                if ($version) {
                    return $true
                }
            }
        }
    }

    return $false
}

if (-not (Try-InitializeEmscripten)) {
    Write-Host "Error: Emscripten not available in this terminal session." -ForegroundColor Red
    Write-Host "Run this in the SAME PowerShell, then retry (replace <path-to-emsdk>):" -ForegroundColor Yellow
    Write-Host '  . <path-to-emsdk>\\emsdk_env.ps1'
    if ($env:EMSDK) {
        $detectedEmsdkEnv = Join-Path ([System.IO.Path]::GetFullPath($env:EMSDK)) 'emsdk_env.ps1'
        Write-Host "  Detected EMSDK env var candidate: $detectedEmsdkEnv"
    }
    Write-Host '  emcc --version'
    exit 1
}

$qpdfSource = Join-Path $scriptRoot '..\\qpdf'
$qpdfSource = [System.IO.Path]::GetFullPath($qpdfSource)

if (-not (Test-Path -Path $qpdfSource -PathType Container)) {
    Write-Host "Error: Parent qpdf source not found at $qpdfSource" -ForegroundColor Red
    Write-Host "Expected directory structure:" 
    Write-Host "  C:\\path\\to\\qpdf\\          <- parent qpdf source"
    Write-Host "  C:\\path\\to\\qpdf-wasm\\     <- this project"
    exit 1
}

$emccVersion = Get-EmccVersionLine
if (-not $emccVersion) {
    Write-Host "Error: emcc is still unavailable after environment setup." -ForegroundColor Red
    exit 1
}

Write-Host "OK Emscripten found: $emccVersion" -ForegroundColor Green
Write-Host "OK Parent qpdf source found at: $qpdfSource" -ForegroundColor Green

$buildDir = Join-Path $scriptRoot 'cmake-build'
if (-not (Test-Path $buildDir)) {
    New-Item -ItemType Directory -Path $buildDir | Out-Null
}

Push-Location $buildDir

try {
    Run-Step -Label 'Running CMake configuration...' -Action {
        # On Windows, cmake cannot find emcc.bat by bare name during compiler detection.
        # Resolve the full paths here and pass them explicitly so cmake can locate them.
        $emccPath    = Get-ToolPath -Name 'emcc'
        $emppPath    = Get-ToolPath -Name 'em++'
        $earPath     = Get-ToolPath -Name 'emar'
        $eranlibPath = Get-ToolPath -Name 'emranlib'

        $cmakeArgs = @(
            'cmake',
            '-DCMAKE_TOOLCHAIN_FILE=../emscripten-toolchain.cmake',
            "-DCMAKE_C_COMPILER=$emccPath",
            "-DCMAKE_CXX_COMPILER=$emppPath",
            '-DCMAKE_BUILD_TYPE=Release',
            '..'
        )
        if ($earPath) {
            $cmakeArgs += "-DCMAKE_AR=$earPath"
        }
        if ($eranlibPath) {
            $cmakeArgs += "-DCMAKE_RANLIB=$eranlibPath"
        }

        Invoke-Tool -Name 'emcmake' -Args $cmakeArgs
    }

    $jobs = if ($env:NUMBER_OF_PROCESSORS) { [int]$env:NUMBER_OF_PROCESSORS } else { 4 }

    Run-Step -Label 'Compiling WASM (this may take a few minutes)...' -Action {
        Invoke-Tool -Name 'emmake' -Args @('make', "-j$jobs")
    }

    Run-Step -Label 'Installing artifacts...' -Action {
        Invoke-Tool -Name 'emmake' -Args @('make', 'install')
    }
}
finally {
    Pop-Location
}

$outputDir = Join-Path $scriptRoot '..\\build\\wasm'
$outputDir = [System.IO.Path]::GetFullPath($outputDir)
$wasmFile = Join-Path $outputDir 'qpdf.wasm'
$jsFile = Join-Path $outputDir 'qpdf.js'

if ((Test-Path $wasmFile) -and (Test-Path $jsFile)) {
    $wasmSizeMB = [Math]::Round((Get-Item $wasmFile).Length / 1MB, 2)
    Write-Host 'Build successful.' -ForegroundColor Green
    Write-Host "  qpdf.wasm: $wasmSizeMB MB" -ForegroundColor Green
    Write-Host "  Output: $outputDir" -ForegroundColor Green
}
else {
    Write-Host 'Error: Build artifacts not found' -ForegroundColor Red
    exit 1
}
