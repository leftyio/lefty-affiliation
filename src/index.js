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

/**
 * Creates an order object with the given external order ID, items, and amount.
 *
 * @param {string} externalOrderId - The external order ID.
 * @param {Array} items - The items included in the order.
 * @param {string} [currencyCode] - The currency code for the order amount.
 * @param {number} [amount] - The total amount of the order. If not provided, it will be computed based on the items.
 * @returns {Object} - The created order object.
 */
export function createOrder(externalOrderId, items, currencyCode, amount) {
  return {
    externalOrderId: externalOrderId,
    items: items,
    currencyCode: currencyCode,
    amount: amount || _computeTotalAmount(items),
  };
}

/**
 * Creates a new product object with the given external product ID and name.
 *
 * @param {string} externalProductId - The external product ID for the new product.
 * @param {string} name - The name of the new product.
 * @returns {object} - The newly created product object.
 */
export function createProduct(externalProductId, name) {
  return {
    externalProductId: externalProductId,
    name: name,
  };
}

/**
 * Creates a product item object.
 *
 * @param {string} externalOrderItemId - The external order item ID.
 * @param {object} product - The product object.
 * @param {number} totalAmount - The total amount of the product item.
 * @param {number} quantity - The quantity of the product item.
 * @returns {object} - The created product item object.
 */
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

function _check(referer) {
  referer = referer || window.location.hostname;
  return _http("POST", "/check?ref=" + referer);
}

/**
 * Perform a conversion tracking.
 *
 * @param {Object} order - The Order object
 * @param {Object} options - The options for the conversion tracking.
 * @param {boolean} options.debug - Whether to enable debug mode for the conversion tracking.
 * @param {string} options.referer - The referer for the conversion tracking.
 * @returns {Promise} A promise that resolves when the conversion tracking is successful.
 */
export function conversion(order, options) {
  options = options || {};

  order.pixelId = order.pixelId || PIXEL_ID;
  order.referringDomain = options.referer || window.location.hostname;

  var path = "/track/conversion";

  if (options.debug) {
    return _http("POST", path, order);
  }

  return _check(options.referer).then(
    function (checkResponse) {
      checkResponse = JSON.parse(checkResponse);
      if (checkResponse.matchable === true) {
        return _http("POST", path, order);
      }
    }.bind(this)
  );
}

/**
 * The 'pixel' function is used to track a conversion event by sending a pixel request to the server.
 *
 * @param {Object} order - The Order object.
 * @param {Object} options - The options object containing additional configuration options.
 * @param {string} options.referer - The referring domain associated with the conversion event.
 *
 * @returns {void}
 */
export function pixel(order, options) {
  options = options || {};

  var items = order.items || [];
  var orderId = order.externalOrderId;
  var amount = order.amount;

  var pixelId = order.pixelId || PIXEL_ID;
  var currency = order.currencyCode || options.currencyCode;
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
    case "pixel":
      return pixel(...args);
    case "conversion":
      return conversion(...args);
    case "init":
      return init(...args);
  }
}

window.lefty = _lefty;
