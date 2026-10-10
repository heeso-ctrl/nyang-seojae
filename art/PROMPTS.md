# 냥서재 그림 프롬프트 (GPT용)

순서: ① 스타일 기준 → ② 배경 → ③ 고양이 기본 → ④ 다른 자세 → ⑤ 옷. 한 대화창에서 진행.

## 지금 할 일: 새 대화방에서 나머지 배경을 기준 그림체로
1. 새 대화 + 기준 그림 첨부 + 그림체 고정 → OK
2. 테마마다 예전 배경 첨부 + 테마 한 장 (한 메시지에 한 장)
3. 덜 맞으면 덜 맞을 때. 오류·반복이 두 번 넘으면 새 대화에서 다시.

### 그림체 고정
```
I'm making background art for my personal reading app. The attached image is the STYLE REFERENCE. Every image I ask for in this chat must match its drawing style exactly:
- Clean, even warm-brown outlines on every object (slightly thinner on small or distant things).
- Flat cel colors with one soft shadow tone and a few simple highlights. No painterly brush strokes, no photographic lighting, no noise or grain.
- Simplified textures: a knit blanket is a few simple rows, a rug is plain stripes, wood is flat color with a few lines.
- Warm, cozy, gentle palette. Lamp light only as a small soft halo around the lamp.
- Portrait 2:3 (1024x1536). No cat, person or animal. No text, letters, logos or watermark.
Same room layout every time: window upper-left, a lamp on a small round side table lower-left, a tall bookshelf on the right with only a few decorations and mostly EMPTY shelves, a big round cushion/beanbag in the lower center-right with pillows and a blanket, a rug at the bottom. Keep the bottom 18% simple.
Reply only "OK" and wait.
```
### 테마 한 장
```
Redraw the attached room in the style of the reference image. Keep this room's theme, colors, window view and objects, but use the reference's layout and drawing style. Make one image only.
Theme: {THEME}
```
- **다락방**: attic at night: slanted roof window with a crescent moon, stars and rooftops; stained-glass table lamp; a globe and a world map on the wall; dark red cushion with a floral pillow and a red plaid blanket. Palette: warm brown, deep red, gold, navy.
- **숲속 산장**: wooden cabin in daylight: window with pine forest, a lake and mountains under a blue sky; cream cushion with a cream knitted pillow and a green plaid blanket; pine cones on the shelf. Palette: forest green, warm wood, cream, sky blue.
- **노을 바닷가**: sunset by the sea: open window with a balcony railing; calm sea, a small sailboat, a lighthouse and white houses on a cliff; potted lemon tree; cream cushion with a blue-and-white striped pillow and a blue knit blanket. Palette: peach, coral, sea blue, cream.
- **비 오는 저녁**: rainy evening: window with raindrops and a city street with lit windows and street lamps; an umbrella stand; cream cushion with a navy plaid blanket. Palette: blue-gray, warm brown, soft amber.
### 덜 맞을 때
```
Closer to the reference style, please: cleaner and more even outlines, flatter colors with only one shadow tone, simpler textures, no glow except a small halo around the lamp. Keep the same layout and theme. One image only.
```

## 요령
- 한 대화창 안에서 순서대로: ① 스타일 기준 → ② 배경들 → ③ 고양이 기본(읽는 중) → ④ 다른 자세 → ⑤ 옷.
- ③에서 마음에 드는 고양이가 나오면, 그 뒤로는 항상 그 이미지를 첨부해서 "this exact cat"으로 요청하세요. 첨부하지 않으면 매번 다른 고양이가 나옵니다.
- 자세나 크기가 조금씩 틀어지는 건 정상입니다. 작업대에서 위치·크기를 맞추면 됩니다. 얼굴 생김새가 달라졌으면 다시 생성하세요.
- 옷은 자유 조합 대신 "코디 세트" 단위로 만듭니다. 모자 4 × 옷 4를 자유롭게 섞으면 자세마다 16장이 필요해서 감당이 안 됩니다. 처음에는 "읽는 중" 자세에만 옷을 입히세요.
- 고양이가 흰색이라 배경을 흰색으로 하면 떼어내기 어렵습니다. 그래서 자홍색(#FF00FF) 배경으로 받고, 작업대에서 그 색을 지웁니다. GPT가 투명 배경 PNG를 바로 주면 그걸 써도 됩니다.
- 원래 앱에 있는 개구리 모자, 우주복, 큰 리본, 고양이 귀 후드, 동그란 안경 차림은 넣지 마세요. 그 앱의 모습을 따라 하게 됩니다.
- 파일 이름 예시: bg-moon.png, cat-reading-base.png, cat-reading-beret.png, cat-resting-base.png

## ① 스타일 기준 (대화 시작할 때 한 번)
```
You are making art assets for my personal reading-tracker app "Nyangseojae". Every image in this chat must share ONE consistent style and ONE consistent cat.

STYLE (one style for the cat AND the backgrounds — clean cel-style illustration that reads well on a color e-ink screen)
- Clean 2D cel-style illustration, like a cute picture book: clear dark-brown outlines (#3A332E) on everything, flat colors with at most one simple shadow tone, no painterly brushwork.
- Outlines: about 3px at 1024px for the cat, about 2px for furniture and objects, about 1.5px for small or distant things.
- No gradients, no glow or bloom, no light rays, no blur, no fine textures (no knit, wood-grain or fabric detail), no tiny patterns. The app runs on a 7-inch COLOR E-INK screen whose color resolution is low and whose colors look faded, so use medium-to-large shapes, clear contrast, and slightly brighter, more saturated colors than usual.
- Never put any text, letters, numbers, logos, signatures, watermarks, or app UI in the image.

THE CAT (keep identical in every image)
- A small, slim white kitten (not chubby), about 2.5 heads tall, slightly long body and legs.
- 3/4 view: face and body turned toward the viewer's LEFT, about 30 degrees from front. Both eyes visible; the far eye slightly smaller.
- Large rounded-triangle ears with pink insides. Three short light-gray tabby stripes on the forehead, a few faint gray stripes on the back and tail.
- Small solid black oval eyes with one tiny white highlight, a tiny pink nose, a small "ω"-shaped mouth, soft pink blush on the cheek, 2-3 short dark whiskers on each side.
- Long thin tail curling up behind on the right.
Reply "OK" and wait for my next request.
```

## ② 배경 (테마마다 한 장)
```
Using the agreed style, draw an EMPTY cozy reading-nook background. Portrait 2:3, 1024x1536.
Theme: {THEME}

Layout (follow exactly):
- A window in the upper-left showing the outdoor view.
- A tall bookshelf on the right side, from the top down to about 60% of the height.
- A small round side table on the lower-left with a desk lamp, a mug and 2-3 stacked books.
- A big soft cushion / beanbag in the lower center-right, with its seat facing the viewer.

Very important:
- NO cat, NO person, NO animal anywhere.
- Keep the cushion seat clearly empty. A cat will be placed later inside the box from 32% to 80% of the width and 42% to 84% of the height, so keep that area simple (cushion and blanket only).
- Keep the bottom 18% of the image calm and plain (floor, blanket edge) because an interface card will cover it.
- On the bookshelf put only a few decorations (small plants, a frame, a jar). Leave the shelf boards mostly EMPTY of books; the app will add books later.
- Keep the upper-left sky area fairly calm.
```

`{THEME}` 자리에 넣을 문장:

- **달빛 서재**: night reading room. Outside: deep navy sky, a crescent moon, a few stars, distant houses with warm lit windows. Inside: warm amber desk-lamp light, trailing pothos plants, lavender and cream cushion. Palette: navy, lavender, warm amber.
- **비 오는 창가**: rainy evening. Outside: a city street in the rain with soft blurred street lights and raindrops on the glass. Inside: warm lamp light, a plaid blanket on the cushion, an umbrella stand. Palette: blue-gray, warm brown, soft amber.
- **노을 바닷가**: sunset by the sea. Outside (through an open window with a balcony railing): a calm sea, a small sailboat, a lighthouse on a cliff with white houses. Inside: a potted lemon tree, a blue-and-white striped cushion. Palette: peach, coral, sea blue, cream.
- **숲속 오두막**: wooden cabin in daylight. Outside: pine forest, a lake and soft mountains. Inside: log walls, pine cones, a green plaid blanket, cream knitted pillow. Palette: forest green, warm wood, cream.
- **다락방**: attic study at night with a slanted roof window. Outside: starry sky, crescent moon, rooftops. Inside: a stained-glass style table lamp, a globe, a world map on the wall, a dark red armchair-cushion with a floral pillow. Palette: warm brown, deep red, gold, navy.
- **선화 (흑백 e잉크용)**: the same cozy reading room drawn as BLACK-AND-WHITE LINE ART ONLY: clean black lines on pure white, no color, no gray, no shading, like a coloring-book page. A window with a simple outdoor view, plants, lamp, cushion.

## ③ 고양이 기본 (읽는 중)
```
Using the agreed style and cat, draw ONLY the cat. Square 1024x1024.
Background: a perfectly flat, solid magenta color (#FF00FF) filling the whole image — no gradient, no floor, no shadow, no cushion, no other objects except the book.
Pose (READING): sitting on its bottom, 3/4 view facing left, holding an open hardcover book with both front paws in front of the chest, looking down at the book, tail curling up behind on the right.
Framing: the whole cat is visible, centered horizontally, the lowest point of the cat at about 92% of the image height, the cat about 70% of the image height.
```

## ④ 다른 자세 (③ 이미지 첨부)
```
Here is our cat (attached). Redraw the EXACT same cat — same size on the canvas, same position, same 3/4 angle facing left, same outline thickness, same colors, same solid magenta (#FF00FF) background — and change ONLY the pose:
{POSE}
Keep the lowest point of the cat at about 92% of the image height.
```

- **쉬는 중**: holding a warm mug with both front paws, eyes closed in a happy curved smile, the closed book resting on its lap.
- **자는 중**: curled up asleep in a round loaf, eyes closed, chin resting on the closed book, tail wrapped around the body. (No "z" letters or any text.)
- **대기**: sitting upright with both front paws together, looking at the viewer with a small smile, the closed book standing next to it.

## ⑤ 옷 (해당 자세 이미지 첨부)
```
Here is our cat (attached). Keep EVERYTHING identical — same pose, size, position on the canvas, angle, outline, colors and solid magenta (#FF00FF) background. Only add this outfit:
{ITEM}
The outfit must fit the 3/4 angle naturally and must not cover the eyes or the book.
```

- **베레모**: a small red felt beret, tilted toward the right ear.
- **귀 달린 털모자**: a soft blue knitted beanie with two little ear-shaped points, the cat ears hidden inside.
- **줄무늬 목도리**: a cozy coral-and-cream striped knitted scarf wrapped around the neck, one end hanging down the chest.
- **보라 스웨터**: a lavender knitted sweater with two cream stripes; the front paws come out of the sleeves.
- **꽃 화관**: a small crown of tiny white and pink flowers resting between the ears.
- **노란 우비**: a small yellow raincoat with the hood down and two round buttons.
- **작은 왕관**: a tiny golden crown sitting between the ears.

## ⑥ 배경을 고양이 그림체로 다시 그리기 (추천, 고양이 + 배경 하나 첨부)
```
I attached two images: (1) our cat, (2) one of our room backgrounds.
Redraw the BACKGROUND (image 2) in the SAME drawing style as the cat (image 1), keeping everything else:
- Keep the exact same layout, furniture, window view, colors and theme — same positions and sizes, portrait 2:3, 1024x1536.
- Change only the drawing style to match the cat: clear dark-brown outlines (#3A332E, about 2px; 1.5px for small or distant things), flat colors with at most one simple shadow tone, no painterly brushwork.
- Remove gradients, glow, light rays, blur and fine textures (knit, wood grain, fabric weave, rug fibers). Show lamp light only as a flat pale shape if needed.
- Make colors slightly brighter and more saturated than the original (it will be shown on a color e-ink screen where colors look faded). Avoid very dark areas; the night sky can stay navy but keep the room readable.
- Still NO cat, person or animal. Keep the cushion seat empty and the bookshelf boards mostly empty of books.
```

## ⑦ (반대 방향) 배경에 맞춰 고양이 다시 그리기 (고양이 + 배경 하나 첨부)
```
I attached two images: (1) our cat, (2) one of our room backgrounds.
Redraw ONLY the cat — same pose, same size and same position on the canvas, same perfectly flat solid magenta (#FF00FF) background — so that it looks like it was painted INTO that room:
- Use the same soft hand-painted look as the background. No thick dark outline; at most a thin warm-brown line where needed.
- Warm lamp light comes from the upper LEFT: the left side of the head and body is brighter warm cream, the right side, under the chin, under the arms and under the book get soft warm shadows.
- Fur is warm ivory, not pure white. Gray stripes stay soft.
- Keep the face exactly the same and just as cute: same eyes, tiny pink nose, small "ω" mouth, pink blush, forehead stripes, whiskers.
- Do not draw any floor, cushion, shadow or other object on the magenta background.
```
