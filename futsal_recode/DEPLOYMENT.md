# GitHub + Vercel 배포 메모

## 목표

Mad FC 기록 페이지를 GitHub에 올리고, Vercel 자동 배포로 외부 접속 URL을 만든다.

## 현재 프로젝트 위치

`C:\Users\김장엽\Desktop\Yeop\VS Code\my-app`

## 배포 흐름

1. GitHub에서 새 저장소를 만든다.
2. 이 프로젝트 폴더를 Git 저장소로 초기화한다.
3. GitHub 저장소에 코드를 push한다.
4. Vercel에서 GitHub 저장소를 Import한다.
5. Vercel이 자동으로 React 프로젝트를 감지해 빌드하고 URL을 만든다.
6. 이후 코드를 수정해서 GitHub에 push하면 Vercel이 자동으로 다시 배포한다.

## Vercel 권장 설정

- Framework Preset: Create React App
- Build Command: `npm run build`
- Output Directory: `build`
- Install Command: `npm install`

## 참고

현재 이 PC 터미널에서는 `git`과 `vercel` 명령어가 설치되어 있지 않아, 명령어로 바로 GitHub push와 Vercel 배포를 실행할 수는 없다.
