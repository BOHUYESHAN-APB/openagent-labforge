# OpenAgent Labforge

> [!NOTE]
> **파생 프로젝트 안내**
>
> OpenAgent Labforge는 `code-yeongyu/oh-my-openagent`
> (구 `oh-my-opencode`)의 파생 버전입니다.
> 이 포크는 상위 프로젝트의 라이선스 경계와 출처를 유지하면서,
> OpenCode 네이티브 위임, 연구 워크플로우, MCP 사용성, 로컬 우선 운영에
> 더 집중하도록 방향을 바꿨습니다.
>
> 라이선스와 출처는 `LICENSE.md`, `NOTICE`, `THIRD_PARTY_NOTICES.md`,
> `docs/licensing.md`를 참고하세요.
>
> **번역 동기화 안내**
>
> 이 한국어 README는 핵심 실무 정보 위주로 맞추고 있지만, 전체 동기화는
> 영문 `README.md`와 중국어 `README.zh-cn.md`가 더 빠를 수 있습니다.
> 차이가 보이면 영어판과 중국어판을 우선 기준으로 봐 주세요.

## 이 포크에서 지금 달라진 점

이 README는 상위 프로젝트의 분위기나 마케팅 문구보다,
**현재 이 프로젝트가 실제로 무엇을 할 수 있는지**를 보여주는 데 집중합니다.

### 1. Agent 역할 분리가 더 명확해졌습니다

- 오케스트레이터와 전문 agent의 경계를 다시 정리했습니다
- `task(subagent_type=...)`를 OpenCode에서 확인 가능한 child session의 정식 경로로 봅니다
- 핵심 역할 분리:
  - `librarian` -> 단일 라이브러리 / 프레임워크 / SDK 질문
  - `github-scout` -> 저장소 비교, 학습 우선순위, 유지보수 신호
  - `tech-scout` -> 생태계 / benchmark / 출시 흐름 분석
  - `article-writer` -> 공개용 기술 글쓰기
  - `scientific-writer` -> 연구 / 동료 검토 지향 글쓰기
- 백그라운드 child session의 fallback-chain 관리도 더 안정화했습니다

### 2. 검색 흐름을 “정밀도”와 “범위”로 분리했습니다

- `websearch` -> 더 정밀한 고품질 검색
- `open_websearch_mcp` -> 더 넓은 다중 엔진 검색
- `paper_search_mcp` -> 학술 검색
- `context7` -> 공식 문서 / 프레임워크 레퍼런스
- `grep_app` -> GitHub 코드 예시

검색/분석 모드의 주입 프롬프트도 더 가볍게 바꿨기 때문에,
이미 명시적으로 선택한 specialist agent를 다시 억지 라우팅하지 않습니다.

### 3. MCP 런타임 안정성을 높였습니다

- `bing_cn_mcp`는 `open_websearch_mcp`로 교체되었습니다
- `open_websearch_mcp`는 `environment`, stdio, prompt-probe 호환, 버전 고정,
  시작 타임아웃까지 조정했습니다
- `paper_search_mcp`는 이 Windows/OpenCode 환경에서 실제로 작동한 경로로 되돌렸습니다
- 정밀 검색 / 광범위 검색 / 학술 검색 역할 분리가 명확해졌습니다

### 4. Skill 발견 로직을 OpenCode 쪽에 더 맞췄습니다

- 프로젝트 로컬 skill은 git 루트 방향으로 탐색합니다
- `SKILL.md` 메타데이터 검증을 더 엄격하게 했습니다
- 설치 시 `openagent-labforge` skill 디렉터리를 자동 생성해 플러그인 인식 안정성을 높였습니다

### 5. 릴리스 / 설치 표면도 현재 fork 실태에 맞게 정리 중입니다

- 루트 README는 더 이상 상위 프로젝트의 홍보 문서를 그대로 복사하지 않습니다
- 설치기 문구, 패키지 메타데이터, schema 메타데이터도 현재 fork 기준으로 조정했습니다
- 현재 권장 경로는 **로컬 build + 로컬 install** 입니다

## 프로토콜 호환 원칙

이 포크에서 추가하는 코드는 가능한 한 upstream 플러그인의 원래 프로토콜 표면을
이어받습니다.

- config / injection 호환성을 우선 유지
- agent / MCP / command / skill 등록 표면은 upstream 흐름을 계승
- fork 고유 확장은 원래 계약을 깨기 전에 누적

목표는 불필요한 drift를 줄이고, 이후 upstream 동기화를 계속 가능하게 만드는 것입니다.

## 현재 모델 추천

현재 수동 모델 선택 기준의 추천 순서는 다음과 같습니다.

- 강력 추천:
  - GPT 계열
  - GLM 계열
  - Kimi 계열
- 추천:
  - Google / Gemini
- 현재 적응도도 좋은 편:
  - DeepSeek 계열
- 지원은 하지만 최근 로컬 검증이 완전히 끝나지 않음:
  - Claude 계열

Gemini 관련 주의:

- Gemini도 추천 대상이지만, 이 포크의 긴 프롬프트 구조에서는 프롬프트가
  너무 길어질 때 중국어/영어 혼합 사용자 시나리오에서 가끔 목표 언어가 아닌
  쪽으로 drift하는 현상이 있습니다.

## 컨텍스트 윈도우 권장

안정적인 결과를 위해 **400K를 넘는 컨텍스트를 안정적으로 제공하는 모델**을
우선 추천합니다.

실무 기준:

- 400K 초과 모델은 짧은 컨텍스트 모델보다 눈에 띄게 안정적입니다
- 실제 작업 컨텍스트는 500K~550K 정도로 유지하는 편이 좋습니다
- 광고된 최대 컨텍스트를 항상 끝까지 채우는 운영은 피하는 것이 좋습니다
- 장시간 자동 실행, 생물정보학 장기 세션, 깊은 엔지니어링 세션에서는
  **500K 초과**를 강하게 권장합니다
- **1M 이상**을 안정적으로 제공하는 모델이 가장 좋습니다

이유:

- 모델이 스스로 매우 큰 summary를 생성할 수 있습니다
- compaction 사이의 실제 작업 간격이 매우 짧아질 수 있습니다
- 같은 모델 이름이라도 provider마다 실제 컨텍스트 상한이 크게 다를 수 있습니다

즉 모델 이름만 보지 말고, provider별 실제 컨텍스트 한도를 확인하는 것이 안전합니다.

## 권장 companion plugins

OpenAgent Labforge는 다음 플러그인과 함께 쓰는 것을 강하게 권장합니다.

- `opencode-pty`
- `@tarquinen/opencode-dcp`

## 기여 관련 메모

- 다인 협업 Git merge는 상황에 따라 시간이 조금 더 걸릴 수 있습니다
- maintainer는 복잡한 multi-party Git conflict 처리에 아주 능숙한 편은 아닙니다
- 필요하면 AI 보조 review / merge 정리를 거친 뒤 병합할 수 있습니다

## 현재 agent 구성

### 핵심 오케스트레이터

- `sisyphus`
- `hephaestus`
- `prometheus`
- `atlas`
- `sisyphus-junior`

### 전문 agent

- `explore`
- `librarian`
- `github-scout`
- `tech-scout`
- `article-writer`
- `scientific-writer`
- 필요 시 bio / multimodal specialist

## 현재 설치 현실

현재 프로젝트는 다음 흐름에 최적화되어 있습니다.

1. 로컬 build
2. 로컬 tgz 생성
3. OpenCode 설정 디렉터리 안의 로컬 플러그인 교체

```bash
bun run build
bun pm pack
```

자세한 절차는 `docs/guide/installation.md`를 보세요.

## 문서 입구

- `docs/guide/installation.md` - 현재 설치 / 교체 흐름
- `docs/guide/overview.md` - 현재 제품 형태
- `docs/guide/orchestration.md` - 계획 / 실행 / 위임 구조
- `docs/reference/configuration.md` - 설정 레퍼런스
- `docs/reference/features.md` - 기능 정리
- `examples/README.md` - 설정 예시 / bundle 예시

## 현재 알려진 제한

- 아직은 로컬 우선이며, 공개 npm 릴리스 흐름은 완전히 정리되지 않았습니다
- 일부 하위 문서에는 아직 상위 프로젝트 용어가 남아 있습니다
- 브라우저 계열 MCP는 검색/문서/코드 계열 MCP보다 환경 민감도가 높습니다

## 출처

- Upstream: `https://github.com/code-yeongyu/oh-my-openagent`
- Current fork: `https://github.com/BOHUYESHAN-APB/openagent-labforge`

하위 문서와 실제 동작이 충돌하면, 이 README와
`docs/guide/installation.md`를 우선 기준으로 보세요.

## 다른 언어 버전

- [English](README.md)
- [简体中文](README.zh-cn.md)
- [日本語](README.ja.md)
- [한국어](README.ko.md)
- [Русский](README.ru.md)
