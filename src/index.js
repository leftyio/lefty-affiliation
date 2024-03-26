let PIXEL_ID;
let DEBUG_MODE = false;

const _base = "https://a.lefty.io";

function _http(method, path, data) {
  let xhr = new XMLHttpRequest();
  xhr.open(method, _base + path, true);
  xhr.setRequestHeader("Content-type", "application/json");
  xhr.withCredentials = true;

  let promise = new Promise(function (resolve, reject) {
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

function _check(referer, options) {
  options = options || {};

  referer = referer || window.location.hostname;

  const path = "/check?ref=" + referer;

  if (options.xhr) {
    return _http("POST", path);
  }

  const url = _base + path;

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = resolve;
    img.onerror = reject;

    img.src = url;
  });
}

/**
 * Perform a conversion tracking.
 *
 * @param {Object} order - The Order object
 * @param {Object} options - The options for the conversion tracking.
 * @param {string} options.referer - The referer for the conversion tracking.
 * @returns {Promise} A promise that resolves when the conversion tracking is successful.
 */
export function conversion(order, options) {
  options = options || {};

  order.pixelId = order.pixelId || PIXEL_ID;
  order.referringDomain = options.referer || window.location.hostname;

  const path = "/track/conversion";

  if (DEBUG_MODE) {
    console.log("Lefty - conversion", order);
    return _http("POST", path, order);
  }

  return _check(order.referringDomain, { xhr: true }).then(
    (checkResponse) => {
      checkResponse = JSON.parse(checkResponse);
      if (checkResponse.matchable === true) {
        return _http("POST", path, order);
      }
    },
    (error) => console.error("Lefty - check", error)
  );
}

function _pixel(order, options) {
  options = options || {};

  const items = order.items || [];
  const orderId = order.externalOrderId;
  const amount = order.amount;

  const pixelId = order.pixelId || PIXEL_ID;
  const currency = order.currencyCode || options.currencyCode;
  const referer = options.referer || window.location.hostname;

  let url = _base + "/track?type=conversion";
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
    const pIds = items
      .map(function (item) {
        return "pId=" + item.product.externalProductId;
      })
      .join("&");

    const pNames = items
      .map(function (item) {
        return "pName=" + encodeURIComponent(item.product.name);
      })
      .join("&");

    const itemQty = items
      .map(function (item) {
        return "itemQty=" + item.quantity;
      })
      .join("&");

    const itemAmount = items
      .map(function (item) {
        return "itemAmount=" + item.totalAmount;
      })
      .join("&");

    const itemIds = items
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

  const img = new Image();
  img.src = url;
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
  if (DEBUG_MODE) {
    console.log("Lefty - pixel", order);
    return _pixel(order, options);
  }

  options.referer = options.referer || window.location.hostname;

  return _check(options.referer).then(
    () => _pixel(order, options),
    (error) => console.error("Lefty - check", error)
  );
}

function init(pixelId, options) {
  options = options || {};

  PIXEL_ID = pixelId;
  DEBUG_MODE = options.debug || false;

  const actions = window._lefty || [];

  while (actions.length) {
    const action = actions.shift();
    _lefty(...action);
  }
}

function _lefty() {
  const args = [...arguments];
  const ref = args.shift();

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
