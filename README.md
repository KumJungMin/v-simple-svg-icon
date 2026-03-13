# v-simple-svg-icon

터보레포 기반 모노레포 구조입니다.

## 구조

```text
.
├── app/                 # 아이콘 패키지 사용 샘플 앱
│   ├── src/
│   │   ├── App.vue      # 컴포넌트 방식 + 캔버스 방식 예시
│   │   └── components/
│   └── public/icons/    # 샘플 SVG 아이콘
└── packages/
   └── icon/            # 핵심 아이콘 로직(GenIcon, store 등)
```

## 실행

```bash
pnpm install
pnpm dev
```

## 스크립트

- `pnpm dev`: 모든 워크스페이스의 `dev` 실행
- `pnpm build`: 모든 워크스페이스 빌드
- `pnpm typecheck`: 모든 워크스페이스 타입체크
