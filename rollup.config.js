// rollup.config.js
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { terser } from "rollup-plugin-terser";
import postcss from "rollup-plugin-postcss";
import url from "@rollup/plugin-url";

export default [
  // —— 1) ESM build ——
  {
    input: "src/index.js",
    output: {
      file: "dist/asteroid-day.esm.js",
      format: "esm",
      sourcemap: true,
    },
    plugins: [
      url({
        include: ["**/*.svg", "**/*.png", "**/*.jpg", "**/*.gif"],
        limit: 8192, // ← files ≤8 KB become data‐URI; larger ones get copied to /dist
        emitFiles: true, // ← copy files > limit into dist/
        fileName: "[name]-[hash][extname]",
        // you can tweak limit or include patterns to taste
      }),
      nodeResolve(), // so Rollup can resolve imports in node_modules if needed
      commonjs(), // converts any CommonJS imports to ESM (safe to include even if you don’t need it)
      postcss({
        inject: true,
        extensions: [".css"],
      }),
    ],
  },

  // —— 2) UMD build (minified) ——
  {
    input: "src/index.js",
    output: {
      file: "dist/asteroid-day.umd.js",
      format: "umd",
      name: "AsteroidDay", // This will create a global `window.MyWidget` in browsers
      sourcemap: false,
    },
    plugins: [
      url({
        include: ["**/*.svg", "**/*.png", "**/*.jpg", "**/*.gif"],
        limit: 8192,
        emitFiles: true,
        fileName: "[name]-[hash][extname]",
      }),
      nodeResolve(),
      commonjs(),
      postcss({
        inject: true,
        extensions: [".css"],
      }),
      terser(), // Minify the UMD bundle for production
    ],
  },
];
