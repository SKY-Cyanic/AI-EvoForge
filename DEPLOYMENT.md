# 🚀 EvoForge 배포 가이드

## GitHub Pages 자동 배포

이 프로젝트는 GitHub Pages에 자동으로 배포되도록 설정되어 있습니다.

### 배포 과정

1. **코드 푸시**: `main` 브랜치에 코드를 푸시하면 자동으로 배포 프로세스가 시작됩니다.

2. **GitHub Actions**: `.github/workflows/deploy.yml` 파일이 자동 배포를 처리합니다.

3. **GitHub Pages 활성화**: 
   - Repository Settings → Pages
   - Source: "Deploy from a branch" 선택
   - Branch: `gh-pages` 선택
   - 또는 GitHub Actions를 통한 자동 배포 선택

### 배포 URL

배포 완료 후 다음 URL에서 게임에 접근할 수 있습니다:
```
https://[your-username].github.io/[repository-name]/
```

### 로컬 개발 서버

로컬에서 테스트하려면 간단한 HTTP 서버를 실행하세요:

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (http-server 설치 필요)
npx http-server

# VS Code Live Server 확장 사용
```

그 후 `http://localhost:8000`에서 게임을 테스트할 수 있습니다.

### 커스텀 도메인 (선택사항)

1. `CNAME` 파일을 루트 디렉토리에 생성
2. 원하는 도메인을 파일에 입력
3. DNS 설정에서 CNAME 레코드를 GitHub Pages로 연결

### 배포 확인

배포가 성공적으로 완료되었는지 확인하는 방법:

1. **GitHub Actions 탭**: 워크플로우 실행 상태 확인
2. **Pages 설정**: Settings → Pages에서 배포 상태 확인
3. **브라우저 테스트**: 배포 URL에서 게임이 정상 작동하는지 확인

### 문제 해결

#### 배포 실패 시
- GitHub Actions 로그 확인
- 파일 경로와 권한 확인
- Repository Settings에서 GitHub Pages 설정 확인

#### 게임이 로드되지 않을 시
- 브라우저 개발자 도구에서 콘솔 에러 확인
- 네트워크 탭에서 파일 로딩 실패 확인
- CORS 정책 관련 문제 확인

#### 성능 문제 시
- 브라우저 호환성 확인 (모던 브라우저 권장)
- 하드웨어 가속 활성화 확인
- 개체 수 제한 설정 조정

### 업데이트 배포

새로운 기능이나 버그 수정을 배포하려면:

1. 코드 수정
2. 커밋 및 푸시
3. 자동 배포 대기 (보통 1-5분)
4. 브라우저 캐시 새로고침 (Ctrl+F5)

### 브라우저 호환성

지원되는 브라우저:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

모바일 브라우저:
- Chrome Mobile 90+
- Safari Mobile 14+
- Samsung Internet 14+

### PWA 기능

이 게임은 Progressive Web App으로 구현되어 있어:
- 오프라인 캐싱 지원
- 모바일 홈 화면에 추가 가능
- 앱과 같은 전체화면 경험

### 성능 최적화

배포된 게임의 성능을 최적화하려면:

1. **CDN 사용**: 정적 자산을 CDN에 배치
2. **압축**: Gzip 압축 활성화
3. **캐싱**: 적절한 캐시 헤더 설정
4. **이미지 최적화**: WebP 형식 사용 고려

### 모니터링

배포된 게임을 모니터링하는 방법:

1. **GitHub Insights**: Repository 트래픽 확인
2. **Google Analytics**: 사용자 행동 분석 (선택사항)
3. **브라우저 에러 리포팅**: Sentry 등 서비스 연동 (선택사항)

---

배포에 문제가 있거나 추가 도움이 필요하면 GitHub Issues를 통해 문의해주세요.