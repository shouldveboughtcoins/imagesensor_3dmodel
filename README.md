# Sensor Lab · 이미지 센서 3D 학습 뷰어

일반화한 BSI CMOS 이미지 센서를 회전·확대하고, 구조와 동작을 배우는 한국어 웹 앱입니다.

## 실행

Node.js 22.12 이상과 최신 Edge 또는 Chrome을 권장합니다.

```sh
npm ci
npm run dev
```

터미널에 표시된 로컬 주소를 엽니다. 배포용 정적 파일은 `npm run build`로 `dist/`에 생성합니다. `npm run preview`로 빌드 결과를 확인합니다.

## 기능

- 센서 패키지, 8×8 베이어 픽셀 배열, 2×2 픽셀 단면 개념 모델
- 마우스 회전·확대·이동, 자동 회전 및 시점 초기화
- 분해 슬라이더, 부품 클릭·선택, 층별 표시 전환
- 빛 입사 → 전하 축적 → 신호 읽기 → 디지털 변환의 단계별 설명 및 애니메이션
- 빛 세기와 노출 시간을 조절하는 상대 전하량 실험
- 이해 확인 퀴즈, 현재 표시 모델의 GLB 다운로드
- 모바일 반응형 레이아웃, 선택적인 WebMCP 도구

## 교육 모델의 범위

특정 제품이나 공정을 재현한 설계도가 아닙니다. 렌즈, 컬러 필터, 실리콘/포토다이오드, 배선, 지지층을 이해하기 위해 크기와 층 간격을 과장했습니다. 포토다이오드 표시는 실리콘 내부 활성 영역의 위치를 설명하는 단순화입니다. 픽셀 단면은 2×2 픽셀의 층 구조 개념 표현이며 도핑 프로파일이나 트랜지스터 상세 단면을 구현하지 않습니다.

실험식은 `min(100, 빛 세기 × 노출 시간 / 20)`의 상대값으로, 양자 효율·암전류·노이즈·실제 포화 전자 수를 계산하지 않습니다. 전하 애니메이션도 이동과 읽기 과정을 단순화한 시각적 설명입니다. ADC는 개별 픽셀 내부 모델에 포함하지 않았으며 디지털 변환 이후 디모자이킹은 아직 구현하지 않았습니다.

## 모델 수정

`src/main.ts`의 `rebuild()`에서 Three.js 형상을 생성합니다. Blender 설치 없이 수정할 수 있으며, 뷰어에서 받은 GLB는 Blender로 가져올 수 있습니다. 분해 상태와 표시 중인 층이 다운로드 모델에 반영됩니다.

- `src/main.ts`: 학습 콘텐츠, 3D 모델, UI 상태와 상호작용
- `src/style.css`: 데스크톱·모바일 화면
- `tests/viewer.spec.mjs`: 핵심 사용자 흐름 검증

## 검증

미리보기 서버를 실행한 상태에서 `npx playwright test`를 실행합니다. 테스트는 설치된 Microsoft Edge를 사용합니다. 다른 운영체제에서는 `playwright.config.mjs`의 브라우저 채널을 조정할 수 있습니다.

## 참고 자료

- [Sony: Back-illuminated structure](https://www.sony-semicon.com/en/technology/is/back-illuminated.html)
- [Sony: Stacked structure](https://www.sony-semicon.com/en/technology/is/stacked.html)
- [Three.js 공식 문서](https://threejs.org/docs/)

## 다음 단계

FSI·BSI·적층형 비교, 4T 픽셀의 전하 이동 상세, 롤링·글로벌 셔터 비교, 색 복원·노이즈 실험으로 확장할 수 있습니다.
