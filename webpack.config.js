const path = require("path");
const BrowserSyncPlugin = require("browser-sync-webpack-plugin");

module.exports = {
  entry: "./src/index.ts",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"]
  },
  output: {
    filename: "index.js",
    library: "Timeline",
    libraryTarget: "umd",
    path: path.resolve(__dirname, "dist")
  },
  plugins: [
    new BrowserSyncPlugin({
      host: "localhost",
      port: 3000,
      server: { baseDir: ["./"] }
    })
  ]
};
