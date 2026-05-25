function removeClass(element, className) {
	element.className = element.className.replace(className,'');
}
function addClass(element, className) {
	element.classList.add(className);
}
function getTargetContainer(element) {
  var targetContainer = (element) ? element.closest("[data-zs-product-id]") : ""; // No I18n
  return targetContainer;
}
function addToCartSuccess (e) {
	let cartSuccessElem = document.querySelector('[data-cart-add-success]');
	var isQuote = e.detail.isQuote;
	var viewQuoteButton = cartSuccessElem ? cartSuccessElem.querySelector('[data-zs-view-quote]') : null;
	var viewCartButton = cartSuccessElem ? cartSuccessElem.querySelector('[data-zs-view-cart]') : null;
	var cartSuccessMsg = cartSuccessElem ? cartSuccessElem.querySelector('.theme-added-to-cart-msg') : null;
	var quoteSuccessMsg = cartSuccessElem ? cartSuccessElem.querySelector('.theme-added-to-quote-msg') : null;
	var sellingPriceContainer = document.querySelector('[data-cart-add-success-selling-prod-price="theme-cart-add-success-selling-prod-price"]');
	if(isQuote) {
		if (viewQuoteButton) {
			viewQuoteButton.style.display = '';
			if (quoteSuccessMsg) {
				quoteSuccessMsg.style.display = '';
			}
			if (sellingPriceContainer) {
				sellingPriceContainer.style.display = 'none';
			}
			
		}
		if (viewCartButton) {
			viewCartButton.style.display = 'none';
    		if (cartSuccessMsg) {
        	  cartSuccessMsg.style.display = 'none';
    		}
		}
	} else {
		if (viewQuoteButton) {
			viewQuoteButton.style.display = 'none';
			if (quoteSuccessMsg) {
				quoteSuccessMsg.style.display = 'none';
			}
		}
		if (viewCartButton) {
			viewCartButton.style.display = '';
			if (cartSuccessMsg) {
			  cartSuccessMsg.style.display = '';
			}	
			if (sellingPriceContainer) {
				sellingPriceContainer.style.display = '';
			} ;
		}
	}

	var cartAddSuccess = document.querySelectorAll('[data-cart-add-success="theme-cart-add-success"]')[0];
	var cartMsgFour = document.querySelectorAll('[data-theme-message-four]')[0];
	var quickLookContainer = document.getElementById("product_quick_look");
	addClass(cartAddSuccess,'theme-cart-success');
	removeClass(cartAddSuccess,'theme-cart-success-remove');
	if(cartMsgFour){
		addClass(cartAddSuccess,'theme-cart-added-success');
		removeClass(cartAddSuccess,'theme-cart-added-success-remove');
	}
	if(quickLookContainer && cartMsgFour){
		closeProductQuickLook();
	}
	var addcartButton = e.detail.target;
	removeClass(addcartButton,'theme-cart-loading-container');
	var cartButtonText = addcartButton.querySelectorAll('[data-theme-cart-button-text="theme-cart-button-text"]')[0];
	var cartButtonLoading = addcartButton.querySelectorAll('[data-theme-cart-button-loading="theme-cart-button-loading"]')[0];

	var cartButtonLoadingFive = addcartButton.querySelectorAll('[data-theme-cart-button-loading-five="theme-cart-button-loading-five"]')[0];
	var cartLoadingTwo = addcartButton.querySelectorAll('[data-theme-cart-button-icon="data-theme-cart-button-icon"]')[0];

	if(cartButtonText){
		cartButtonText.style.display = "block";
	}
	if(cartButtonLoading){
		cartButtonLoading.style.display = "none";
	}
	if(cartButtonLoadingFive){
		cartButtonLoadingFive.style.display = "none";
	}
	if(cartLoadingTwo){
		cartLoadingTwo.style.display = "block";
	}

	var targetContainer = getTargetContainer(e.detail.target);

	var prodId = (targetContainer && targetContainer != "") ? targetContainer.getAttribute("data-zs-product-id") : "";

	var errorContainer = targetContainer.querySelectorAll('[data-theme-error="theme-error-message-'+prodId+'"]')[0];

	var errorContainerList = targetContainer.querySelectorAll('[data-theme-error="theme-error-message-list-'+prodId+'"]')[0];

	if(errorContainer){
		errorContainer.style.display = "none";
		errorContainer.innerHTML = "";
	}
	if(errorContainerList){
		errorContainerList.style.display = "none";
		errorContainerList.innerHTML = "";
	}

	var nameContianer = document.querySelectorAll('[data-cart-add-success-prod-name="theme-cart-add-success-prod-name"]')[0];
	var imgContainer = document.querySelectorAll('[data-cart-add-success-prod-img="theme-cart-add-success-prod-img"]')[0];
	var countContainer = document.querySelectorAll('[ data-cart-add-success-count="theme-cart-add-success-prod-count"]')[0];
	var quantityContainer = document.querySelectorAll('[data-cart-add-success-prod-qty="theme-cart-add-success-prod-qty"]')[0];


	var thumbnailImages = document.querySelectorAll('[data-thumbnail]');
	var thumbanailcontainer = document.querySelectorAll('[data-theme-thumbnail-container="theme-thumbnail-container-'+prodId+'"]')[0];
	var detailImage = document.querySelectorAll('[data-detail-image="theme-detail-image"]')[0];

  var thumbcontainerProdId = document.querySelectorAll('[data-thumbnail-prod-id="'+prodId+'"]')[0];

	if(thumbcontainerProdId){
		var detailImageUrl = thumbcontainerProdId.querySelectorAll('[data-thumbnail-active]');
	}
	var firstImgUrl;
	if(thumbcontainerProdId){
		for(iurl=0;iurl<detailImageUrl.length;iurl++){
			var imgUrl = detailImageUrl[iurl].getAttribute('data-thumbnail-active');
			if (iurl == 0) {
				detailImageUrl[iurl].click();
			}
		}
	}
	for(ti=0;ti<thumbnailImages.length;ti++){
		if(thumbnailImages[ti]){
			thumbnailImages[ti].style.display = 'flex';
		}
	}
	if(thumbanailcontainer){
		thumbanailcontainer.style.display = "flex";
	}

	if(thumbanailcontainer){
		activeThumbnail();
	}

	var detail = e.detail;
	var variantId = detail.target.getAttribute("data-zs-product-variant-id");
	var lineItems = detail.cart.items

	var currentLineItem;

	resetSelect(targetContainer);

	for (var lineItem of lineItems) {
	  if (lineItem.variant_id == variantId) {
	      currentLineItem = lineItem;
	      break;
	  }
	}
	if(nameContianer){
		nameContianer.innerHTML = currentLineItem.name;
	}
	if(sellingPriceContainer) {
	  sellingPriceContainer.innerHTML = currentLineItem.selling_price_formatted;
	}
	if(quantityContainer) {
	  quantityContainer.innerHTML = currentLineItem.quantity;
	}
	if(countContainer){
		countContainer.innerHTML = lineItems.length;
	}
	if (currentLineItem.images) {
	 var imageUrl = currentLineItem.images[0].url;
	 var imageAlt = currentLineItem.images[0].alternate_text;
	 var imageTitle = currentLineItem.images[0].title;
	 if (!currentLineItem.images[0].is_placeholder_image) {
		 imageUrl += '/400x400'; // No I18n
	 }
	 if(imgContainer){
	 	imgContainer.setAttribute('src', imageUrl);
		imgContainer.setAttribute('alt', imageAlt);
 	 	imgContainer.setAttribute('title', imageTitle);
 	 }
	}

	var customfields = $D.getAll('[data-custom-field-id]', targetContainer);
  customfields.forEach( function (field) {
			var fieldValue =  field.getAttribute('data-default-value');
			var fieldType = field.getAttribute('data-field-type');
      if(fieldType == 'check_box') {
          field.checked = (fieldValue == "true");
      }
			else if(fieldType == 'dropdown' && fieldValue == "" ){
				field.selectedIndex = 0;

			} else if(fieldType == "attachment"){
                var customfieldId = field.getAttribute("data-custom-field-id");
                var variantElement =  field.closest('[data-variant-id]')

                if(variantElement) {
                    field.setAttribute("data-value", "")
                    var attachmentClickElem = $D.get('[data-zs-attachment-upload-custom-field-id="' + customfieldId+ '"]', variantElement);
                    if(attachmentClickElem) {
                        var attachmentClickLabel = $D.get('[data-zs-attachment-label]', attachmentClickElem);
                        if(attachmentClickLabel) {
                            attachmentClickLabel.innerText = i18n.get("product.custom_field.attachment.change_file");
                        }
                    }

                    var nameContainer = $D.get('[data-zs-attachment-name-container="'+ customfieldId +'"]', variantElement);
                    if(nameContainer) {
                        var fileName = $D.get('[data-attachment-file-name]', nameContainer);
                        if(fileName) {
                            fileName.innerText = "";
                        }

                        nameContainer.style.display = "none";
                    }

                }

            }

			else {
          field.value = fieldValue;
      }
  });
  selectAttributeOnLoad();
  setTimeout(()=>{
	var cartAddSuccess = document.querySelectorAll('[data-cart-add-success="theme-cart-add-success"][data-theme-message-four]')[0];
	if(cartAddSuccess){
		addClass(cartAddSuccess,'theme-cart-success-remove');
		removeClass(cartAddSuccess,'theme-cart-success');
	}
  },3000);
}
function closeSuccessMessage() {
	var cartAddSuccess = document.querySelectorAll('[data-cart-add-success="theme-cart-add-success"]')[0];
	if(cartAddSuccess){
		addClass(cartAddSuccess,'theme-cart-success-remove');
	}
}
function closemessage(){
		var cartAddSuccess = document.querySelectorAll('[data-cart-add-success="theme-cart-add-success"]')[0];
		var cartFailure = document.querySelectorAll('[data-cart-add-failure="theme-cart-add-failure"]')[0];
		if(cartFailure){
			addClass(cartFailure,'theme-cart-failure-remove');
			removeClass(cartFailure,'theme-cart-failure');
		}
		if(cartAddSuccess){
			addClass(cartAddSuccess,'theme-cart-success-remove');
			removeClass(cartAddSuccess,'theme-cart-success');
			addClass(cartAddSuccess,'theme-cart-added-success-remove');
		}
		closeProductQuickLook();
}
function resetSelect(targetContainer){
	var VariantRadio = targetContainer.querySelectorAll('[data-zs-attribute-option]');
	var VariantSelect = targetContainer.querySelectorAll('[data-zs-attribute-select]');
	if(VariantSelect){
		for(vs=0;vs<VariantSelect.length;vs++){
			VariantSelect[vs].selectedIndex = 0;
		}
	}
	if(VariantRadio){
		for(vs=0;vs<VariantRadio.length;vs++){
			VariantRadio[vs].checked = false;
			removeClass(VariantRadio[vs].parentElement,'chekedLabel');
		}
	}
	if(typeof product_option != "undefined"){
		if(VariantSelect.length!=0 || VariantRadio.length!=0) {
			var productId = (targetContainer != document) ? targetContainer.getAttribute("data-zs-product-id") : "";
			_hideCustomFieldsOfVariants(productId);
			product_option.resetAddToCart(productId,targetContainer);
		}
	}
	var allStocks = targetContainer.querySelectorAll("[data-variant-id-stock]");
	for(sa=0;sa<allStocks.length;sa++){
		allStocks[sa].style.display = 'none';
	}
	var dataResetQuantity = targetContainer.querySelectorAll("[data-theme-quantity]");
	for(qr=0;qr<dataResetQuantity.length;qr++){
		dataResetQuantity[qr].value = 1 ;
	}
}

var deliveryLocationLoader,deliveryLocationPinInput,deliveryLocationPinError;

function deliveryLocationPinValidate(inputEl,pinErrorMsg){
	if(inputEl && pinErrorMsg){
		var inpPattern = /[^0-9a-zA-Z?*-]+/;
		inputEl.addEventListener('keyup',function(){
			var isPattern = inpPattern.test(this.value);
			pinErrorMsg.innerText = i18n.get('delivery_location_availability.label.error.invalid.postal_code');
			isPattern ? pinErrorMsg.style.display = "block" : pinErrorMsg.style.display ="none"
		});
	}
}

document.addEventListener("DOMContentLoaded", function(event) {
	resetSelect(document);

	deliveryLocationLoader = document.querySelector('[data-theme-delivery-location-loader]');

	deliveryLocationPinInput = document.querySelector('[data-zs-delivery-location-postalcode]');
	deliveryLocationPinError = document.querySelector('[data-zs-delivery-availability-product-details-error-message]');
	deliveryLocationPinValidate(deliveryLocationPinInput,deliveryLocationPinError);


	var loader = $D.get('[data-theme-loader]');
	var body = document.getElementsByTagName("body")[0];
	var contentContainer = $D.get('[data-theme-content-container]');
	if(contentContainer){
		var contentParent = contentContainer.parentElement;
	}
	if(window.location.href.indexOf("search-products") > -1){
		addClass(contentContainer,'theme-search-page-contianer')
	}
	if(!loader && window.location.href.indexOf("search-products") > -1){
      var tempLoad = document.createElement('div');
      addClass(tempLoad,'theme-loader');
      addClass(tempLoad,'theme-loader-show');
      tempLoad.style.position = "static";
      tempLoad.style.marginTop = '80px';
      tempLoad.setAttribute('data-theme-temp-load','');
      tempLoad.innerHTML = i18n.get("search.wait.message")+' . . .';
			if(contentParent){
      	contentParent.insertBefore(tempLoad,contentContainer);
			}
			else{
				contentContainer.insertBefore(tempLoad,contentContainer);
			}
      var offsetVal = window.pageYOffset;
      var mainHeader = $D.get('[data-headercontainer]');
			var headerSix = mainHeader.classList.contains('zpheader-style-06');
      var mobileHeaderFix = mainHeader.classList.contains('theme-mobile-header-fixed');
			var verticalHeader = $D.get('[data-theme-header-six-res]');
			if(verticalHeader){
				var verticalHeaderHeight = verticalHeader.clientHeight;
			}
      if(mainHeader){
          var mainHeaderHeight = mainHeader.clientHeight;
      }
			if(headerSix && mainHeader && tempLoad && (contentContainer.parentNode.nodeName == 'BODY')){
				addClass(tempLoad,'theme-temp-load-padding');
			}
  }
});
function addToCartFailure (e) {
	var cartAddFailure = document.querySelectorAll('[data-cart-add-failure="theme-cart-add-failure"]')[0];
	var cartMsgFour = document.querySelectorAll('[data-theme-message-four]')[0];
	var quickLookContainer = document.getElementById("product_quick_look");
	addClass(cartAddFailure,'theme-cart-failure');
	removeClass(cartAddFailure,'theme-cart-failure-remove');
	if(cartMsgFour){
		addClass(cartAddFailure,'theme-cart-added-failure');
		removeClass(cartAddFailure,'theme-cart-added-failure-remove');
	}
	if(quickLookContainer && cartMsgFour){
		closeProductQuickLook();
	}
	var addcartButton = e.detail.target;
	removeClass(addcartButton,'theme-cart-loading-container');
	var cartButtonText = addcartButton.querySelectorAll('[data-theme-cart-button-text="theme-cart-button-text"]')[0];
	var cartButtonLoading = addcartButton.querySelectorAll('[data-theme-cart-button-loading="theme-cart-button-loading"]')[0];
	var cartButtonLoadingFive = addcartButton.querySelectorAll('[data-theme-cart-button-loading-five="theme-cart-button-loading-five"]')[0];
	var cartLoadingTwo = addcartButton.querySelectorAll('[data-theme-cart-button-icon="data-theme-cart-button-icon"]')[0];
	var cartResponse = (e.detail.response.cart_details != null) ? e.detail.response.cart_details.message : e.detail.response.error.message;
	var cartFailureDetail = document.querySelectorAll('[data-theme-failure-reason="theme-failure-reason"]')[0];
  cartFailureDetail.innerHTML = cartResponse;

	if(cartButtonText){
		cartButtonText.style.display = "block";
	}
	if(cartLoadingTwo){
		cartLoadingTwo.style.display = "block";
	}
	if(cartButtonLoading){
		cartButtonLoading.style.display = "none";
	}
	if(cartButtonLoadingFive){
		cartButtonLoadingFive.style.display = "none";
	}
}
function closeFailureMessage() {
	var cartAddFailure = document.querySelectorAll('[data-cart-add-failure="theme-cart-add-failure"]')[0];
	if(cartAddFailure){
		addClass(cartAddFailure,'theme-cart-failure-added-remove');
		removeClass(cartAddFailure,'theme-cart-added-failure');
	}
}
function updateToCartSuccess (e) {
	var cartupdateloading = document.querySelector("[data-theme-loader]");
	var cartUpdateSuccess = document.querySelectorAll('[data-cart-update-success="theme-cart-update-success"]')[0];
	var cartMsgFour = document.querySelectorAll('[data-theme-message-four]')[0];
	var cartNameContainer = document.querySelectorAll('[data-cart-update-success-product-name="theme-cart-update-success-product-name"]')[0];
	var updateCartButton = e.detail.target;
	if(updateCartButton.hasAttribute("data-zs-update")){
	removeClass(updateCartButton,'theme-cart-updating');
	}else if(cartupdateloading){
		hideLoader()
	}
	addClass(cartUpdateSuccess,'theme-cart-success');
	removeClass(cartUpdateSuccess,'theme-cart-success-remove');
	if(cartMsgFour){
		addClass(cartUpdateSuccess,'theme-cart-page-success');
		removeClass(cartUpdateSuccess,'theme-cart-page-success-remove');
	}

	var errorLineItemId = e.detail.target.getAttribute('data-zs-product-lineitem-id');
	var errorContainerCart;
	if (errorLineItemId) {
		errorContainerCart = document.querySelectorAll('[data-quantity-error-cart-lineitem="'+errorLineItemId+'"]')[0];

	} else {
		var errorflagId = e.detail.target.getAttribute('data-zs-product-variant-id');
		errorContainerCart = document.querySelectorAll('[data-quantity-error-cart="'+errorflagId+'"]')[0];
	}
	if(errorContainerCart){	
		errorContainerCart.style.display = 'none';
	}

	setTimeout(function() {
		addClass(cartUpdateSuccess,'theme-cart-success-remove');
		removeClass(cartUpdateSuccess,'theme-cart-success');
		if(cartMsgFour){
			removeClass(cartUpdateSuccess,'theme-cart-page-success');
			addClass(cartUpdateSuccess,'theme-cart-page-success-remove');
		}
	}, 3000);

	var detail = e.detail;
	var variantId = detail.target.getAttribute("data-zs-product-variant-id");
	var lineItems = detail.cart.line_items;

	var currentLineItem;

	for (var lineItem of lineItems) {
		if (lineItem.item_id == variantId) {
			currentLineItem = lineItem;
			break;
		}
	}

	if(cartNameContainer){
		cartNameContainer.innerHTML = currentLineItem.name;
	}
}

function updateWishlistActionsAlert(e) {
	var wishlistAlertElement = document.querySelector('[data-wishlist-alert-update="theme-wishlist-alert-update"]');
	if (wishlistAlertElement) {
		var messageInnerContainer = wishlistAlertElement.querySelector('[data-zs-alert-inner-container]');
		var messageTextContainer = wishlistAlertElement.querySelector('[data-zs-message-text]');
	
		let successIcon = wishlistAlertElement.querySelector('[data-zs-success-icon]');
		if (successIcon) {
			successIcon.classList.add('theme-cart-success-remove');  // No I18N
		}
	
		let failureIcon = wishlistAlertElement.querySelector('[data-zs-failure-icon]');
		if (failureIcon) {
			failureIcon.classList.add('theme-cart-failure-remove'); // No I18N
		}
	
		wishlistAlertElement.classList.remove('theme-cart-success-remove', 'theme-cart-failure-remove', 'theme-wishlist-success-message', 'theme-wishlist-failure-message'); // No I18N
	
		messageTextContainer.innerHTML = e.detail.message;
		if (e.detail && e.detail.status_code == '0') {
			wishlistAlertElement.setAttribute('data-toast-type', 'success');
			wishlistAlertElement.classList.add('theme-wishlist-success-message', 'theme-cart-success'); // No I18N
			messageInnerContainer.classList.add('theme-success-message', 'theme-cart-message-success'); // No I18N
			successIcon.classList.remove('theme-cart-success-remove'); // No I18N
			setTimeout(function () {
				wishlistAlertElement.classList.remove('theme-cart-success'); // No I18N
				messageInnerContainer.classList.remove('theme-failure-message', 'theme-cart-message-success'); // No I18N
				successIcon.classList.add('theme-cart-success-remove'); // No I18N
			}, 3000);
		} else {
			wishlistAlertElement.setAttribute('data-toast-type', 'failure');
			wishlistAlertElement.classList.add('theme-wishlist-failure-message', 'theme-cart-failure'); // No I18N
			messageInnerContainer.classList.add('theme-failure-message', 'theme-cart-message-failure'); // No I18N
			failureIcon.classList.remove('theme-cart-failure-remove'); // No I18N
			setTimeout(function () {
				wishlistAlertElement.classList.remove('theme-cart-failure'); // No I18N
				messageInnerContainer.classList.remove('theme-failure-message', 'theme-cart-message-failure'); // No I18N
				failureIcon.classList.add('theme-cart-failure-remove'); // No I18N
			}, 3000);
		}
	}
}

function updateSaveForLaterActionsAlert(e) {
	var isMoveToCart = e.detail.isMoveToCart;
	var moveToCartButton = e.detail.target;
	// Stop the loader for MoveToCart Button
	if(isMoveToCart && moveToCartButton){
		removeClass(moveToCartButton,'theme-cart-loading-container');
		var moveToCartButtonText = moveToCartButton.querySelectorAll('[data-theme-cart-button-text="theme-cart-button-text"]')[0];
		var moveToCartButtonLoading = moveToCartButton.querySelectorAll('[data-theme-cart-button-loading="theme-cart-button-loading"]')[0];
		if(moveToCartButtonText){
			moveToCartButtonText.style.display = "block";
		}
		if(moveToCartButtonLoading){
			moveToCartButtonLoading.style.display = "none";
		}
	}
	var saveForLaterAlertElement = document.querySelector('[data-save-for-later-alert-update]');
	if (saveForLaterAlertElement) {
		var messageInnerContainer = saveForLaterAlertElement.querySelector('[data-zs-alert-inner-container]');
		var messageTextContainer = saveForLaterAlertElement.querySelector('[data-zs-message-text]');

		let successIcon = saveForLaterAlertElement.querySelector('[data-zs-success-icon]');
		if (successIcon) {
			addClass(successIcon, 'theme-cart-success-remove')
		}

		let failureIcon = saveForLaterAlertElement.querySelector('[data-zs-failure-icon]');
		if (failureIcon) {
			addClass(failureIcon, 'theme-cart-failure-remove')
		}

		saveForLaterAlertElement.classList.remove(
			'theme-cart-success-remove',   // No I18N
			'theme-cart-failure-remove',    // No I18N
			'theme-save-for-later-success-message',   // No I18N
			'theme-save-for-later-failure-message'    // No I18N
		);

		messageTextContainer.innerHTML = e.detail.response.status_code == '0' ?  e.detail.response.status_message: (e.detail.response.error?.message || e.detail.response.developer_message);
		if ( e.detail.response && e.detail.response.status_code == '0') {
			saveForLaterAlertElement.setAttribute('data-toast-type', 'success');
			saveForLaterAlertElement.classList.add('theme-save-for-later-success-message', 'theme-cart-success');  // No I18N
			messageInnerContainer.classList.add('theme-success-message', 'theme-cart-message-success');  // No I18N
			successIcon.classList.remove('theme-cart-success-remove');  // No I18N
			setTimeout(function () {
				saveForLaterAlertElement.classList.remove('theme-cart-success');  // No I18N
				messageInnerContainer.classList.remove('theme-failure-message');  // No I18N
				successIcon.classList.add('theme-cart-success-remove');   // No I18N
				messageInnerContainer.classList.remove('theme-cart-message-success');   // No I18N
			}, 3000);
		} else {
			saveForLaterAlertElement.setAttribute('data-toast-type', 'failure');   // No I18N
			saveForLaterAlertElement.classList.add('theme-save-for-later-failure-message', 'theme-cart-failure');  // No I18N
			messageInnerContainer.classList.add('theme-failure-message', 'theme-cart-message-failure');   // No I18N
			failureIcon.classList.remove('theme-cart-failure-remove');  // No I18N
			setTimeout(function () {
				saveForLaterAlertElement.classList.remove('theme-cart-failure');  // No I18N
				messageInnerContainer.classList.remove('theme-failure-message', 'theme-cart-message-failure');  // No I18N
				failureIcon.classList.add('theme-cart-failure-remove');   // No I18N
			}, 3000);
		}
	}
}

function showUpdate(cartitem){
	var updateButton =  document.querySelectorAll('[data-theme-update="'+cartitem+'"]')[0];
	updateButton.style.display = 'block';
}
function updateToCartFailure (e) {
	var cartupdateloading = document.querySelector("[data-theme-loader]");
	var cartUpdateFailure = document.querySelectorAll('[data-cart-update-failure="theme-cart-update-failure"]')[0];
	var cartMsgFour = document.querySelectorAll('[data-theme-message-four]')[0];
	var updateCartButton = e.detail.target;

	var cartResponse = (e.detail.response.cart_details != null) ? e.detail.response.cart_details.message : e.detail.response.error.message;
	var cartFailureDetail = document.querySelectorAll('[data-theme-update-failure-reason="theme-update-failure-reason"]')[0];
  cartFailureDetail.innerHTML = cartResponse;

  if(updateCartButton.hasAttribute("data-zs-update")){
	removeClass(updateCartButton,'theme-cart-updating');
  }else if(cartupdateloading){
	  hideLoader()
  }
	addClass(cartUpdateFailure,'theme-cart-failure');
	removeClass(cartUpdateFailure,'theme-cart-failure-remove');

	if(cartMsgFour){
		addClass(cartUpdateFailure,'theme-cart-page-failure');
		removeClass(cartUpdateFailure,'theme-cart-page-failure-remove');
	}
	setTimeout(function() {
		addClass(cartUpdateFailure,'theme-cart-failure-remove');
		removeClass(cartUpdateFailure,'theme-cart-failure')
		if(cartMsgFour){
			removeClass(cartUpdateFailure,'theme-cart-page-failure');
			addClass(cartUpdateFailure,'theme-cart-page-failure-remove');
		}
	}, 3000);
	if(updateCartButton.hasAttribute("data-zs-update")){
		updateCartButton.style.display = 'block';
	}
}

function deleteFromCartSuccess (e) {
	var cartDeleteSuccess = document.querySelectorAll('[data-cart-delete-success="theme-cart-delete-success"]')[0];
	var cartMsgFour = document.querySelectorAll('[data-theme-message-four]')[0];
	addClass(cartDeleteSuccess,'theme-cart-success');
	removeClass(cartDeleteSuccess,'theme-cart-success-remove');
	if(cartMsgFour){
		addClass(cartDeleteSuccess,'theme-cart-page-success');
		removeClass(cartDeleteSuccess,'theme-cart-page-success-remove');
	}
	var deleteButtonElem = e.detail.target;
	removeClass(deleteButtonElem,'theme-cart-item-removing');
	setTimeout(function() {
		addClass(cartDeleteSuccess,'theme-cart-success-remove');
		removeClass(cartDeleteSuccess,'theme-cart-success');
		if(cartMsgFour){
			removeClass(cartDeleteSuccess,'theme-cart-page-success');
			addClass(cartDeleteSuccess,'theme-cart-page-success-remove');
		}
	}, 3000);
	var lineItemCount = parseInt(document.querySelectorAll('[data-zs-view-cart-count]')[0].textContent);
	var cartTableHead = document.querySelectorAll('[data-cart-table]');
	var cartNotEmptyMessage = document.querySelectorAll('[data-zs-cart-empty-message]');
	var cartEmptyShoppingButton = document.querySelectorAll('[data-cart-empty-shopping-button]');
	var cartEmptyCheckoutButton = document.querySelectorAll('[data-cart-empty-checkout-button]');
	var cartEmptyContinueLink = document.querySelectorAll('[data-zs-continue-shopping]');
	var cartShippingContent = document.querySelectorAll('[data-zs-shipping-label]')
	// NON DELIVERABLE PRODUCT LIST

	var commonNonDeliCont = document.querySelector('[data-zs-cart-delivery-availability-common-error-message]');
	var nonDeliverProdListCont = document.querySelector('[data-zs-cart-non-deliverable-items]');
	if(deleteButtonElem) {
		var deletedProdId = deleteButtonElem.getAttribute('data-zs-product-variant-id');
	}
	if(nonDeliverProdListCont){
		var deletedNonDeliProd = nonDeliverProdListCont.querySelector('[data-zs-delivery-availability-cart-item-id="'+deletedProdId+'"]');
		var nonDeliverProdList = nonDeliverProdListCont.children;
	}
	if(deletedNonDeliProd){
		deletedNonDeliProd.remove();
	}
	if(commonNonDeliCont && nonDeliverProdList && nonDeliverProdList.length == 0){
		commonNonDeliCont.style.display = 'none';
		var checkout_button = cartEmptyCheckoutButton[0].querySelector("[data-zs-checkout]");
		var quoteCheckoutButton = cartEmptyCheckoutButton[0].querySelector("[data-zs-quote-checkout]");
		if(checkout_button){
			checkout_button.removeAttribute("disabled");
		}
		if(quoteCheckoutButton){
			quoteCheckoutButton.removeAttribute("disabled");
		}
	}

	if (lineItemCount == 0) {
		addClass(cartTableHead[0],'theme-cart-empty');
		removeClass(cartNotEmptyMessage[0],'theme-cart-error-message-not-empty');
		addClass(cartNotEmptyMessage[0],'theme-cart-error-empty-message');
		addClass(cartEmptyShoppingButton[0],'theme-cart-empty-shopping-button');
		addClass(cartEmptyCheckoutButton[0],'theme-cart-empty-checkout-buton');
		addClass(cartEmptyContinueLink[0],'theme-continue-link');
		addClass(cartShippingContent[0],'theme-hide-shipping-label');
		if(commonNonDeliCont){
			commonNonDeliCont.style.display = 'none';
		}
	}
}

function deleteFromCartFailure (e) {
	var cartDeleteFailure = document.querySelectorAll('[data-cart-delete-failure="theme-cart-delete-failure"]')[0];
	var cartMsgFour = document.querySelectorAll('[data-theme-message-four]')[0];
	var cartResponse = (e.detail.response.cart_details != null) ? e.detail.response.cart_details.message : e.detail.response.error.message;
	var cartFailureDetail = document.querySelectorAll('[data-theme-delete-failure-reason="theme-delete-failure-reason"]')[0];
  cartFailureDetail.innerHTML = cartResponse;

	addClass(cartDeleteFailure,'theme-cart-failure');
	removeClass(cartDeleteFailure,'theme-cart-failure-remove');
	if(cartMsgFour){
		addClass(cartDeleteFailure,'theme-cart-page-failure');
		removeClass(cartDeleteFailure,'theme-cart-page-failure-remove');
	}
	var deleteButtonElem = e.detail.target;
	removeClass(deleteButtonElem,'theme-cart-item-removing');
	setTimeout(function() {
		addClass(cartDeleteFailure,'theme-cart-failure-remove');
		removeClass(cartDeleteFailure,'theme-cart-failure');
		if(cartMsgFour){
			removeClass(cartDeleteFailure,'theme-cart-page-failure');
			addClass(cartDeleteFailure,'theme-cart-page-failure-remove');
		}
	}, 3000);
}

function addToCartWithInvalidVariant (e) {

	var targetContainer = getTargetContainer(e.detail.target);

	var prodId = (targetContainer && targetContainer != "") ? targetContainer.getAttribute("data-zs-product-id") : "";

	var quickViewScroll = document.querySelector("[data-theme-quickview-scroll]");

	var attributes = targetContainer.querySelectorAll("[data-zs-attribute-select]");
	attributesLength = attributes.length;

	for (atr=0;atr<attributesLength;atr++) {

		var attribute = attributes[atr];
		var attributeTagName = attribute.tagName;

		var errorAttr = targetContainer.querySelectorAll("[data-error-select-flag='" + prodId + "']");

		var errorAttrVal = attribute.getAttribute("data-zs-attribute-name");
		var errorContainer = targetContainer.querySelector('[data-variant-error="theme-data-error-'+errorAttrVal+'"]');

		if(errorContainer){
			errorContainer.style.display = "none";
		}

		if (attribute.selectedIndex === 0 && attributeTagName == 'SELECT') {
			errorContainer.style.display = "block";
		}

		if(attributeTagName != 'SELECT'){
			var radioSelect = attribute.querySelectorAll('[data-zs-attribute-option]');
			radioSelectLength = radioSelect.length;
			for(rs=0;rs<radioSelectLength;rs++){
				radioSelected = radioSelect[rs].checked;
				if(radioSelected){
					errorContainer.style.display = "none";
					break;
				}
			}
			if(!radioSelected){
				errorContainer.style.display = "block";
			}
		}

	}
	var errorContainerCommon = targetContainer.querySelectorAll('[data-theme-error="theme-error-message-'+prodId+'"]')[0];
	if(errorContainerCommon){
		errorContainerCommon.className = ' theme-variant-select-error';
		errorContainerCommon.style.display = 'flex';
		errorContainerCommon.innerHTML = i18n.get("product.message.error.select_variant");
	}
	if(quickViewScroll){
		quickViewScroll.scrollTop = quickViewScroll.scrollHeight;
	}

}

function invalidProductQuantity (e) {

	// INVALID IN ADD TO CART

	var targetContainer = getTargetContainer(e.detail.quantityElement);

	var prodId = (targetContainer && targetContainer != "") ? targetContainer.getAttribute("data-zs-product-id") : "";

	if(e.detail.view != 'cart'){
		var errorContainer = targetContainer.querySelectorAll('[data-theme-error="theme-error-message-'+prodId+'"]')[0];
		var errorContainerList = targetContainer.querySelectorAll('[data-theme-error="theme-error-message-list-'+prodId+'"]')[0];
		if(errorContainer){
			errorContainer.style.display = "block";
			errorContainer.className = ' theme-variant-select-error';
			errorContainer.innerHTML = i18n.get("product.message.error.invalid_quantity");
		}
		if(errorContainerList){
			errorContainerList.style.display = 'block';
			errorContainerList.style.width = '100%';
			errorContainerList.className = ' theme-variant-select-error';
			errorContainerList.innerHTML = i18n.get("product.message.error.invalid_quantity");
			if(errorContainer){
				errorContainer.style.display = "none";
			}
		}
	}
    var errorFlagInput = e.detail.quantityElement;
    var errorFlagInputLineItemId = errorFlagInput.getAttribute('data-zs-product-lineitem-id');
		var errorFlagInputId;
		var errorContainerCart;
		if (errorFlagInputLineItemId) {
			errorFlagInputId = errorFlagInputLineItemId;
			errorContainerCart = document.querySelectorAll('[data-quantity-error-cart-lineitem="'+errorFlagInputId+'"]')[0];

		} else {
			errorFlagInputId = errorFlagInput.getAttribute('data-zs-product-variant-id');
			errorContainerCart = document.querySelectorAll('[data-quantity-error-cart="'+errorFlagInputId+'"]')[0];
		}
    errorContainerCart.style.display = 'block';

	var cartButtonText = document.querySelectorAll('[data-theme-cart-button-text="theme-cart-button-text"]');
	var cartButtonLoading = document.querySelectorAll('[data-theme-cart-button-loading="theme-cart-button-loading"]');
  cartButtonTextLength = cartButtonText.length;
  cartButtonLoadingLength = cartButtonLoading.length;
  for(ct=0;ct<cartButtonTextLength;ct++){
		cartButtonText[ct].style.display = "block";
   }
  for(cl = 0;cl<cartButtonLoadingLength;cl++){
		cartButtonLoading[cl].style.display = "none";
  }

}

function selectAttribute (e) {

	var targetContainer = getTargetContainer(e.detail.target);

	var productId = (targetContainer && targetContainer != "") ? targetContainer.getAttribute("data-zs-product-id") : "";

	var errorContainer = targetContainer.querySelectorAll('[data-theme-error="theme-error-message-'+productId+'"]')[0];


	var stockCartAttribute = targetContainer.querySelectorAll('[data-nostock-cart-add="theme-nostock-cart-add"]');
	stockCartAttributeLength = stockCartAttribute.length;

	for(sa=0;sa<stockCartAttributeLength;sa++){
		var stockCartAttributeDisplay = stockCartAttribute[sa].style.display;
		if(stockCartAttributeDisplay == 'none'){

			addClass(errorContainer,'theme-error-no-cart-button');
		}
		else{

			removeClass(errorContainer,'theme-error-no-cart-button');
		}
	}

	errorContainer.style.display = 'none';
	errorContainer.innerHTML = "";


	var attributes = targetContainer.querySelectorAll("[data-zs-attribute-select]");
	attributesLength = attributes.length;

	for (atr=0;atr<attributesLength;atr++) {


		var attributeTagName = attributes[atr].tagName;

		var attribute = attributes[atr];

		var errorAttrVal = attribute.getAttribute("data-zs-attribute-name");
		var errorVariantContainer = targetContainer.querySelector('[data-variant-error="theme-data-error-'+errorAttrVal+'"]');



		if (attributes[atr].selectedIndex != 0 && attributeTagName == 'SELECT') {
			errorVariantContainer.style.display = "none";
		}
		if(attributeTagName != 'SELECT'){
			var radioSelect = attributes[atr].querySelectorAll('[data-zs-attribute-option]');
			radioSelectLength = radioSelect.length;
			for(rs=0;rs<radioSelectLength;rs++){
				radioSelected = radioSelect[rs].checked;
				if(radioSelected){
					errorVariantContainer.style.display = "none";
				}
			}
		}
		// SHOW ADD CART BUTTON IF NO STOCK INFO

		if(attributeTagName == 'SELECT'){
			var stockCartAttribute = document.querySelectorAll('[data-nostock-cart-add="theme-nostock-cart-add"]');
			var noStockQuantity = document.querySelectorAll("[data-nostock-quantity]");
			if (attributes[atr].selectedIndex == 0) {
				for (sa=0;sa<stockCartAttribute.length;sa++){
					stockCartAttribute[sa].style.display = 'flex';
				}
				for (sq=0;sq<noStockQuantity.length;sq++){
					noStockQuantity[sq].style.display = 'flex';
				}
			}
		}
	}
}

function invalidAttributeGroup (e) {

	var targetContainer = getTargetContainer(e.detail.target);

	var selectedOption = e.detail.selectedOption;
  var selectedOptionLabel = selectedOption.parentElement;
  if(selectedOption.tagName != 'OPTION'){
 	 removeClass(selectedOptionLabel,'chekedLabel');
  }

	var prodId = (targetContainer && targetContainer != "") ? targetContainer.getAttribute("data-zs-product-id") : "";
	var errorContainer = targetContainer.querySelectorAll('[data-theme-error="theme-error-message-'+prodId+'"]')[0];

	errorContainer.className = ' theme-variant-select-error';
	errorContainer.style.display = 'inline-block';
	errorContainer.innerHTML = i18n.get("product.message.error.selected_invalid_group");

	// REMOVE FLOATER EFFECT OF ERROR MESSAGE IF CART BUTTON HIDDEN

	var stockCartAttribute = document.querySelectorAll('[data-nostock-cart-add="theme-nostock-cart-add"]');
	stockCartAttributeLength = stockCartAttribute.length;
	for(sa=0;sa<stockCartAttributeLength;sa++){
		var stockCartAttributeDisplay = stockCartAttribute[sa].style.display;
		if(stockCartAttributeDisplay == 'none'){
			addClass(errorContainer,'theme-error-no-cart-button');
		}
		else{
			removeClass(errorContainer,'theme-error-no-cart-button');
		}
	}

	// REMOVE FLOATER EFFECT OF ERROR MESSAGE IF CART BUTTON HIDDEN END

}

function addToCartLoading (e) {
	var addcartButton = e.detail.target;
	addClass(addcartButton,'theme-cart-loading-container');
	var cartButtonText = addcartButton.querySelectorAll('[data-theme-cart-button-text="theme-cart-button-text"]')[0];
	var cartButtonLoading = addcartButton.querySelectorAll('[data-theme-cart-button-loading="theme-cart-button-loading"]')[0];
	var cartButtonLoadingFive = addcartButton.querySelectorAll('[data-theme-cart-button-loading-five="theme-cart-button-loading-five"]')[0];
	var cartLoadingTwo = addcartButton.querySelectorAll('[data-theme-cart-button-icon="data-theme-cart-button-icon"]')[0];
	if(cartButtonText){
		cartButtonText.style.display = "none";
	}
	if(cartButtonLoading){
		cartButtonLoading.style.display = "block";
	}
	if(cartButtonLoadingFive){
		cartButtonLoadingFive.style.display = "flex";
	}
	if(cartLoadingTwo){
		cartLoadingTwo.style.display = "none";
	}
}
function updateToCartLoading (e) {
	var updateCartButton = e.detail.target;
	var cartupdateloading = document.querySelector("[data-theme-loader]");
	if(updateCartButton.hasAttribute("data-zs-update")){
		addClass(updateCartButton,'theme-cart-updating');
		updateCartButton.style.display = 'none';
	}else if(cartupdateloading){
		showLoader()
	}
}

function deleteFromCartLoading (e) {
	var deleteButtonElem = e.detail.target;
	addClass(deleteButtonElem,'theme-cart-item-removing');
}

function imageOrder (e){
	var imageIds = e.detail.image_ids;

	prodId = e.detail.productId;
	var thumbanailcontainer = document.querySelectorAll('[data-theme-thumbnail-container="theme-thumbnail-container-'+prodId+'"]')[0];
	if(thumbanailcontainer){
		var allImages = thumbanailcontainer.querySelectorAll("[data-zs-image-id]");
	}
	var first = true;
	var imageIdLength;
	if(imageIds.indexOf('-1') >= 0 ){
    	imageIdLength = imageIds.length - 1;
	}
  else{
		imageIdLength = imageIds.length;
  }
	if(imageIdLength == 1){
		if(thumbanailcontainer){
    		thumbanailcontainer.style.display = 'none';
		}
  }
  else{
		if(thumbanailcontainer){
  		thumbanailcontainer.style.display = 'flex';
		}
  }
	if(thumbanailcontainer){
		for (var i = 0; i < allImages.length; i++) {
				var image = allImages[i];
				var imageId = image.getAttribute("data-zs-image-id");
				var previousDisplay = image.style.display;
				if (previousDisplay !== "none") {
						image.setAttribute("data-show-display", image.style.display);
				}
				image.style.display = "none";
				addClass(image,'hb-grid-hide');
				if (imageIds.indexOf(imageId) > -1) {
						image.style.display = image.getAttribute("data-show-display");
						if (first) {
								image.querySelector("img").click();
								first = false;
						}
						removeClass(image,'hb-grid-hide');
				}
				if(imageIds.length == 0 || (imageIds.length == 1 && imageIds[0] == "-1")){
					image.style.display = "flex";
					removeClass(image,'hb-grid-hide');
				}
		}
	}
}

function selectedVariant(e) {
	var currentStock = e.detail.variant_id;
	var currentElementId = e.detail.productId;
	var allStocks = document.querySelectorAll("[data-variant-id-stock]");
	var stockCartAttribute = document.querySelectorAll('[data-nostock-cart-add="theme-nostock-cart-add"]');
	var noStockQuantity = document.querySelectorAll("[data-nostock-quantity]");
	_hideCustomFieldsOfVariants(e.detail.productId);
	_displayCustomFieldOfVariant(currentStock, e.detail.productId);
	if (currentStock) {
		_displayWishlistIconOfVariant(currentStock);
	}
	for (var i = 0; i < allStocks.length; i++) {
		stocks = allStocks[i];
		stock = stocks.getAttribute("data-variant-id-stock");
		stocks.style.display = 'none';
		if (stock == currentStock) {

			var stockAvail = stocks.getAttribute('data-stock-avail');
			if (stockAvail == 'true') {
				stocks.style.display = "inline-block";
				for (sa = 0; sa < stockCartAttribute.length; sa++) {
					stockCartAttribute[sa].style.display = 'none';
				}
				for (sq = 0; sq < noStockQuantity.length; sq++) {
					noStockQuantity[sq].style.display = 'none';
				}
				addClass(stocks, 'theme-out-of-stock');
			}
			else {
				stocks.style.display = "none";
				for (sa = 0; sa < stockCartAttribute.length; sa++) {
					stockCartAttribute[sa].style.display = 'flex';
				}
				for (sq = 0; sq < noStockQuantity.length; sq++) {
					noStockQuantity[sq].style.display = 'flex';
				}
				removeClass(stocks, 'theme-out-of-stock');
			}
		}
	}

	// REMOVE CUSTOM FIELD ERRORS WHEN CLICK THE VARIANTS

	var variantContainer = $D.get('[data-variant-id="'+ currentStock +'"]');
	if(variantContainer){
		var targetContainer = getTargetContainer(variantContainer);
		if(targetContainer) {
			var customFields = $D.getAll('[data-custom-field-id]', targetContainer);
			customFields.forEach( function (field) {
					_removeErrorElement(field);
			});
		}
	}

	// END REMOVE CUSTOM FIELD ERRORS WHEN CLICK THE VARIANTS

	// Start - To update additional offers on variant change
		var currentContainer = $D.get('[data-zs-product-id="'+currentElementId+'"]');
		if(currentContainer){
			var additionalOfferContainer = currentContainer.querySelectorAll('[data-zs-pricelist-variantid]');
		    if(additionalOfferContainer){
	            for(i=0;i<additionalOfferContainer.length;i++){
					additionalOfferContainer[i].style.display = "none";
					additionalOfferContainer[i].classList.remove('theme-prod-pricelist-active');
				}
				var activeVariant = $D.get('[data-zs-pricelist-variantid ="' + e.detail.variant_id + '"]');
				if(e.detail.variant_id != -1 && activeVariant){
					activeVariant.style.display = "block";
					activeVariant.classList.add('theme-prod-pricelist-active');
				}
	        }
    	}
    // End - To update additional offers on variant change
}

function loadVariantBasedImages(e) {
  let selectedVariantId = e.detail.variant_id;
  let targetConatiner =  e.detail.targetContainer;
  let allOptions = targetConatiner.querySelectorAll('[data-zs-variants] option');
  let matchedOption = Array.from(allOptions).find(opt => opt.value === selectedVariantId);
  if (matchedOption) {
    const imageUrl = matchedOption.getAttribute('data-zs-img-url');
    const imageAlt = matchedOption.getAttribute('data-zs-img-alt');
    if (imageUrl && !matchedOption.getAttribute('data-zs-images').includes('-1')) {
      const productImage = targetConatiner.querySelector('.theme-product-image-area img'); 
      if (productImage) {
        productImage.src = imageUrl;
        productImage.setAttribute('data-src', imageUrl);
        productImage.setAttribute('alt', imageAlt);
        productImage.style.display = 'block';
      }
    }
  }
}



function showMoreToggle (el,status) {
	var toggleContainer = document.querySelector('.theme-prod-pricelist-active .theme-prod-pricelist-morelist-outter');
	var toggleContent = document.querySelector('.theme-prod-pricelist-active .theme-prod-pricelist-morelist');
	if(status == 'show'){
		el.style.display = 'none';
		el.parentNode.querySelector('.theme-prod-pricelist-hide-btn').style.display = 'block';
		toggleContainer.style.height = toggleContent.clientHeight + "px";
	}else if(status == 'hide'){
		el.style.display = 'none';
		el.parentNode.querySelector('.theme-prod-pricelist-show-btn').style.display = 'block';
		toggleContainer.style.height = '0px';
	}
}

function selectcolorVariantImage(label, attribute) {
    var selectedVariant = label.querySelector('input[type="radio"]:checked');
    selectcolor(label,attribute)
    if (selectedVariant) {
        var variantId = selectedVariant.value;
	var productImage = label.closest('.theme-product-box-content').querySelector('.theme-product-image-area img');    // No I18N
 		var variantImages = label.closest('.theme-product-box-content').querySelectorAll('.variant-based-images picture img');   // No I18N    
        variantImages.forEach(function(img) {
            if (img.id === variantId) {
                var imageUrl = img.getAttribute('src');
                productImage.src = imageUrl;
                productImage.setAttribute('data-src', imageUrl);
            }
        });
    }
}
function customSortBySelect(value, label, clickedElement) {
	let customSortOverlay = document.querySelector('[data-custom-sort-overlay]');
	let select = document.querySelector('[data-sort-by-products]');
	let customSelect = document.querySelector('[data-custom-select-value]');
	let customSelectContainer = document.querySelector('[data-custom-select-option-container]');
	if(customSelectContainer) {
	  var customSortByCheck = customSelectContainer.querySelector('[data-custom-check="'+value+'"]');
	  var customChecks = customSelectContainer.querySelectorAll('[data-custom-check]');
	  customChecks.forEach((check) => {
        check.removeAttribute('data-sortby-check');
      });
	}
	if(customSortOverlay && customSortByCheck && customChecks){
		customSortOverlay.addEventListener('click',() => {
			customSelectContainer.classList.remove('theme-open-custom-sort'); // No I18N
		})
		customChecks.forEach((check) => {
				check.removeAttribute('data-sortby-check');
		});
		customSortByCheck.setAttribute('data-sortby-check', 'checked');
	}
	else{
		let allOptions = document.querySelectorAll('.theme-custom-select-option');
		allOptions.forEach(option => option.classList.remove('active')); // No I18N
		if(clickedElement.classList.contains('theme-custom-sort-option-conatiner')){
			let option = clickedElement.querySelector('.theme-custom-select-option');
			if (option){
				option.classList.add('active'); // No I18N
			}
		}
		else {
			clickedElement.classList.add('active'); // No I18N
		}
	}
	if (select) {
    select.value = value;
    select.dispatchEvent(new Event("change")); // No I18N
    customSelect.innerText = label;
    setTimeout(() => {
      customSelectContainer.classList.remove("theme-open-custom-sort"); // No I18N
    }, 250);
  }
}
function toggleCustomSort(element){
	let customSelectContainer = element.querySelector('[data-custom-select-option-container]');
	let customOpenClose = element.querySelector('.theme-sort-open-close');
	let isfilterOpen = document.querySelector('.theme-open-filters');
	if(customSelectContainer || isfilterOpen){
		customSelectContainer.classList.toggle('theme-open-custom-sort');
		customOpenClose.classList.toggle('theme-toggle-open');
		element.setAttribute("aria-expanded", true);
		if(isfilterOpen) {
			isfilterOpen.classList.remove('theme-open-filters'); // No I18N
		}
	}
}

function openFilterByDefault(filtertype) {
	setTimeout(() => {
	  let filterElementId = filtertype.getAttribute("data-zs-filter-option-container-id");
	  let allFilters = document.querySelectorAll('.theme-mobile-filter-show [data-zs-filter-option-container-id]');
	  for (let filterElement of allFilters) {
		let filterId = filterElement.getAttribute("data-zs-filter-option-container-id");
		let filterHeader = filterElement.querySelector('.theme-product-filter-type');
		let filterOptions = filterElement.querySelector('[data-zs-filter-option-values-wrapper]');
		if (filterId === filterElementId) {
		  if (filterHeader) {
			if (!filterHeader.classList.contains('theme-filter-close-toggle')) {
			  filterHeader.classList.add('theme-filter-close-toggle'); // No I18N
			  filterOptions.style.display = "block";
			}
			if (filterHeader.classList.contains('theme-filter-expand-toggle')) {
			  filterHeader.classList.remove('theme-filter-expand-toggle'); // No I18N
			}
		  }
		} else {
		  if (filterHeader) {
			if (filterHeader.classList.contains('theme-filter-close-toggle')) {
			  filterHeader.classList.remove('theme-filter-close-toggle'); // No I18N
			}
			if (!filterHeader.classList.contains('theme-filter-expand-toggle')) {
			  filterHeader.classList.add('theme-filter-expand-toggle'); // No I18N
			  filterOptions.style.display = "none";
			}
		  }
		}
  
	  }
	}, 500)
  }

function handleCurrencyTooltipContainer(event) {
	if (multi_currency.getBaseCurrency) {
		var targetCurrencyObj;
		var baseCurrencyObj = multi_currency.getBaseCurrency();
		if (event.detail.currencyObj && Object.keys(event.detail.currencyObj).length > 0) {
			targetCurrencyObj = event.detail.currencyObj;
		} else if (event.detail && Object.keys(event.detail).length > 0) {
			targetCurrencyObj = event.detail;
		}
	
		var currencyTooltipContainer = document.querySelector('[data-theme-currency-tooltip]');
		var baseCurrencyContent = document.querySelector('[data-zs-cart-base-currency-content]');
		var canShowTooltip = targetCurrencyObj && !targetCurrencyObj.can_checkout && !targetCurrencyObj.is_base_currency;
		if (currencyTooltipContainer) {
			var tooltipContent = currencyTooltipContainer.querySelector('.tooltiptext');
			if (canShowTooltip) {
				tooltipContent.innerText = i18n.get("currency.message.error.not_configured", baseCurrencyObj.currency_code);
				currencyTooltipContainer.style.display = 'inline-block';
			} else {
				currencyTooltipContainer.style.display = 'none';
			}
		}
	
		if (baseCurrencyContent && baseCurrencyObj) {
			if (canShowTooltip) {
				baseCurrencyContent.innerText = i18n.get("cart.basecurrency.message", baseCurrencyObj.currency_code);
				baseCurrencyContent.style.display = 'block';
				baseCurrencyContent.style.marginBottom = '20px'; // No I18N
			} else {
				baseCurrencyContent.style.display = 'none';
			}
		}
	}
	var priceMaskContainers = document.querySelectorAll('.price-mask');
	priceMaskContainers.forEach(function(container) {
		container.classList.remove('price-mask'); // No I18N
	});
	
}

function multiCurrencyLoaded(e){
	var baseCurrency = document.querySelector('[data-theme-base-currency]');
	var currencyListContainer = document.querySelector('[data-theme-currency-list-ul]');
	var currencyListClick = document.querySelector('[data-theme-currency-list-container]');
	var currencyContainerHeight = document.querySelector('[data-theme-currency-list-container]');
	var currencyPlaceHeight = document.querySelector('[data-theme-currency-placeholder-non-res]');
	var curHeight = currencyListContainer.clientHeight;
	if(window.innerWidth > 992){
		if(curHeight != 0){
			currencyPlaceHeight.style.height = curHeight+'px';
			currencyContainerHeight.style.height = curHeight+'px';
      currencyContainerHeight.style.display = 'flex';
			currencyContainerHeight.style.alignItems = 'start'; // No I18N
			currencyContainerHeight.style.justifyContent = 'center'; // No I18N
		}
	}
	var targetCurrency = e.detail.currency_code;
	if(targetCurrency){
		currencyListContainer.insertBefore(targetCurrency,currencyListContainer.childNodes[0]);
	}
	else{
		if(baseCurrency){
			currencyListContainer.insertBefore(baseCurrency,currencyListContainer.childNodes[0]);
		}
	}

	handleCurrencyTooltipContainer(e);
	currencyListClick.removeEventListener('click',openCurrency);
	currencyListClick.addEventListener('click',openCurrency);
  if(window.innerWidth < 992 ){
      currencyListContainer.addEventListener('click',function(){
          currencyListClick.removeEventListener('click',openCurrency);
      });
  }
}

function openCurrency(){
	var currencyList = document.querySelectorAll('[data-theme-currency-list]');
	var currencyListContainer = document.querySelector('[data-theme-currency-list-ul]');
	var currencyHideOverlay = document.querySelector('[data-theme-currency-hide-overlay]');
	var currencyHideMobile = document.querySelector('[data-theme-currency-hide-mobile]');
	var currencyMobileOpenTop = document.querySelector('[data-theme-currency-open-top]');
	var resMenu = document.querySelector('[data-non-res-menu="zptheme-menu-non-res"]');
	for(cur=0;cur<currencyList.length;cur++){
		if(currencyList[cur].style.display == 'flex'){
			currencyList[cur].style.display = 'none';
			currencyListContainer.firstChild.style.display = "flex";
			removeClass(currencyListContainer,'theme-currency-open');
			currencyHideOverlay.style.display = "none";
			removeClass(resMenu,'theme-change-zindex');
			currencyMobileOpenTop.style.display = "none";
		}
		else{
			currencyList[cur].style.display = 'flex';
			addClass(currencyListContainer,'theme-currency-open');
			currencyHideOverlay.style.display = "block";
			currencyHideMobile.style.display = "block";
			currencyMobileOpenTop.style.display = "flex";
			addClass(resMenu,'theme-change-zindex');
		}
	}
}

function resetMultiCurrency(e){
	var baseCurrency = document.querySelector('[data-theme-base-currency]');
	var currencyListContainer = document.querySelector('[data-theme-currency-list-ul]');
	var allCurrency = currencyListContainer.children;
	var targetCurrency = e.detail.currency_code;
	if(targetCurrency){
		currencyListContainer.insertBefore(targetCurrency,currencyListContainer.childNodes[0]);
	}
	else{
		if(baseCurrency){
			currencyListContainer.insertBefore(baseCurrency,currencyListContainer.childNodes[0]);
			for(ac=0;ac < allCurrency.length ; ac++){
      	allCurrency[ac].style.display = "none";
      }
			baseCurrency.style.display = "flex";
		}
	}
	handleCurrencyTooltipContainer(e);
}

function _displayCustomFieldOfVariant(variantId, productId) {
		//display customn fields of appropriate variant
	var variantElements = $D.getAll('[data-variant-id="'+ variantId +'"]');
	var customFieldMainContainers = $D.getAll('[data-custom-field-main-container]');
	var customFieldQuickview = $D.get('[data-theme-custom-field-quickview]');
	var hasVariantsToDisplay = false;
	variantElements.forEach(function(variant) {
		$D.css(variant, 'display', '');
		hasVariantsToDisplay = true;
	});

	if(hasVariantsToDisplay){
		customFieldMainContainers.forEach( function(customFieldMainContainer) {
			var targetContainer = productId ? customFieldMainContainer.closest('[data-zs-product-id="'+ productId +'"]') : customFieldMainContainer.closest('[data-zs-product-id]');
			var customFieldAccordion = customFieldMainContainer.closest('[data-custom-field-accordion]'); // No I18N
			if(targetContainer){
				$D.css(customFieldMainContainer, 'display', '');
				if(customFieldAccordion){
					$D.css(customFieldAccordion, 'display', '');
				}
			}
		});

		if(customFieldQuickview){
			$D.css(customFieldQuickview, 'padding-block-start', '29px');
		}
	}
}

function _displayWishlistIconOfVariant(variantId) {
	const wishlistElement = document.getElementById('wishlist-variant');
	window.zs_wishlist_variants = window.zs_wishlist_variants || {};
	if (wishlistElement && variantId != -1) {
		wishlistElement.setAttribute('data-zs-wishlist-variant-id', variantId);
		wishlistElement.disabled = false;
		wishlistElement.onclick = function () {
			addToWishlistFromList(variantId, wishlistElement);
		};
		if (window.zs_wishlist_variants.hasOwnProperty(variantId)) {
			wishlistElement.setAttribute('data-zs-wishlisted', window.zs_wishlist_variants[variantId]);
		} else if (typeof wishlist != "undefined" && zs_wishlist_enabled) {
			wishlist.initForElement(wishlistElement, true);
		}
	}
}

function _hideCustomFieldsOfVariants(productId) {
	var customFieldMainContainers = $D.getAll('[data-custom-field-main-container]');
	var customFieldQuickview = $D.get('[data-theme-custom-field-quickview]');
	$D.getAll('[data-variant-id]').forEach(function(variant) {
		var targetContainer = productId ? variant.closest('[data-zs-product-id="'+ productId +'"]') : variant.closest('[data-zs-product-id]');
		if(targetContainer) {
			$D.css(variant, 'display', 'none');
		}
	});

	customFieldMainContainers.forEach( function(customFieldMainContainer) {
		var targetContainer = productId ? customFieldMainContainer.closest('[data-zs-product-id="'+ productId +'"]') : customFieldMainContainer.closest('[data-zs-product-id]');
		var customFieldAccordion = customFieldMainContainer.closest('[data-custom-field-accordion]'); // No I18N
		if(targetContainer){
			$D.css(customFieldMainContainer, 'display', 'none');
			if(customFieldAccordion){
				$D.css(customFieldAccordion, 'display', 'none');
			}
		}
	});

	if(customFieldQuickview){
		$D.css(customFieldQuickview, 'padding-block-start', '0');
	}
}


function customFieldValidation(e) {
	let customFieldsAccordion = document.querySelector("[data-custom-field-accordion]");
	let customFieldSliderToggle = document.getElementById("custom-fields");
	if (customFieldsAccordion) {
	  customFieldsAccordion.setAttribute("open", "");
	}
	if (customFieldSliderToggle) {
	  customFieldSliderToggle.checked = true;
	}
  var detail = e.detail;
  if (detail.custom_fields) {
    detail.custom_fields.forEach(function (field) {
      _removeErrorElement(field);
    });
  }

  if (detail.error_custom_fields) {
    detail.error_custom_fields.forEach(function (error, index) {
      var data = {
        element: error.field,
        message: error.message
      };
      if (index == 0) {
        data.scroll = true;
        data.scrollposition = "center";
        data.scrollViewElem = error.field.parentNode;
      }
      addErrorMsg(data);
    });
  }
}

function showSearchLoader(e){
  var resultTarget = e.detail.element;
  var mainHeader = $D.get('[data-headercontainer]');
  var mobileHeaderFix = mainHeader.classList.contains('theme-mobile-header-fixed');
	var searchButton = e.detail.submitElem;
	if(searchButton){
		var searchDots = searchButton.parentNode.querySelector('[data-theme-search-loader-dots]');
	}
	if(searchButton && searchDots){
		addClass(searchDots,'theme-show-search-loader-dots');
    searchButton.style.display = "none";
	}
	showLoader()
  if(resultTarget){
      addClass(resultTarget,'theme-searching-opacity');
  }
  if(mainHeader){
  	var mainHeaderHeight = mainHeader.clientHeight;
  }
}
function hideSearchLoader(e){
	var loader = $D.get('[data-theme-loader]');
  var tempLoad = $D.get('[data-theme-temp-load]');
	var searchButton = e.detail.submitElem;
	if(searchButton){
		var searchDots = searchButton.parentNode.querySelector('[data-theme-search-loader-dots]');
	}
	if(searchButton && searchDots){
		removeClass(searchDots,'theme-show-search-loader-dots');
          searchButton.style.display = "block";
	}
  if(tempLoad){
  	tempLoad.parentNode.removeChild(tempLoad);
  }
    var resultTarget = e.detail.element;
	hideLoader();
	if(resultTarget){
		removeClass(resultTarget,'theme-searching-opacity');
	}
	window.scrollTo({top:0, behaviour:'smooth'});
	mobileFilter();
}

function closeSuggestionsContainer() {
	var searchOverlays = document.querySelectorAll('.theme-search-suggestion-overlay');
	searchOverlays.forEach(function(searchOverlay) {
		var suggestionsContainer = searchOverlay.querySelector('#search-suggestions');
		var searchContainer = searchOverlay.querySelector('.theme-search-suggestion-container');
		var searchStyle = searchOverlay.getAttribute('data-search-style');
		var body = document.querySelector('body');
		
		if (suggestionsContainer) {
			suggestionsContainer.style.display = 'none';
		}
		
		if (searchStyle === "01") {
			body.classList.remove('theme-body-hide-overflow'); // No I18N
			searchOverlay.classList.remove('theme-show-overlay'); // No I18N
			if (searchContainer) {
				searchContainer.classList.remove('theme-show-live-search'); // No I18N
			}
		}
	});
}

function showLoader(){
	var loader = $D.get('[data-theme-loader]');
	var body = document.getElementsByTagName("body")[0];
	var offsetVal = window.pageYOffset;
	var header = $D.get('[data-header]');
	var mainHeader = $D.get('[data-headercontainer]');
	var headerAni = header.classList.contains('theme-header-animate');
	var headerSix = mainHeader.classList.contains('zpheader-style-06');
	if(loader){
		addClass(loader,'theme-loader-show');
		addClass(body,'theme-loader-body-hidden');
	}
	if(header){
		var headerHeight = header.clientHeight;
	}
	if(header && offsetVal > headerHeight && headerAni && !headerSix){
		loader.children[0].style.marginTop = (offsetVal+headerHeight)+'px';
	}
	  else if(mainHeader && headerSix){
		loader.children[0].style.marginTop = (offsetVal+80)+'px'
	}
}

function hideLoader(){
	var loader = $D.get('[data-theme-loader]');
	  var body = document.getElementsByTagName("body")[0];
	  if(loader){
		  removeClass(loader,'theme-loader-show');
		  removeClass(body,'theme-loader-body-hidden');
	  }
}

function uploadAttachmentCustomFieldsSuccess(e) {
    var data = e.detail;
    var attachment_element = e.detail.field;
    var variantElement = data.variant_element;

    var customfieldId = attachment_element.getAttribute("data-custom-field-id");

    attachment_element.setAttribute("data-value", data.document_id)

    var attachmentClickElem = $D.get('[data-zs-attachment-upload-custom-field-id="' + customfieldId+ '"]', variantElement);
    if(attachmentClickElem) {
        var attachmentClickLabel = $D.get('[data-zs-attachment-label]', attachmentClickElem);
        if(attachmentClickLabel) {
            attachmentClickLabel.innerText = i18n.get("product.custom_field.attachment.change_file");
        }
    }

    var nameContainer = $D.get('[data-zs-attachment-name-container="'+ customfieldId +'"]', variantElement);
    if(nameContainer) {
        var fileName = $D.get('[data-attachment-file-name]', nameContainer);
        if(fileName) {
            fileName.innerText = data.attachment_file_name;
        }

        $D.css(nameContainer, 'display', '');

        var remove = $D.get('[data-zs-remove-attachment]', nameContainer);
        remove.addEventListener("click", function(e) {
            attachment_element.setAttribute("data-value", "")
            $D.css(nameContainer, 'display', 'none');

            var attachmentClickLabel = $D.get('[data-zs-attachment-label]', attachmentClickElem);
            if(attachmentClickLabel) {
                attachmentClickLabel.innerText = i18n.get("product.custom_field.attachment.choose_file");
            }

        });

    }

    //remove attachment error element
    _removeErrorElement(attachment_element)
}

function elementLoader(e) {
    var targetElement = e.detail.element;
    var displayOption = e.detail.display;

    if(targetElement) {
        if(displayOption == "none") {
            targetElement.removeAttribute("disabled");
        } else {
            targetElement.setAttribute("disabled", true);

        }

        var svgElement = $D.getByTag('svg', targetElement)[0];
        if(svgElement) {
            $D.css(svgElement, 'display', displayOption);

        }
    }

}

// Delivery location popup loader

function showPopupLoader(e){
	if(deliveryLocationLoader){
		deliveryLocationLoader.style.display = 'flex';
	}
}
function hidePopupLoader(e){
	if(deliveryLocationLoader){
		deliveryLocationLoader.style.display = 'none';
	}
	deliveryLocationPinInput = document.querySelector('[data-theme-popup-postalcode]');
	deliveryLocationPinError = document.querySelector('[data-zs-delivery-availability-popup-error-message]');
	deliveryLocationPinValidate(deliveryLocationPinInput,deliveryLocationPinError);
}

function showBreadCrumb() {
  let breadcrumb = document.querySelector("[data-breadcrumb-container]");
  if (breadcrumb) {
    if (
      ['category', 'product'].includes(window.zs_view) &&    // No I18N
      breadcrumb.querySelector("[data-breadcrumb]").children.length > 0
    ) {
      breadcrumb.style.display = "flex";
    } else {
      breadcrumb.style.display = "none";
    }
  }
}

function imageZoom(productImage, productImageMagnify) {
  var lens, productImageMagnifyAndLensRatioX, productImageMagnifyAndLensRatioY;  
  lens = document.createElement("div");
  lens.setAttribute("class", "img-zoom-lens");
  const existingLens = productImage.parentElement.querySelector('.img-zoom-lens');
  if (!existingLens) {
    productImage.parentElement.insertBefore(lens, productImage);
  }
  productImageMagnifyAndLensRatioX = productImageMagnify.offsetWidth / lens.offsetWidth;
  productImageMagnifyAndLensRatioY = productImageMagnify.offsetHeight / lens.offsetHeight;
  let ProductImageUrl = productImage.src;
  let ProductMagnifyImageUrl
  const magnifyImageWidth = 1400;
  const magnifyImageHeight = 1400;
  const match = ProductImageUrl.match(/\/(\d+)x(\d+)(?=[/?]|$)/i);
  if (match) {
    const productImageWidth = parseInt(match[1]);
    const productImageHeight = parseInt(match[2]);
    ProductMagnifyImageUrl = ProductImageUrl.replace(`${productImageWidth}x${productImageHeight}`, `${magnifyImageWidth}x${magnifyImageHeight}`);
  }
  productImageMagnify.style.backgroundImage = "url('" + ProductMagnifyImageUrl + "')"; // No I18N
  productImageMagnify.style.backgroundSize = (productImage.width * productImageMagnifyAndLensRatioX) + "px " + (productImage.height * productImageMagnifyAndLensRatioY) + "px"; // No I18N
  lens.addEventListener("mousemove", moveLens);
  productImage.addEventListener("mousemove", moveLens);
  lens.addEventListener("touchmove", moveLens);
  productImage.addEventListener("touchmove", moveLens);
  productImageMagnify.style.display = "none";
  lens.onmouseover = function() { productImageMagnify.style.display = "block"; };
  lens.onmouseout = function() { productImageMagnify.style.display = "none"; };

  function moveLens(event) {
    var cursorPosition, lensPositionX, lensPositionY;
    event.preventDefault();
    cursorPosition = getCursorPos(event);
    lensPositionX = cursorPosition.imagePositionX - (lens.offsetWidth / 2);
    lensPositionY = cursorPosition.imagePositionY - (lens.offsetHeight / 2);
    if (lensPositionX > productImage.width - lens.offsetWidth) { lensPositionX = productImage.width - lens.offsetWidth; }
    if (lensPositionX < 0) { lensPositionX = 0; }
    if (lensPositionY > productImage.height - lens.offsetHeight) { lensPositionY = productImage.height - lens.offsetHeight; }
    if (lensPositionY < 0) { lensPositionY = 0; }
    lens.style.left = lensPositionX + "px";
    lens.style.top = lensPositionY + "px";
    productImageMagnify.style.backgroundPosition = "-" + (lensPositionX * productImageMagnifyAndLensRatioX) + "px -" + (lensPositionY * productImageMagnifyAndLensRatioY) + "px"; // No I18N
  }

  function getCursorPos(event) {
    var productImageRect,imagePositionX = 0, imagePositionY = 0;
    event = event || window.event;
    productImageRect = productImage.getBoundingClientRect();
    imagePositionX = event.pageX - productImageRect.left;
    imagePositionY = event.pageY - productImageRect.top;
    imagePositionX = imagePositionX - window.pageXOffset;
    imagePositionY = imagePositionY - window.pageYOffset;
    return { imagePositionX: imagePositionX, imagePositionY: imagePositionY };
  }
}
  
function enableImageMagnify(){
  let zoomEnable = document.querySelector('.magnify-image');
  let picture = document.querySelector('[data-zs-product-img-container] picture ');
  if(!picture){ return }
  let productImage = picture.querySelector('img');
  if (productImage.src.includes("no-preview-image")) {
    return;
  }
  let productDetail   = document.querySelector('[data-zs-product-details-primary-section]');
  const imgZoomContainer = document.createElement('div');
  imgZoomContainer.className = 'img-zoom-container';
  productImage.id = 'product-image';
  const productImageMagnify = document.createElement('div');
  productImageMagnify.id = 'magnify-image';
  productImageMagnify.className = 'img-zoom-result';
  productImageMagnify.style = "";
  if(zoomEnable && (window.innerWidth > 768)){
    imgZoomContainer.appendChild(productImage);
    productDetail.appendChild(productImageMagnify);
    picture.appendChild(imgZoomContainer);
    imageZoom(productImage, productImageMagnify );
  }
  let thumbnailImages = document.querySelectorAll('[data-theme-thumbnail-container] [data-zs-image-id]');
  if(thumbnailImages){
    for (const thumbnail of thumbnailImages){
      thumbnail.addEventListener('click',() => {
        if(zoomEnable && (window.innerWidth > 768)){
		  setTimeout(() => {
            imageZoom(productImage, productImageMagnify );
		  }, 300);
        }
      })
    }
  }
}


function setAttrOptionImages() {
	let productContainers = document.querySelectorAll("[data-zs-product-id]");
    productContainers.forEach((productContainer) => {
	  let optionImages = productContainer.querySelectorAll('[data-zs-attribute-option-image]');
      let variantImages = productContainer.querySelectorAll('[data-zs-variants] option');
    let variantsMap = [];
    
    if (optionImages && variantsMap) {
      variantImages.forEach((img) => {
        let variantId = img.getAttribute("id");
        let attributes = img.getAttribute("data-zs-attributes");
        let imgUrl = img.getAttribute("data-zs-img-url");
        
        if (variantId && attributes && imgUrl) {
          variantsMap.push({
            variantId: variantId,
            attributIds: JSON.parse(attributes), // Parse the stringified array
            imgUrl: imgUrl
          });
        }
      });

      optionImages.forEach((img) => {
        let optionId = img.getAttribute("id");
        let found = false; // Flag to stop further iterations once a valid image is found
        
        for (let variant of variantsMap) {
          if (variant.attributIds.includes(optionId)) {
            // Only set the URL if no valid image is already set
            if (!found || img.src.includes("zs-common/images/no-preview-image")) {
              img.setAttribute("src", variant.imgUrl);
              // Stop further iterations for this optionId once a valid image is set
              if (!variant.imgUrl.includes("zs-common/images/no-preview-image")) {
                found = true;
              }
            }
          }
        }
      });
    }
  })
}



function selectAttributeOnLoad(container) {
  if (!(container instanceof Element) && container !== document) {
    container = document;
  }
  let variantContainers = container.querySelectorAll('.theme-product-box-content [data-zs-product-variant-container]');
  if (variantContainers.length) {
    variantContainers.forEach(container => {
      let option = container.querySelector('[data-zs-attribute-option]');  
      let label = option.closest('label'); // No I18N
      let select = option.closest('select'); // No I18N

      if (label) {
        label.click();
      } 
      else if (select) {
        select.value = option.getAttribute('value');
      }
    });
  }
}
// Auto select first option on quickview open
function  autoSelectVariants() {
  let quickViewContainer = document.getElementById('product_quick_look');
  if (quickViewContainer) {
	selectAttributeOnLoad(quickViewContainer);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  let quoteButton = document.querySelector("[data-zs-add-to-quote]");
  if (quoteButton) {
    quoteButton.addEventListener("click", (event) => {
      if (window.isLoggedInUser !== true && window.zs_view === "product") {
        event.preventDefault();
        window.location.href = "/signin";
      }
    });
  }
});

function updateVariantName() {
  document.querySelectorAll('input[type="radio"][data-zs-attribute-option]').forEach(radio => {
  radio.addEventListener('change', function () { 
    if (this.checked) {
      let variantContainer = this.closest('[data-zs-product-variant-container]'); // No I18N
	  if(variantContainer) {
	    let labelElement = variantContainer.querySelector('[data-zs-attribute-label]');
        let selectedText = this.getAttribute('data-text');
        if (labelElement && selectedText) {
          labelElement.textContent = `${selectedText}`;
        }
	  }
    }
  });
});

}
document.addEventListener('DOMContentLoaded', () => {
	if(window.zs_view === 'product') {
		updateVariantName();
	}
});

let listLayouts = document.querySelectorAll('.theme-product-list-style-17 ,.theme-product-list-style-18');


function showLabelPrice() {
	document.querySelectorAll('[data-zs-label-price]').forEach(labelPriceContainer => {
		let pricingContainer = labelPriceContainer.closest('[data-zs-pricings]'); // No I18N
		let sellingPriceContainer = pricingContainer.querySelector('[data-zs-selling-price]');
		let sellingPrice = sellingPriceContainer.getAttribute('data-zs-selling-price');
		let labelPrice = labelPriceContainer.getAttribute('data-zs-label-price');
		let discount = pricingContainer.querySelector("[data-product-discount], [data-variant-discount]");
		if(labelPrice > sellingPrice){
    		labelPriceContainer.style.display = 'block';
			if(discount){
				let discountPercentage = Math.round(((labelPrice - sellingPrice)/(labelPrice)) * 100);
				let discountValueContainer = discount.querySelector('[data-product-discount-percentage]');
				if(discountValueContainer){
					discountValueContainer.innerText = discountPercentage;
				}
			}
		}
		else{
			labelPriceContainer.style.display = 'none';
			if(discount){
				discount.style.display = 'none';
			}
		}
    })
}

function removePriceMask() {
	if (window.zs_rendering_mode != 'live') {
		var priceMaskContainers = document.querySelectorAll('.price-mask');
		priceMaskContainers.forEach(function(container) {
			container.classList.remove('price-mask'); // No I18N
		});
	}
}
function encodeTagUrls() {
	if (window.zs_view !== 'product') return;

	var base = window.location.origin;
	document.querySelectorAll('[data-zs-product-tag]').forEach(function (link) {
		var href = link.getAttribute('href');
		if (!href) return;

		try {
			var url = new URL(href, base);
			var params = new URLSearchParams(url.search);
			var encoded = [];
			params.forEach(function (value, key) {
				encoded.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
			});
			var newSearch = encoded.length ? '?' + encoded.join('&') : '';
			link.setAttribute('href', url.pathname + newSearch + url.hash);
		} catch (e) {
			// If URL parsing fails, leave href unchanged
		}
	});
}

function openMandatoryCustomField() {
  let customFieldAccordion = document.querySelector('[data-custom-field-accordion]');

  if (customFieldAccordion) {
    let mandatoryFields = customFieldAccordion.querySelectorAll('.theme-custom-mandatory-field');
    if (mandatoryFields.length > 0) {
      customFieldAccordion.setAttribute('open', '');
    }
  }
}

function toggleSortSlider() {
  let sortByMobileIcons = document.querySelectorAll('[data-theme-product-sortby-mobile-icon]');
  let sortByContainer = document.querySelector('[data-theme-sortby-with-no-filter]');
  if (sortByContainer) {
    sortByMobileIcons.forEach(sortByMobileIcon => {
      sortByMobileIcon.addEventListener('click', () => {
        sortByContainer.classList.toggle('theme-mobile-filter-show'); // No I18N
      });
    });
  }
}

function customFieldDatePickerValidation() {
	const dateInputs = document.querySelectorAll('[data-zs-app="datepicker_app"]');
	if (!dateInputs.length) return;
  
	const regex = /^\d{4}-\d{2}-\d{2}$/; // Validates date in YYYY-MM-DD format
  
    dateInputs.forEach(function (input) {
      const errorSpan = input.parentElement.nextElementSibling;
      if (!errorSpan) return;
	  
  
	  const validate = function () {
		const value = input.value.trim();
  
		if (!value) {
		  errorSpan.style.display = "none";
		  return;
		}
  
		errorSpan.style.display = !regex.test(value) ? "block" : "none";
	  };
  
	  input.addEventListener("blur", validate);
	  input.addEventListener("change", validate);
  
	});
  
  }
  document.addEventListener("DOMContentLoaded", () => {
    if (window.zs_view === "product") {
      customFieldDatePickerValidation();
    }
  });
  document.addEventListener("quickview:opened", customFieldDatePickerValidation);

document.addEventListener('DOMContentLoaded', encodeTagUrls);
document.addEventListener('DOMContentLoaded', toggleSortSlider);
document.addEventListener('DOMContentLoaded', openMandatoryCustomField);
document.addEventListener("DOMContentLoaded", removePriceMask);
document.addEventListener('DOMContentLoaded',setAttrOptionImages);
document.addEventListener("zp-event-add-to-cart-success", addToCartSuccess, false);
document.addEventListener("zp-event-add-to-cart-failure", addToCartFailure, false);
document.addEventListener("zp-event-update-to-cart-success", updateToCartSuccess, false);
document.addEventListener("zp-event-update-to-cart-failure", updateToCartFailure, false);
document.addEventListener("zp-event-delete-from-cart-success", deleteFromCartSuccess, false);
document.addEventListener("zp-event-delete-from-cart-failure", deleteFromCartFailure, false);
document.addEventListener("zp-event-add-to-cart-invalid-variant", addToCartWithInvalidVariant, false);
document.addEventListener("zp-event-invalid-product-quantity", invalidProductQuantity, false);
document.addEventListener("zp-event-attribute-selected", selectAttribute, false);
document.addEventListener("zp-event-attribute-group-invalid", invalidAttributeGroup, false);

document.addEventListener("zp-event-add-to-cart-loading", addToCartLoading, false);
document.addEventListener("zp-event-update-to-cart-loading", updateToCartLoading, false);
document.addEventListener("zp-event-delete-from-cart-loading", deleteFromCartLoading, false);

document.addEventListener("zp-event-wishlist-actions-alert", updateWishlistActionsAlert, false);
document.addEventListener("zp-event-saveforlater", updateSaveForLaterActionsAlert, false);

document.addEventListener("zp-event-image-ordered", imageOrder, false);

document.addEventListener("zp-event-selected-variant", selectedVariant, false);

document.addEventListener("zp-event-multi-currency-loaded", multiCurrencyLoaded, false);

document.addEventListener("zp-event-multi-currency-value-change", handleCurrencyTooltipContainer, false);

document.addEventListener("zp-event-multi-currency-value-reset", resetMultiCurrency, false);

document.addEventListener("zs-event-custom-field-validation-error", customFieldValidation, false);

document.addEventListener("zp-event-search-pending",showSearchLoader, false);

document.addEventListener("zp-event-search-success",hideSearchLoader, false);

document.addEventListener("zs-event-custom-field-attachment-success",uploadAttachmentCustomFieldsSuccess, false);
document.addEventListener("zs-event-button-loader",elementLoader, false);

document.addEventListener("zp-event-delivery-availability-popup-on-load",showPopupLoader, false);
document.addEventListener("zp-event-delivery-availability-popup-loaded",hidePopupLoader, false);
document.addEventListener("zp-event-check-delivery-availability-loading",showPopupLoader, false);
document.addEventListener("zp-event-check-delivery-availability-success",hidePopupLoader, false);
document.addEventListener("zp-event-check-delivery-availability-failure",hidePopupLoader, false);
document.addEventListener("DOMContentLoaded", showBreadCrumb, false);
document.addEventListener('DOMContentLoaded', enableImageMagnify, false)
document.addEventListener("quickview:opened", autoSelectVariants, false);
document.addEventListener("zp-event-selected-variant", loadVariantBasedImages);
document.addEventListener('pricelist:afterLoad', showLabelPrice);
document.addEventListener('DOMContentLoaded', () => {
	if(listLayouts.length > 0) {
    selectAttributeOnLoad();
  }
  setAttrOptionImages();
});
document.addEventListener('zp-event-recommended-products-loaded', () => {
  if(listLayouts.length > 0) {
	selectAttributeOnLoad();
  }
  setAttrOptionImages();
  
});
document.addEventListener('zp-event-search-success', closeSuggestionsContainer, false);

