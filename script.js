// Global Variables
let balance = 10000;
let portfolio = {};
let assets = [];
let selectedAsset = null;
let gameDuration = 5 * 60 * 1000; // 5 minutes
let gameTimer;
let priceUpdateInterval;
let marketEventInterval;
let newStockInterval;
let achievementsUnlocked = [];
let priceHistory = {}; // For recording price history
let chartUpdateInterval;
let selectedSymbolForChart = null;

// Arrays for messages and insider info
const purchaseMessages = [
  "A shadowy figure nods approvingly as you invest.",
  "Your holo-screen flickers as you confirm the purchase.",
  "Rumors of your investment spread through the cyber network.",
  "A surge of data flows as you acquire new assets.",
  "The market whispers tales of your bold move.",
  "An enigmatic AI predicts a bright future for your investment.",
  "Whispers of your trade echo in the neon alleys.",
  "The digital winds favor your latest purchase.",
];

const insiderInfoMessages = [
  { symbol: 'NEO', message: 'Rumors suggest NeoTech Corp is about to announce a breakthrough.', effect: 'positive' },
  { symbol: 'ZEN', message: 'Whispers indicate legal troubles ahead for Zenith Ltd.', effect: 'negative' },
  { symbol: 'CRX', message: 'CyberX might secure a government contract soon.', effect: 'positive' },
  { symbol: 'ALT', message: 'Altair Systems facing supply chain issues.', effect: 'negative' },
  // Add messages for new stocks
];

// Initialize Game
document.addEventListener('DOMContentLoaded', () => {
  startGame();
  document.getElementById('close-modal')
    .addEventListener('click', closeModal);
  document.getElementById('close-graph-modal')
    .addEventListener('click', () => {
      document.getElementById('graph-modal').classList.add('hidden');

      selectedSymbolForChart = null;

      // Clear the chart update interval
      if (chartUpdateInterval) {
        clearInterval(chartUpdateInterval);
        chartUpdateInterval = null;
      }

      // Destroy the chart instance
      if (window.priceChart) {
        window.priceChart.destroy();
        window.priceChart = null;
      }
    });
});

function startGame() {
  loadAssets();
  updateBalance();
  updatePortfolioValue();
  startPriceUpdates();
  triggerMarketEvents();
  startIntroducingNewStocks();

  // Start the game timer
  gameTimer = setTimeout(endGame, gameDuration);

  // Display remaining time
  startGameTimerDisplay();
}

// Load Initial Assets
function loadAssets() {
  assets = [
    { symbol: 'NEO', name: 'NeoTech Corp', price: 150 },
    { symbol: 'ZEN', name: 'Zenith Ltd', price: 80 },
    { symbol: 'CRX', name: 'CyberX', price: 220 },
    { symbol: 'ALT', name: 'Altair Systems', price: 45 },
  ];

  // Initialize price history for each asset
  assets.forEach(asset => {
    priceHistory[asset.symbol] = [asset.price];
  });

  populateMarketTable();
}

// Populate Market Table
function populateMarketTable() {
  const table = document.getElementById('market-table');
  table.innerHTML = `
    <tr>
      <th>Symbol</th>
      <th>Name</th>
      <th>Price ($)</th>
      <th>Action</th>
    </tr>
  `;
  assets.forEach((asset, index) => {
    addStockToMarketTable(asset, index);
  });
}

// Add Stock to Market Table
function addStockToMarketTable(asset, index) {
  const table = document.getElementById('market-table');
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${asset.symbol}</td>
    <td>${asset.name}</td>
    <td id="price-${index}">${asset.price.toFixed(2)}</td>
    <td>
      <input type="number" id="buy-quantity-${index}" value="1" min="1" style="width:50px;">
      <button onclick="buyAsset(${index})">Buy</button>
      <button onclick="showPriceGraph('${asset.symbol}')">View Graph</button>
    </td>
  `;
  table.appendChild(row);
}

// Buy Asset
function buyAsset(index) {
  const asset = assets[index];
  const quantityInput = document.getElementById(`buy-quantity-${index}`);
  const quantity = parseInt(quantityInput.value);

  const totalCost = asset.price * quantity;
  if (balance >= totalCost && quantity > 0) {
    balance -= totalCost;
    if (!portfolio[asset.symbol]) {
      portfolio[asset.symbol] = { ...asset, quantity: quantity };
    } else {
      portfolio[asset.symbol].quantity += quantity;
    }
    updateBalance();
    updatePortfolioTable();
    updatePortfolioValue();

    const message = purchaseMessages[Math.floor(Math.random() * purchaseMessages.length)];
    showStoryMessage(`${message} You purchased ${quantity} shares of ${asset.name}!`);
  } else {
    alert('Insufficient balance or invalid quantity!');
  }
}

// Sell Asset
function sellAsset(symbol) {
  const asset = portfolio[symbol];
  const quantityInput = document.getElementById(`sell-quantity-${symbol}`);
  const quantity = parseInt(quantityInput.value);

  if (asset && asset.quantity >= quantity && quantity > 0) {
    const totalRevenue = asset.price * quantity;
    balance += totalRevenue;
    asset.quantity -= quantity;
    if (asset.quantity === 0) {
      delete portfolio[symbol];
    }
    updateBalance();
    updatePortfolioTable();
    updatePortfolioValue();
    showStoryMessage(`You sold ${quantity} shares of ${asset.name}.`);
  } else {
    alert('You do not have enough shares to sell or invalid quantity.');
  }
}

// Update Balance Display
function updateBalance() {
  document.getElementById('balance').textContent =
    balance.toFixed(2);
}

// Update Portfolio Table
// ... [Other parts of your code remain unchanged]

// Update Portfolio Table
function updatePortfolioTable() {
  const table = document.getElementById('portfolio-table');
  table.innerHTML = `
    <tr>
      <th>Symbol</th>
      <th>Name</th>
      <th>Quantity</th>
      <th>Value ($)</th>
      <th>Action</th>
    </tr>
  `;
  for (const symbol in portfolio) {
    const asset = portfolio[symbol];
    const value = asset.price * asset.quantity;
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${asset.symbol}</td>
      <td>${asset.name}</td>
      <td>${asset.quantity}</td>
      <td>${value.toFixed(2)}</td>
      <td>
        <input type="number" id="sell-quantity-${asset.symbol}" value="1" min="1" max="${asset.quantity}" style="width:50px;">
        <button onclick="sellAsset('${asset.symbol}')">Sell</button>
        <button onclick="sellAllAsset('${asset.symbol}')">Sell All</button>
      </td>
    `;
    table.appendChild(row);
  }
}

// Sell All Shares of an Asset
function sellAllAsset(symbol) {
  const asset = portfolio[symbol];
  if (asset && asset.quantity > 0) {
    const totalRevenue = asset.price * asset.quantity;
    balance += totalRevenue;

    // Remove the asset from the portfolio
    delete portfolio[symbol];

    updateBalance();
    updatePortfolioTable();
    updatePortfolioValue();
    showStoryMessage(`You sold all shares of ${asset.name}.`);
  } else {
    alert('You do not have any shares to sell.');
  }
}

// ... [Rest of your code remains unchanged]


// Update Portfolio Value
function updatePortfolioValue() {
  let totalValue = 0;
  for (const symbol in portfolio) {
    const asset = portfolio[symbol];
    totalValue += asset.price * asset.quantity;
  }
  document.getElementById('portfolio-value')
    .textContent = totalValue.toFixed(2);

  // Check for achievements
  checkAchievements();
}

// Start Price Updates
function startPriceUpdates() {
  priceUpdateInterval = setInterval(() => {
    assets.forEach((asset, index) => {
      const change = (Math.random() - 0.5) * 5;
      asset.price = Math.max(1, asset.price + change);

      // Record the new price in the price history
      if (priceHistory[asset.symbol]) {
        priceHistory[asset.symbol].push(asset.price);
      } else {
        priceHistory[asset.symbol] = [asset.price];
      }

      let priceElement = document.getElementById(`price-${index}`);
      if (!priceElement) {
        addStockToMarketTable(asset, index);
        priceElement = document.getElementById(`price-${index}`);
      }
      priceElement.textContent = asset.price.toFixed(2);

      if (portfolio[asset.symbol]) {
        portfolio[asset.symbol].price = asset.price;
      }
    });
    updatePortfolioTable();
    updatePortfolioValue();

    // Update the chart if it's open
    if (window.priceChart && selectedSymbolForChart) {
      updateChartData(selectedSymbolForChart);
    }
  }, 5000);
}

// Show Story Message
function showStoryMessage(message) {
  document.getElementById('story-message').textContent =
    message;
  document.getElementById('story-modal')
    .classList.remove('hidden');
}

// Close Modal
function closeModal() {
  document.getElementById('story-modal')
    .classList.add('hidden');
}

// Trigger Market Events
function triggerMarketEvents() {
  marketEventInterval = setInterval(() => {
    const eventChance = Math.random();
    if (eventChance > 0.7) {
      // Global Market Event
      const marketEffect = Math.random() > 0.5 ? 1.1 : 0.9;
      assets.forEach(asset => {
        asset.price *= marketEffect;

        // Record the new price
        if (priceHistory[asset.symbol]) {
          priceHistory[asset.symbol].push(asset.price);
        } else {
          priceHistory[asset.symbol] = [asset.price];
        }
      });
      const effectText = marketEffect > 1 ? 'up' : 'down';
      showStoryMessage(`Market Shift! Prices are ${effectText} by 10%!`);
      updatePriceDisplay();
      updatePortfolioTable();
      updatePortfolioValue();
    } else if (eventChance > 0.5) {
      // Individual Stock Event
      const asset = assets[Math.floor(Math.random() * assets.length)];
      const eventEffect = Math.random() > 0.5 ? 1.3 : 0.7;
      asset.price *= eventEffect;

      // Record the new price
      if (priceHistory[asset.symbol]) {
        priceHistory[asset.symbol].push(asset.price);
      } else {
        priceHistory[asset.symbol] = [asset.price];
      }

      const effectText = eventEffect > 1 ? 'soars' : 'plummets';
      showStoryMessage(`${asset.name} ${effectText} due to unexpected news!`);
      updatePriceDisplay();
      updatePortfolioTable();
      updatePortfolioValue();
    } else if (eventChance > 0.3) {
      // Provide insider information
      provideInsiderInformation();
    }
  }, 20000);
}

// Start Introducing New Stocks
function startIntroducingNewStocks() {
  newStockInterval = setInterval(introduceNewStock, 60000);
}

// Generate and Introduce New Stock
function generateRandomStock() {
  const symbols = ['AQUA', 'SOL', 'LUNA', 'STEL', 'ORION', 'NOVA', 'QUANT', 'COSM'];
  const names = ['Aquarius Inc', 'Solaris Energy', 'Luna Tech', 'Stellar Dynamics', 'Orion Enterprises', 'Nova Labs', 'Quantum Corp', 'Cosmic Ventures'];

  // Ensure unique symbols
  let symbol, name;
  do {
    const index = Math.floor(Math.random() * symbols.length);
    symbol = symbols[index];
    name = names[index];
  } while (assets.find(asset => asset.symbol === symbol));

  const price = Math.floor(Math.random() * 100) + 50;
  return { symbol, name, price };
}

function introduceNewStock() {
  const newStock = generateRandomStock();
  assets.push(newStock);
  addStockToMarketTable(newStock, assets.length - 1);

  // Initialize price history for the new stock
  priceHistory[newStock.symbol] = [newStock.price];
}

// Provide Insider Information
function provideInsiderInformation() {
  const info = insiderInfoMessages[Math.floor(Math.random() * insiderInfoMessages.length)];
  showStoryMessage(`Insider Info: ${info.message}`);

  const isAccurate = Math.random() > 0.1; // 90% chance to be accurate
  setTimeout(() => {
    const asset = assets.find(a => a.symbol === info.symbol);
    if (asset) {
      if (isAccurate) {
        if (info.effect === 'positive') {
          asset.price *= 1.2;
        } else {
          asset.price *= 0.8;
        }
      } else {
        // Opposite effect
        if (info.effect === 'positive') {
          asset.price *= 0.8;
        } else {
          asset.price *= 1.2;
        }
        showStoryMessage(`Unexpected turn of events for ${asset.name}! The insider info was misleading.`);
      }

      // Record the new price
      if (priceHistory[asset.symbol]) {
        priceHistory[asset.symbol].push(asset.price);
      } else {
        priceHistory[asset.symbol] = [asset.price];
      }

      updatePriceDisplay();
      updatePortfolioTable();
      updatePortfolioValue();
    }
  }, 10000);
}

// Show Price Graph Function
function showPriceGraph(symbol) {
  selectedSymbolForChart = symbol;

  // Get the price history for the stock
  const prices = priceHistory[symbol];
  if (!prices) {
    alert('No price history available for this stock.');
    return;
  }

  // Prepare data for the chart
  const labels = prices.map((_, index) => index * 5); // Adjust based on your timing

  // Get the canvas element and context
  const canvas = document.getElementById('price-graph');
  const ctx = canvas.getContext('2d');

  // Destroy existing chart instance if it exists
  if (window.priceChart) {
    window.priceChart.destroy();
  }

  window.priceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: `${symbol} Price History`,
        data: prices,
        borderColor: 'rgba(0, 255, 234, 1)',
        backgroundColor: 'rgba(0, 255, 234, 0.2)',
        fill: true,
        tension: 0.1,
        pointRadius: 3,
        pointHoverRadius: 5,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // Allows the chart to fill the container
      scales: {
        x: {
          title: {
            display: true,
            text: 'Time (seconds)',
            color: '#fff',
            font: {
              family: 'Orbitron',
              size: 14,
            },
          },
          ticks: {
            color: '#fff',
            font: {
              family: 'Orbitron',
              size: 12,
            },
          },
          grid: {
            color: '#555',
          },
        },
        y: {
          title: {
            display: true,
            text: 'Price ($)',
            color: '#fff',
            font: {
              family: 'Orbitron',
              size: 14,
            },
          },
          ticks: {
            color: '#fff',
            font: {
              family: 'Orbitron',
              size: 12,
            },
          },
          grid: {
            color: '#555',
          },
        },
      },
      plugins: {
        legend: {
          labels: {
            color: '#fff',
            font: {
              family: 'Orbitron',
              size: 16,
            },
          },
        },
        tooltip: {
          enabled: true,
          mode: 'index',
          intersect: false,
        },
      },
      animation: {
        duration: 500,
        easing: 'easeOutQuart',
      },
    },
  });

  // Start updating the chart data
  startChartUpdates(symbol);

  // Show the graph modal
  document.getElementById('graph-modal').classList.remove('hidden');
}

// Start Chart Updates
function startChartUpdates(symbol) {
  // Clear any existing interval
  if (chartUpdateInterval) {
    clearInterval(chartUpdateInterval);
  }

  chartUpdateInterval = setInterval(() => {
    if (window.priceChart) {
      const prices = priceHistory[symbol];
      const labels = prices.map((_, index) => index * 5); // Adjust based on your timing

      // Update chart data
      window.priceChart.data.labels = labels;
      window.priceChart.data.datasets[0].data = prices;
      window.priceChart.update();
    }
  }, 1000); // Update every second
}

// Update Chart Data (if using the alternative method)
function updateChartData(symbol) {
  if (window.priceChart) {
    const prices = priceHistory[symbol];
    const labels = prices.map((_, index) => index * 5);

    window.priceChart.data.labels = labels;
    window.priceChart.data.datasets[0].data = prices;
    window.priceChart.update();
  }
}

// Update Price Display
function updatePriceDisplay() {
  assets.forEach((asset, index) => {
    const priceElement = document.getElementById(`price-${index}`);
    if (priceElement) {
      priceElement.textContent = asset.price.toFixed(2);
    }
  });
}

// Start Game Timer Display
function startGameTimerDisplay() {
  const timerElement = document.createElement('p');
  timerElement.id = 'timer';
  timerElement.classList.add('orbitron-body');
  document.querySelector('header').appendChild(timerElement);

  let timeRemaining = gameDuration / 1000; // in seconds

  const timerInterval = setInterval(() => {
    timeRemaining--;
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timerElement.textContent = `Time Remaining: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
    }
  }, 1000);
}

// End Game Function
function endGame() {
  clearInterval(priceUpdateInterval);
  clearInterval(marketEventInterval);
  clearInterval(newStockInterval);

  // Disable buy buttons
  const buyButtons = document.querySelectorAll('#market-table button');
  buyButtons.forEach(button => button.disabled = true);

  // Disable sell buttons
  const sellButtons = document.querySelectorAll('#portfolio-table button');
  sellButtons.forEach(button => button.disabled = true);

  const netWorth = balance + getTotalPortfolioValue();

  let endingMessage = '';
  if (netWorth >= 15000) {
    endingMessage = `Outstanding performance! Your net worth is $${netWorth.toFixed(2)}. You've mastered the market!`;
  } else if (netWorth >= 10000) {
    endingMessage = `Good job! Your net worth is $${netWorth.toFixed(2)}. You've made a profit.`;
  } else if (netWorth >= 8000) {
    endingMessage = `Not bad. Your net worth is $${netWorth.toFixed(2)}. You've weathered the market's ups and downs.`;
  } else {
    endingMessage = `Ouch! Your net worth is $${netWorth.toFixed(2)}. Better luck next time.`;
  }

  showStoryMessage(endingMessage);
}

// Helper Functions
function getTotalPortfolioValue() {
  let totalValue = 0;
  for (const symbol in portfolio) {
    const asset = portfolio[symbol];
    totalValue += asset.price * asset.quantity;
  }
  return totalValue;
}

// Check Achievements
function checkAchievements() {
  const netWorth = balance + getTotalPortfolioValue();
  if (netWorth >= 12000 && !achievementsUnlocked.includes('First Profit')) {
    achievementsUnlocked.push('First Profit');
    showStoryMessage('🎉 Achievement Unlocked: First Profit! Net worth exceeded $12,000.');
  }
  if (netWorth >= 15000 && !achievementsUnlocked.includes('Market Master')) {
    achievementsUnlocked.push('Market Master');
    showStoryMessage('🏆 Achievement Unlocked: Market Master! Net worth exceeded $15,000.');
  }
  // Add more achievements as desired
}

// Sell All Shares of an Asset
function sellAllAsset(symbol) {
  const asset = portfolio[symbol];
  if (asset && asset.quantity > 0) {
    const totalRevenue = asset.price * asset.quantity;
    balance += totalRevenue;

    // Remove the asset from the portfolio
    delete portfolio[symbol];

    updateBalance();
    updatePortfolioTable();
    updatePortfolioValue();
    showStoryMessage(`You sold all shares of ${asset.name}.`);
  } else {
    alert('You do not have any shares to sell.');
  }
}

function endGame() {
  clearInterval(priceUpdateInterval);
  clearInterval(marketEventInterval);
  clearInterval(newStockInterval);

  // Disable buy buttons
  const buyButtons = document.querySelectorAll('#market-table button');
  buyButtons.forEach(button => button.disabled = true);

  // Disable sell buttons
  const sellButtons = document.querySelectorAll('#portfolio-table button');
  sellButtons.forEach(button => button.disabled = true);

  const netWorth = balance + getTotalPortfolioValue();

  let endingMessage = '';
  if (netWorth >= 15000) {
    endingMessage = `Outstanding performance! Your net worth is $${netWorth.toFixed(2)}. You've mastered the market!`;
  } else if (netWorth >= 10000) {
    endingMessage = `Good job! Your net worth is $${netWorth.toFixed(2)}. You've made a profit.`;
  } else if (netWorth >= 8000) {
    endingMessage = `Not bad. Your net worth is $${netWorth.toFixed(2)}. You've weathered the market's ups and downs.`;
  } else {
    endingMessage = `Ouch! Your net worth is $${netWorth.toFixed(2)}. Better luck next time.`;
  }

  showStoryMessage(endingMessage);

  // Redirect to thank you page after a short delay
  setTimeout(() => {
    window.location.href = 'thankyou.html';
  }, 5000); // 5 seconds delay
}