/**
 * Help Me Decide — vanilla JS widget for product pages.
 *
 * UI: AI-themed toast trigger → gradient hero modal with confidence bar,
 *     emphasised winner card, feature table, and chat-driven refinement.
 *
 * API contract (backend: zoho-decide-agent FastAPI service)
 * ---------------------------------------------------------
 * POST /canshowComparison
 *   body : { product_ids: string[] }
 *   resp : { showPopup, selectedProductIds, selectedProducts }
 *
 * POST /compare
 *   body : { product_ids: [id_a, id_b], user_input?: string }
 *   resp : { comparisonPoints, recommendedProductId, recommendationReasoning,
 *            suggestionText, confidence, intent, alternativeProducts }
 */
(function (global) {
  "use strict"; // No I18N

  // ---------- constants ----------

  var POLL_INTERVAL_MS    = 5 * 60 * 1000;
  var SESSION_DISMISS_KEY = "zs_help_me_decide_dismissed";   // No I18N
  var VISIT_SENT_PREFIX   = "zs_help_me_decide_visit_";      // No I18N
  var VISIT_META_PREFIX   = "zs_help_me_decide_visit_meta_"; // No I18N
  var VARIANT_VISIT_PREFIX = "zs_help_me_decide_variant_";   // No I18N
  var SESSION_START_KEY   = "zs_help_me_decide_session_start"; // No I18N
  var MIN_VARIANTS_FOR_CANSHOW = 2;
  var MIN_SESSION_MS           = 5000;

  var API = {
    canShowComparison: "http://localhost:5174/canshowComparison", // No I18N
    compare:           "http://localhost:5174/compare"            // No I18N
  };

  // Quick-pick suggestion chips for the refinement chat.
  var QUICK_CHIPS = [
    { label: "Better battery?",   text: "Which one has better battery life?" },
    { label: "Cheaper option?",   text: "I want the more affordable one." },
    { label: "For gaming?",       text: "Which is better for gaming and creative work?" },
    { label: "Lighter weight?",   text: "I travel a lot — which is lighter?" },
    { label: "Best for students?", text: "I'm a student. Which one fits me better?" }
  ];

  // ---------- module state ----------

  var state = {
    selectedProductIds: [],
    previewProducts:    [],
    inlineMessage:      "",
    introMessage:       "",
    comparing:          false,
    comparison:         null,
    compareError:       null,
    chatMessages:       [],
    chatInput:          "",
    chatting:           false,
    chatError:          null,
    addedToCartId:      null,
    promptShown:        false,
    modalOpen:          false,
    usedChips:          {}
  };

  var portalEl        = null;
  var triggerEl       = null;
  var modalEl         = null;
  var cartToastEl     = null;
  var cartToastTimer  = null;
  var typewriterTimer = null;
  var confidenceRaf   = null;
  var pollIntervalId  = null;
  var initialized     = false;

  // ---------- debug ----------

  function debugLog() {
    if (global.zsHelpMeDecideConfig && global.zsHelpMeDecideConfig.debug) {
      console.log.apply(console, ["[Help Me Decide]"].concat(Array.prototype.slice.call(arguments))); // No I18N
    }
  }

  // ---------- CSRF / fetch helpers ----------

  function getCsrfHeaders() {
    if (typeof zsUtils !== "undefined" && zsUtils.getCSRFHeader) {
      return zsUtils.getCSRFHeader();
    }
    return {};
  }

  function isCrossOriginApi(url) {
    if (!url || url.indexOf("http") !== 0) { return false; }
    try {
      return new URL(url, global.location.href).origin !== global.location.origin;
    } catch (e) {
      return false;
    }
  }

  function request(method, url, body) {
    return new Promise(function (resolve, reject) {
      var crossOrigin = isCrossOriginApi(url);

      if (typeof $X !== "undefined" && !crossOrigin) {
        var opts = {
          url: url,
          headers: getCsrfHeaders(),
          handler: function () {
            try { resolve(JSON.parse(this.responseText)); }
            catch (err) { reject(err); }
          },
          error: {
            handler:   function () { reject(new Error("Request failed: " + url)); },
            condition: function () { return this.status >= 300; }
          }
        };

        if (method === "GET") { $X.get(opts); }
        else { opts.bodyJSON = body || {}; $X.post(opts); }
        return;
      }

      var fetchOpts = {
        method:      method,
        credentials: crossOrigin ? "omit" : "same-origin",
        headers:     crossOrigin
          ? { "Content-Type": "application/json" }
          : Object.assign({ "Content-Type": "application/json" }, getCsrfHeaders())
      };
      if (body && method !== "GET") { fetchOpts.body = JSON.stringify(body); }

      fetch(url, fetchOpts)
        .then(function (res) { if (!res.ok) { throw new Error("Request failed"); } return res.json(); })
        .then(resolve)
        .catch(reject);
    });
  }

  // ---------- session-storage helpers ----------

  function getVisitedProductIds() {
    var ids = [];
    try {
      for (var i = 0; i < sessionStorage.length; i++) {
        var k = sessionStorage.key(i);
        if (k && k.indexOf(VISIT_SENT_PREFIX) === 0) { ids.push(k.slice(VISIT_SENT_PREFIX.length)); }
      }
    } catch (e) {}
    return ids;
  }

  function getVisitedVariantIds() {
    var ids = [];
    try {
      for (var i = 0; i < sessionStorage.length; i++) {
        var k = sessionStorage.key(i);
        if (k && k.indexOf(VARIANT_VISIT_PREFIX) === 0) { ids.push(k.slice(VARIANT_VISIT_PREFIX.length)); }
      }
    } catch (e) {}
    return ids;
  }

  function ensureSessionStart() {
    try {
      if (!sessionStorage.getItem(SESSION_START_KEY)) {
        sessionStorage.setItem(SESSION_START_KEY, String(Date.now()));
      }
    } catch (e) {}
  }

  function getSessionDurationMs() {
    try {
      var start = parseInt(sessionStorage.getItem(SESSION_START_KEY), 10);
      if (!start) { return 0; }
      return Date.now() - start;
    } catch (e) { return 0; }
  }

  function isDismissedThisSession() { return sessionStorage.getItem(SESSION_DISMISS_KEY) === "1"; }
  function setDismissedSession() { try { sessionStorage.setItem(SESSION_DISMISS_KEY, "1"); } catch (e) {} }

  function lookupProductMeta(id) {
    try {
      var raw = sessionStorage.getItem(VISIT_META_PREFIX + id);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  // ---------- preconditions ----------

  function canShowComparisonPreconditionsMet() {
    if (isDismissedThisSession()) { return false; }
    if (getSessionDurationMs() < MIN_SESSION_MS) { return false; }

    var variantIds = getVisitedVariantIds();
    if (variantIds.length > 0) { return variantIds.length > MIN_VARIANTS_FOR_CANSHOW; }
    return getVisitedProductIds().length >= 2;
  }

  function getComparisonIds() {
    var variantIds = getVisitedVariantIds();
    if (variantIds.length > 0) { return variantIds; }
    return getVisitedProductIds();
  }

  // ---------- product normalisation ----------

  function normalizeProduct(item) {
    if (!item) { return null; }
    return {
      product_id:      item.product_id  || item.productId  || item.id      || "",
      variant_id:      item.variant_id  || item.variantId  || null,
      name:            item.name        || item.product_name || item.productName || "",
      image_url:       item.image_url   || item.imageUrl   || item.image   || "",
      price_formatted: item.price_formatted || item.priceFormatted || item.price || "",
      url:             item.url         || item.product_url || item.productUrl  || "",
      source:          item.source      || item.context_source || "visited"
    };
  }

  function getCurrentProductMeta() {
    var root    = document.querySelector("[data-zs-help-me-decide-root]");
    var section = document.querySelector("[data-zs-product-details-primary-section]");
    var container = section || document;

    var productId =
      (root && root.getAttribute("data-product-id")) ||
      (container.querySelector("[data-zs-product-id]") &&
        container.querySelector("[data-zs-product-id]").getAttribute("data-zs-product-id"));

    var nameEl    = container.querySelector("[data-zs-product-name]");
    var productName =
      (root && root.getAttribute("data-product-name")) ||
      (nameEl && (nameEl.textContent || "").trim()) || "";

    var productUrl =
      (root && root.getAttribute("data-product-url")) ||
      global.location.pathname;

    var addToCart = container.querySelector("[data-zs-add-to-cart]");
    var variantId = addToCart && addToCart.getAttribute("data-zs-product-variant-id");

    var img = container.querySelector(".theme-product-image-area img, [data-zs-product-img-container] img");
    var imageUrl = img ? img.getAttribute("src") || img.getAttribute("data-src") : "";

    var priceEl       = container.querySelector("[data-zs-selling-price]");
    var priceFormatted = priceEl ? priceEl.textContent.trim() : "";

    return {
      product_id:      productId,
      variant_id:      variantId,
      product_name:    productName,
      product_url:     productUrl,
      image_url:       imageUrl,
      price_formatted: priceFormatted,
      visited_at:      new Date().toISOString()
    };
  }

  function trackProductVisited(meta) {
    if (!meta || (!meta.product_id && !meta.variant_id)) { return Promise.resolve(); }
    ensureSessionStart();

    if (meta.variant_id) {
      try { sessionStorage.setItem(VARIANT_VISIT_PREFIX + String(meta.variant_id), "1"); } catch (e) {}
    }
    if (meta.product_id) {
      try {
        sessionStorage.setItem(VISIT_SENT_PREFIX + meta.product_id, "1");
        sessionStorage.setItem(VISIT_META_PREFIX + meta.product_id, JSON.stringify({
          name:            meta.product_name || meta.name    || "",
          image_url:       meta.image_url    || "",
          price_formatted: meta.price_formatted || "",
          url:             meta.product_url  || meta.url     || ""
        }));
      } catch (e) {}
    }

    callCanShowApi();
    return Promise.resolve();
  }

  // ---------- API calls + normalisers ----------

  function fetchCanShow() {
    var ids = getComparisonIds();
    return request("POST", API.canShowComparison, { product_ids: ids })
      .then(normalizeCanShowResponse);
  }

  function callCanShowApi() {
    if (!canShowComparisonPreconditionsMet()) { return Promise.resolve(null); }
    return fetchCanShow()
      .then(function (result) {
        debugLog("canshowComparison response", result);
        if (result && result.showPopup === true) {
          state.selectedProductIds = result.selectedProductIds || [];
          state.previewProducts    = result.products || [];
          if (result.products && result.products.length >= 2) {
            state.inlineMessage = buildIntroFromProducts(result.products);
          }
          try { showTrigger(); }
          catch (err) { console.error("[Help Me Decide] showTrigger threw:", err); } // No I18N
        }
        return result;
      })
      .catch(function (err) { debugLog("canshowComparison fetch failed", err); return null; });
  }

  function fetchCompare(productIds, userInput) {
    var body = { product_ids: productIds };
    if (userInput && userInput.trim()) { body.user_input = userInput.trim(); }
    return request("POST", API.compare, body).then(normalizeCompareResponse);
  }

  function resolveSelectedProducts(selectedIds) {
    if (!Array.isArray(selectedIds)) { return []; }
    return selectedIds
      .map(function (id) {
        var stored = lookupProductMeta(id) || {};
        return normalizeProduct(Object.assign({
          product_id: id, variant_id: id,
          name: stored.name || stored.product_name || String(id), source: "selected"
        }, stored));
      })
      .filter(function (p) { return p && p.product_id; });
  }

  function normalizeCanShowResponse(data) {
    var showPopup   = data.showPopup === true;
    var selectedIds = Array.isArray(data.selectedProductIds) ? data.selectedProductIds : [];

    var products;
    if (Array.isArray(data.selectedProducts) && data.selectedProducts.length) {
      products = data.selectedProducts.map(function (sp) {
        var stored = lookupProductMeta(sp.id) || {};
        return normalizeProduct(Object.assign({ source: "selected" }, stored, {
          product_id: sp.id, name: sp.name
        }));
      }).filter(function (p) { return p && p.product_id; });
    } else {
      products = resolveSelectedProducts(selectedIds);
    }

    return { showPopup: showPopup, selectedProductIds: selectedIds, products: products };
  }

  function normalizeCompareResponse(data) {
    var payload      = data.payload || data;
    var points       = payload.comparisonPoints || payload.comparison_points || [];
    var recommendedId = payload.recommendedProductId || payload.recommended_product_id || "";
    var reasoning    = payload.recommendationReasoning || payload.recommendation_reasoning || "";

    return {
      summary:              reasoning || payload.summary || "",
      recommendedProductId: recommendedId,
      comparisonPoints:     points,
      suggestionText:       payload.suggestionText || payload.suggestion_text || null,
      confidence:           typeof payload.confidence === "number" ? payload.confidence : 80,
      intent:               payload.intent || null,
      alternativeProducts:  payload.alternativeProducts || null
    };
  }

  // ---------- misc UI helpers ----------

  function buildIntroFromProducts(products) {
    var names = products.slice(0, 2).map(function (p) { return p.name; }).filter(Boolean);
    if (names.length < 2) {
      return "I noticed you're comparing a few products. Want my recommendation?";
    }
    return "I noticed you're comparing " + names[0] + " and " + names[1] + ". Want my recommendation based on store data?";
  }

  function lockBodyScroll(lock) {
    document.getElementsByTagName("body")[0].style.overflow = lock ? "hidden" : "auto";
  }

  function escapeHtml(s) {
    if (s == null) { return ""; }
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function resolvePortalEl() {
    if (portalEl && portalEl.isConnected) { return portalEl; }
    portalEl = document.getElementById("help_me_decide_portal") || document.body || null;
    return portalEl;
  }

  // ---------- shared SVGs ----------

  var AI_SPARKLE_SVG = '' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" fill="currentColor" stroke="none"/>' +
      '<path d="M19 14l.95 2.55L22.5 17.5l-2.55.95L19 21l-.95-2.55L15.5 17.5l2.55-.95L19 14z" fill="currentColor" stroke="none" opacity="0.7"/>' +
    '</svg>';

  var CLOSE_SVG  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>';
  var STAR_SVG   = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z"/></svg>';
  var CART_SVG   = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>';
  var CHECK_SVG  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>';
  var SEND_SVG   = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>';

  // Generic product image (laptop silhouette) — used when MCP/storefront doesn't supply one.
  function productPlaceholderSvg(seed) {
    var palette = ["#D9D74E", "#5B6478", "#7C9CB8", "#B89B6E"];
    var color   = palette[(seed || 0) % palette.length];
    return '' +
      '<svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg" class="zsh-laptop">' +
        '<rect x="40" y="20" width="240" height="150" rx="10" fill="' + color + '"/>' +
        '<rect x="48" y="28" width="224" height="134" rx="4" fill="#0F1B2D"/>' +
        '<rect x="60" y="42" width="200" height="10" rx="2" fill="#3B4F77" opacity="0.6"/>' +
        '<circle cx="68" cy="47" r="2" fill="#FF5F57"/>' +
        '<circle cx="76" cy="47" r="2" fill="#FEBC2E"/>' +
        '<circle cx="84" cy="47" r="2" fill="#28C840"/>' +
        '<rect x="60" y="60"  width="60"  height="80" rx="3" fill="#1f3358" opacity="0.7"/>' +
        '<rect x="128" y="60" width="132" height="14" rx="2" fill="#2A4470" opacity="0.7"/>' +
        '<rect x="128" y="80" width="100" height="6"  rx="1.5" fill="#3B5586" opacity="0.6"/>' +
        '<rect x="128" y="92" width="120" height="6"  rx="1.5" fill="#3B5586" opacity="0.6"/>' +
        '<rect x="128" y="104" width="80" height="6"  rx="1.5" fill="#3B5586" opacity="0.6"/>' +
        '<path d="M 20 170 L 300 170 L 285 195 L 35 195 Z" fill="' + color + '"/>' +
        '<ellipse cx="160" cy="200" rx="150" ry="6" fill="#0B1220" opacity="0.08"/>' +
      '</svg>';
  }

  function productImageHtml(p, seed) {
    if (p && p.image_url) {
      return '<img src="' + escapeHtml(p.image_url) + '" alt="' + escapeHtml(p.name || "") + '" class="zsh-card__img"/>';
    }
    return productPlaceholderSvg(seed);
  }

  // ---------- styles (scoped with .zsh- prefix) ----------

  function ensureFontLink() {
    if (document.getElementById("zsh-fonts")) { return; }
    var l1 = document.createElement("link");
    l1.id = "zsh-fonts";
    l1.rel = "stylesheet";
    l1.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
    document.head.appendChild(l1);
  }

  function ensureStyles() {
    if (document.getElementById("zsh-styles")) { return; }
    var style = document.createElement("style");
    style.id = "zsh-styles";
    style.textContent = ZSH_CSS;
    document.head.appendChild(style);
  }

  // Pre-bundled CSS — scoped under .zsh- so it won't collide with host page styles.
  var ZSH_CSS =
    ".zsh-root{--zsh-bg:#F6F6F1;--zsh-card:#FFFFFF;--zsh-t1:#0B1220;--zsh-t2:#4B5563;--zsh-t3:#9CA3AF;--zsh-bd:#E5E7EB;--zsh-bd-soft:#F0F0EC;" +
    "--zsh-ai:#047857;--zsh-ai-2:#059669;--zsh-ai-3:#10B981;--zsh-ai-tint:#ECFDF5;--zsh-ai-tint-2:#D1FAE5;--zsh-ai-dark:#064E3B;" +
    "--zsh-gold:#B45309;--zsh-gold-2:#D97706;--zsh-gold-3:#F59E0B;--zsh-gold-tint:#FFFBEB;--zsh-gold-tint-2:#FEF3C7;" +
    "--zsh-r-md:10px;--zsh-r-lg:14px;--zsh-r-xl:20px;--zsh-r-pill:999px;" +
    "--zsh-sh-md:0 4px 12px rgba(15,23,42,.06),0 2px 4px rgba(15,23,42,.04);" +
    "--zsh-sh-lg:0 12px 36px rgba(15,23,42,.10),0 4px 12px rgba(15,23,42,.06);" +
    "--zsh-sh-xl:0 24px 64px rgba(15,23,42,.18),0 8px 16px rgba(15,23,42,.08);" +
    "font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:var(--zsh-t1);font-size:15px;line-height:1.55;-webkit-font-smoothing:antialiased}" +
    ".zsh-root *,.zsh-root *::before,.zsh-root *::after{box-sizing:border-box}" +
    /* trigger */
    ".zsh-trigger{position:fixed;bottom:24px;right:24px;z-index:2147483000}" +
    ".zsh-toast{width:340px;background:#fff;border-radius:var(--zsh-r-lg);padding:16px 16px 14px;display:flex;gap:12px;box-shadow:var(--zsh-sh-lg);border:1px solid var(--zsh-bd-soft);position:relative;animation:zsh-slideUp .4s cubic-bezier(.16,1,.3,1)}" +
    "@keyframes zsh-slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}" +
    "@keyframes zsh-fadeIn{from{opacity:0}to{opacity:1}}" +
    "@keyframes zsh-modalIn{from{opacity:0;transform:translateY(16px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}" +
    ".zsh-toast__close{position:absolute;top:8px;right:8px;background:transparent;border:0;width:22px;height:22px;border-radius:6px;cursor:pointer;color:var(--zsh-t3);display:flex;align-items:center;justify-content:center}" +
    ".zsh-toast__close:hover{background:var(--zsh-bg);color:var(--zsh-t1)}" +
    ".zsh-toast__close svg{width:14px;height:14px}" +
    ".zsh-badge{flex-shrink:0;width:40px;height:40px;border-radius:var(--zsh-r-md);background:linear-gradient(135deg,var(--zsh-ai) 0%,var(--zsh-ai-2) 100%);display:flex;align-items:center;justify-content:center;color:#fff;position:relative;box-shadow:0 4px 10px -2px rgba(4,120,87,.4)}" +
    ".zsh-badge::after{content:'';position:absolute;inset:-2px;border-radius:12px;background:linear-gradient(135deg,var(--zsh-gold-3),transparent);z-index:-1;opacity:.5}" +
    ".zsh-badge svg{width:22px;height:22px}" +
    ".zsh-toast__body{flex:1;min-width:0}" +
    ".zsh-toast__title{margin:0 0 4px;font-size:14.5px;font-weight:600;display:flex;align-items:center;gap:6px;padding-right:18px}" +
    ".zsh-chip-tag{font-size:9.5px;font-weight:700;letter-spacing:.08em;background:var(--zsh-gold-tint-2);color:var(--zsh-gold);padding:2px 6px;border-radius:4px;text-transform:uppercase}" +
    ".zsh-toast__copy{margin:0 0 12px;font-size:13px;color:var(--zsh-t2);line-height:1.5;padding-right:14px}" +
    ".zsh-toast__copy strong{color:var(--zsh-t1);font-weight:600}" +
    ".zsh-toast__actions{display:flex;gap:8px}" +
    /* buttons */
    ".zsh-btn{font-family:inherit;font-size:13px;font-weight:600;padding:8px 14px;border-radius:var(--zsh-r-md);border:1px solid transparent;cursor:pointer;display:inline-flex;align-items:center;gap:6px;letter-spacing:.01em;transition:transform .08s,background .15s,box-shadow .15s;line-height:1.2}" +
    ".zsh-btn:active{transform:scale(.98)}" +
    ".zsh-btn:disabled{opacity:.6;cursor:not-allowed}" +
    ".zsh-btn--ai{background:var(--zsh-ai);color:#fff;box-shadow:0 2px 4px -1px rgba(4,120,87,.25)}" +
    ".zsh-btn--ai:hover:not(:disabled){background:var(--zsh-ai-2)}" +
    ".zsh-btn--ai-gold{background:linear-gradient(135deg,var(--zsh-ai) 0%,var(--zsh-gold-2) 130%);color:#fff}" +
    ".zsh-btn--ai-gold:hover:not(:disabled){filter:brightness(1.05)}" +
    ".zsh-btn--ghost{background:transparent;color:var(--zsh-t2);border-color:var(--zsh-bd)}" +
    ".zsh-btn--ghost:hover:not(:disabled){background:var(--zsh-bg);color:var(--zsh-t1)}" +
    ".zsh-btn--outline-ai{background:transparent;color:var(--zsh-ai);border-color:var(--zsh-ai-tint-2)}" +
    ".zsh-btn--outline-ai:hover:not(:disabled){background:var(--zsh-ai-tint)}" +
    ".zsh-btn--lg{padding:12px 20px;font-size:14.5px}" +
    ".zsh-btn--block{width:100%;justify-content:center}" +
    ".zsh-btn--success{background:var(--zsh-ai);color:#fff}" +
    /* modal */
    ".zsh-overlay{position:fixed;inset:0;background:rgba(11,18,32,.55);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);z-index:2147483001;display:flex;align-items:center;justify-content:center;padding:24px;animation:zsh-fadeIn .25s}" +
    ".zsh-modal{background:#fff;border-radius:var(--zsh-r-xl);width:100%;max-width:920px;max-height:92vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:var(--zsh-sh-xl);animation:zsh-modalIn .35s cubic-bezier(.16,1,.3,1)}" +
    ".zsh-modal__header{display:flex;align-items:center;justify-content:space-between;padding:18px 24px;border-bottom:1px solid var(--zsh-bd-soft);background:linear-gradient(180deg,#FFFFFF 0%,#FBFBF8 100%)}" +
    ".zsh-modal__title{display:flex;align-items:center;gap:12px;font-size:17px;font-weight:600;margin:0;color:var(--zsh-t1)}" +
    ".zsh-modal__title .zsh-badge{width:32px;height:32px}" +
    ".zsh-modal__title .zsh-badge svg{width:18px;height:18px}" +
    ".zsh-modal__title .zsh-chip-tag{font-size:10px;padding:3px 8px}" +
    ".zsh-modal__close{width:32px;height:32px;background:transparent;border:0;border-radius:var(--zsh-r-md);cursor:pointer;color:var(--zsh-t2);display:flex;align-items:center;justify-content:center}" +
    ".zsh-modal__close:hover{background:var(--zsh-bg);color:var(--zsh-t1)}" +
    ".zsh-modal__close svg{width:18px;height:18px}" +
    ".zsh-modal__body{overflow-y:auto;padding:24px;display:flex;flex-direction:column;gap:20px}" +
    ".zsh-modal__body > *{flex-shrink:0}" +
    /* AI hero */
    ".zsh-hero{position:relative;background:linear-gradient(135deg,var(--zsh-ai-tint) 0%,var(--zsh-gold-tint) 100%);border:1px solid var(--zsh-ai-tint-2);border-radius:var(--zsh-r-lg);padding:22px 24px 24px;overflow:hidden}" +
    ".zsh-hero::before{content:'';position:absolute;top:-40px;right:-40px;width:180px;height:180px;background:radial-gradient(circle,var(--zsh-gold-tint-2) 0%,transparent 70%);pointer-events:none}" +
    ".zsh-hero__label{display:inline-flex;align-items:center;gap:8px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--zsh-ai-dark);margin-bottom:10px}" +
    ".zsh-hero__label .zsh-dot{width:8px;height:8px;background:var(--zsh-ai-2);border-radius:999px;position:relative}" +
    ".zsh-hero__label .zsh-dot::after{content:'';position:absolute;inset:0;border-radius:999px;background:var(--zsh-ai-2);animation:zsh-pulse 2s infinite}" +
    "@keyframes zsh-pulse{0%{transform:scale(1);opacity:.6}100%{transform:scale(2.5);opacity:0}}" +
    ".zsh-hero__rec{font-size:18px;font-weight:600;margin:0 0 6px;color:var(--zsh-t1);line-height:1.4}" +
    ".zsh-hero__rec strong{color:var(--zsh-ai)}" +
    ".zsh-hero__reason{font-size:14.5px;line-height:1.65;color:var(--zsh-t2);margin:0;min-height:3.2em}" +
    ".zsh-hero__reason .zsh-cursor{display:inline-block;width:2px;height:1em;background:var(--zsh-ai-2);margin-left:1px;vertical-align:text-bottom;animation:zsh-blink 1s steps(2) infinite}" +
    "@keyframes zsh-blink{50%{opacity:0}}" +
    ".zsh-conf{display:flex;align-items:center;gap:12px;margin-top:14px;padding-top:14px;border-top:1px solid rgba(4,120,87,.12)}" +
    ".zsh-conf__bar{flex:1;height:6px;background:rgba(4,120,87,.12);border-radius:999px;overflow:hidden;position:relative}" +
    ".zsh-conf__fill{height:100%;background:linear-gradient(90deg,var(--zsh-ai) 0%,var(--zsh-gold-3) 100%);border-radius:999px;transition:width 1.2s cubic-bezier(.16,1,.3,1)}" +
    ".zsh-conf__label{font-size:12px;color:var(--zsh-t2);font-weight:500}" +
    ".zsh-conf__label strong{color:var(--zsh-ai);font-weight:700}" +
    /* compare cards */
    ".zsh-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}" +
    ".zsh-card{position:relative;background:#fff;border:1px solid var(--zsh-bd);border-radius:var(--zsh-r-lg);padding:18px;display:flex;flex-direction:column;transition:transform .3s cubic-bezier(.16,1,.3,1),box-shadow .3s,border-color .3s}" +
    ".zsh-card__image{background:var(--zsh-bg);border-radius:var(--zsh-r-md);height:140px;display:flex;align-items:center;justify-content:center;margin-bottom:14px;overflow:hidden}" +
    ".zsh-card__image svg,.zsh-card__image img{width:100%;height:100%;padding:12px;object-fit:contain}" +
    ".zsh-card__title{font-size:15.5px;font-weight:600;margin:0 0 4px;color:var(--zsh-t1)}" +
    ".zsh-card__meta{font-size:12.5px;color:var(--zsh-t3);margin-bottom:10px;min-height:1em}" +
    ".zsh-card__price{font-size:22px;font-weight:700;color:var(--zsh-t1);margin:0 0 12px;font-variant-numeric:tabular-nums}" +
    ".zsh-card__actions{display:flex;flex-direction:column;gap:8px;margin-top:auto}" +
    ".zsh-card.is-winner{border-color:var(--zsh-ai-2);transform:translateY(-6px) scale(1.02);box-shadow:0 0 0 4px var(--zsh-ai-tint),0 24px 48px -8px rgba(4,120,87,.3);background:linear-gradient(180deg,#FFFFFF 0%,var(--zsh-ai-tint) 60%,var(--zsh-gold-tint) 100%);animation:zsh-glowPulse 3s infinite ease-in-out}" +
    "@keyframes zsh-glowPulse{0%,100%{box-shadow:0 0 0 4px var(--zsh-ai-tint),0 24px 48px -8px rgba(4,120,87,.3)}50%{box-shadow:0 0 0 4px var(--zsh-ai-tint),0 24px 48px -8px rgba(4,120,87,.45),0 0 36px 2px rgba(4,120,87,.35)}}" +
    ".zsh-winner-badge{position:absolute;top:12px;right:12px;background:linear-gradient(135deg,var(--zsh-ai) 0%,var(--zsh-gold-2) 130%);color:#fff;font-size:10.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:5px 9px 5px 8px;border-radius:var(--zsh-r-pill);display:flex;align-items:center;gap:4px;z-index:2;box-shadow:0 4px 10px -2px rgba(4,120,87,.4)}" +
    ".zsh-winner-badge svg{width:11px;height:11px}" +
    ".zsh-sparkle-layer{position:absolute;inset:0;pointer-events:none;overflow:hidden;border-radius:var(--zsh-r-lg)}" +
    ".zsh-spark{position:absolute;width:8px;height:8px;background:var(--zsh-gold-3);clip-path:polygon(50% 0,60% 40%,100% 50%,60% 60%,50% 100%,40% 60%,0 50%,40% 40%);opacity:0;animation:zsh-sparkFloat 3s infinite ease-out}" +
    "@keyframes zsh-sparkFloat{0%{opacity:0;transform:scale(.4) translateY(20px)}30%{opacity:1;transform:scale(1) translateY(0)}70%{opacity:1;transform:scale(.9) translateY(-10px)}100%{opacity:0;transform:scale(.5) translateY(-30px)}}" +
    /* feature table */
    ".zsh-table-wrap{background:#fff;border:1px solid var(--zsh-bd);border-radius:var(--zsh-r-lg);overflow:hidden}" +
    ".zsh-table-head{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:#FBFBF8;border-bottom:1px solid var(--zsh-bd-soft)}" +
    ".zsh-table-head h4{margin:0;font-size:14px;font-weight:600}" +
    ".zsh-table-head__hint{font-size:12px;color:var(--zsh-t3)}" +
    ".zsh-table{width:100%;border-collapse:collapse;font-size:13.5px}" +
    ".zsh-table th,.zsh-table td{padding:11px 18px;text-align:left;border-bottom:1px solid var(--zsh-bd-soft);vertical-align:middle}" +
    ".zsh-table tr:last-child td{border-bottom:0}" +
    ".zsh-table th{font-weight:600;font-size:12.5px;color:var(--zsh-t2);background:#FBFBF8}" +
    ".zsh-table th:not(:first-child),.zsh-table td:not(:first-child){text-align:center}" +
    ".zsh-table td:not(:first-child){font-variant-numeric:tabular-nums;color:var(--zsh-t1)}" +
    ".zsh-table td.is-win{background:var(--zsh-ai-tint);font-weight:600;color:var(--zsh-ai-dark);position:relative}" +
    ".zsh-table td.is-win::before{content:'\\2713';display:inline-block;width:16px;height:16px;background:var(--zsh-ai);color:#fff;border-radius:50%;font-size:10px;font-weight:800;line-height:16px;text-align:center;margin-right:6px;vertical-align:middle}" +
    ".zsh-table .zsh-feat{font-weight:500;color:var(--zsh-t1)}" +
    /* chat */
    ".zsh-chat{background:#fff;border:1px solid var(--zsh-bd);border-radius:var(--zsh-r-lg);padding:18px 20px}" +
    ".zsh-chat__hd{display:flex;align-items:center;gap:10px;margin-bottom:14px}" +
    ".zsh-chat__hd h4{margin:0;font-size:14px;font-weight:600}" +
    ".zsh-chat__sub{font-size:13px;color:var(--zsh-t2);margin:0 0 14px}" +
    ".zsh-chip-row{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}" +
    ".zsh-chip{display:inline-flex;align-items:center;gap:6px;background:var(--zsh-bg);border:1px solid var(--zsh-bd);color:var(--zsh-t1);font-size:12.5px;font-weight:500;padding:7px 12px;border-radius:var(--zsh-r-pill);cursor:pointer;font-family:inherit;transition:background .15s,border-color .15s,color .15s}" +
    ".zsh-chip:hover:not(:disabled){background:var(--zsh-ai-tint);border-color:var(--zsh-ai-tint-2);color:var(--zsh-ai-dark)}" +
    ".zsh-chip:disabled{opacity:.5;cursor:not-allowed}" +
    ".zsh-chip svg{width:12px;height:12px;color:var(--zsh-gold-3)}" +
    ".zsh-thread{display:flex;flex-direction:column;gap:10px;margin-bottom:14px;max-height:240px;overflow-y:auto;padding-right:4px}" +
    ".zsh-msg{max-width:86%;display:flex;flex-direction:column;gap:8px}" +
    ".zsh-msg__bubble{padding:10px 14px;border-radius:var(--zsh-r-lg);font-size:13.5px;line-height:1.5}" +
    ".zsh-msg--user{align-self:flex-end}" +
    ".zsh-msg--user .zsh-msg__bubble{background:var(--zsh-ai);color:#fff;border-bottom-right-radius:4px}" +
    ".zsh-msg--ai{align-self:flex-start}" +
    ".zsh-msg--ai .zsh-msg__bubble{background:var(--zsh-bg);color:var(--zsh-t1);border-bottom-left-radius:4px;border:1px solid var(--zsh-bd-soft)}" +
    ".zsh-typing{display:inline-flex;gap:4px}" +
    ".zsh-typing span{width:6px;height:6px;background:var(--zsh-ai);border-radius:50%;animation:zsh-bounce 1.2s infinite ease-in-out}" +
    ".zsh-typing span:nth-child(2){animation-delay:.15s}" +
    ".zsh-typing span:nth-child(3){animation-delay:.3s}" +
    "@keyframes zsh-bounce{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-5px);opacity:1}}" +
    ".zsh-msg__action{align-self:flex-start}" +
    ".zsh-input-row{display:flex;gap:8px;align-items:center}" +
    ".zsh-input{flex:1;padding:11px 14px;border:1px solid var(--zsh-bd);border-radius:var(--zsh-r-md);font-family:inherit;font-size:13.5px;outline:none;background:var(--zsh-bg);transition:border-color .15s,background .15s}" +
    ".zsh-input:focus{border-color:var(--zsh-ai-2);background:#fff;box-shadow:0 0 0 3px var(--zsh-ai-tint)}" +
    ".zsh-input::placeholder{color:var(--zsh-t3)}" +
    /* loading */
    ".zsh-loading-cards{display:grid;grid-template-columns:1fr 1fr;gap:16px}" +
    ".zsh-loading-card{background:#fff;border:1px solid var(--zsh-bd);border-radius:var(--zsh-r-lg);padding:18px;height:280px}" +
    ".zsh-shimmer{background:linear-gradient(90deg,#F1F1ED 0%,#FAFAF7 50%,#F1F1ED 100%);background-size:200% 100%;border-radius:6px;animation:zsh-shimmer 1.4s infinite linear}" +
    "@keyframes zsh-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}" +
    ".zsh-shimmer-img{height:140px;margin-bottom:14px;border-radius:var(--zsh-r-md)}" +
    ".zsh-shimmer-line{height:12px;margin-bottom:8px}" +
    ".zsh-w70{width:70%}.zsh-w40{width:40%}.zsh-w90{width:90%}" +
    ".zsh-thinking{display:flex;align-items:center;gap:12px;padding:16px 20px;background:var(--zsh-ai-tint);border:1px solid var(--zsh-ai-tint-2);border-radius:var(--zsh-r-lg);margin-bottom:16px;font-size:14px;color:var(--zsh-ai-dark);font-weight:500}" +
    ".zsh-spinner{width:18px;height:18px;border:2px solid var(--zsh-ai-tint-2);border-top-color:var(--zsh-ai);border-radius:50%;animation:zsh-spin .9s linear infinite;flex-shrink:0}" +
    "@keyframes zsh-spin{to{transform:rotate(360deg)}}" +
    /* error */
    ".zsh-error{margin:8px 0;padding:10px 12px;border-radius:var(--zsh-r-md);background:#FDECEA;color:#B00020;font-size:13px}" +
    /* cart toast */
    ".zsh-cart-toast{position:fixed;bottom:32px;left:50%;transform:translateX(-50%) translateY(60px);background:var(--zsh-t1);color:#fff;padding:14px 22px;border-radius:var(--zsh-r-pill);font-size:14px;font-weight:500;display:flex;align-items:center;gap:10px;box-shadow:var(--zsh-sh-xl);opacity:0;transition:opacity .3s,transform .3s;z-index:2147483002;pointer-events:none}" +
    ".zsh-cart-toast.is-visible{opacity:1;transform:translateX(-50%) translateY(0)}" +
    ".zsh-cart-toast__icon{background:var(--zsh-ai);width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center}" +
    ".zsh-cart-toast__icon svg{width:14px;height:14px}" +
    /* responsive */
    "@media (max-width:880px){.zsh-trigger{bottom:16px;right:16px;left:16px}.zsh-toast{width:100%}.zsh-grid,.zsh-loading-cards{grid-template-columns:1fr}.zsh-modal{max-height:100vh;border-radius:0}.zsh-overlay{padding:0;align-items:flex-end}}";

  // ---------- trigger (toast) ----------

  function showTrigger() {
    var target = resolvePortalEl();
    if (!target) { debugLog("showTrigger: no portal target"); return; }
    ensureFontLink(); ensureStyles();

    // Already mounted: just refresh copy
    if (state.promptShown && triggerEl && triggerEl.isConnected) {
      var copyEl = triggerEl.querySelector(".zsh-toast__copy");
      if (copyEl) { copyEl.innerHTML = triggerCopyHtml(); }
      return;
    }

    state.promptShown = true;
    triggerEl = document.createElement("div");
    triggerEl.className = "zsh-root zsh-trigger";
    triggerEl.setAttribute("role", "region");
    triggerEl.setAttribute("aria-label", "Help me decide");
    triggerEl.innerHTML =
      '<div class="zsh-toast">' +
        '<button class="zsh-toast__close" data-zsh-action="dismiss" aria-label="Close">' + CLOSE_SVG + '</button>' +
        '<div class="zsh-badge">' + AI_SPARKLE_SVG + '</div>' +
        '<div class="zsh-toast__body">' +
          '<h3 class="zsh-toast__title">Help me decide<span class="zsh-chip-tag">AI</span></h3>' +
          '<p class="zsh-toast__copy">' + triggerCopyHtml() + '</p>' +
          '<div class="zsh-toast__actions">' +
            '<button class="zsh-btn zsh-btn--ai" data-zsh-action="accept">Yes, compare</button>' +
            '<button class="zsh-btn zsh-btn--ghost" data-zsh-action="dismiss">Maybe later</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    triggerEl.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-zsh-action]");
      if (!btn) { return; }
      var action = btn.getAttribute("data-zsh-action");
      if (action === "accept")       { handleAccept(); }
      else if (action === "dismiss") { handleDismiss(); }
    });

    target.appendChild(triggerEl);
    debugLog("trigger mounted");
  }

  function triggerCopyHtml() {
    var ps = state.previewProducts || [];
    if (ps.length >= 2) {
      return "I noticed you're comparing <strong>" + escapeHtml(ps[0].name) +
             "</strong> and <strong>" + escapeHtml(ps[1].name) +
             "</strong>. Want my recommendation based on store data?";
    }
    return "I can help you compare the products you've been viewing. Want my recommendation?";
  }

  function hideTrigger() {
    state.promptShown = false;
    if (triggerEl) { triggerEl.remove(); triggerEl = null; }
  }

  // ---------- modal ----------

  function openModal() {
    var target = resolvePortalEl();
    if (!target) { return; }
    ensureFontLink(); ensureStyles();

    state.modalOpen = true;
    if (modalEl && modalEl.isConnected) { renderModalBody(); return; }

    modalEl = document.createElement("div");
    modalEl.className = "zsh-root zsh-overlay";
    modalEl.innerHTML =
      '<div class="zsh-modal" role="dialog" aria-modal="true" aria-label="AI product comparison">' +
        '<header class="zsh-modal__header">' +
          '<h2 class="zsh-modal__title">' +
            '<span class="zsh-badge">' + AI_SPARKLE_SVG + '</span>' +
            'Help me decide' +
            '<span class="zsh-chip-tag">Powered by AI</span>' +
          '</h2>' +
          '<button class="zsh-modal__close" data-zsh-action="modal-close" aria-label="Close">' + CLOSE_SVG + '</button>' +
        '</header>' +
        '<div class="zsh-modal__body" data-zsh-body></div>' +
      '</div>';

    modalEl.addEventListener("click", function (e) {
      if (e.target === modalEl) { closeModal(); return; }
      var act = e.target.closest("[data-zsh-action]");
      if (!act) { return; }
      var action = act.getAttribute("data-zsh-action");
      if (action === "modal-close")        { closeModal(); }
      else if (action === "chat-send")     { handleChatSend(); }
      else if (action === "chat-chip")     { handleChatSend(act.getAttribute("data-chip-text")); }
      else if (action === "add-to-cart")   { handleAddToCart(act.getAttribute("data-product-id"), act.getAttribute("data-product-name")); }
    });

    modalEl.addEventListener("input", function (e) {
      if (e.target.matches && e.target.matches("[data-zsh-chat-input]")) {
        state.chatInput = e.target.value;
        var btn = modalEl.querySelector('[data-zsh-action="chat-send"]');
        if (btn) { btn.disabled = state.chatting || !state.chatInput.trim(); }
      }
    });

    modalEl.addEventListener("keydown", function (e) {
      if (e.target.matches && e.target.matches("[data-zsh-chat-input]") && e.key === "Enter" && !e.shiftKey) {
        handleChatSend();
      }
    });

    target.appendChild(modalEl);
    lockBodyScroll(true);
    document.addEventListener("keydown", handleEscape);

    // Kick off the loading skeleton, then auto-run /compare
    state.comparison = null;
    state.compareError = null;
    state.comparing = true;
    renderModalBody();
    handleCompare();
  }

  function closeModal() {
    state.modalOpen = false;
    if (modalEl) { modalEl.remove(); modalEl = null; }
    if (typewriterTimer) { clearInterval(typewriterTimer); typewriterTimer = null; }
    if (confidenceRaf)   { cancelAnimationFrame(confidenceRaf); confidenceRaf = null; }
    lockBodyScroll(false);
    document.removeEventListener("keydown", handleEscape);
  }

  function handleEscape(e) { if (e.key === "Escape") { closeModal(); } }

  // ---------- modal body renderers ----------

  function renderModalBody() {
    if (!modalEl) { return; }
    var body = modalEl.querySelector("[data-zsh-body]");
    if (!body) { return; }

    if (state.comparing) {
      body.innerHTML = renderLoading();
      return;
    }

    if (state.compareError) {
      body.innerHTML = '<div class="zsh-error">' + escapeHtml(state.compareError) + '</div>';
      return;
    }

    if (!state.comparison) {
      body.innerHTML = '<div class="zsh-error">No comparison data.</div>';
      return;
    }

    var c = state.comparison;
    var ps = state.previewProducts || [];

    body.innerHTML =
      renderHero(c, ps) +
      renderCards(c, ps) +
      renderTable(c, ps) +
      renderChat(c, ps);

    // After paint: start typewriter for reasoning and animate the confidence bar.
    startTypewriter(c.summary);
    animateConfidence(c.confidence);

    // Auto-scroll chat thread to bottom
    var thread = body.querySelector(".zsh-thread");
    if (thread) { thread.scrollTop = thread.scrollHeight; }
  }

  function renderLoading() {
    return '' +
      '<div class="zsh-thinking">' +
        '<div class="zsh-spinner"></div>' +
        '<div><strong>Analyzing your selections</strong> · checking specs, reviews, and store performance signals…</div>' +
      '</div>' +
      '<div class="zsh-loading-cards">' +
        '<div class="zsh-loading-card"><div class="zsh-shimmer zsh-shimmer-img"></div>' +
          '<div class="zsh-shimmer zsh-shimmer-line zsh-w70"></div>' +
          '<div class="zsh-shimmer zsh-shimmer-line zsh-w40"></div>' +
          '<div style="height:24px"></div>' +
          '<div class="zsh-shimmer zsh-shimmer-line zsh-w90"></div>' +
          '<div class="zsh-shimmer zsh-shimmer-line zsh-w90"></div></div>' +
        '<div class="zsh-loading-card"><div class="zsh-shimmer zsh-shimmer-img"></div>' +
          '<div class="zsh-shimmer zsh-shimmer-line zsh-w70"></div>' +
          '<div class="zsh-shimmer zsh-shimmer-line zsh-w40"></div>' +
          '<div style="height:24px"></div>' +
          '<div class="zsh-shimmer zsh-shimmer-line zsh-w90"></div>' +
          '<div class="zsh-shimmer zsh-shimmer-line zsh-w90"></div></div>' +
      '</div>';
  }

  function renderHero(c, ps) {
    var winnerId = c.recommendedProductId;
    var winnerName = "";
    for (var i = 0; i < ps.length; i++) {
      if (ps[i].product_id === winnerId) { winnerName = ps[i].name; break; }
    }
    if (!winnerName) { winnerName = ps[0] ? ps[0].name : "this option"; }

    var conf = Math.max(0, Math.min(100, c.confidence || 80));

    return '' +
      '<div class="zsh-hero">' +
        '<div class="zsh-hero__label"><span class="zsh-dot"></span>AI Recommendation</div>' +
        '<p class="zsh-hero__rec">Based on store data, I recommend the <strong>' + escapeHtml(winnerName) + '</strong>.</p>' +
        '<p class="zsh-hero__reason" data-zsh-typewriter></p>' +
        '<div class="zsh-conf">' +
          '<span class="zsh-conf__label">Match confidence</span>' +
          '<div class="zsh-conf__bar"><div class="zsh-conf__fill" data-zsh-conf-fill style="width:0%"></div></div>' +
          '<span class="zsh-conf__label" data-zsh-conf-label><strong>0%</strong></span>' +
        '</div>' +
      '</div>';
  }

  function renderCards(c, ps) {
    if (!ps || ps.length < 2) { return ""; }
    var html = '<div class="zsh-grid">';
    for (var i = 0; i < 2; i++) {
      var p = ps[i];
      var isWinner = p.product_id === c.recommendedProductId;
      var added    = state.addedToCartId === p.product_id;

      var cardClasses = "zsh-card" + (isWinner ? " is-winner" : "");
      var actionBtn   = isWinner
        ? '<button class="zsh-btn ' + (added ? "zsh-btn--success" : "zsh-btn--ai-gold") + ' zsh-btn--block zsh-btn--lg" ' +
          'data-zsh-action="add-to-cart" data-product-id="' + escapeHtml(p.product_id) +
          '" data-product-name="' + escapeHtml(p.name) + '"' + (added ? " disabled" : "") + ">" +
          (added ? CHECK_SVG + " Added to Cart" : CART_SVG + " Add to Cart") +
          "</button>"
        : '<button class="zsh-btn zsh-btn--ghost zsh-btn--block" ' +
          'data-zsh-action="add-to-cart" data-product-id="' + escapeHtml(p.product_id) +
          '" data-product-name="' + escapeHtml(p.name) + '"' + (added ? " disabled" : "") + ">" +
          (added ? "✓ Added" : "Add to Cart") +
          "</button>";

      html +=
        '<div class="' + cardClasses + '">' +
          (isWinner ? '<div class="zsh-winner-badge">' + STAR_SVG + 'Top Pick</div>' : "") +
          (isWinner
            ? '<div class="zsh-sparkle-layer">' +
                '<div class="zsh-spark" style="top:20px;left:30%;animation-delay:0s"></div>' +
                '<div class="zsh-spark" style="top:60px;left:70%;animation-delay:.8s"></div>' +
                '<div class="zsh-spark" style="top:100px;left:50%;animation-delay:1.6s"></div>' +
                '<div class="zsh-spark" style="top:40px;left:85%;animation-delay:2.2s"></div>' +
              '</div>'
            : "") +
          '<div class="zsh-card__image">' + productImageHtml(p, i) + '</div>' +
          '<h3 class="zsh-card__title">' + escapeHtml(p.name) + '</h3>' +
          '<div class="zsh-card__meta">' + escapeHtml(p.price_formatted || "") + '</div>' +
          '<div class="zsh-card__price">' + escapeHtml(p.price_formatted || "") + '</div>' +
          '<div class="zsh-card__actions">' + actionBtn + '</div>' +
        '</div>';
    }
    html += '</div>';
    return html;
  }

  function renderTable(c, ps) {
    var pts = c.comparisonPoints || [];
    if (!pts.length || ps.length < 2) { return ""; }

    var nameA = ps[0].name, nameB = ps[1].name;
    var idA   = ps[0].product_id, idB = ps[1].product_id;

    var rows = pts.map(function (pt) {
      var aCls = pt.winner === idA ? "is-win" : "";
      var bCls = pt.winner === idB ? "is-win" : "";
      return '<tr>' +
        '<td class="zsh-feat">' + escapeHtml(pt.feature || "") + '</td>' +
        '<td class="' + aCls + '">' + escapeHtml(String(pt.product_a || "")) + '</td>' +
        '<td class="' + bCls + '">' + escapeHtml(String(pt.product_b || "")) + '</td>' +
        '</tr>';
    }).join("");

    return '' +
      '<div class="zsh-table-wrap">' +
        '<div class="zsh-table-head"><h4>Detailed comparison</h4>' +
          '<span class="zsh-table-head__hint">Highlighted cells = better for this feature</span></div>' +
        '<table class="zsh-table">' +
          '<thead><tr><th>Feature</th><th>' + escapeHtml(nameA) + '</th><th>' + escapeHtml(nameB) + '</th></tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table>' +
      '</div>';
  }

  function renderChat(c, ps) {
    var sending = state.chatting;

    var chips = QUICK_CHIPS.map(function (chip) {
      var used = !!state.usedChips[chip.text];
      var disabled = sending || used;
      return '<button class="zsh-chip" data-zsh-action="chat-chip" data-chip-text="' + escapeHtml(chip.text) + '"' +
        (disabled ? " disabled" : "") + ">" +
        '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/></svg>' +
        escapeHtml(chip.label) +
        "</button>";
    }).join("");

    var msgs = (state.chatMessages || []).map(function (m) {
      var html = '<div class="zsh-msg zsh-msg--' + (m.role === "user" ? "user" : "ai") + '">' +
        '<div class="zsh-msg__bubble">' + escapeHtml(m.text) + '</div>';
      if (m.role !== "user" && m.productId) {
        var added = state.addedToCartId === m.productId;
        html += '<button class="zsh-btn ' + (added ? "zsh-btn--success" : "zsh-btn--ai") + ' zsh-msg__action" ' +
          'data-zsh-action="add-to-cart" data-product-id="' + escapeHtml(m.productId) +
          '" data-product-name="' + escapeHtml(m.productName || "") + '"' + (added ? " disabled" : "") + ">" +
          (added ? "✓ Added" : "Add " + escapeHtml(m.productName || "") + " to Cart") +
          "</button>";
      }
      html += "</div>";
      return html;
    }).join("");

    if (sending) {
      msgs += '<div class="zsh-msg zsh-msg--ai"><div class="zsh-msg__bubble"><span class="zsh-typing"><span></span><span></span><span></span></span></div></div>';
    }

    var hasMsgs = (state.chatMessages || []).length > 0 || sending;

    var sendDisabled = sending || !(state.chatInput || "").trim();

    return '' +
      '<div class="zsh-chat">' +
        '<div class="zsh-chat__hd"><h4>Refine your recommendation</h4><span class="zsh-chip-tag">Chat</span></div>' +
        '<p class="zsh-chat__sub">Tell me what matters most to you and I\'ll adjust.</p>' +
        '<div class="zsh-chip-row">' + chips + '</div>' +
        (hasMsgs ? '<div class="zsh-thread">' + msgs + '</div>' : "") +
        (state.chatError ? '<div class="zsh-error">' + escapeHtml(state.chatError) + '</div>' : "") +
        '<div class="zsh-input-row">' +
          '<input class="zsh-input" data-zsh-chat-input type="text" ' +
            'placeholder="e.g. I work outdoors, need long battery..." ' +
            'value="' + escapeHtml(state.chatInput || "") + '"' + (sending ? " disabled" : "") + " />" +
          '<button class="zsh-btn zsh-btn--ai" data-zsh-action="chat-send"' + (sendDisabled ? " disabled" : "") + ">Send" + SEND_SVG + "</button>" +
        '</div>' +
      '</div>';
  }

  // ---------- animations ----------

  function startTypewriter(text) {
    if (typewriterTimer) { clearInterval(typewriterTimer); typewriterTimer = null; }
    var el = modalEl && modalEl.querySelector("[data-zsh-typewriter]");
    if (!el) { return; }
    text = text || "";
    if (!text) { el.textContent = ""; return; }

    el.textContent = "";
    // cursor
    var cursor = document.createElement("span");
    cursor.className = "zsh-cursor";
    el.appendChild(cursor);

    var i = 0;
    typewriterTimer = setInterval(function () {
      i++;
      el.textContent = text.slice(0, i);
      // re-append cursor (textContent wipes it)
      if (i < text.length) {
        var c = document.createElement("span");
        c.className = "zsh-cursor";
        el.appendChild(c);
      }
      if (i >= text.length) { clearInterval(typewriterTimer); typewriterTimer = null; }
    }, 14);
  }

  function animateConfidence(target) {
    target = Math.max(0, Math.min(100, target || 0));
    if (!modalEl) { return; }
    var fill  = modalEl.querySelector("[data-zsh-conf-fill]");
    var label = modalEl.querySelector("[data-zsh-conf-label]");
    if (!fill || !label) { return; }

    if (confidenceRaf) { cancelAnimationFrame(confidenceRaf); }
    var start = performance.now();
    var duration = 1100;
    function tick(now) {
      var t = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - t, 3);
      var v = Math.round(target * eased);
      fill.style.width = v + "%";
      label.innerHTML = "<strong>" + v + "%</strong>";
      if (t < 1) { confidenceRaf = requestAnimationFrame(tick); }
    }
    confidenceRaf = requestAnimationFrame(tick);
  }

  // ---------- event handlers ----------

  function handleAccept() {
    hideTrigger();
    state.comparison    = null;
    state.compareError  = null;
    state.chatMessages  = [];
    state.chatInput     = "";
    state.chatting      = false;
    state.chatError     = null;
    state.addedToCartId = null;
    state.usedChips     = {};
    openModal();
  }

  function handleDismiss() {
    hideTrigger();
    setDismissedSession();
  }

  function getCurrentIds() {
    if (state.selectedProductIds.length >= 2) {
      return [state.selectedProductIds[0], state.selectedProductIds[1]];
    }
    if (state.previewProducts.length >= 2) {
      return [state.previewProducts[0].product_id, state.previewProducts[1].product_id];
    }
    return [];
  }

  function handleCompare() {
    var ids = getCurrentIds();
    if (ids.length < 2) {
      state.compareError = "Not enough products to compare. Browse more items first.";
      state.comparing = false;
      renderModalBody();
      return;
    }

    state.comparing    = true;
    state.compareError = null;
    renderModalBody();

    fetchCompare(ids)
      .then(function (raw) {
        state.comparison = raw;
        state.comparing  = false;
        renderModalBody();
      })
      .catch(function () {
        state.compareError = "AI comparison is unavailable right now. Please try again.";
        state.comparing    = false;
        renderModalBody();
      });
  }

  function handleChatSend(chipText) {
    var text = (chipText || state.chatInput || "").trim();
    if (!text || state.chatting) { return; }

    var ids = getCurrentIds();
    if (ids.length < 2) { return; }

    state.chatMessages = state.chatMessages.concat([{ role: "user", text: text }]);
    state.chatInput    = "";
    state.chatting     = true;
    state.chatError    = null;
    if (chipText) { state.usedChips[chipText] = true; }
    renderModalBody();

    fetchCompare(ids, text)
      .then(function (raw) {
        // Alternative intent: swap the comparison pair entirely
        if (raw.intent === "alternative" && Array.isArray(raw.alternativeProducts) &&
            raw.alternativeProducts.length === 2) {
          var altA = raw.alternativeProducts[0];
          var altB = raw.alternativeProducts[1];
          state.selectedProductIds = [altA.id, altB.id];
          state.previewProducts = [
            normalizeProduct({ product_id: altA.id, name: altA.name, source: "alternative" }),
            normalizeProduct({ product_id: altB.id, name: altB.name, source: "alternative" })
          ];
        }

        state.comparison = raw;

        var recId   = raw.recommendedProductId;
        var ps      = state.previewProducts;
        var recName = "";
        for (var i = 0; i < ps.length; i++) {
          if (ps[i].product_id === recId) { recName = ps[i].name; break; }
        }

        var suggestion = raw.suggestionText ||
          ("My suggestion is " + recName + ". Are you OK with this choice?");
        if (raw.intent === "alternative") {
          suggestion = "I found a better match for your preference! " + suggestion;
        }

        state.chatMessages = state.chatMessages.concat([{
          role:        "ai",
          text:        suggestion,
          productId:   recId,
          productName: recName
        }]);
        state.chatting = false;
        renderModalBody();
      })
      .catch(function () {
        state.chatError = "Could not get a response. Please try again.";
        state.chatting  = false;
        renderModalBody();
      });
  }

  function handleAddToCart(productId, productName) {
    if (!productId) { return; }
    state.addedToCartId = productId;
    renderModalBody();
    showCartToast(productName);
    try {
      document.dispatchEvent(new CustomEvent("zs-add-to-cart", { // No I18N
        detail: { productId: productId, productName: productName }
      }));
    } catch (e) {}
  }

  function showCartToast(name) {
    var target = resolvePortalEl();
    if (!target) { return; }
    if (!cartToastEl) {
      cartToastEl = document.createElement("div");
      cartToastEl.className = "zsh-root zsh-cart-toast";
      target.appendChild(cartToastEl);
    }
    cartToastEl.innerHTML =
      '<span class="zsh-cart-toast__icon">' + CHECK_SVG + '</span>' +
      '<span><strong>' + escapeHtml(name || "Item") + '</strong> added to cart</span>';
    // Force reflow then add visible class
    void cartToastEl.offsetWidth;
    cartToastEl.classList.add("is-visible");
    clearTimeout(cartToastTimer);
    cartToastTimer = setTimeout(function () {
      if (cartToastEl) { cartToastEl.classList.remove("is-visible"); }
    }, 2400);
  }

  // ---------- public API ----------

  global.zsHelpMeDecide = {
    trackProductVisited:               trackProductVisited,
    getCurrentProductMeta:             getCurrentProductMeta,
    canShowComparisonPreconditionsMet: canShowComparisonPreconditionsMet,
    getVisitedVariantIds:              getVisitedVariantIds,
    fetchCanShowComparison:            callCanShowApi,
    pollNow:                           callCanShowApi
  };

  // ---------- bootstrap ----------

  function init() {
    if (initialized) { return; }
    if (global.zs_view !== "product") {
      if (global.zsHelpMeDecideConfig && global.zsHelpMeDecideConfig.debug) {
        console.warn("[Help Me Decide] Widget skipped: window.zs_view is not \"product\"."); // No I18N
      }
      return;
    }
    if (!document.getElementById("help-me-decide-root")) {
      if (global.zsHelpMeDecideConfig && global.zsHelpMeDecideConfig.debug) {
        console.warn("[Help Me Decide] Widget skipped: #help-me-decide-root not found."); // No I18N
      }
      return;
    }

    initialized = true;
    portalEl    = document.getElementById("help_me_decide_portal") || document.body;
    ensureFontLink();
    ensureStyles();

    var meta = getCurrentProductMeta();
    trackProductVisited(meta);

    pollIntervalId = setInterval(callCanShowApi, POLL_INTERVAL_MS);
    debugLog("widget initialised");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(typeof window !== "undefined" ? window : this);
