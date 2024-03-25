# lefty-affiliation

## Usage

```js
window._lefty = window._lefty || [];
function lefty() {
  _lefty.push(arguments);
}

const script = document.createElement("script");
script.setAttribute(
  "src",
  "https://cdn.jsdelivr.net/gh/leftyio/lefty-affiliation@0/dist/index.min.js"
);
script.setAttribute("async", "");
document.head.appendChild(script);

lefty("init", "<PIXEL_ID>");
```
