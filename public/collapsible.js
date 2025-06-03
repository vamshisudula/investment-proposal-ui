// Add collapsible functionality to card components in Products page
function initCollapsibleCards() {
  // Find all cards in the Products page
  const cards = document.querySelectorAll('[data-component-name="_c"]');
  if (cards.length === 0) {
    // If no cards found yet, try again in a moment (React might still be rendering)
    setTimeout(initCollapsibleCards, 500);
    return;
  }
  
  console.log('Found', cards.length, 'cards to make collapsible');
  
  cards.forEach((card, index) => {
    // Add card-header and card-content classes for our CSS
    const header = card.querySelector('[data-component-name="_c2"]');
    const content = card.querySelector('[data-component-name="CardContent"]');
    
    if (!header || !content) return;
    
    header.classList.add('card-header');
    content.classList.add('card-content');
    
    // Check if we've already processed this card
    if (header.getAttribute('data-collapsible') === 'true') return;
    header.setAttribute('data-collapsible', 'true');
    
    // Add click event to the header
    header.addEventListener('click', (e) => {
      // Don't trigger collapse if clicking on buttons or checkboxes inside the header
      if (e.target.closest('button') || e.target.closest('input[type="checkbox"]') || 
          e.target.closest('label') || e.target.tagName === 'BUTTON' || 
          e.target.tagName === 'INPUT') {
        return;
      }
      
      // Toggle collapsed class
      if (content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
        content.style.maxHeight = content.scrollHeight + 'px';
        setTimeout(() => {
          content.style.maxHeight = null;
        }, 300);
      } else {
        content.style.maxHeight = content.scrollHeight + 'px';
        setTimeout(() => {
          content.classList.add('collapsed');
          content.style.maxHeight = '0px';
        }, 10);
      }
      
      // Toggle the chevron icon
      const chevron = header.querySelector('.chevron-icon');
      if (chevron) {
        chevron.classList.toggle('rotate-180');
      }
    });
    
    // Add chevron icon if it doesn't exist
    const cardTitle = header.querySelector('h3');
    if (cardTitle && !header.querySelector('.chevron-icon')) {
      const chevron = document.createElement('span');
      chevron.className = 'chevron-icon transition-transform duration-300';
      chevron.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down"><path d="m6 9 6 6 6-6"/></svg>`;
      cardTitle.appendChild(chevron);
    }
  });
}

// Run on page load and whenever the DOM changes (React updates)
document.addEventListener('DOMContentLoaded', () => {
  // Initial setup
  initCollapsibleCards();
  
  // Set up a MutationObserver to watch for DOM changes
  const observer = new MutationObserver((mutations) => {
    // Check if any mutations added nodes that might be our cards
    const shouldReinit = mutations.some(mutation => 
      mutation.type === 'childList' && 
      mutation.addedNodes.length > 0
    );
    
    if (shouldReinit) {
      initCollapsibleCards();
    }
  });
  
  // Start observing the document with the configured parameters
  observer.observe(document.body, { childList: true, subtree: true });
});
