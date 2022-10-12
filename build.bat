@echo off
set UserName=CoiaPrant
set Name=PortForwardGo
set Version=1.0.3

if exist dist (
    del /F /S /Q dist > NUL
    rd /S /Q dist > NUL
)

if not exist .git (
    git init
    git config --global core.autocrlf true
    git config --global credential.helper store
    git remote add origin https://gitlab.com/%UserName%/%Name%.git
)

go mod tidy
git add .gitignore .goreleaser.yml Dockerfile build.bat examples resources systemd scripts README.md LICENSE
git commit -m "v%Version%"
git push -u origin master
git tag -a v%Version% -m "release v%Version%"
git push origin v%Version%
goreleaser --skip-validate
pause