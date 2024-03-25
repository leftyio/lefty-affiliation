const Lefty = {
  _base: "https://a.lefty.io",
  _http: function (method, path, data) {
    var xhr = new XMLHttpRequest();
    xhr.open(method, this._base + path, true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.withCredentials = true;

    var promise = new Promise(function (resolve, reject) {
      xhr.onreadystatechange = function () {
        if (this.readyState === 4)
          if (this.status === 200) {
            resolve(xhr.responseText);
          } else {
            reject(new Error(xhr.statusText));
          }
      };
    });

    if (data) {
      xhr.send(JSON.stringify(data));
    } else {
      xhr.send();
    }

    return promise;
  },
  _computeTotalAmount: function (items) {
    return items
      .map(function (item) {
        return item.totalAmount;
      })
      .reduce(function (a, b) {
        return a + b;
      }, 0);
  },
  createOrder: function (externalOrderId, items, amount) {
    return {
      externalOrderId: externalOrderId,
      items: items,
      amount: amount || this._computeTotalAmount(items),
    };
  },
  _createSingleProductOrder: function (externalOrderId, productItem) {
    return this.createOrder(
      externalOrderId,
      [productItem],
      productItem.totalAmount
    );
  },
  createProduct: function (externalProductId, name) {
    return {
      externalProductId: externalProductId,
      name: name,
    };
  },
  createProductItem: function (
    externalOrderItemId,
    product,
    totalAmount,
    quantity
  ) {
    return {
      externalOrderItemId: externalOrderItemId,
      product: product,
      totalAmount: totalAmount,
      quantity: quantity,
    };
  },
  check: function (referer) {
    referer = referer || window.location.hostname;
    return this._http("POST", "/check?ref=" + referer);
  },
  conversion: function (data, options) {
    options = options || {};

    data.pixelId = data.pixelId || options.pixelId;
    data.currencyCode = data.currencyCode || options.currencyCode;
    data.referringDomain = options.referer || window.location.hostname;

    var path = "/track/conversion";

    if (options.debug) {
      return this._http("POST", path, data);
    }

    return this.check(options.referer).then(
      function (checkResponse) {
        checkResponse = JSON.parse(checkResponse);
        if (checkResponse.matchable === true) {
          return this._http("POST", path, data);
        }
      }.bind(this)
    );
  },
  conversionSingleProduct: function (externalOrderId, productItem, options) {
    return this.conversion(
      this._createSingleProductOrder(externalOrderId, productItem),
      options
    );
  },
  pixel: function (data, options) {
    options = options || {};

    var items = data.items || [];
    var orderId = data.externalOrderId;
    var amount = data.amount;

    var pixelId = data.pixelId || options.pixelId;
    var currency = data.currencyCode || options.currencyCode;
    var referer = options.referer || window.location.hostname;

    var url = this._base + "/track?type=conversion";
    url += "&orderId=" + orderId;
    url += "&ref=" + referer;

    if (amount) {
      url += "&amount=" + amount;
    }

    if (currency) {
      url += "&currency=" + currency;
    }

    if (pixelId) {
      url += "&pixelId=" + pixelId;
    }

    if (items.length !== 0) {
      var pIds = items
        .map(function (item) {
          return "pId=" + item.product.externalProductId;
        })
        .join("&");

      var pNames = items
        .map(function (item) {
          return "pName=" + encodeURIComponent(item.product.name);
        })
        .join("&");

      var itemQty = items
        .map(function (item) {
          return "itemQty=" + item.quantity;
        })
        .join("&");

      var itemAmount = items
        .map(function (item) {
          return "itemAmount=" + item.totalAmount;
        })
        .join("&");

      var itemIds = items
        .map(function (item) {
          return "itemId=" + item.externalOrderItemId;
        })
        .join("&");

      url += "&" + pIds;
      url += "&" + pNames;
      url += "&" + itemQty;
      url += "&" + itemAmount;

      if (itemIds) {
        url += "&" + itemIds;
      }
    }

    var img = new Image();
    img.src = url;
  },
  pixelSingleProduct: function (externalOrderId, productItem, options) {
    return this.pixel(
      this._createSingleProductOrder(externalOrderId, productItem),
      options
    );
  },
};

export function lefty() {
  const args = arguments;
  var ref = args.shift();
  window.Lefty[ref](...args);
}

const actions = window._lefty || [];
actions.forEach(function (args) {
  lefty(...args);
});
