<script setup>
import { ref } from 'vue'
import axios from 'axios'

const holdings = ref([])
const equityHoldings = ref([])
const mfHoldings = ref([])
const loading = ref(false)
const loggedIn = ref(false)
const requestToken = ref('')
const totalInvested = ref(0)
const totalValue = ref(0)
const totalPnL = ref(0)
const filter = ref('all') // 'all', 'equity', 'mutual_fund'
let childWindow = null

const login = async () => {
  try {
    const response = await axios.get('http://localhost:5000/kite/login_url', { withCredentials: true })
    childWindow = window.open(response.data.login_url, '_blank')
  } catch (error) {
    console.error(error)
  }
}

window.addEventListener('message', (event) => {
  if (event.data.type === 'kite_token') {
    requestToken.value = event.data.token
    generateSession()
  }
})

// Handle callback in child window
if (window.opener) {
  const urlParams = new URLSearchParams(window.location.search)
  const token = urlParams.get('request_token')
  if (token) {
    window.opener.postMessage({ type: 'kite_token', token }, '*')
    window.close()
  }
}

const openScreener = (symbol) => {
  window.open(`https://www.screener.in/company/${symbol}/`, '_blank')
}

const generateSession = async () => {
  try {
    await axios.post('http://localhost:5000/kite/generate_session', { request_token: requestToken.value }, { withCredentials: true })
    loggedIn.value = true
    fetchHoldings()
  } catch (error) {
    console.error(error)
  }
}

const fetchHoldings = async () => {
  loading.value = true
  try {
    const response = await axios.get('http://localhost:5000/kite/holdings', { withCredentials: true })
    equityHoldings.value = response.data.equity || []
    mfHoldings.value = response.data.mutual_fund || []
    holdings.value = response.data.all || []

    updateFilteredHoldings()
    calculateTotals()
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const updateFilteredHoldings = () => {
  if (filter.value === 'all') {
    holdings.value = equityHoldings.value.concat(mfHoldings.value)
  } else if (filter.value === 'equity') {
    holdings.value = equityHoldings.value
  } else if (filter.value === 'mutual_fund') {
    holdings.value = mfHoldings.value
  }
}

const calculateTotals = () => {
  const currentHoldings = holdings.value
  totalInvested.value = currentHoldings.reduce((sum, h) => {
    if (h.type === 'equity') {
      return sum + (h.quantity * h.average_price)
    } else if (h.type === 'mutual_fund') {
      return sum + (h.quantity * h.average_price)
    }
    return sum
  }, 0)
  totalValue.value = currentHoldings.reduce((sum, h) => {
    if (h.type === 'equity') {
      return sum + (h.quantity * h.last_price)
    } else if (h.type === 'mutual_fund') {
      return sum + (h.quantity * h.last_price)
    }
    return sum
  }, 0)
  totalPnL.value = currentHoldings.reduce((sum, h) => {
    if (h.type === 'equity') {
      return sum + h.pnl
    } else if (h.type === 'mutual_fund') {
      return sum + h.pnl
    }
    return sum
  }, 0)
}

const setFilter = (newFilter) => {
  filter.value = newFilter
  updateFilteredHoldings()
  calculateTotals()
}
</script>

<template>
  <div class="portfolio">
    <h2>My Portfolio</h2>
    <div v-if="loggedIn" class="portfolio-summary">
      <div class="summary-card">
        <h3>Total Invested</h3>
        <p>₹{{ totalInvested.toLocaleString('en-IN', {maximumFractionDigits: 2}) }}</p>
      </div>
      <div class="summary-card">
        <h3>Total Value</h3>
        <p>₹{{ totalValue.toLocaleString('en-IN', {maximumFractionDigits: 2}) }}</p>
      </div>
      <div class="summary-card">
        <h3>Total P&L</h3>
        <p :class="{ negative: totalPnL < 0, neutral: totalPnL === 0 }">₹{{ totalPnL.toLocaleString('en-IN', {maximumFractionDigits: 2}) }}</p>
      </div>
    </div>
    <div v-if="loggedIn" class="filters">
      <button @click="setFilter('all')" :class="{ active: filter === 'all' }">All</button>
      <button @click="setFilter('equity')" :class="{ active: filter === 'equity' }">Equity</button>
      <button @click="setFilter('mutual_fund')" :class="{ active: filter === 'mutual_fund' }">Mutual Funds</button>
    </div>
    <button v-if="!loggedIn" @click="login">Login to Kite</button>
    <div v-if="!loggedIn" class="login-form">
      <input v-model="requestToken" placeholder="Enter request token after login" />
      <button @click="generateSession">Generate Session</button>
    </div>
    <div v-if="loggedIn">
      <button @click="fetchHoldings">Fetch Holdings</button>
      <div v-if="loading" class="loading">Loading...</div>
      <table v-if="holdings.length" class="holdings-table">
        <thead>
          <tr>
            <th>Instrument</th>
            <th>Qty</th>
            <th>Avg. Cost</th>
            <th>LTP</th>
            <th>Invested</th>
            <th>Cur. val</th>
            <th>P&L</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="holding in holdings" :key="holding.instrument_token || holding.fund">
            <td>
              <span v-if="holding.type === 'equity'">
                <a href="#" @click.prevent="openScreener(holding.tradingsymbol)" class="symbol-link">{{ holding.tradingsymbol }}</a>
              </span>
              <span v-else-if="holding.type === 'mutual_fund'">
                {{ holding.fund || holding.scheme_name }}
              </span>
            </td>
            <td>{{ holding.quantity }}</td>
            <td>₹{{ holding.average_price.toLocaleString('en-IN', {maximumFractionDigits: 2}) }}</td>
            <td>₹{{ holding.last_price.toLocaleString('en-IN', {maximumFractionDigits: 2}) }}</td>
            <td>₹{{ (holding.quantity * holding.average_price).toLocaleString('en-IN', {maximumFractionDigits: 2}) }}</td>
            <td>₹{{ (holding.quantity * holding.last_price).toLocaleString('en-IN', {maximumFractionDigits: 2}) }}</td>
            <td :class="{ negative: holding.pnl < 0, neutral: holding.pnl === 0 }">₹{{ holding.pnl.toLocaleString('en-IN', {maximumFractionDigits: 2}) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.portfolio {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--kite-bg-primary);
  color: var(--kite-text-primary);
  min-height: 100vh;
}

.portfolio h2 {
  text-align: center;
  color: var(--kite-text-primary);
  font-size: 1.8em;
  margin-bottom: 32px;
  font-weight: 600;
  letter-spacing: -0.5px;
}

.login-form {
  margin: 24px 0;
  background: var(--kite-bg-secondary);
  padding: 20px;
  border-radius: 8px;
  border: 1px solid var(--kite-border);
  display: flex;
  gap: 12px;
  align-items: center;
}

input {
  padding: 10px 12px;
  border: 1px solid var(--kite-border);
  border-radius: 6px;
  font-size: 0.9em;
  background: var(--kite-bg-tertiary);
  color: var(--kite-text-primary);
  flex: 1;
  transition: all 0.2s ease;
}

input:focus {
  outline: none;
  border-color: var(--kite-blue-primary);
  box-shadow: 0 0 0 2px rgba(56, 126, 209, 0.1);
}

button {
  padding: 10px 16px;
  background: var(--kite-blue-primary);
  color: var(--kite-text-primary);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9em;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(56, 126, 209, 0.2);
}

button:hover {
  background: var(--kite-blue-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(56, 126, 209, 0.3);
}

.portfolio-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin: 24px 0;
}

.summary-card {
  background: var(--kite-bg-secondary);
  padding: 20px;
  border-radius: 8px;
  border: 1px solid var(--kite-border);
  text-align: center;
  box-shadow: 0 2px 8px var(--kite-shadow);
  transition: transform 0.2s ease;
}

.summary-card:hover {
  transform: translateY(-2px);
}

.summary-card h3 {
  margin: 0 0 8px 0;
  font-size: 0.85em;
  color: var(--kite-text-secondary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-card p {
  margin: 0;
  font-size: 1.3em;
  font-weight: 600;
  color: var(--kite-green);
}

.summary-card p.negative {
  color: var(--kite-red);
}

.summary-card p.neutral {
  color: var(--kite-text-muted);
}

.filters {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  gap: 8px;
}

.filters button {
  padding: 8px 16px;
  border: 1px solid var(--kite-border);
  border-radius: 6px;
  background: var(--kite-bg-secondary);
  color: var(--kite-text-muted);
  font-size: 0.85em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filters button.active {
  background: var(--kite-blue-primary);
  color: var(--kite-text-primary);
  border-color: var(--kite-blue-primary);
  box-shadow: 0 2px 4px rgba(56, 126, 209, 0.2);
}

.filters button:hover:not(.active) {
  color: var(--kite-text-secondary);
  background: var(--kite-bg-tertiary);
  border-color: var(--kite-border-light);
}

.loading {
  text-align: center;
  margin: 32px 0;
  font-size: 1em;
  color: var(--kite-text-muted);
}

.holdings-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 24px;
  background: var(--kite-bg-secondary);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--kite-border);
  box-shadow: 0 2px 8px var(--kite-shadow);
}

th, td {
  border: none;
  padding: 14px 12px;
  text-align: left;
  border-bottom: 1px solid var(--kite-border);
}

th {
  background: var(--kite-bg-tertiary);
  color: var(--kite-text-secondary);
  font-weight: 600;
  font-size: 0.8em;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

td {
  color: var(--kite-text-primary);
  font-weight: 500;
  font-size: 0.9em;
}

tr:hover {
  background-color: var(--kite-bg-tertiary);
  transition: background-color 0.2s ease;
}
</style>
.symbol-link {
  color: var(--kite-blue-primary);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.symbol-link:hover {
  color: var(--kite-blue-hover);
  text-decoration: underline;
}

td.negative {
  color: var(--kite-red);
}

td.neutral {
  color: var(--kite-text-muted);
}