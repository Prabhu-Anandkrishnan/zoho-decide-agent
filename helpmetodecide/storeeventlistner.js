/**
 * Storefront variant listener — same logic as storeeventlistner.html.
 * Load after help_me_to_decide.js on product pages.
 */
(function () {
  "use strict"; // No I18N

  function warn(msg) {
    if (window.zsHelpMeDecideConfig && window.zsHelpMeDecideConfig.debug) {
      console.warn("[Help Me Decide]", msg); // No I18N
    }
  }

  function onSelectedVariant(e) {
    if (!window.zsHelpMeDecide) {
      warn("zsHelpMeDecide missing — load help_me_to_decide.js before this snippet.");
      return;
    }

    if (!e || !e.detail || e.detail.variant_id == null) { return; }

    var variantId = e.detail.variant_id;
    if (variantId === -1 || variantId === "-1") { return; }

    window.zsHelpMeDecide.trackProductVisited({ variant_id: String(variantId) });
    window.zsHelpMeDecide.pollNow();
  }

  function attachListener() {
    document.addEventListener("zp-event-selected-variant", onSelectedVariant, false);
    warn("zp-event-selected-variant listener attached.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", attachListener);
  } else {
    attachListener();
  }
})();
