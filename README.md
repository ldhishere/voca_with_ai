
# AI Vocabulary Master 🚀

Gemini API를 활용한 보안 중심 스마트 단어장입니다.

## 🔐 보안 및 배포 가이드

### 1. 로컬에서 개발할 때 (내 컴퓨터)
프로젝트 루트 폴더에 `.env` 파일을 만들고 아래 내용을 적으세요. (이 파일은 `.gitignore`에 의해 보호됩니다.)
```env
API_KEY=your_actual_gemini_api_key_here
```

### 2. 깃허브 배포 시 (GitHub Secrets 설정 필수)
코드를 Sync 한 후, 웹사이트에서 AI 기능이 작동하려면 다음 설정을 반드시 해야 합니다.
1. 깃허브 저장소 페이지에서 **Settings** 탭으로 이동합니다.
2. 좌측 메뉴에서 **Secrets and variables > Actions**를 클릭합니다.
3. **New repository secret** 버튼을 클릭합니다.
4. **Name**에 `GEMINI_API_KEY` 라고 입력합니다. (대문자 필수)
5. **Secret**에 본인의 실제 Gemini API 키를 붙여넣고 저장합니다.

이제 **Actions** 탭에서 배포가 다시 진행되면, 보안이 적용된 상태로 서비스가 시작됩니다.

## 👥 공동 사용 및 데이터 저장 방식
*   **기능 공유**: 배포된 URL로 접속하는 모든 사용자는 배포자가 설정한 API 키를 통해 AI 기능을 사용할 수 있습니다.
*   **개별 데이터**: 모든 단어 데이터는 사용자의 브라우저(`localStorage`)에 저장됩니다. **사용자 간에 단어 리스트는 공유되지 않으며**, 각 접속자는 자신만의 독립된 단어장을 관리하게 됩니다.
*   **보안 권장**: API 키 남용을 방지하기 위해 [Google Cloud Console](https://console.cloud.google.com/)에서 해당 API 키의 **사용량 제한(Quota)** 설정을 권장합니다.

## ✨ 주요 기능
- **AI 일괄 생성**: 100단어 즉시 로드
- **가리기 모드**: 학습 최적화 UX
- **실시간 검색**: 구글 검색 기반 예문 생성
- **즐겨찾기 및 CSV 지원**
