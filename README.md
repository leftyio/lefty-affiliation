# lefty-affiliation

## Usage

### Installation

Copy/Paste this at the end of you head tag

```html
(function(t,e,i,n){t._lefty=t._lefty||[];function s(){_lefty.push(arguments)}var
c=e.createElement("script");c.setAttribute("src","https://cdn.jsdelivr.net/gh/leftyio/lefty-affiliation@"+i+"/dist/index.min.js");c.setAttribute("async","");e.head.appendChild(c)})(window,document,"0");
```

Then init lefty pixel

```js
lefty("init", "<PIXEL_ID>", {
  debug: true, // must be false in production
});
```

### Trigger conversion

Starts building the order

```js
var product = Lefty.createProduct(PRODUCT_ID, name);

var productItem = Lefty.createProductItem(
  ITEM_ID,
  product,
  20, // total amount
  2 // quantitiy
);

var order = Lefty.createOrder(
  ORDER_ID,
  [
    product,
    // Add more product item
  ],
  "USD"
);

lefty("conversion", order);
```

### Shopify Web Pixels API

https://shopify.dev/docs/api/web-pixels-api

For Shopify Web Pixel API, installation is different. Initialize your pixel with the following script.

```js
window._lefty = window._lefty || [];
function lefty() {
  _lefty.push(arguments);
}

var script = document.createElement("script");
script.setAttribute(
  "src",
  "https://cdn.jsdelivr.net/gh/leftyio/lefty-affiliation@0/dist/index.min.js"
);
script.setAttribute("async", "");
document.head.appendChild(script);
```

Then subscribe to shopify events you want and trigger lefty conversion.

```js
analytics.subscribe("checkout_completed", (event) => {
  let checkout = event.data.checkout;

  // build lefty order using shopify checkout data

  lefty("conversion", order);
});
```
