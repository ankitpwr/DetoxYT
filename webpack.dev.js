import { merge } from "webpack-merge";
import common from "./webpack.common.js";

export default merge(common, {
  mode: "development",
  devtool: "cheap-module-source-map", // help to identify where original error comes from
});
