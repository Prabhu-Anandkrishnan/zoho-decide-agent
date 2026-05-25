var scrollPosition, refineWrapper, stickyPosition, mobileHeaderStyle,
    mobileFilterContainer = document.querySelector('[data-zs-mobile-header-filterby]'),
    selectedFiltersContainer = document.querySelector('[data-zs-selected-filters-conatainer]'),
    mobileHeaderStyleIdentifier = document.querySelector('[data-zs-mobile-headerstyle]'),
    mobilecontentWrap = document.querySelector('[data-zs-mobile-content-wrap]');
var headerContainer = document.querySelector('[data-headercontainer]');
var contentContainer = document.querySelector('[data-theme-content-container]');
var footerContainer = document.querySelector('.theme-footer-area');
var allContainers = [headerContainer, contentContainer, footerContainer];

const closeSvgCursorURI = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2232%22%20height%3D%2232%22%20viewBox%3D%220%200%2032%2032%22%20fill%3D%22none%22%20data-ember-extension%3D%221%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20clip-rule%3D%22evenodd%22%20d%3D%22M16%2031C24.2843%2031%2031%2024.2843%2031%2016C31%207.71573%2024.2843%201%2016%201C7.71573%201%201%207.71573%201%2016C1%2024.2843%207.71573%2031%2016%2031Z%22%20stroke%3D%22%23979797%22%20stroke-width%3D%222%22/%3E%3Cpath%20d%3D%22M9%209L24%2024%22%20stroke%3D%22%23979797%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22square%22/%3E%3Cpath%20d%3D%22M8.49512%2023.4586L24.5049%209.54144%22%20stroke%3D%22%23979797%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22square%22/%3E%3C/svg%3E"; // No I18N

function handleKeyPressForClick(event, element) {
  if (event.key === 'Enter' || event.keyCode === 13) {
    element.click();
  }
}

if(mobileHeaderStyleIdentifier){
  mobileHeaderStyle = mobileHeaderStyleIdentifier.getAttribute("data-zs-mobile-headerstyle");// No I18N
}

if(window.zs_view == 'product'){
  let floatingContainer = document.querySelector('.theme-floating-add-to-cart');
  if(floatingContainer){
      isFloatingAddToCart = true;
      window.addEventListener('scroll', updateFloatingContainerVisibility);
      window.addEventListener('load', updateFloatingContainerVisibility);
  }
}

function updateFloatingContainerVisibility() {
  let mainContainer = document.querySelector('[data-zs-product-primary-details]').querySelector('.theme-product-quantity-cart-container');
  let floatingContainer = document.querySelector('.theme-floating-add-to-cart');
  let footerContainer = document.querySelector('.theme-footer-area');
  
  const shouldShowFloatingCTA = isOutOfViewport(mainContainer) && isOutOfViewport(footerContainer);

  floatingContainer.classList.toggle('theme-show-floating-cta', shouldShowFloatingCTA);// No I18N
  floatingContainer.classList.toggle('theme-hide-floating-cta', !shouldShowFloatingCTA);// No I18N
}


function isOutOfViewport(element) {
  let rect = element.getBoundingClientRect();
  return (
      rect.bottom < 0 ||
      rect.right < 0 ||
      rect.left > window.innerWidth ||
     rect.top > window.innerHeight
  );
}

function closeToastMessage(element){
  let toastElem = element.closest('[data-toast-type]'); // No I18N
  let toast = toastElem.getAttribute('data-toast-type'); // No I18N
  if(toast && toast == "success"){
    addClass(toastElem,'theme-cart-success-remove');
    removeClass(toastElem,'theme-cart-success');
  }
  else if(toast && toast == "failure"){
    addClass(toastElem,'theme-cart-failure-remove');
    removeClass(toastElem,'theme-cart-failure');
  }
}

function positionCartSuccessMsg() {
  var header = document.querySelector('.theme-header');
  var mobileheader = document.querySelector('.theme-mobile-header-top');
  var popups = document.querySelectorAll('[data-theme-message-two], [data-theme-message-six]');
  var popupSeven = document.querySelectorAll('[data-theme-message-seven]');
  function handlePosition(popup, headerTopVal, mobileTopVal, defaultTopVal) {
    var isHeaderVisible = header && header.getBoundingClientRect().bottom > 0;
    var isMobileheaderVisible = mobileheader && mobileheader.getBoundingClientRect().bottom > 0;
    if (isHeaderVisible) {
      popup.style.top = header.getBoundingClientRect().bottom + headerTopVal + 'px';
      popup.classList.remove('fixed'); // No I18N
    } else if (isMobileheaderVisible) {
      popup.style.top = mobileheader.getBoundingClientRect().bottom + mobileTopVal + 'px';
      popup.classList.remove('fixed'); // No I18N
    } else {
      popup.style.top = defaultTopVal + '%';
      popup.classList.add('fixed'); // No I18N
    }
  }

  function handleScroll() {
    if(popups){
      popups.forEach(function (popup) {
        handlePosition(popup, 16, 8, 2);
      });
    }
    else if(popupSeven){
      popupSeven.forEach(function (popup) {
        handlePosition(popup, 0, 0, 0);
      });
    }
  }
  handleScroll();
  window.addEventListener('scroll', handleScroll);
}

if (document.querySelector('[data-theme-message-two], [data-theme-message-seven]')) {
  window.addEventListener('load', positionCartSuccessMsg);
}

function slideRecommendedProds(elem, dir) {
  let section = elem.closest('.zprow'); // No I18N
  let carousel = section ? section.querySelector('[class*="theme-store-style-collection-row-"]') : null; // No I18N

  if (carousel) {
    let cards = carousel.children;
    let scrollAmt = cards.length > 0 ? cards[0].offsetWidth : 200;
    let containerWidth = carousel.scrollWidth - carousel.clientWidth;

    if (dir === "right") { 
      if (carousel.scrollLeft >= containerWidth) {
        carousel.scrollTo({ left: 0, behavior: "smooth" }); // No I18N
      } else {
        carousel.scrollBy({ left: scrollAmt, behavior: "smooth" }); // No I18N
      }
    } else if (dir === "left") { 
      if (carousel.scrollLeft <= 15) {
        carousel.scrollTo({ left: containerWidth, behavior: "smooth" }); // No I18N
      } else {
        carousel.scrollBy({ left: -scrollAmt, behavior: "smooth" }); // No I18N
      }
    }
  }
}

function customAttributeSelect(elem) {
  let container = elem.closest('.theme-product-sizes');// No I18N
  let selectedText = elem.getAttribute('data-value');
  if (container) {
    const selectElement = container.querySelector('select[data-zs-attribute-name]');
    if (selectElement) {
      const matchingOption = Array.from(selectElement.options).find(
        option => option.textContent.trim() === selectedText
      );
      if (matchingOption) {
        selectElement.value = matchingOption.value;

        const changeEvent = new Event('change', { bubbles: true }); // No I18N
        selectElement.dispatchEvent(changeEvent);
      }
    }

    const summaryElement = container.querySelector('.theme-custom-select-value');
    if (summaryElement) {
      const clickedOption = Array.from(container.querySelectorAll('.theme-custom-select-option')).find(
        opt => opt.getAttribute('data-value') === selectedText
      );

      if (clickedOption) {
        const colorLabel = clickedOption.querySelector('[data-theme-color-label]');
        const colorStyle = colorLabel ? colorLabel.style.background : '';

        if (colorStyle) {
          summaryElement.innerHTML = `
            <label style="display:inline-block; width:20px; height:20px; background:${colorStyle}; margin-right:8px; vertical-align:middle;"></label>${selectedText}`; // No I18N
        } else {
          summaryElement.textContent = selectedText;
        }
      }
    }

    const options = container.querySelectorAll('.theme-custom-select-option');
    if (options.length > 0) {
      options.forEach(opt => opt.classList.add('blur-option'));// No I18N
      const clickedOption = Array.from(options).find(
        opt => opt.getAttribute('data-value') === selectedText
      );
      if (clickedOption) {
        clickedOption.classList.remove('blur-option');// No I18N
      }
    }

    // Close the dropdown
    const detailsElement = container.querySelector('details'); // No I18N
    if (detailsElement) {
      detailsElement.removeAttribute('open'); // No I18N
    }
  }
}
// Close the dropdown when clicking outside
document.addEventListener('click', function(event) {
  const dropdowns = document.querySelectorAll('.theme-product-sizes details');
  dropdowns.forEach(dropdown => {
      const container = dropdown.closest('.theme-product-sizes');// No I18N
      if (container && !container.contains(event.target)) {
          dropdown.removeAttribute('open');
      }
  });
});
// Sync changes from the original <select> to the custom dropdown

function syncCustomDropdown(selectElement) {
  const container = selectElement.closest('.theme-product-sizes'); // No I18N
  if (container) {
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    const selectedText = selectedOption ? selectedOption.textContent.trim() : '';

    const summaryElement = container.querySelector('.theme-custom-select-value');
    if (summaryElement) {
      const clickedOption = Array.from(container.querySelectorAll('.theme-custom-select-option')).find(
        opt => opt.getAttribute('data-value') === selectedText
      );

      if (clickedOption) {
        const colorLabel = clickedOption.querySelector('[data-theme-color-label]');
        const colorStyle = colorLabel ? colorLabel.style.background : '';

        if (colorStyle) {
          summaryElement.innerHTML = `
            <label style="display:inline-block; width:20px; height:20px; background:${colorStyle}; margin-right:8px; vertical-align:middle;"></label>${selectedText}`; // No I18N
        } else {
          summaryElement.textContent = selectedText; 
        }
      }
    }

    const options = container.querySelectorAll('.theme-custom-select-option');
    if (options.length > 0) {
      options.forEach(opt => opt.classList.add('blur-option')); // No I18N
      const clickedOption = Array.from(options).find(
        opt => opt.getAttribute('data-value') === selectedText
      );
      if (clickedOption) {
        clickedOption.classList.remove('blur-option'); // No I18N
      }
    }
  }
}



document.querySelectorAll('select[data-zs-attribute-name]').forEach(selectElement => {
  selectElement.addEventListener('change', () => syncCustomDropdown(selectElement));
});

function detailtab(currTab){
  var allTabs = document.querySelectorAll('[data-detail-tab]');
  var allCont = document.querySelectorAll('[data-detail-tab-content]');
  for(at=0;at<allTabs.length;at++){
    removeClass(allTabs[at],'theme-prod-detail-tab-active');
  }
  for(ac=0;ac<allCont.length;ac++){
    removeClass(allCont[ac],'theme-prod-detail-tab-content-active');
  }
  var activetabVal = currTab.getAttribute('data-detail-tab');
  var activeCont = document.querySelectorAll('[data-detail-tab-content="'+activetabVal+'-content"]')[0];// No I18N
  addClass(currTab,'theme-prod-detail-tab-active');
  addClass(activeCont,'theme-prod-detail-tab-content-active')
}

function openQuickViewOnKeyPress(event, element){
  if (event.key === 'Enter' || event.keyCode === 13) {
    viewProductQuickLook(element.querySelector('[data-zs-product-url]'));
  }
}

function openSlidingFilter() {
  let filterContainer = document.querySelector('[data-zs-filter-container]');
  filterContainer.classList.toggle('theme-open-slider-filter'); // No I18N
  let isFilterOpen = filterContainer.classList.contains('theme-open-slider-filter');
  if(isFilterOpen) {
    let sortByContainer = document.querySelector('[data-theme-sortby-with-filter]');
    let isSortByDropDownOpen = sortByContainer?.querySelector('.theme-open-custom-sort');
    let isSortByToggleOpen = sortByContainer?.querySelector('.theme-toggle-open');
    let activeFilterBar = document.querySelector('.theme-category-filter-bar .zpfilter-active'); // No I18N
    activeFilterBar?.classList.remove('zpfilter-active'); // No I18N
    if(isSortByDropDownOpen && isSortByToggleOpen) {
      isSortByDropDownOpen.classList.remove('theme-open-custom-sort'); // No I18N
      isSortByToggleOpen.classList.remove('theme-toggle-open'); // No I18N
    }
  }
}

function activeThumbnail() {
  var prodId;
  var thumbNailsAtt = document.querySelectorAll("[data-thumbnail]");
  for (dt = 0; dt < thumbNailsAtt.length; dt++) {
    prodId = thumbNailsAtt[dt].getAttribute("data-thumbnail");
  }
  var thumbNails = document.querySelectorAll('[data-thumbnail="' + prodId + '"]'); // No I18N
  for (tn = 0; tn < thumbNails.length; tn++) {
    removeClass(thumbNails[tn], "theme-active-thumbnail");
  }
  if (thumbNails[0]) {
    addClass(thumbNails[0], "theme-active-thumbnail");
  }
}

/* PRODUCT FILTER MOBILE */

function mobileFilter() {
  var filterIcons = document.querySelectorAll('[data-theme-product-filter-mobile-icon],[data-theme-product-filter-type-mobile-icon]');// No I18N
  var filterContainer = document.querySelector('[data-zs-filter-container]');
  var filterOverlay = document.querySelector('[data-theme-product-filter-overlay]');// No I18N
  for (let filterIcon of filterIcons) {
    if (filterIcon) {
      filterIcon.addEventListener('click', function() {
        addClass(filterContainer, 'theme-mobile-filter-show');
        addClass(filterOverlay, 'theme-mobile-filter-overlay-show');
        document.getElementsByTagName("body")[0].style.overflow = 'hidden';
      });
    }
  }
  if (filterOverlay) {
    filterOverlay.addEventListener('click', function() {
      removeClass(this, 'theme-mobile-filter-overlay-show');
      removeClass(filterContainer, 'theme-mobile-filter-show');
      document.getElementsByTagName("body")[0].style.overflow = 'auto';
    });
  }
  window.addEventListener('resize', function(event) {
    if (document.documentElement.clientWidth > 992) {
      document.getElementsByTagName("body")[0].style.overflow = 'auto';
    }
  });
}
/* PRODUCT FILTER MOBILE END */

document.addEventListener("DOMContentLoaded", function(event) {
  activeThumbnail();
  mobileFilter();
  if(mobileHeaderStyle == '03'){
    mobileheaderThreeFilterSearch();
  }
});
function productQuantity(event) {
  var key = event.which || event.keyCode;
  var result;
  if (key == 8 || key == 46 || key == 37 || key == 39 || ( key > 47 && key < 58 )) {
    result = true;
  }
  else {
    result = false;
  }
  return result;
}
function getTargetContainer(element) {
  var targetContainer = (element) ? element.closest("[data-zs-product-id]") : "";// No I18N
  return targetContainer;
}
function increaseCount(e){
  var targetContainer = getTargetContainer(e);
  var quantity_inputs = (targetContainer && targetContainer != "") ? targetContainer.querySelectorAll("[data-zs-quantity]") : "";
  
  quantity_inputs.forEach(quantity_input => {
    var quantity = quantity_input.value;
    if( !isNaN( quantity )){
      quantity_input.value++;
    }
  })
  return false;
}
function decreaseCount(e){
  var targetContainer = getTargetContainer(e);
  var quantity_inputs = (targetContainer && targetContainer != "") ? targetContainer.querySelectorAll("[data-zs-quantity]") : "";
  
  quantity_inputs.forEach(quantity_input => {
  var quantity = quantity_input.value;
    if( !isNaN( quantity ) && quantity > 1 ) {
      quantity_input.value--;
    }
  })
  return false;
}
function selectcolor(currentcolor,selectedAttribute){
  var targetContainer = getTargetContainer(currentcolor);
  var currentcolorInput = currentcolor.firstElementChild;
	var colorAttrNameContainer = targetContainer.querySelectorAll('[data-zs-attribute-name="'+selectedAttribute+'"]')[0];// No I18N
	var colorLabel = colorAttrNameContainer.querySelectorAll("[data-theme-color-label]");// No I18N
	for(var cc = 0; cc < colorLabel.length; cc++){
		removeClass(colorLabel[cc],'chekedLabel');
    colorLabel[cc].setAttribute('aria-checked', 'false');
  }
	if (currentcolorInput.checked == true){
		addClass(currentcolor,'chekedLabel');
    updateVariantLabel();
    currentcolor.setAttribute('aria-checked', 'true');
	}
	else{
		removeClass(currentcolor,'chekedLabel');
    currentcolor.setAttribute('aria-checked', 'false');
  }
  // Sync only if floating cart exists
  let floatingCTA = document.querySelector('.theme-floating-add-to-cart');
  if (floatingCTA) {
    var selectedValue = currentcolorInput.value;

    // Find all containers with same attribute
    var allContainers = document.querySelectorAll('[data-zs-attribute-name="' + selectedAttribute + '"]');

    allContainers.forEach(container => {
      var labels = container.querySelectorAll('[data-theme-color-label]');
      labels.forEach(label => {
        var input = label.querySelector('input[type="radio"]');
        if (input && input.value === selectedValue) {
          addClass(label, 'chekedLabel');
        } else {
          removeClass(label, 'chekedLabel');
        }
      });
    });
  }
}
function selectVariant(currentVariant,selectedAttribute){
  var targetContainer = getTargetContainer(currentVariant);
  var currentVariantInput = currentVariant.querySelector('input[type="radio"]');
	var variantAttrNameContainer = targetContainer.querySelectorAll('[data-zs-attribute-name="'+selectedAttribute+'"]')[0];// No I18N
	var variantLabel = variantAttrNameContainer.querySelectorAll("[data-theme-variant-label]");// No I18N
	for(var cc = 0; cc < variantLabel.length; cc++){
		removeClass(variantLabel[cc],'chekedLabel');
    variantLabel[cc].setAttribute('aria-checked', 'false');
  }
  if (currentVariantInput.checked == true){
    addClass(currentVariant,'chekedLabel');
    updateVariantLabel();
    currentVariant.setAttribute('aria-checked', 'true');
  }
	else{
		removeClass(currentVariant,'chekedLabel');
    currentVariant.setAttribute('aria-checked', 'false');
  }
}
function updateVariantLabel() {
  let attributeInputs = document.querySelectorAll("[data-zs-attribute-select] input[type='radio']");
  if (attributeInputs) {
    attributeInputs.forEach((radio) => {
      radio.addEventListener("change", function () {
        const variantContainer = this.closest(".theme-list-variants"); // No I18N
        if (variantContainer) {
          const selectedVariantSummary = variantContainer.querySelector("[data-zs-selected-variant]");
          const variantsName = variantContainer.querySelectorAll("[data-zs-attribute-name]");
          if (!variantContainer.variantState) {
            variantContainer.variantState = {};
          }

          const attributeName = this.closest("[data-zs-attribute-select]").getAttribute("data-zs-attribute-name"); // No I18N
          const text = this.getAttribute("data-text");

          variantContainer.variantState[attributeName] = text;
          const variantSelectedContainer = [];
          variantsName.forEach((variant) => {
            const name = variant.getAttribute("data-zs-attribute-name");
            if (variantContainer.variantState[name]) {
                variantSelectedContainer.push(variantContainer.variantState[name]);
            }
          });

          selectedVariantSummary.textContent = variantSelectedContainer.join(", ");
        }
      });
    });
  }
}
function toggleVariantDetails() {
  let detailElements = document.querySelectorAll('.theme-list-variants');
  if(detailElements) {
    detailElements.forEach(details => {
      details.addEventListener('toggle', function () {
        if (this.open) {
          detailElements.forEach(element => {
            if (element !== this) {
              element.removeAttribute('open');
            }
          });
        }
      });
    });
  }
}
function selectColorImage(label, attribute) {
  selectcolor(label, attribute);
  setTimeout(() => {
    var selectedVariant = label.querySelector('input[type="radio"]:checked');
    let productContainer = label.closest('[data-zs-wrapping-category-id][data-zs-product-id]'); // No I18N
    if (selectedVariant && productContainer) {
      let variantSelect = productContainer.querySelector('[data-zs-variants]'); // No I18N
      var variantId = selectedVariant.value;
      var productImage = productContainer.querySelector('.theme-product-image-area img'); // No I18N
      var originalSrc = productContainer.querySelector('.theme-product-image-area .theme-org-img').getAttribute('data-src'); // No I18N
      var foundMatchingImage = false;

      for (const option of variantSelect.options) {
        const zsAttributes = option.getAttribute('data-zs-attributes');
        if (zsAttributes && zsAttributes.includes(variantId) && !option.getAttribute('data-zs-images').includes('-1')) {
          const imageUrl = option.getAttribute('data-zs-img-url');
          productImage.src = imageUrl;
          productImage.setAttribute('data-src', imageUrl);
          foundMatchingImage = true;
          break;
        }
      }
      if (!foundMatchingImage) {
        productImage.src = originalSrc.includes('no-preview-image') ? originalSrc : originalSrc + '/400x400';
        productImage.setAttribute('data-src', originalSrc);
      }
    }
  }, 250);
}
function removePriceMask() {
	if (window.zs_rendering_mode != 'live') {
		var priceMaskContainers = document.querySelectorAll('.price-mask');
		priceMaskContainers.forEach(function(container) {
			container.classList.remove('price-mask'); // No I18N
		});
	}
}
function viewProductQuickLook (span) {
  setInertAttribute(allContainers);
  var productLookUpUrl = span.getAttribute("data-zs-product-url");
  productLookUpUrl += "?quick_look=true"; // No I18N
  var xhttp = new XMLHttpRequest();
  var qvInputTargetId = document.getElementById('product_quick_look');
  let listStyle = span.closest('[data-zs-product-id]'); // No I18N
  let isListStyleEleven = listStyle ? listStyle.classList.contains('theme-product-list-style-11') : null;
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      setInnerHTMLForId("product_quick_look", this.responseText);
			$E.dispatch(document.body,'quickview:opened');
      removePriceMask();
      if(isListStyleEleven){
        repositionQuickViewContainer(listStyle, qvInputTargetId);
      }
      try {
        cart.productQuickLookAddToCart();
      } catch(e) {
      }

      var thumbNailsAtt = document.querySelectorAll('[data-thumbnail]');
      var prodId;
      for (dt = 0; dt < thumbNailsAtt.length; dt++) {
        prodId = thumbNailsAtt[dt].getAttribute("data-thumbnail");
      }
			if(prodId){
	      var thumbNails = document.querySelectorAll('[data-thumbnail="'+prodId+'"]');
	      for(tn=0;tn < thumbNails.length; tn++){
          removeClass(thumbNails[tn],'theme-active-thumbnail');
        }
	      if(thumbNails[0]){
	        addClass(thumbNails[0],'theme-active-thumbnail');
        }
      }
			product_list_coupon.handleQuickViewCoupons(document.getElementById("product_quick_look"));
      multi_currency.convertCurrencyPrice();

      deliveryLocationPinInput = qvInputTargetId.querySelector('[data-zs-delivery-location-postalcode]');
    	deliveryLocationPinError = qvInputTargetId.querySelector('[data-zs-delivery-availability-product-details-error-message]');
    	deliveryLocationPinValidate(deliveryLocationPinInput,deliveryLocationPinError);
    }
  };
  xhttp.open("GET", productLookUpUrl, true);
  xhttp.send();
	document.getElementsByTagName("body")[0].style.overflow = 'hidden';
}

function repositionQuickViewContainer(productCard, quickViewContainer) {
  let quickView = quickViewContainer.querySelector(".theme-product-quick-view-inner");
  if (productCard && quickView) {
    let card = productCard.getBoundingClientRect();

    let topPosition = card.top;
    let leftPosition = card.right + 10; 

    const quickViewHeight = quickView.offsetHeight;
    const quickViewWidth = quickView.offsetWidth;

    const spaceRight = window.innerWidth - card.right; 
    const spaceLeft = card.left;

    if (leftPosition + quickViewWidth > window.innerWidth && spaceLeft >= quickViewWidth) {
      leftPosition = card.left - quickViewWidth - 10; 
    } 
    else if (spaceRight < quickViewWidth && spaceLeft < quickViewWidth) {
      leftPosition = card.left + (card.width / 2) - (quickViewWidth / 2); 
      if (leftPosition < 10) leftPosition = 10; 
      if (leftPosition + quickViewWidth > window.innerWidth) leftPosition = window.innerWidth - quickViewWidth - 10;
    }
    if (topPosition + quickViewHeight > window.innerHeight) {
        topPosition = window.innerHeight - quickViewHeight - 10;
    }
    if (topPosition < 0) {
        topPosition = 10;
    }
    quickView.style.top = `${topPosition}px`;
    quickView.style.left = `${leftPosition}px`;
  }
}

function closeProductQuickLook(e) {
  removeInertAttribute(allContainers);
  var prodQuickLook = document.getElementById("product_quick_look");
  if (typeof wishlist != "undefined" && window.zs_wishlist_enabled) {
    var wishlistVariantId = prodQuickLook && prodQuickLook.getElementsByClassName('wishlist-selection-container')[0] && prodQuickLook.getElementsByClassName('wishlist-selection-container')[0].getAttribute('data-zs-wishlist-variant-id');
    if (wishlistVariantId) {
       wishlist.initForElement(wishlistVariantId, true);
    }
  }
  if (prodQuickLook) {
    setInnerHTMLForId("product_quick_look", "");
  }
  document.getElementsByTagName("body")[0].style.overflow = "auto";
  $E.dispatch(document.body, "quickview:closed");
}

document.onkeydown = function(e) {
  e = e || window.event;
  if (e.keyCode == 27) {
    closeProductQuickLook();
  }
};

function showDetailImage(thisel) {
  var prodId = thisel.getAttribute("data-thumbnail");
  var imgId = thisel.getAttribute("data-thumbnail-active");
  var thisImg = thisel.getElementsByTagName("img")[0];
  var imgUrl = thisImg.getAttribute("data-image-resolution");
  var imageLoadingOverlay = document.querySelectorAll('[data-theme-image-overlay="theme-image-overlay-' + prodId + '"]');
  imageLoadingOverlay.forEach(function (overlay) {
    overlay.style.display = "block";
  });

  // Get all detail images for the product
  var detailImages = document.querySelectorAll('[data-detail-image="theme-detail-image-' + prodId + '"]');
  var activeImage = document.querySelectorAll('[data-thumbnail-active="' + imgId + '"]')[0];
  var imgAlt = thisImg.getAttribute("alt");

  // Update all detail images
  detailImages.forEach(function (detailImage) {
    // Apply fade-out effect before changing the image
    detailImage.style.opacity = "0";
    detailImage.style.transition = "opacity 0.3s ease-in-out"; // No I18N
    setTimeout(() => {
      detailImage.setAttribute("alt", imgAlt);
      detailImage.setAttribute("title", imgAlt);
      detailImage.setAttribute("src", imgUrl);
    }, 150);
    // Handle image load for each detail image
    detailImage.onload = function () {
      imageLoadingOverlay.forEach(function (overlay) {
        overlay.style.display = "none";
      });
      detailImage.style.opacity = "1";
    };
  });

  // Reset active thumbnail classes
  var thumbNails = document.querySelectorAll('[data-thumbnail="' + prodId + '"]');
  for (var i = 0; i < thumbNails.length; i++) {
    thumbNails[i].className = thumbNails[i].className.replace("theme-active-thumbnail", "");
  }

  // Add active class to the clicked thumbnail
  addClass(activeImage, "theme-active-thumbnail");
}


function showPreviousImage() {
  const activeThumbnail = document.querySelector('.theme-active-thumbnail');
  const thumbnails = document.querySelectorAll('.theme-product-detail-thumbnail');
  const activeIndex = Array.from(thumbnails).indexOf(activeThumbnail);

  for (let i = 1; i < thumbnails.length; i++) {
      const prevIndex = (activeIndex - i + thumbnails.length) % thumbnails.length; 
      const prevThumbnail = thumbnails[prevIndex];
      if (window.getComputedStyle(prevThumbnail).display !== 'none') {
          showDetailImage(prevThumbnail);
          break;
      }
  }
}

function showNextImage() {
  const activeThumbnail = document.querySelector('.theme-active-thumbnail');
  const thumbnails = document.querySelectorAll('.theme-product-detail-thumbnail');
  const activeIndex = Array.from(thumbnails).indexOf(activeThumbnail);

  for (let i = 1; i < thumbnails.length; i++) {
      const nextIndex = (activeIndex + i) % thumbnails.length; 
      const nextThumbnail = thumbnails[nextIndex];
      if (window.getComputedStyle(nextThumbnail).display !== 'none') {
          showDetailImage(nextThumbnail);
          break;
      }
  }
}

function hideCurrency() {
  var currencyList = document.querySelectorAll("[data-theme-currency-list]");
  var currencyListContainer = document.querySelector("[data-theme-currency-list-ul]");
  var currencyHideOverlay = document.querySelector("[data-theme-currency-hide-overlay]");
  var resMenu = document.querySelector('[data-non-res-menu="zptheme-menu-non-res"]');
  var currencyMobileOpenTop = document.querySelector("[data-theme-currency-open-top]");
  for (cur = 0; cur < currencyList.length; cur++) {
    currencyList[cur].style.display = "none";
    currencyListContainer.firstChild.style.display = "flex";
    removeClass(currencyListContainer, "theme-currency-open");
  }
  currencyHideOverlay.style.display = "none";
  currencyMobileOpenTop.style.display = "none";
  removeClass(resMenu, "theme-change-zindex");
}
function closeCurrencyMobile(){
	var currencyList = document.querySelectorAll('[data-theme-currency-list]');
	var currencyListContainer = document.querySelector('[data-theme-currency-list-ul]');
	var currencyHideMobile = document.querySelector('[data-theme-currency-hide-mobile]');
	var currencyMobileOpenTop = document.querySelector('[data-theme-currency-open-top]');
	var menuId = currencyListContainer.getAttribute('data-theme-currency-list-ul');
  var menuClose = document.querySelector('[data-zp-burger-clickable-area="'+menuId+'"]');
	var resMenu = document.querySelector('[data-non-res-menu="zptheme-menu-non-res"]');
	for(cur=0;cur<currencyList.length;cur++){
		currencyList[cur].style.display = 'none';
		currencyListContainer.firstChild.style.display = "flex";
		removeClass(currencyListContainer,'theme-currency-open');
	}
  if(!['03', '04', '05'].includes(mobileHeaderStyle)){
	  menuClose.click();
  }
	currencyHideMobile.style.display = "none";
	currencyMobileOpenTop.style.display = "none";
	removeClass(resMenu,'theme-change-zindex');
}
function currentCurrency(currentList) {
  var currencyListContainer = document.querySelector("[data-theme-currency-list-ul]");
  var currenyOpen = currencyListContainer.classList.contains("theme-currency-open");
  var currencyList = document.querySelectorAll("[data-theme-currency-list]");
  var menuId = currencyListContainer.getAttribute("data-theme-currency-list-ul");
  var currencyMobileOpenTop = document.querySelector("[data-theme-currency-open-top]");
  var menuClose = document.querySelector('[data-zp-burger-clickable-area="' + menuId + '"]');
  var resMenu = document.querySelector('[data-non-res-menu="zptheme-menu-non-res"]');
  if (currentList != currencyListContainer.childNodes[0]) {
    currencyListContainer.insertBefore(currentList,currencyListContainer.childNodes[0]);
    var storeCurrencyMeta = localStorage.getItem("store_currency_meta"); // No I18N
    if(storeCurrencyMeta) {
      storeCurrencyMeta = JSON.parse(storeCurrencyMeta);
      storeCurrencyMeta.selected_currency_set_by_customer = true;
      localStorage.setItem("store_currency_meta", JSON.stringify(storeCurrencyMeta)); // No I18N
    }
    multi_currency.change(currentList.innerText);
  }
  if (currenyOpen == true && !["03", "04", "05"].includes(mobileHeaderStyle)) {
    menuClose.click();
  }
  currencyMobileOpenTop.style.display = "none";
  if (window.innerWidth <= 992) {
    for (cur = 0; cur < currencyList.length; cur++) {
      currencyList[cur].style.display = "none";
      currencyListContainer.firstChild.style.display = "flex";
      removeClass(currencyListContainer, "theme-currency-open");
    }
    if (resMenu) {
      removeClass(resMenu, "theme-change-zindex");
    }
  }
}

function informMerchantAboutFailureTransaction() {
  if (typeof cart != "undefined") {
    cart.mailMerchantAboutFailureTransaction();
  }
}


/* ERROR MESSAGE FUNCTIONS START */

var ERROR_MESSAGE = "error_msg";

function addErrorMsg(data) {
  /*
   * add element error message. and scroll to error element of current postion
   *
   * @param data Object
   * element is String
   * message is String
   * scroll is boolean (optional)
   * scrollTopPosition is boolean (option)
   */
  //Incase element is undefined, then error message cannot be shown
  if (!data.element) {
    return;
  }
  if (data.scroll) {
    /**
     * Browser scrollbar scroll to element view area
     * reference ht tps://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView
     */
    var target_element = data.scrollViewElem || data.element;
    target_element.scrollIntoView && target_element.scrollIntoView(data.scrollTopPosition);
  }

  //need to check error is already added to this element

  if (_hasError(data.element)) {
    _removeErrorElement(data.element);
  }
  data.element.onkeydown = _removeError;

  if (
    data.element.nodeName === "SELECT" || data.element.hasAttribute("data-onchange-event") // No i18n
  ) {
    data.element.onchange = _removeError;
  }

  var span_element = document.createElement("span");
  span_element.className = ERROR_MESSAGE;
  $D.css(span_element, "clear", "both");
  $D.css(span_element, "display", "block");
  $D.css(span_element, "padding", "7px 0");
  $D.css(span_element, "width", "100%");
  var content = '<span style="color:#E54D42;white-space:normal;">' + data.message + "</span>";
  setInnerHTMLForElement(span_element, content);
  if (data.element.parentNode) {
    data.element.parentNode.appendChild(span_element);
  }
}

function _hasError(element) {
  if (element && element.parentNode) {
    return $D.getByClass(ERROR_MESSAGE, element.parentNode).length > 0;
  }
  return false;
}

function _removeError() {
  _removeErrorElement(this);
}

function _removeErrorElement(element) {
  if (_hasError(element) && element.parentNode) {
    var error_element = $D.getByClass(ERROR_MESSAGE, element.parentNode);
    for (var i = 0, length = error_element.length; i < length; i++) {
      if (error_element[i]) {
        $D.remove(error_element[i]);
      }
    }
  }
}

/* ERROR MESSAGE FUNCTIONS END */

/* PRODUCT COUPON FUNCTION START */

function showCoupons(el) {
  var couponContainerToggle = el.parentNode.querySelector(".theme-prod-coupons-container-toggle");
  var couponHideBtn = el.parentNode.querySelector(".theme-prod-coupons-hide-btn");
  el.style.display = "none";
  couponContainerToggle.parentNode.style.height = couponContainerToggle.clientHeight + "px";
  couponHideBtn.style.display = "block";
}

function hideCoupons(el) {
  var couponContainerToggle = el.parentNode.querySelector('.theme-prod-coupons-container-toggle');
  var couponShowBtn = el.parentNode.querySelector('.theme-prod-coupons-show-btn');
  el.style.display = "none";
  couponContainerToggle.parentNode.style.height = "0px";
  couponShowBtn.style.display = "block";
}

/* PRODUCT COUPON FUNCTION END */

/* START: Common Methods */

function removeClass(element, class_name) {
  if (element) {
    element.className = element.className.replace(class_name, "");
  }
}
function addClass(element, class_name) {
  if (element) {
    element.classList.add(class_name);
  }
}

function showElementWithId(id, value) {
  value = !value ? "" : value;
  showElement($D.getById(id), value);
}

function showElement(element, value) {
  if (element) {
    element.style.display = !value ? "" : value;
  }
}

function hideElementWithId(id) {
  hideElement($D.getById(id));
}

function hideElement(element) {
  if (element) {
    element.style.display = "none";
  }
}

function setInnerTextForId(id, value) {
  setInnerTextForElement($D.getById(id), value);
}

function setInnerTextForElement(element, value) {
  if (element) {
    element.innerText = value;
  }
}

function setInnerHTMLForId(id, value) {
  setInnerHTMLForElement($D.getById(id), value);
}

function setInnerHTMLForElement(element, value) {
  if (element) {
    element.innerHTML = value;
  }
}

function setContentToClass(class_id, content) {
  var content_place_holders = $D.getByClass(class_id);
  for (var i = 0; i < content_place_holders.length; i++) {
    var content_place_holder = content_place_holders[i];
    setInnerHTMLForElement(content_place_holder, content);
  }
}

function replaceClassInElementFromDataAttribute(data_attribute, existing_class_name, to_be_replaced_class_name) {
  var element = $D.get("[" + data_attribute + "]");
  replaceClassInElement(element, existing_class_name, to_be_replaced_class_name);
}

function replaceClassInElement(element, existing_class_name, to_be_replaced_class_name) {
  if(element) {
    element.classList.replace(existing_class_name, to_be_replaced_class_name);
  }
}

function currencyContainerCheck() {
  var currencyContainerButton = document.querySelector("[data-theme-currency-list-container]");
  var currencyContainer = currencyContainerButton.querySelector("[data-theme-currency-list-ul]");
  var isCurrencyContainerOpen;
  if (currencyContainerButton) {
    var observerCurrencyContainerChanged = new MutationObserver(function () {
      isCurrencyContainerOpen = currencyContainer.classList.contains("theme-currency-open");
      if (!isCurrencyContainerOpen) {
        currencyContainerButton.addEventListener("click", isOpenCurrency);
      }
    });
    observerCurrencyContainerChanged.observe(currencyContainer, {attributes: true,childList: true,subtree: true});
  }
}

function isOpenCurrency(){
  var currencyContainerButton = document.querySelector('[data-theme-currency-list-container]');
  currencyContainerButton.addEventListener('click',openCurrency);
}

function scrollPositionCheck() {
  var positionY = mobilecontentWrap.scrollTop;
  if (positionY > stickyPosition) {
    if (positionY > scrollPosition) {
      refineWrapper.classList.add("hide-refine-wrapper"); // No i18n
    } else {
      refineWrapper.classList.remove("hide-refine-wrapper"); // No i18n
    }
    scrollPosition = positionY;
  }
}

function newFilterUpdated(){
  var selectedFilters = selectedFiltersContainer.querySelectorAll('[data-zs-selected-filter]');
  var selectedFiltersCount = mobileFilterContainer.querySelector('[data-zs-mobile-header-filter-selectedcount]');
  if(selectedFilters.length > 0){
      selectedFiltersCount.innerHTML = "("+selectedFilters.length+")";
      if(!selectedFiltersCount.classList.contains('filter-selectedcount-active')){
          selectedFiltersCount.classList.add('filter-selectedcount-active');
}
  }else{
      selectedFiltersCount.classList.remove('filter-selectedcount-active');
  }
}

function toggleFilters() {
  let filterIcon = document.querySelector("[data-toggle-filters]");
  let collectionContainer = document.querySelector(".theme-collection-section");
  let isSortByDropDownOpen = document.querySelector(".theme-open-custom-sort");
  let isSortByDropDownToggleOpen = document.querySelector(".theme-toggle-open");
  
  if(isSortByDropDownOpen && isSortByDropDownToggleOpen) {
    isSortByDropDownOpen.classList.remove("theme-open-custom-sort"); // No I18N
    isSortByDropDownToggleOpen.classList.remove("theme-toggle-open"); // No I18N
  }

  filterIcon.classList.toggle("theme-open-filters"); // No I18N
  collectionContainer.classList.toggle("theme-productfilter-hidden"); // No I18N
}

// Select all search containers
const searchContainers = document.querySelectorAll(".theme-neobrutal-search-field-container");// No I18N

// Add event listener to each search icon to toggle the corresponding search container
if(searchContainers){
  searchContainers.forEach((container) => {
    const menu = container.closest("[data-menu-and-search]");// No I18N
    const searchIcon = menu.querySelector("[data-zs-search-icon]");

    function toggleNeoBrutalSearch(elem) {
      let searchContainer = elem.closest("[data-menu-and-search]"); // No I18N
      searchContainer.classList.toggle("theme-neobrutal-search-open");// No I18N
      if (searchContainer.classList.contains("theme-neobrutal-search-open")) {// No I18N
        searchContainer.querySelector("input").focus();
        searchContainer.querySelector("input").value = "";
        elem.style.display = "none";
        document.body.style.cursor = `url(${closeSvgCursorURI}) 16 16, auto`;
      } else {
        elem.style.display = "block";
        document.body.style.cursor = "auto";
      }
    }

    function closeSearchContainer() {
      if (searchIcon) {
        searchIcon.style.display = "block";
        menu.classList.remove("theme-neobrutal-search-open");// No I18N
        document.body.style.cursor = "auto";
      }
      let suggestionWrappers = document.querySelectorAll('.theme-search-suggestion-overlay');
      if (suggestionWrappers) {
        let body = document.querySelector('body');
        body.classList.remove('theme-body-hide-overflow'); // No I18N
        suggestionWrappers.forEach(wrapper => {
          wrapper.classList.remove('theme-show-overlay'); // No I18N
        })
      }
    }

    // Event listener to open/close search container on icon click
    if (searchIcon){
      searchIcon.addEventListener("click", function () {
        toggleNeoBrutalSearch(this);
      });
    }

    // Event listener for clicking outside to close the search container
    document.addEventListener("click", function (event) {
      if (container && menu.classList.contains("theme-neobrutal-search-open") && !container.contains(event.target) && !searchIcon.contains(event.target)) {// No I18N
        closeSearchContainer();
      }
    });
  });
}


function submitSearch(searchIcon){
  let isFormOpen = searchIcon.closest('.theme-search-open');// No I18N
  let searchform = searchIcon.closest('form'); // No I18N
  if (searchform){
    if(isFormOpen){
        searchform.submit(); 
    }
    else{
        toggleFullSearchbox(searchIcon);
    }
  }
}

/* END: Common Methods */

/* START: Mobile Header style three filter and search */

function mobileheaderThreeFilterSearch() {
  var headerTop = document.querySelector("[data-zs-mobile-header-three-top]");
  refineWrapper = document.querySelector("[data-zs-mobile-header-refine-wrapper]");
  if (headerTop && refineWrapper) {
    stickyPosition = headerTop.clientHeight + refineWrapper.clientHeight;
    refineWrapper.style.top = headerTop.clientHeight;
    scrollPosition = stickyPosition;
    if (mobilecontentWrap) {
      mobilecontentWrap.addEventListener("scroll", scrollPositionCheck);
    }
  } else if (refineWrapper) {
    scrollPosition = refineWrapper.clientHeight;
  }
  if (mobileFilterContainer && selectedFiltersContainer) {
    newFilterUpdated();
    var observerNewFilterUpdated = new MutationObserver(newFilterUpdated);
    observerNewFilterUpdated.observe(selectedFiltersContainer, {attributes: true,childList: true,subtree: true});
  }
  var currencyContainerButton = document.querySelector("[data-theme-currency-list-container]");
  if (currencyContainerButton) {
    var observerCurrencyLoaded = new MutationObserver(currencyContainerCheck);
    observerCurrencyLoaded.observe(currencyContainerButton, {attributes: true, childList: true, subtree: true});
  }
  document.addEventListener("zp-event-search-success", function (e) {
    document.querySelector("[data-zs-mobile-header-search] [data-zs-search-input]").value = e.detail.searchTerm;
  },false);
  document.addEventListener("zp-event-search-pending",function () {
    document.querySelector("[data-zs-mobile-header-search] [data-zs-search-input]").blur();
  },false);
}
/* END: Mobile Header style three filter and search */

function closeSlidingCart() {
  document.getElementsByTagName('body')[0].style.overflow = 'auto';
  removeInertAttribute(allContainers);
  let slidingCart = document.querySelector('.theme-sliding-cart-container');
  if(slidingCart) {
    slidingCart.classList.add('theme-close-sliding-cart'); // No I18N
  }
}

function setInertAttribute(containers) {
  containers.forEach(container => {
    if (container) {
      container.setAttribute('inert', '');
    }
  });
}
function removeInertAttribute(containers) {
  containers.forEach(container => {
      if (container) {
          container.removeAttribute('inert');
      }
  });
}
function loadCartDrawer() {
  if(window.zs_view == 'checkout') {
    viewCartInCheckout();
  }
  if (sessionStorage.getItem('cartRedirectAction') === 'true') {
    sessionStorage.removeItem('cartRedirectAction'); // No I18N
    handleMiniCart(false);
  }
  if (sessionStorage.getItem('quoteRedirectAction') === 'true') {
    sessionStorage.removeItem('quoteRedirectAction'); // No I18N
    handleMiniCart(true);
  }
  let cartIcons = document.querySelectorAll('[data-zs-view-mini-cart]');
  let addToCartButtons = document.querySelectorAll('[data-zs-view-mini-cart-button][data-zs-add-to-cart]');
  let quoteIcons = document.querySelectorAll('[data-zs-view-mini-quote]');
  let addToQuoteButtons = document.querySelectorAll('[data-zs-view-mini-quote-button][data-zs-add-to-quote]');
  if(addToCartButtons && addToCartButtons.length > 0){
    document.addEventListener("zp-event-add-to-cart-success",() => handleMiniCart(false));
  }
  cartIcons.forEach((icon) => {
    icon.addEventListener('click', () => handleMiniCart(false));
  });
  if(addToQuoteButtons && addToQuoteButtons.length > 0){
    document.addEventListener("zp-event-add-to-cart-success", () => handleMiniCart(true) );
  }
  quoteIcons.forEach((icon) => {
    icon.addEventListener('click', () => handleMiniCart(true));
  });
  
  document.addEventListener("zp-event-minicart-open-success", enableMinicartButtons);
}

function enableMinicartButtons() {
  var minicartElements = document.querySelectorAll('[data-zs-view-mini-cart]');
  for (var i = 0; i < minicartElements.length; i++) {
    minicartElements[i].disabled = false;
  }
}

function handleMiniCart(isQuote) { 
  var minicartPendingEvent = new CustomEvent("zp-event-minicart-pending", { // No I18N
    detail: {
      isQuote: isQuote
    }
  });
  document.dispatchEvent(minicartPendingEvent);
  
  var minicartElements = document.querySelectorAll('[data-zs-view-mini-cart]');
  for (var i = 0; i < minicartElements.length; i++) {
    minicartElements[i].disabled = true;
  }
  
  document.getElementsByTagName("body")[0].style.overflow = 'hidden';
  let cartSuccessToastMessage = document.querySelector('[data-cart-add-success].theme-cart-success');
  if(cartSuccessToastMessage) {
    cartSuccessToastMessage.classList.replace('theme-cart-success', 'theme-cart-success-remove'); // No I18N
  }
  let url = '/mini-cart'; // No I18N
  if (isQuote && getCookie('zqid')) {
    url += '?cart_id=' + getCookie('zqid'); // No I18N
  }
  $X.get({
    url: url,
    handler: function () {
      let target = document.querySelector('.theme-sliding-cart-container');
      var miniCartData = this.responseText;
      if(miniCartData){
        if(target) {
          target.outerHTML = miniCartData;
          setInertAttribute(allContainers);
        }
        else{
          target = document.querySelector('.theme-cart-delete-failure-message');
          let cartContainer = document.createElement('div');
          target.insertAdjacentElement('afterend',cartContainer); // No I18N
          cartContainer.outerHTML = miniCartData;
          setInertAttribute(allContainers);
        }
        if (multi_currency.convertContainerOnDemand) {
        let currencyContainer = document.querySelector('[data-zs-currency-list]');
          if (currencyContainer) {
            multi_currency.convertContainerOnDemand('mini-cart'); // No I18N
          }
        }
      } else {
        var minicartElements = document.querySelectorAll('[data-zs-view-mini-cart]');
        for (var i = 0; i < minicartElements.length; i++) {
          minicartElements[i].disabled = false;
        }
      }
      setTimeout(() => {
        zsUtils.onDocumentReady(cart.init);
        if(miniCartData) {
          var cartOpenSuccess = new CustomEvent("zp-event-minicart-open-success", { // No I18N
            detail: {
              cart: miniCartData,
              view: window.zs_view || "store_page" // No I18N
            }
          });
          document.dispatchEvent(cartOpenSuccess);
        }
        else {
          var cartOpenFailure = new CustomEvent("zp-event-minicart-open-failure", { // No I18N
            detail: {
              view: window.zs_view || "store_page" // No I18N
            }
          });
          document.dispatchEvent(cartOpenFailure);
        }
      },500);
    },
    error: {
      handler: enableMinicartButtons(),
      condition: function() {
        return this.status >= 300;
      }
    }
  })
}
let listLayout17 = document.querySelector('.theme-product-list-style-17');
document.addEventListener('DOMContentLoaded',loadCartDrawer);
document.addEventListener('quickview:opened',loadCartDrawer);
document.addEventListener('DOMContentLoaded', () => {
  if(listLayout17) {
    updateVariantLabel();
    toggleVariantDetails();
  }
});
document.addEventListener('zp-event-recommended-products-loaded' ,() => {
  if(listLayout17) {
    updateVariantLabel();
    toggleVariantDetails();
  }
})


function viewCartInCheckout() {
  let miniCartCheckout = document.querySelector('[data-zs-view-mini-cart]');
  if(miniCartCheckout){
    const viewCartElement = document.querySelector('.theme-checkout-breadcrum li:nth-child(2) a');
    viewCartElement.addEventListener('click', (event) => {
      event.preventDefault();
      history.back();
      if (zs_checkout && zs_checkout.is_quote) {
        sessionStorage.setItem('quoteRedirectAction', 'true'); // No I18N
      } else {
        sessionStorage.setItem('cartRedirectAction', 'true'); // No I18N
      }
    })
  } 
}

document.addEventListener('keydown', function(event) {
  let focusedElement = document.activeElement;
  if ((focusedElement.hasAttribute('data-zs-qty-dec')) && (event.key === 'ArrowDown')) {
    event.preventDefault();
    decreaseCount(focusedElement);
  }
  if ((focusedElement.hasAttribute('data-zs-qty-inc')) && (event.key === 'ArrowUp')) {
    event.preventDefault();
    increaseCount(focusedElement);
  }
});

// START: Wishlist functions

function addToWishlistFromList(variantId, wishlistElement) {
  if (wishlistElement.getAttribute('data-zs-wishlisted') === 'true') {
    this.deleteVariantInWishList(wishlistElement, true);
  } else {
    this.addVariantToWishlistApi(variantId, wishlistElement);
  }
}


function addVariantToWishlistApi(variantId, wishlist_container) {
  if (window.isLoggedInUser) {
    wishlist_container.disabled = true;
    $X.post({
      url: "/storefront/api/v1/wishlists/variants",//NO I18N
      params: { variant_ids: variantId },
      headers: zsUtils.getCSRFHeader(),
      handler: function () {
        var response = JSON.parse(this.responseText);
        if (response.status_code == 0) {
          wishlist_container.setAttribute('data-zs-wishlisted', "true");
          if (wishlist_container.id == "wishlist-variant") {
            window.zs_wishlist_variants[variantId] = true;
          }
          wishlist_container.disabled = false;
        } 
        var updateWishlistActionsEvent = new CustomEvent("zp-event-wishlist-actions-alert", {detail: response}); //NO I18N
        document.dispatchEvent(updateWishlistActionsEvent);
        wishlist_container.disabled = false;
      }
    });
  } else {
    window.location.href = "/signin"; 
  }
}

function showorHideWishListEmptyView() {
  var isNoResultsFound = true;
  var elements = document.querySelectorAll('[data-zs-variant-wishlist]');
  for (var i = 0; i < elements.length; i++) {
    if (elements[i].style.display !== 'none') {
      isNoResultsFound = false;
    }
  }

  var dataNoWishlist = document.querySelector("[data-zs-no-wishlist]");

  if (isNoResultsFound) {
    dataNoWishlist.style.display = 'block';
  } else {
    dataNoWishlist.style.display = 'none';
  }
}

function deleteVariantInWishList(wishlistRemoveButton, fromIcon) {
  wishlistRemoveButton.disabled = true;
  let wishlistElement;
  var variantId = wishlistRemoveButton.getAttribute('data-zs-wishlist-variant-id');
  if (!fromIcon) {
    variantId = wishlistRemoveButton.getAttribute('data-zs-product-variant-id');
    wishlistElement = document.querySelector("[data-zs-variant-id='" + variantId + "']");
  }
  $X.del({
    url: "/storefront/api/v1/wishlists/variants?variant_ids=" + variantId, //NO I18N
    headers: zsUtils.getCSRFHeader(),
    handler: function () {
      var response = JSON.parse(this.responseText);

      if (response.status_code == 0) {
        if (fromIcon && wishlistRemoveButton) {
          wishlistRemoveButton.setAttribute('data-zs-wishlisted', 'false');
          if (wishlistRemoveButton.id == "wishlist-variant") {
            window.zs_wishlist_variants[variantId] = false;
          }
          wishlistRemoveButton.disabled = false;
        } else {
          if (wishlistElement) {
            wishlistElement.remove();
            var removeLinkContainer = document.querySelector('.removed-alert-container');
            var linkElement = document.querySelector('.removed-alert-container a');
            if (removeLinkContainer && linkElement ) {
              removeLinkContainer.style.display = "flex";
							linkElement.href = wishlistRemoveButton.getAttribute('data-zs-variant-url');
              linkElement.innerHTML = wishlistRemoveButton.getAttribute('data-zs-variant-name');
            }
          }
          showorHideWishListEmptyView.call(this);
        }
      } 
      if (fromIcon || response.status_code != 0 ) {
        var updateWishlistActionsEvent = new CustomEvent("zp-event-wishlist-actions-alert", {detail: response}); //NO I18N
        document.dispatchEvent(updateWishlistActionsEvent);
      }
      wishlistRemoveButton.disabled = false;
    }
  });
}

function hideLinkAlert() {
	var removeLinkContainer = document.querySelector('.removed-alert-container');
  if (removeLinkContainer) {
    removeLinkContainer.style.display = "none";
  }
}


function searchWishlistByName(searchText) {
  var wishlist_containers = document.querySelectorAll('[data-zs-variant-wishlist][data-zs-variant-id]');
  var closeIcon = document.getElementById('resetWishlistSearch');
 
  for (var i = 0; i < wishlist_containers.length; i++) {
    var nameElement = wishlist_containers[i].querySelector('[data-zs-variant-name]');
    if (nameElement && nameElement.innerText.toLowerCase().includes(searchText.toLowerCase())) {
      wishlist_containers[i].style.display = 'block';
    } else {
      wishlist_containers[i].style.display = 'none';
    }
  }
    
  if (searchText) {
    closeIcon.style.display = 'block';
  } else {
    closeIcon.style.display = 'none';
  }
 
  this.showorHideWishListEmptyView();
}

function clearSearch() {
  var searchWishlistElements = document.getElementsByName('search_wishlist');
  var searchWishlist = searchWishlistElements.length > 0 ? searchWishlistElements[0] : null; 
  searchWishlist.value = '';
  searchWishlistByName('');
  document.getElementById('close').style.display = 'none';
}

window.addEventListener("load", function () {
  var searchWishlistElements = document.getElementsByName('search_wishlist');
  var searchWishlist = searchWishlistElements.length > 0 ? searchWishlistElements[0] : null; 
  if (searchWishlist) {
   searchWishlist.oninput = function (event) {
    searchWishlistByName(event.target.value);
   };
  }
});

// END Wishlist methods

function toggleProductsView(elem, value){
  let viewBy = elem.closest('[data-view-by]'); // No I18N
  if(viewBy) {
    viewBy.setAttribute('data-view-by', value);
    elem.classList.add('theme-active-class'); // No I18N
  }
  productViewBy();
}
