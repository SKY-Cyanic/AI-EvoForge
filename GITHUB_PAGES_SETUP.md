# 🚀 GitHub Pages 설정 가이드

## EvoForge를 GitHub Pages로 배포하기

### 1단계: GitHub Pages 활성화

1. **GitHub 저장소로 이동**
   - https://github.com/SKY-Cyanic/Player-vs-AI--- 접속

2. **Settings 탭 클릭**
   - 저장소 상단의 "Settings" 탭을 클릭하세요

3. **Pages 메뉴 찾기**
   - 왼쪽 사이드바에서 "Pages" 메뉴를 클릭하세요

4. **배포 소스 설정**
   - Source 섹션에서 "Deploy from a branch" 선택
   - Branch: `main` 선택
   - Folder: `/ (root)` 선택
   - **Save** 버튼 클릭

### 2단계: 배포 확인

배포 설정 후 몇 분 정도 기다리면 GitHub Pages가 활성화됩니다.

**게임 URL**: https://sky-cyanic.github.io/Player-vs-AI---/

### 3단계: 자동 배포 확인

1. **Actions 탭 확인**
   - GitHub 저장소의 "Actions" 탭에서 배포 진행 상황을 확인할 수 있습니다
   - 녹색 체크마크가 나타나면 배포 성공

2. **배포 완료 알림**
   - GitHub에서 배포 완료 시 이메일 알림을 받게 됩니다

### 4단계: 게임 테스트

배포가 완료되면 다음 URL에서 게임을 플레이할 수 있습니다:

🎮 **게임 링크**: https://sky-cyanic.github.io/Player-vs-AI---/

### 추가 설정 (선택사항)

#### 커스텀 도메인 설정
1. 원하는 도메인이 있다면 Pages 설정에서 "Custom domain" 입력
2. DNS 설정에서 CNAME 레코드를 `sky-cyanic.github.io`로 연결

#### HTTPS 강제 활성화
- Pages 설정에서 "Enforce HTTPS" 체크박스 활성화 (권장)

### 문제 해결

#### 배포가 안 되는 경우:
1. Repository가 Public인지 확인
2. main 브랜치에 index.html 파일이 있는지 확인
3. Actions 탭에서 에러 메시지 확인

#### 게임이 로드되지 않는 경우:
1. 브라우저 개발자 도구(F12)에서 콘솔 에러 확인
2. 모던 브라우저 사용 (Chrome 90+, Firefox 88+, Safari 14+)
3. 브라우저 캐시 새로고침 (Ctrl+F5 또는 Cmd+Shift+R)

### 업데이트 방법

게임을 수정하거나 업데이트하려면:

1. 코드 수정
2. Git으로 커밋 및 푸시:
   ```bash
   git add .
   git commit -m "게임 업데이트"
   git push origin main
   ```
3. 자동으로 GitHub Pages에 재배포됩니다 (1-5분 소요)

### 공유하기

게임이 성공적으로 배포되면 다음과 같이 공유할 수 있습니다:

- **링크 공유**: https://sky-cyanic.github.io/Player-vs-AI---/
- **QR 코드**: 모바일 사용자를 위한 QR 코드 생성
- **소셜 미디어**: Twitter, Facebook 등에 게임 링크 공유
- **임베드**: 다른 웹사이트에 iframe으로 임베드 가능

### 성능 최적화

더 나은 사용자 경험을 위해:

1. **CDN 사용**: jsDelivr 등을 통한 정적 자산 가속
2. **압축**: GitHub Pages는 자동으로 Gzip 압축 제공
3. **캐싱**: 브라우저 캐싱 최적화를 위한 헤더 설정
4. **PWA**: 이미 구현된 Progressive Web App 기능 활용

---

🎉 **축하합니다!** 이제 전 세계 누구나 여러분의 EvoForge 게임을 플레이할 수 있습니다!

문제가 있거나 도움이 필요하면 GitHub Issues를 통해 문의해주세요.