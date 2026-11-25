# 에셋 목록

Figma에서 `exportAsync`로 직접 내보낸 파일입니다 (SVG는 글자를 윤곽선으로 변환, PNG @1x·@2x, 배경 투명).
여러 레이어로 된 에셋은 원본 화면을 건드리지 않으려고 백업 페이지 102:2에 복사 프레임(부모 170:2)을 만들고, 그 복사본을 내보냈습니다. 복사 프레임은 사방에 24px 여백이 있어 그림자·글로우가 잘리지 않습니다.
확인 방법: 파일 45개 모두 `ls`로 확인하고 크기를 쟀습니다. PNG는 PIL로 열어 검증했고 모서리 알파 0(투명)을 확인했습니다. SVG는 `<svg … </svg>` 형식을 확인했습니다. 실패한 내보내기는 없습니다.

| 에셋 | 파일 (크기) | 원본 노드 | 내보낸 노드 | 쓰임 |
|---|---|---|---|---|
| reel-symbol-7 | `reel-symbol-7.svg` (985 B)<br>`reel-symbol-7.png` (8,678 B, 368x248 RGBA)<br>`reel-symbol-7@2x.png` (28,632 B, 736x496 RGBA) | 150:877 (135:1231 안 텍스트 '7', Do Hyeon 160 #C7362B + 그림자) | 170:3 | 릴 기호 7. 크기는 320×200 글상자 + 24 여백 |
| reel-symbol-cherry | `reel-symbol-cherry.svg` (2,078 B)<br>`reel-symbol-cherry.png` (16,287 B, 168x168 RGBA)<br>`reel-symbol-cherry@2x.png` (45,896 B, 335x335 RGBA) | 150:880 | 150:880 | 릴 기호 체리 167×167 |
| reel-symbol-bell | `reel-symbol-bell.svg` (1,720 B)<br>`reel-symbol-bell.png` (13,235 B, 168x168 RGBA)<br>`reel-symbol-bell@2x.png` (38,885 B, 335x335 RGBA) | 150:889 | 150:889 | 릴 기호 벨 167×167 |
| reel-bg | `reel-bg.svg` (1,221 B)<br>`reel-bg.png` (57,850 B, 368x328 RGBA)<br>`reel-bg@2x.png` (129,914 B, 736x656 RGBA) | 150:875 + 150:876 | 170:5 | 릴 바탕(금속 그라디언트 + 가운데 밝은 띠) 320×280 |
| coin-small-52 | `coin-small-52.svg` (2,049 B)<br>`coin-small-52.png` (9,981 B, 100x107 RGBA)<br>`coin-small-52@2x.png` (31,376 B, 200x214 RGBA) | 135:1705–1707 | 170:8 | 헤더 '가진 코인' 옆 입체 코인 52 |
| coin-large-86 | `coin-large-86.svg` (2,064 B)<br>`coin-large-86.png` (18,067 B, 134x145 RGBA)<br>`coin-large-86@2x.png` (56,881 B, 268x290 RGBA) | 135:1732–1734 | 170:12 | 09-0 제목 옆 입체 코인 86 (r6 이동 후) |
| lever-up | `lever-up.svg` (1,770 B)<br>`lever-up.png` (25,772 B, 200x292 RGBA)<br>`lever-up@2x.png` (75,733 B, 400x584 RGBA) | 150:859, 860, 895–900 | 170:16 | 레버 올림 상태(받침·막대·축·손잡이). 09-1·09-1b |
| lever-pulled | `lever-pulled.svg` (1,767 B)<br>`lever-pulled.png` (25,816 B, 200x292 RGBA)<br>`lever-pulled@2x.png` (75,899 B, 400x584 RGBA) | 143:10–17 (135:1394) | 170:25 | 레버 당긴 상태. 09-2·09-2a |
| slot-frame-with-bulbs | `slot-frame-with-bulbs.svg` (1,308 B)<br>`slot-frame-with-bulbs.png` (11,741 B, 1248x453 RGBA)<br>`slot-frame-with-bulbs@2x.png` (26,992 B, 2496x906 RGBA) | 150:861–874 | 170:34 | 슬롯 틀 + 릴 창 + 전구 11개 (릴·기호 없음) |
| cloud-small | `cloud-small.svg` (277 B)<br>`cloud-small.png` (2,242 B, 318x150 RGBA)<br>`cloud-small@2x.png` (4,535 B, 636x300 RGBA) | 135:1239–1241 | 170:49 | 작은 구름 (타원 3개) |
| cloud-large | `cloud-large.svg` (288 B)<br>`cloud-large.png` (4,065 B, 543x235 RGBA)<br>`cloud-large@2x.png` (8,950 B, 1086x470 RGBA) | 135:1236–1238 | 170:53 | 큰 구름 (타원 3개) |
| allin-button-full | `allin-button-full.svg` (5,852 B)<br>`allin-button-full.png` (54,619 B, 312x164 RGBA)<br>`allin-button-full@2x.png` (152,429 B, 624x328 RGBA) | 157:21 그룹 | 157:21 | 금색 [올인] 정지 상태 전체 (글자 '올인' 포함, 반짝 띠는 정지 위치 x+40) |
| allin-body-no-text | `allin-body-no-text.svg` (1,624 B)<br>`allin-body-no-text.png` (52,423 B, 332x184 RGBA)<br>`allin-body-no-text@2x.png` (150,690 B, 664x368 RGBA) | 157:2–7, 157:9 | 170:57 | [올인] 몸통만 (글로우·두께·테·반짝 띠·광택, 글자·코인·별 없음). 글자는 코드로 Do Hyeon 54 #3A1F00 |
| allin-coin | `allin-coin.svg` (282 B)<br>`allin-coin.png` (1,963 B, 84x88 RGBA)<br>`allin-coin@2x.png` (3,676 B, 168x176 RGBA) | 157:11–13 | 170:66 | [올인] 장식 코인 36 |
| allin-sparkle | `allin-sparkle.svg` (270 B)<br>`allin-sparkle.png` (695 B, 70x70 RGBA)<br>`allin-sparkle@2x.png` (1,199 B, 140x140 RGBA) | 157:17 | 170:70 | [올인] 반짝이 별(22px 원본). 2–4번은 같은 모양 20/18/16 |

참고: 반짝 띠·글로우·별의 움직임은 motion.md 3장대로 코드에서 만드세요. PNG에는 정지 상태만 들어 있습니다. 릴이 도는 모습은 에셋이 없고 코드로 만듭니다.
참고: 처음에 Figma MCP `download_assets`로 받은 파일은 캔버스 배경(#F5F5F5)이 깔려 있어 쓰지 않았습니다(`final/r6/opaque_exports/`에 보관).
