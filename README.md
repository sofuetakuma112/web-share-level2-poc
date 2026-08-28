# Web Share Level 2 PoC

`navigator.share({ files })`を使ったファイル共有を確認するためのPoCです。

## 公開ページ

https://sofuetakuma112.github.io/web-share-level2-poc/

## 確認手順

1. 「サンプル画像を作成」または「ファイルを選択」を押す
2. 選択したファイルが共有可能と判定されることを確認する
3. 「ファイルを共有」を押す
4. OSの共有シートが表示されることを確認する

## 判定内容

- HTTPSで動作しているか
- `navigator.share`が存在するか
- `navigator.canShare`が存在するか
- `navigator.canShare({ files })`が`true`を返すか

Web Share APIは、ブラウザだけでなくOSやファイル形式によっても利用可否が異なります。

## 参考資料

- [Web Share API](https://w3c.github.io/web-share/)
- [Navigator: canShare() method](https://developer.mozilla.org/docs/Web/API/Navigator/canShare)
