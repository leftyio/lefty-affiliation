let PIXEL_ID;

const _base = "https://a.lefty.io";

function _http(method, path, data) {
  var xhr = new XMLHttpRequest();
  xhr.open(method, _base + path, true);
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
}

function _computeTotalAmount(items) {
  return items
    .map(function (item) {
      return item.totalAmount;
    })
    .reduce(function (a, b) {
      return a + b;
    }, 0);
}
export function createOrder(externalOrderId, items, amount) {
  return {
    externalOrderId: externalOrderId,
    items: items,
    amount: amount || _computeTotalAmount(items),
  };
}

function _createSingleProductOrder(externalOrderId, productItem) {
  return createOrder(externalOrderId, [productItem], productItem.totalAmount);
}

export function createProduct(externalProductId, name) {
  return {
    externalProductId: externalProductId,
    name: name,
  };
}

export function createProductItem(
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
}

export function check(referer) {
  referer = referer || window.location.hostname;
  return _http("POST", "/check?ref=" + referer);
}

export function conversion(data, options) {
  options = options || {};

  data.pixelId = data.pixelId || PIXEL_ID;
  data.currencyCode = data.currencyCode || options.currencyCode;
  data.referringDomain = options.referer || window.location.hostname;

  var path = "/track/conversion";

  if (options.debug) {
    return _http("POST", path, data);
  }

  return check(options.referer).then(
    function (checkResponse) {
      checkResponse = JSON.parse(checkResponse);
      if (checkResponse.matchable === true) {
        return _http("POST", path, data);
      }
    }.bind(this)
  );
}

export function conversionSingleProduct(externalOrderId, productItem, options) {
  return conversion(
    _createSingleProductOrder(externalOrderId, productItem),
    options
  );
}

export function pixel(data, options) {
  options = options || {};

  var items = data.items || [];
  var orderId = data.externalOrderId;
  var amount = data.amount;

  var pixelId = data.pixelId || PIXEL_ID;
  var currency = data.currencyCode || options.currencyCode;
  var referer = options.referer || window.location.hostname;

  var url = _base + "/track?type=conversion";
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
}

export function pixelSingleProduct(externalOrderId, productItem, options) {
  return pixel(
    _createSingleProductOrder(externalOrderId, productItem),
    options
  );
}

function init(pixelId) {
  PIXEL_ID = pixelId;

  const actions = window._lefty || [];

  while (actions.length) {
    const action = actions.shift();
    _lefty(...action);
  }
}

function _lefty() {
  const args = [...arguments];
  var ref = args.shift();

  switch (ref) {
    case "check":
      return check(...args);
    case "pixel":
      return pixel(...args);
    case "conversion":
      return conversion(...args);
    case "init":
      return init(...args);
  }
}

window.lefty = _lefty;
