const path = require("path");

module.exports = {
  // どのソースからスタートするか
  entry: "./src/index.ts",

  output: {
    // 出力するファイル名
    filename: "bundle.js",

    // 出力するファイルをどこに出力するか（絶対パスで書く）
    path: path.resolve(__dirname, "dist"),
  },
  devtool: "source-map",
  target: "node",

  // ts-loaderの設定
  module: {
    rules: [
      {
        // どんなファイルに対して
        test: /\.ts$/,

        // 何をするのか
        use: "ts-loader",

        // node_modulesから持ってきたtsファイルはts-loaderの対象から省く
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    /**
     * import文で記載しているファイル名を拡張子をつけずに記載した場合、
     * extensions配列内に記載した拡張子がついた同名のファイルがあるか検索し、
     * あればそのファイルをimportする。
     *
     * 検索は配列の左から順番に行う。
     */
    extensions: [".ts", ".js"],
  },
};
