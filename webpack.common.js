import path from "path";
import { fileURLToPath } from "url";
import CopyPlugin from "copy-webpack-plugin";
import HtmlPlugin from "html-webpack-plugin";
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import Dotenv from "dotenv-webpack";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//Webpack, by default, only understands JavaScript and TypeScript files that are imported into your entry point (popup.tsx).
export default {
  //tells webpack which file(s) to start bundling from.
  entry: {
    popup: path.resolve("src/popup/popup.tsx"),
    options: path.resolve("src/options/options.tsx"),
    background: path.resolve("src/background/background.ts"),
    contentScript: path.resolve("src/contentScript/contentScript.tsx"),
  },
  target: "webworker",

  module: {
    // process other types of files other than js files
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        exclude: /contentScript\.css$/i,
        use: ["style-loader", "css-loader", "postcss-loader"],
      },
      {
        test: /contentScript\.css$/i,
        use: ["to-string-loader", "css-loader", "postcss-loader"],
      },
      {
        type: "asset/resource",
        test: /\.(jpg|jpeg|png|woff|woff2|eot|ttf|svg)$/,
      },
    ],
  },

  plugins: [
    new Dotenv(),
    new CleanWebpackPlugin({
      cleanStaleWebpackAssets: false,
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve("src/static"),
          to: path.resolve("dist"),
        },
        {
          from: path.resolve(
            __dirname,
            "node_modules/@xenova/transformers/dist"
          ),
          to: "lib/transformers",
        },
        // onnxruntime wasm(s)
        {
          from: path.resolve(__dirname, "node_modules/onnxruntime-web/dist"),
          to: "lib/onnxruntime",
        },
        // if you later add models to src/models, copy them too:
        {
          from: path.resolve(__dirname, "src/models"),
          to: "models",
        },
      ],
    }),

    ...getHtmlPlugins(["popup", "options"]),
  ],

  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    //This tells webpack where t o put the bundled files and what to name them.
    filename: "[name].js",
    path: path.resolve("dist"),
  },

  // optimization: {
  //   //allow chunks to share modules eg. react being imported in both popup.tsx and option.tsx

  //   splitChunks: {
  //     chunks: (chunk) => {
  //       return chunk.name !== "contentScript" && chunk.name !== "background";
  //     },
  //   },
  // },
};

function getHtmlPlugins(chunks) {
  return chunks.map(
    (chunk) =>
      new HtmlPlugin({
        // it create HTML shell and injects the JavaScript that was generated from your React code into it.
        title: "React Extension",
        filename: `${chunk}.html`,
        chunks: [chunk],
      })
  );
}
