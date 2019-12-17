const path = require("path");
const BrowserSyncPlugin = require("browser-sync-webpack-plugin");
const createVariants = require("parallel-webpack").createVariants;

const defaultConfig = {
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
  plugins: [
    new BrowserSyncPlugin({
      host: "localhost",
      port: 3000,
      server: { baseDir: ["./"] }
    })
  ]
};

const buildOutput = options => {
  return {
    ...defaultConfig,
    output: {
      filename: "index." + options.target + ".js",
      library: "Timeline",
      libraryTarget: options.target,
      path: path.resolve(__dirname, "dist")
    }
  };
};

const exportFunction = () => {
  if (process.env.NODE_ENV === "development") {
    return {
      ...defaultConfig,
      output: {
        filename: "index.js",
        library: "Timeline",
        libraryTarget: "var",
        path: path.resolve(__dirname, "dist")
      }
    };
  } else {
    return createVariants(
      {
        target: ["var", "umd"]
      },
      buildOutput
    );
  }
};

// At the end of the file:
module.exports = exportFunction();
// module.exports = [
//   moduleFormat({ format: "umd" }),
//   moduleFormat({ format: "var", hash: "min" })
// ];
