# Web Share Level 2 PoC

`navigator.share({ title, text, files })`を使ったテキストとファイルの共有を確認するためのPoCです。

## 公開ページ

https://sofuetakuma112.github.io/web-share-level2-poc/

## 確認手順

1. 共有するタイトルまたは本文を入力する
2. 必要に応じて「サンプル画像を作成」または「ファイルを選択」を押す
3. 入力した内容が共有可能と判定されることを確認する
4. 「共有する」を押す
5. OSの共有シートが表示されることを確認する

## 判定内容

- HTTPSで動作しているか
- `navigator.share`が存在するか
- `navigator.canShare`が存在するか
- `navigator.canShare({ title, text, files })`が`true`を返すか

タイトル、本文、ファイルはそれぞれ任意で、テキストだけでも共有できます。Web Share APIは、ブラウザだけでなくOSやファイル形式、指定した内容の組み合わせによっても利用可否が異なります。

## 参考資料

- [Web Share API](https://w3c.github.io/web-share/)
- [Navigator: canShare() method](https://developer.mozilla.org/docs/Web/API/Navigator/canShare)
