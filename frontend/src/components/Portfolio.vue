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
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #0a0a0a;
  color: #ffffff;
  min-height: 100vh;
}

.portfolio h2 {
  text-align: center;
  color: #ffffff;
  font-size: 1.8em;
  margin-bottom: 20px;
  font-weight: 600;
  letter-spacing: -0.5px;
}

.login-form {
  margin: 20px 0;
}

input {
  padding: 8px 12px;
  margin-right: 12px;
  border: 1px solid #444;
  border-radius: 4px;
  font-size: 0.9em;
  background: #2a2a2a;
  color: #ffffff;
  width: 200px;
}

input:focus {
  outline: none;
  border-color: #2563eb;
}

button {
  padding: 8px 16px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 12px;
  font-size: 0.9em;
  font-weight: 500;
  transition: background-color 0.2s ease;
}

button:hover {
  background: #1d4ed8;
}

.portfolio-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin: 20px 0;
}

.summary-card {
  background: #1a1a1a;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #333;
  text-align: center;
}

.summary-card h3 {
  margin: 0 0 8px 0;
  font-size: 0.9em;
  color: #ccc;
  font-weight: 500;
}

.summary-card p {
  margin: 0;
  font-size: 1.2em;
  font-weight: 600;
  color: #10b981;
}

.summary-card p.negative {
  color: #ef4444;
}

.summary-card p.neutral {
  color: #6b7280;
}

.filters {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
  gap: 8px;
}

.filters button {
  padding: 6px 12px;
  border: 1px solid #444;
  border-radius: 4px;
  background: transparent;
  color: #888;
  font-size: 0.85em;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filters button.active {
  background: #2563eb;
  color: #ffffff;
  border-color: #2563eb;
}

.filters button:hover {
  color: #ffffff;
  background: #1e40af;
}

.loading {
  text-align: center;
  margin: 20px 0;
  font-size: 1em;
  color: #999;
}

.holdings-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  background: #1a1a1a;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #333;
}

th, td {
  border: none;
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #333;
}

th {
  background: #2a2a2a;
  color: #ffffff;
  font-weight: 600;
  font-size: 0.9em;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

td {
  color: #ccc;
  font-weight: 500;
}

tr:hover {
  background-color: #2a2a2a;
  transition: background-color 0.2s ease;
}
</style>
.symbol-link {
  color: #60a5fa;
  text-decoration: none;
  font-weight: 500;
}

.symbol-link:hover {
  color: #93c5fd;
  text-decoration: underline;
}
td.negative {
  color: #dc3545;
}

td.neutral {
  color: #6c757d;
}