![](https://s3-ap-northeast-1.amazonaws.com/groupc-public/poputelogo.png)

## 概要

- 画像をAmazonS3へアップロードし、Rekognitionにて解析を行い、結果を画面に表示する


### API

- Amazon S3 : 画像アップロード
- Amazon Rekognition : 画像解析

### 画面イベント制御 / データバインド

- Vue.js

## s3_website

s3_websiteを使ってS3へhtmlをアップロードする。

https://github.com/laurilehmijoki/s3_website

#### 設定

```bash
bundle exec s3_website cfg create
aws s3 ls --profile group-c
bundle exec s3_website cfg apply
```

#### S3へのアップロード

```bash
bundle exec s3_website push
```
