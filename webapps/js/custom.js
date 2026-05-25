function roundText() {
  const roundedTextElements = document.querySelectorAll('.zs-rounded-text .zpelem-text');
  
  if (roundedTextElements.length) {
    roundedTextElements.forEach((textElement) => {
      textElement.style.animation = "rotate360 9s linear infinite"; // No I18N
      const chars = textElement.innerText.split("");
      const totalChars = chars.length + 2;
      const angleIncrement = 180 / totalChars;
      const roundedText = [];
  
      roundedText.push(`<span style="transform:rotate(0deg) translate(0, 0px) scale(-1)"></span>`);
      chars.forEach((char, i) => {
        const rotation = (i + 2) * angleIncrement;
        roundedText.push(`<span style="transform:rotate(${rotation}deg) translate(0, 0px)">${char}</span>`);
      });
  
      roundedText.push(`<span style="transform:rotate(0deg) translate(0, 0px) scale(-1)"></span>`);
  
      chars.forEach((char, i) => {
        const rotation = (i + 2) * angleIncrement;
        roundedText.push(`<span style="transform:rotate(${rotation}deg) translate(0, 0px) scale(-1)">${char}</span>`);
      });
  
      textElement.innerHTML = roundedText.join("");
    });
  }
}
    
function drag() {
  const slider = document.getElementById('zs-input-slider');
  const dragLine = document.querySelector('.zs-drag-line');
  const comparisonImage = document.querySelector('.zs-comparison-image');

  if (slider && dragLine && comparisonImage) {
    const sliderValue = slider.value + '%';
    dragLine.style.left = sliderValue;
    comparisonImage.style.clipPath = `polygon(0% 0%, ${sliderValue} 0%, ${sliderValue} 100%, 0% 100%)`;
  }
}
function addDragLine() {
  const addInputSlider = document.querySelector('.zs-comparison-image');

  if (addInputSlider) {
    addInputSlider.style.position = "absolute";
    addInputSlider.style.clipPath = "polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%)";

    const sliderElement = document.createElement('div');
    sliderElement.classList.add('zs-slider'); // No I18N

    const dragLine = document.createElement('div');
    dragLine.classList.add('zs-drag-line'); // No I18N
    dragLine.innerHTML = '<span>Drag</span>';  // No I18N

    const inputSlider = document.createElement('input');
    inputSlider.id = 'zs-input-slider';
    inputSlider.type = 'range';
    inputSlider.tabIndex = -1;
    inputSlider.min = '0';
    inputSlider.max = '100';
    inputSlider.value = '50';
    inputSlider.oninput = () => drag();

    sliderElement.append(dragLine, inputSlider);
    addInputSlider.insertAdjacentElement('afterend', sliderElement);  // No I18N
  }
}

function removeFocusOnVideoElement() {
  let videos = document.querySelectorAll('.zpvideo');
  if(videos) {
    videos.forEach(video => {
      video.addEventListener('focus', (event) => {
        event.preventDefault();
      });
    });
  }
}

function marqueeText() {
  let marqueElement = document.querySelector('.zs-marquee-text-track');
  if(marqueElement) {
      marqueElement.style.animation = "marquee-scroll 18s linear infinite"; // No I18N
      marqueElement.style.whiteSpace = "nowrap"; // No I18N
  }
}

function marqueeRow() {
  let duration = 24;
  let marqueeRows = document.querySelectorAll('.zs-marquee-row');
  let marqueeRowStyle = document.createElement('style');

  marqueeRowStyle.textContent = `
    .zs-marquee-row {
      max-width: 100%;
      position: relative;
      overflow: hidden;
    }
  `;
  document.head.appendChild(marqueeRowStyle);

  marqueeRows.forEach(marqueeRow => {
    let columns = marqueeRow.querySelectorAll('[data-element-type="column"]');
    let totalItems = columns.length;
    let marqueeItemStyle = document.createElement('style');
    let rowWidth = marqueeRow.offsetWidth;
    let itemWidth = rowWidth / totalItems;

    let maxHeight = 0;
    columns.forEach(col => {
      let colHeight = col.offsetHeight;
      if (colHeight > maxHeight) {
        maxHeight = colHeight;
      }
    });
    marqueeRow.style.height = maxHeight + 'px';
    
    marqueeItemStyle.textContent = `
      .zs-marquee-item {
        width: ${itemWidth}px;
        position: absolute!important;
        left: max(calc(${itemWidth}px * ${totalItems}), 100%);
        animation-name: scrollMarqueeLeft;
        animation-duration: ${duration}s;
        animation-timing-function: linear;
        animation-iteration-count: infinite;
      }
      @keyframes scrollMarqueeLeft {
        to {
          left: -${itemWidth}px;
        }
      }
    `;
    document.head.appendChild(marqueeItemStyle);

    for(let i=0; i < columns.length; i++){
      columns[i].classList.add('zs-marquee-item');
      let delay = duration / totalItems * (totalItems-(i+1)) * -1;
      columns[i].style = `animation-delay: ${delay}s`
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if(window.zs_rendering_mode !== "canvas") {
    roundText();
    addDragLine();
    removeFocusOnVideoElement();
    marqueeText();
    marqueeRow();
  }
});

function moveCustomCarousel(scrollAmt, elem) {
  let section = elem.closest('[data-element-type="section"]'); //No I18N
  let carousel = section ? section.querySelector(".zcs_custom_flex_gap_and_scroll, .zcs_slider_row") : null; //No I18N
  if (carousel) {
    let containerWidth = carousel.scrollWidth - carousel.clientWidth;
    if (carousel.scrollLeft >= containerWidth && scrollAmt > 0) {
      carousel.scrollTo({ left: 0, behavior: "smooth" }); //No I18N
    } else if (carousel.scrollLeft <= 15 && scrollAmt < 0) {
      carousel.scrollTo({ left: carousel.scrollWidth, behavior: "smooth" }); //No I18N
    } else {
      carousel.scrollBy({ left: scrollAmt, behavior: "smooth" }); //No I18N
    }
  }
}


function clickAnchor(element) {
  let anchor = element.querySelector("a");
  if (anchor) {
    anchor.click();
  }
}

const cards = document.querySelectorAll(".zs-card");
const leftArrow = document.querySelector(".nav-arrow.left");
const rightArrow = document.querySelector(".nav-arrow.right");
let currentIndex = 0;
let isAnimating = false;

function updateCarousel(newIndex) {
	if (isAnimating) {return};
	isAnimating = true;

	currentIndex = (newIndex + cards.length) % cards.length;

	cards.forEach((card, i) => {
		const offset = (i - currentIndex + cards.length) % cards.length;

		card.classList.remove("center", "left-1", "left-2", "right-1", "right-2", "hidden"); // No I18N

		if (offset === 0) {
			card.classList.add("center"); // No I18N
		} else if (offset === 1) {
			card.classList.add("right-1"); // No I18N
		} else if (offset === 2) {
			card.classList.add("right-2"); // No I18N
		} else if (offset === cards.length - 1) {
			card.classList.add("left-1"); // No I18N
		} else if (offset === cards.length - 2) {
			card.classList.add("left-2"); // No I18N
		} else {
			card.classList.add("hidden"); // No I18N
		}
	});

	setTimeout(() => {
		isAnimating = false;
	}, 800);
}
if (leftArrow) {
  leftArrow.addEventListener("click", () => {
    updateCarousel(currentIndex - 1);
  });
}

if (rightArrow) {
	rightArrow.addEventListener("click", () => {
		updateCarousel(currentIndex + 1);
	});
}

cards.forEach((card, i) => {
	card.addEventListener("click", () => {
		updateCarousel(i);
	});
});

document.addEventListener("keydown", (e) => {
	if (e.key === "ArrowLeft") {
		updateCarousel(currentIndex - 1);
	} else if (e.key === "ArrowRight") {
		updateCarousel(currentIndex + 1);
	}
});

document.addEventListener('DOMContentLoaded', () => {
  let swiperContainer = document.querySelector('.zs-swiper');
  if (swiperContainer) {
    updateCarousel(0);
  }
})