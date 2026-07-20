# LiT Camp 2026 Showcase

Gemini Canvas で作った各メンバーのサイトを集約する静的サイトです。

## 使い方

1. まずはブラウザで `index.html` を開く
2. 本番運用するなら、Googleスプレッドシートに以下の列を作る

```csv
name,color,url,comment
すいば,red,https://example.com/suiba,赤Tシャツ
聖成,blue,https://example.com/seisei,青Tシャツ
モナ,orange,https://example.com/mona,オレンジTシャツ
ゆうり,blue,https://example.com/yuuri,青Tシャツ
あずき,pink,https://example.com/azuki,ピンクTシャツ
```

3. シートを「ウェブに公開」して CSV URL を取得する
4. [app.js](/Users/honoka/Desktop/LiT/Camp/26Summer_東大/WEB/app.js) の `SHEET_CSV_URL` にその URL を貼る
5. もしくは `?sheet=CSV_URL` をURL末尾につけても切り替え可能

## メモ

- 認証は持たせていません
- サイトは読み取り専用で、更新はスプレッドシート側で行います
- `SHEET_CSV_URL` が空ならサンプルデータを表示します
- 外部CSVを使う場合は `python3 -m http.server` などで配信して開く方が安定します
- CSVのたたき台は [members.template.csv](/Users/honoka/Desktop/LiT/Camp/26Summer_東大/WEB/members.template.csv) を使えます
