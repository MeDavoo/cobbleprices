// ── GACHA CONFIGURATION──
let GACHA_DATA = {};
let currentGachaType = 'pokedoll'; // 'pokedoll', 'item', 'spawn'
let currentRarity = '1'; // '1', '2', '3', '4'
let currentItemRarity = 'pokeball'; // 'pokeball', 'greatball', 'ultraball'
let currentSpawnRarity = 'common'; // 'common', 'uncommon', 'rare', 'ultra_rare', 'legendary'
let collectedDolls = []; // Store collected doll names

// ── COLLECTION STORAGE ──
function loadCollection() {
  const saved = localStorage.getItem('collectedDolls');
  if (saved) {
    collectedDolls = JSON.parse(saved);
  }
}

function saveCollection() {
  localStorage.setItem('collectedDolls', JSON.stringify(collectedDolls));
}

function toggleCollection(dollName) {
  const index = collectedDolls.indexOf(dollName);
  if (index > -1) {
    collectedDolls.splice(index, 1);
  } else {
    collectedDolls.push(dollName);
  }
  saveCollection();
  updateCollectionCounter();
}

function isCollected(dollName) {
  return collectedDolls.includes(dollName);
}

function updateCollectionCounter() {
  const counter = document.getElementById('collectionCounter');
  if (counter) {
    const total = getTotalDollCount();
    const collected = collectedDolls.length;
    counter.textContent = `Collection: ${collected}/${total}`;
  }
  
  // Update rarity-specific progress
  updateRarityProgress();
}

function updateRarityProgress() {
  if (!GACHA_DATA.pokedoll) return;
  
  [1, 2, 3, 4].forEach(rarity => {
    const items = GACHA_DATA.pokedoll[rarity] || [];
    const collected = items.filter(item => {
      // Extract the Pokemon name, keeping 'Shiny' as a prefix when present
      let itemName = item.name;
      itemName = itemName.replace(/^[^:]*:/, ''); // Remove namespace
      
      // Check if it's a shiny variant and keep that
      let isShiny = false;
      if (itemName.includes('_shiny_')) {
        isShiny = true;
        itemName = itemName.replace(/_shiny_/i, '_');
      }
      
      // Remove pokedoll prefix
      itemName = itemName.replace(/^pokedoll_/i, '');
      itemName = itemName.replace(/^gigantic_pokedoll_/i, '');
      itemName = itemName.replace(/^gigantic_shiny_pokedoll_/i, '');
      
      // Remove any remaining suffixes
      itemName = itemName.replace(/_shiny$/i, '');
      itemName = itemName.replace(/_gigantic$/i, '');
      itemName = itemName.replace(/_gigantic_shiny$/i, '');
      
      // Convert to proper case
      const baseName = itemName.charAt(0).toUpperCase() + itemName.slice(1).toLowerCase();
      
      // Add 'Shiny' prefix if it was a shiny variant
      const displayName = isShiny ? `Shiny ${baseName}` : baseName;
      
      // Create unique collection key per rarity
      const collectionKey = `${displayName}_rarity_${rarity}`;
      
      return isCollected(collectionKey);
    }).length;
    
    const total = items.length;
    const percentage = total > 0 ? (collected / total) * 100 : 0;
    
    // Update progress bar
    const progressFill = document.getElementById(`progress-${rarity}`);
    if (progressFill) {
      progressFill.style.width = `${percentage}%`;
    }
    
    // Update stats text
    const statsElement = document.getElementById(`stats-${rarity}`);
    if (statsElement) {
      statsElement.textContent = `${collected}/${total}`;
    }
  });
}

function getTotalDollCount() {
  let total = 0;
  if (GACHA_DATA.pokedoll) {
    Object.values(GACHA_DATA.pokedoll).forEach(rarityItems => {
      total += rarityItems.length;
    });
  }
  return total;
}

// ── LOAD GACHA DATA ──
function loadGachaData() {
  return Promise.all([
    // Load pokedoll gacha files
    fetch('gachablue1.json').then(r => {
      if (!r.ok) throw new Error('Could not load gachablue1.json');
      return r.json();
    }),
    fetch('gachablue2.json').then(r => {
      if (!r.ok) throw new Error('Could not load gachablue2.json');
      return r.json();
    }),
    fetch('gachablue3.json').then(r => {
      if (!r.ok) throw new Error('Could not load gachablue3.json');
      return r.json();
    }),
    fetch('gachablue4.json').then(r => {
      if (!r.ok) throw new Error('Could not load gachablue4.json');
      return r.json();
    })
  ])
  .then(([blue1, blue2, blue3, blue4]) => {
    // Store gacha data organized by rarity
    GACHA_DATA.pokedoll = {
      1: blue1.pools[0].entries,
      2: blue2.pools[0].entries,
      3: blue3.pools[0].entries,
      4: blue4.pools[0].entries
    };
    
    console.log('Gacha data loaded successfully');
    return GACHA_DATA;
  })
  .catch(err => {
    console.error('Failed to load gacha data:', err);
    return {};
  });
}

// ── POKEDOLL GACHA RENDER ──
function renderPokedollGacha() {
  const pokedollGrid = document.getElementById('pokedollGrid');
  if (!pokedollGrid) return;
  
  // Show only dolls from selected rarity
  const items = GACHA_DATA.pokedoll?.[currentRarity] || [];
  
  pokedollGrid.innerHTML = '';
  
  if (items.length === 0) {
    pokedollGrid.innerHTML = '<div class="no-results"><div class="icon">🏚</div>No pokedoll items found...</div>';
    return;
  }
  
  // Sort by name
  items.sort((a, b) => a.name.localeCompare(b.name));
  
  items.forEach(item => {
    // Extract the Pokemon name, keeping 'Shiny' as a prefix when present
    let itemName = item.name;
    
    // Remove any prefixes like 'pokeblocks:'
    itemName = itemName.replace(/^[^:]*:/, ''); // Remove anything before and including colon
    
    // Check if it's a shiny variant and keep that
    let isShiny = false;
    if (itemName.includes('_shiny_')) {
      isShiny = true;
      itemName = itemName.replace(/_shiny_/i, '_');
    }
    
    // Remove pokedoll prefix
    itemName = itemName.replace(/^pokedoll_/i, '');
    itemName = itemName.replace(/^gigantic_pokedoll_/i, '');
    itemName = itemName.replace(/^gigantic_shiny_pokedoll_/i, '');
    
    // Remove any remaining suffixes
    itemName = itemName.replace(/_shiny$/i, '');
    itemName = itemName.replace(/_gigantic$/i, '');
    itemName = itemName.replace(/_gigantic_shiny$/i, '');
    
    // Convert to proper case (first letter uppercase, rest lowercase)
    const baseName = itemName.charAt(0).toUpperCase() + itemName.slice(1).toLowerCase();
    
    // Add 'Shiny' prefix if it was a shiny variant
    const displayName = isShiny ? `Shiny ${baseName}` : baseName;
    
    const gachaCard = document.createElement('div');
    gachaCard.className = 'gacha-card collection-card';
    
    // Make entire card clickable with rarity-specific collection tracking
    gachaCard.addEventListener('click', () => {
      // Create unique collection key per rarity
      const collectionKey = `${displayName}_rarity_${currentRarity}`;
      toggleCollection(collectionKey);
      gachaCard.classList.toggle('collected', isCollected(collectionKey));
      updateRarityProgress(); // Update progress for current rarity
    });
    
    // Big checkmark overlay
    const checkmarkOverlay = document.createElement('div');
    checkmarkOverlay.className = 'checkmark-overlay';
    const bigCheck = document.createElement('div');
    bigCheck.className = 'big-check';
    bigCheck.innerHTML = '✓';
    checkmarkOverlay.appendChild(bigCheck);
    
    // Pokemon image/video - use custom mapping for newer gen with specific URLs
    const mediaContainer = document.createElement('div');
    mediaContainer.className = 'gacha-item-media';
    
    // Add special class for gigantic categories to make images bigger
    if (currentRarity === '2' || currentRarity === '4') {
      mediaContainer.classList.add('gigantic-media');
    }
    
    // Custom mapping for newer gen Pokemon with specific URLs
    const customPokemonImages = {
      'cetoddle': {
        normal: 'https://bogleech.com/pokemon/sprites/bigcetoddle.gif',
        shiny: 'https://images.wikidexcdn.net/mwuploads/wikidex/transcoded/5/5c/Cetoddle_EP_variocolor.webm/Cetoddle_EP_variocolor.webm.240p.vp9.webm'
      },
      'arboliva': {
        normal: 'https://media.tenor.com/O7oYMmNJp9gAAAAj/arboliva-smoliv.gif',
        shiny: 'https://media.tenor.com/O7oYMmNJp9gAAAAj/arboliva-smoliv.gif'
      },
      'calyrex': {
        normal: 'https://images.wikidexcdn.net/mwuploads/wikidex/thumb/9/90/latest/20201029185017/Calyrex_EpEc.gif/72px-Calyrex_EpEc.gif',
        shiny: 'https://images.wikidexcdn.net/mwuploads/wikidex/thumb/b/b3/latest/20201029185019/Calyrex_EpEc_variocolor.gif/72px-Calyrex_EpEc_variocolor.gif'
      },
      'dolliv': {
        normal: 'https://images.wikidexcdn.net/mwuploads/wikidex/transcoded/f/ff/Dolliv_EP.webm/Dolliv_EP.webm.240p.vp9.webm',
        shiny: 'https://images.wikidexcdn.net/mwuploads/wikidex/transcoded/8/89/Dolliv_EP_variocolor.webm/Dolliv_EP_variocolor.webm.240p.vp9.webm'
      },
      'frigibax': {
        normal: 'https://images.wikidexcdn.net/mwuploads/wikidex/transcoded/e/eb/Frigibax_HOME.webm/Frigibax_HOME.webm.240p.vp9.webm',
        shiny: 'https://images.wikidexcdn.net/mwuploads/wikidex/transcoded/8/87/Frigibax_HOME_variocolor.webm/Frigibax_HOME_variocolor.webm.240p.vp9.webm'
      },
      'rabsca': {
        normal: 'https://images.wikidexcdn.net/mwuploads/wikidex/transcoded/0/03/Rabsca_EP.webm/Rabsca_EP.webm.240p.vp9.webm',
        shiny: 'https://images.wikidexcdn.net/mwuploads/wikidex/transcoded/9/9d/Rabsca_EP_variocolor.webm/Rabsca_EP_variocolor.webm.240p.vp9.webm'
      },
      'rellor': {
        normal: 'https://images.wikidexcdn.net/mwuploads/wikidex/transcoded/3/34/Rellor_HOME.webm/Rellor_HOME.webm.240p.vp9.webm',
        shiny: 'https://images.wikidexcdn.net/mwuploads/wikidex/transcoded/f/f1/Rellor_HOME_variocolor.webm/Rellor_HOME_variocolor.webm.240p.vp9.webm'
      },
      'smoliv': {
        normal: 'https://images.wikidexcdn.net/mwuploads/wikidex/transcoded/3/32/Smoliv_HOME.webm/Smoliv_HOME.webm.240p.vp9.webm',
        shiny: 'https://images.wikidexcdn.net/mwuploads/wikidex/transcoded/c/cd/Smoliv_HOME_variocolor.webm/Smoliv_HOME_variocolor.webm.240p.vp9.webm'
      }
    };
    
    const pokemonKey = itemName.toLowerCase();
    const hasCustomImage = customPokemonImages[pokemonKey];
    
    if (hasCustomImage) {
      const imageUrl = isShiny ? customPokemonImages[pokemonKey].shiny : customPokemonImages[pokemonKey].normal;
      
      // Check if it's a webm file
      if (imageUrl.includes('.webm')) {
        // Create video element for webm files
        const videoEl = document.createElement('video');
        videoEl.className = 'gacha-item-video';
        videoEl.src = imageUrl;
        videoEl.autoplay = true;
        videoEl.loop = true;
        videoEl.muted = true;
        videoEl.playsInline = true;
        videoEl.alt = displayName;
        
        videoEl.onerror = function() {
          // Fallback to PokeAPI if video fails
          const imgEl = document.createElement('img');
          imgEl.className = 'gacha-item-icon';
          imgEl.alt = displayName;
          imgEl.src = isShiny ? 
            `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${itemName.toLowerCase()}.png` :
            `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${itemName.toLowerCase()}.png`;
          
          imgEl.onerror = function() {
            mediaContainer.innerHTML = '<div class="gacha-icon-fallback">❓</div>';
          };
          
          mediaContainer.innerHTML = '';
          mediaContainer.appendChild(imgEl);
        };
        
        mediaContainer.appendChild(videoEl);
      } else {
        // Create img element for gif files
        const imgEl = document.createElement('img');
        imgEl.className = 'gacha-item-icon';
        imgEl.alt = displayName;
        imgEl.src = imageUrl;
        
        imgEl.onerror = function() {
          // Fallback to PokeAPI
          imgEl.src = isShiny ? 
            `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${itemName.toLowerCase()}.png` :
            `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${itemName.toLowerCase()}.png`;
          
          imgEl.onerror = function() {
            mediaContainer.innerHTML = '<div class="gacha-icon-fallback">❓</div>';
          };
        };
        
        mediaContainer.appendChild(imgEl);
      }
    } else {
      // Use ProjectPokemon for older gen
      const imgEl = document.createElement('img');
      imgEl.className = 'gacha-item-icon';
      imgEl.alt = displayName;
      
      if (isShiny) {
        imgEl.src = `https://projectpokemon.org/images/shiny-sprite/${itemName.toLowerCase()}.gif`;
      } else {
        imgEl.src = `https://projectpokemon.org/images/normal-sprite/${itemName.toLowerCase()}.gif`;
      }
      
      imgEl.onerror = function() {
        // Fallback to PokeAPI
        imgEl.src = isShiny ? 
          `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${itemName.toLowerCase()}.png` :
          `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${itemName.toLowerCase()}.png`;
        
        imgEl.onerror = function() {
          mediaContainer.innerHTML = '<div class="gacha-icon-fallback">❓</div>';
        };
      };
      
      mediaContainer.appendChild(imgEl);
    }
    
    // Name - with 'Shiny' prefix if applicable
    const nameEl = document.createElement('div');
    nameEl.className = 'gacha-item-name';
    nameEl.textContent = displayName;
    
    gachaCard.appendChild(checkmarkOverlay);
    gachaCard.appendChild(mediaContainer);
    gachaCard.appendChild(nameEl);
    
    // Create unique collection key per rarity for checking
    const collectionKey = `${displayName}_rarity_${currentRarity}`;
    
    if (isCollected(collectionKey)) {
      gachaCard.classList.add('collected');
    }
    
    pokedollGrid.appendChild(gachaCard);
  });
  
  updateCollectionCounter();
}

function getRarityColor(rarity) {
  const colors = {
    1: '#888888', // Common - gray
    2: '#4a90e2', // Uncommon - blue
    3: '#9b59b6', // Rare - purple
    4: '#f39c12'  // Legendary - gold
  };
  return colors[rarity] || '#ffffff';
}

// ── GACHA EVENT HANDLERS ──
function initGachaEventHandlers() {
  // Search functionality
  const searchInput = document.getElementById('gachaSearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      filterPokemon(query);
    });
  }
  
  // Item gacha search functionality
  const itemSearchInput = document.getElementById('itemGachaSearch');
  if (itemSearchInput) {
    itemSearchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      filterItems(query);
    });
  }
  
  // Spawn gacha search functionality
  const spawnSearchInput = document.getElementById('spawnGachaSearch');
  if (spawnSearchInput) {
    spawnSearchInput.addEventListener('input', (e) => {
      filterSpawnPokemon(e.target.value.toLowerCase());
    });
  }
  
  // Gacha main tabs
  document.querySelectorAll('.gacha-main-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const gachaType = tab.dataset.gacha;
      currentGachaType = gachaType;
      
      // Update active tab
      document.querySelectorAll('.gacha-main-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Update header based on selected tab
      updateGachaHeader(gachaType);
      
      // Show/hide content sections
      document.querySelectorAll('.gacha-content').forEach(content => content.classList.remove('active'));
      
      if (gachaType === 'pokedoll') {
        document.getElementById('pokedollGacha').classList.add('active');
      } else if (gachaType === 'item') {
        document.getElementById('itemGacha').classList.add('active');
        renderItemGacha();
      } else if (gachaType === 'spawn') {
        document.getElementById('spawnGacha').classList.add('active');
        renderSpawnGacha();
      } else if (gachaType === 'spawn') {
        document.getElementById('spawnGacha').classList.add('active');
        // Spawn gacha content would go here
      }
    });
  });

  document.querySelectorAll('#pokedollGacha .rarity-tab, #itemGacha .rarity-tab, #spawnGacha .rarity-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      if (!tab || !tab.dataset) return;
      
      const rarity = tab.dataset.rarity;
      const isPokedollTab = tab.closest('#pokedollGacha');
      const isItemTab = tab.closest('#itemGacha');
      
      if (isPokedollTab) {
        currentRarity = rarity;
        document.querySelectorAll('#pokedollGacha .rarity-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderPokedollGacha();
        const searchInput = document.getElementById('gachaSearch');
        if (searchInput && searchInput.value) filterPokemon(searchInput.value.toLowerCase());
      } else if (isItemTab) {
        currentItemRarity = rarity;
        document.querySelectorAll('#itemGacha .rarity-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderItemGacha();
        const itemSearchInput = document.getElementById('itemGachaSearch');
        if (itemSearchInput && itemSearchInput.value) filterItems(itemSearchInput.value.toLowerCase());
      } else {
        // Spawn gacha tab
        currentSpawnRarity = rarity;
        document.querySelectorAll('#spawnGacha .rarity-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderSpawnGacha();
        const spawnSearchInput = document.getElementById('spawnGachaSearch');
        if (spawnSearchInput && spawnSearchInput.value) filterSpawnPokemon(spawnSearchInput.value.toLowerCase());
      }
    });
  });
}

// ── ITEM GACHA FUNCTIONS ──
let itemGachaData = {};

async function loadItemGachaData() {
  try {
    // Load both CSV and bank data
    const [csvResponse, bankResponse] = await Promise.all([
      fetch('gachared.csv'),
      fetch('bank.json?t=' + Date.now()) // Add cache-busting timestamp
    ]);
    
    const csvText = await csvResponse.text();
    const bankData = await bankResponse.json();
    
    // Create price lookup from bank data
    const priceLookup = {};
    
    // Check if bankData is an array, if not, handle it appropriately
    let actualBankData = bankData;
    
    // Handle if bank data is wrapped in an object
    if (bankData && bankData.bank && Array.isArray(bankData.bank)) {
      actualBankData = bankData.bank;
    }
    
    if (Array.isArray(actualBankData)) {
      actualBankData.forEach(item => {
        // Store both full name and formatted name for easier matching
        const fullName = item.item;
        const formattedName = fullName.split(':')[1].replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        
        // Store multiple variations for flexible matching
        priceLookup[fullName] = item.price;
        priceLookup[formattedName] = item.price;
        priceLookup[fullName.toLowerCase()] = item.price;
        priceLookup[formattedName.toLowerCase()] = item.price;
      });
    } else if (actualBankData && typeof actualBankData === 'object') {
      // Handle if bankData is an object with different structure
      Object.keys(actualBankData).forEach(key => {
        const item = actualBankData[key];
        if (item && item.item && item.price) {
          const fullName = item.item;
          const formattedName = fullName.split(':')[1].replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          
          priceLookup[fullName] = item.price;
          priceLookup[formattedName] = item.price;
          priceLookup[fullName.toLowerCase()] = item.price;
          priceLookup[formattedName.toLowerCase()] = item.price;
        }
      });
    }
    
    const lines = csvText.split('\n');
    
    // Parse CSV data - 3 columns: Pokeball, Greatball, Ultraball
    itemGachaData = {
      pokeball: [],
      greatball: [],
      ultraball: []
    };
    
    // Skip header and parse items
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = line.split(',');
      
      // Parse items in groups of 3: Item,Qty,Item,Qty,Item,Qty
      for (let j = 0; j < parts.length; j += 2) {
        if (j + 1 < parts.length) {
          const itemName = parts[j].trim();
          const quantity = parseInt(parts[j + 1]);
          
          if (itemName && !isNaN(quantity)) {
            // Determine which ball type based on position
            const ballIndex = Math.floor(j / 2) % 3;
            const ballType = ['pokeball', 'greatball', 'ultraball'][ballIndex];
            
            itemGachaData[ballType].push({
              name: itemName,
              quantity: quantity,
              value: calculateItemValue(itemName, quantity, priceLookup)
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error loading item gacha data:', error);
    
    // Fallback: create empty structure to prevent errors
    itemGachaData = {
      pokeball: [],
      greatball: [],
      ultraball: []
    };
  }
}

function calculateItemValue(itemName, quantity, priceLookup) {
  // Check if item exists in bank (using same logic as shop)
  const bankPrice = priceLookup[itemName] || 
                   priceLookup[itemName.toLowerCase()] ||
                   priceLookup['cobblemon:' + itemName.toLowerCase().replace(/ /g, '_')] ||
                   priceLookup['minecraft:' + itemName.toLowerCase().replace(/ /g, '_')];
  
  if (bankPrice !== undefined) {
    // Item is sellable - return price * quantity
    return {
      displayValue: bankPrice * quantity,
      isSellable: true,
      unitPrice: bankPrice
    };
  } else {
    // Item is not sellable
    return {
      displayValue: 'Not sellable',
      isSellable: false,
      unitPrice: null
    };
  }
}

function renderItemGacha() {
  const tableBody = document.getElementById('itemsTableBody');
  if (!tableBody) return;
  
  tableBody.innerHTML = '';
  
  // CRITICAL: Reset item gacha tabs to ensure correct active state
  document.querySelectorAll('#itemGacha .rarity-tab').forEach(t => t.classList.remove('active'));
  
  // Re-activate the current rarity tab
  const currentTab = document.querySelector('#itemGacha .rarity-tab[data-rarity="' + currentItemRarity + '"]');
  if (currentTab) {
    currentTab.classList.add('active');
  }
  
  const items = itemGachaData[currentItemRarity] || [];
  
  items.forEach(item => {
    const row = document.createElement('tr');
    
    const nameCell = document.createElement('td');
    nameCell.textContent = item.name;
    
    const quantityCell = document.createElement('td');
    quantityCell.textContent = item.quantity;
    
    const valueCell = document.createElement('td');
    if (item.value.isSellable) {
      valueCell.textContent = item.value.displayValue;
      valueCell.style.color = 'var(--parchment)';
    } else {
      valueCell.textContent = item.value.displayValue;
      valueCell.style.color = '#888888';
      valueCell.style.fontStyle = 'italic';
    }
    
    row.appendChild(nameCell);
    row.appendChild(quantityCell);
    row.appendChild(valueCell);
    
    tableBody.appendChild(row);
  });
}

function filterItems(query) {
  const rows = document.querySelectorAll('#itemsTableBody tr');
  
  rows.forEach(row => {
    const nameCell = row.querySelector('td:first-child');
    if (nameCell) {
      const itemName = nameCell.textContent.toLowerCase();
      
      if (itemName.includes(query)) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    }
  });
}

// ── POKEMON FILTERING ──
function filterPokemon(query) {
  const cards = document.querySelectorAll('#pokedollGrid .collection-card');
  
  cards.forEach(card => {
    const nameElement = card.querySelector('.gacha-item-name');
    if (nameElement) {
      const pokemonName = nameElement.textContent.toLowerCase();
      
      if (pokemonName.includes(query)) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    }
  });
}

// ── GACHA TAB SWITCHING ──
function updateGachaHeader(gachaType) {
  const titleEl = document.getElementById('gachaTitle');
  const descEl = document.getElementById('gachaDescription');
  
  switch(gachaType) {
    case 'pokedoll':
      titleEl.textContent = 'Pokedoll Gacha';
      titleEl.style.color = '#3b82f6'; // Blue
      descEl.textContent = 'Use blue gacha coins at the pokecino for one of these doll rewards!';
      break;
    case 'item':
      titleEl.textContent = 'Item Gacha';
      titleEl.style.color = '#ef4444'; // Red
      descEl.textContent = 'Use red gacha coins for random item rewards!';
      break;
    case 'spawn':
      titleEl.textContent = 'Spawn Gacha';
      titleEl.style.color = '#f18fc0'; // Pink
      descEl.textContent = 'Use rainbow gacha coins to get a random pokemon!';
      break;
    default:
      titleEl.textContent = 'Gacha Center';
      titleEl.style.color = 'var(--gacha-gold)'; // Default gold
      descEl.textContent = 'Try your luck with our gacha system!';
  }
}

// ── INITIALIZATION ──
function initGacha() {
  loadCollection();
  Promise.all([loadGachaData(), loadItemGachaData(), loadSpawnGachaData()]).then(() => {
    renderPokedollGacha();
    renderItemGacha();
    renderSpawnGacha();
    initGachaEventHandlers();
    updateGachaHeader('pokedoll');
  });
}

// ── SPAWN GACHA FUNCTIONS ──
let spawnGachaData = {};

async function loadSpawnGachaData() {
  try {
    const response = await fetch('gacharainbow.csv');
    const csvText = await response.text();
    const lines = csvText.split('\n');
    spawnGachaData = { common: [], uncommon: [], rare: [], ultra_rare: [], legendary: [] };
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const pokemon = line.split(',');
      if (pokemon[0]) spawnGachaData.common.push(pokemon[0].trim());
      if (pokemon[1]) spawnGachaData.uncommon.push(pokemon[1].trim());
      if (pokemon[2]) spawnGachaData.rare.push(pokemon[2].trim());
      if (pokemon[3]) spawnGachaData.ultra_rare.push(pokemon[3].trim());
      if (pokemon[4]) spawnGachaData.legendary.push(pokemon[4].trim());
    }
  } catch (error) {
    console.error('Error loading spawn gacha data:', error);
    spawnGachaData = { common: [], uncommon: [], rare: [], ultra_rare: [], legendary: [] };
  }
}

function renderSpawnGacha() {
  const grid = document.getElementById('spawnGrid');
  if (!grid) return;
  grid.innerHTML = '';
  const pokemon = spawnGachaData[currentSpawnRarity] || [];
  pokemon.forEach(pokemonName => {
    const card = document.createElement('div');
    card.className = 'gacha-card collection-card';
    const img = document.createElement('img');
    img.className = 'gacha-item-image';
    const slug = pokemonName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    img.src = `https://projectpokemon.org/images/normal-sprite/${slug}.gif`;
    let fallbackTries = 0;
    img.onerror = function() {
      fallbackTries++;
      if (fallbackTries === 1) {
        img.src = `https://img.pokemondb.net/sprites/scarlet-violet/icon/avif/${slug}.avif`;
      } else {
        img.style.display = 'none';
      }
    };
    const nameDiv = document.createElement('div');
    nameDiv.className = 'gacha-item-name';
    nameDiv.textContent = pokemonName;
    card.appendChild(img);
    card.appendChild(nameDiv);
    grid.appendChild(card);
  });
}

function filterSpawnPokemon(query) {
  document.querySelectorAll('#spawnGrid .gacha-card').forEach(card => {
    const nameEl = card.querySelector('.gacha-item-name');
    if (nameEl) card.style.display = nameEl.textContent.toLowerCase().includes(query) ? 'block' : 'none';
  });
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGacha);
} else {
  initGacha();
}