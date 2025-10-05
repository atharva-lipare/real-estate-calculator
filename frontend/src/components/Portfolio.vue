<script setup>
import { ref } from 'vue'
import axios from 'axios'

const holdings = ref([])
const loading = ref(false)
const loggedIn = ref(false)
const requestToken = ref('')
const totalInvested = ref(0)
const totalValue = ref(0)
const totalPnL = ref(0)
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
    holdings.value = response.data
    totalInvested.value = holdings.value.reduce((sum, h) => sum + (h.quantity * h.average_price), 0)
    totalValue.value = holdings.value.reduce((sum, h) => sum + (h.quantity * h.last_price), 0)
    totalPnL.value = holdings.value.reduce((sum, h) => sum + h.pnl, 0)
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="portfolio">
    <h2>My Portfolio</h2>
    <div v-if="loggedIn" class="portfolio-summary">
      <div class="summary-card">
        <h3>💰 Total Invested</h3>
        <p>₹{{ totalInvested.toLocaleString('en-IN', {maximumFractionDigits: 2}) }}</p>
      </div>
      <div class="summary-card">
        <h3>📈 Total Value</h3>
        <p>₹{{ totalValue.toLocaleString('en-IN', {maximumFractionDigits: 2}) }}</p>
      </div>
      <div class="summary-card">
        <h3>📊 Total P&L</h3>
        <p :class="{ negative: totalPnL < 0, neutral: totalPnL === 0 }">₹{{ totalPnL.toLocaleString('en-IN', {maximumFractionDigits: 2}) }}</p>
      </div>
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
            <th>Symbol</th>
            <th>Quantity</th>
            <th>Average Price</th>
            <th>Last Price</th>
            <th>P&L</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="holding in holdings" :key="holding.instrument_token">
            <td><a href="#" @click.prevent="openScreener(holding.tradingsymbol)" class="symbol-link">{{ holding.tradingsymbol }}</a></td>
            <td>{{ holding.quantity }}</td>
            <td>₹{{ holding.average_price.toLocaleString('en-IN', {maximumFractionDigits: 2}) }}</td>
            <td>₹{{ holding.last_price.toLocaleString('en-IN', {maximumFractionDigits: 2}) }}</td>
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
  padding: 30px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 50%, #e0e6ed 100%);
  min-height: 100vh;
  border-radius: 20px;
  box-shadow: inset 0 0 20px rgba(0,0,0,0.1);
}

.portfolio h2 {
  text-align: center;
  color: #333;
  font-size: 2.5em;
  margin-bottom: 30px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
  background: linear-gradient(45deg, #42b883, #3498db);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.login-form {
  margin: 20px 0;
}

input {
  padding: 12px;
  margin-right: 15px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1em;
  transition: border-color 0.3s;
}

input:focus {
  outline: none;
  border-color: #42b883;
  box-shadow: 0 0 8px rgba(66, 184, 131, 0.3);
}

button {
  padding: 12px 20px;
  background: linear-gradient(45deg, #42b883, #3498db);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin-right: 15px;
  font-size: 1em;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(66, 184, 131, 0.3);
}

button:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(66, 184, 131, 0.4);
}

button:active {
  transform: translateY(-1px);
}

.portfolio-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin: 30px 0;
}

.summary-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 1px solid #e9ecef;
}

.summary-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.summary-card h3 {
  margin: 0 0 10px 0;
  font-size: 1.2em;
  color: #495057;
  font-weight: 600;
}

.summary-card p {
  margin: 0;
  font-size: 1.4em;
  font-weight: bold;
  color: #28a745;
}

.summary-card p.negative {
  color: #dc3545;
}

.summary-card p.neutral {
  color: #6c757d;
}

.loading {
  text-align: center;
  margin: 30px 0;
  font-size: 1.2em;
  color: #42b883;
}

.holdings-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 30px;
  background: white;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15);
}

th, td {
  border: none;
  padding: 15px;
  text-align: left;
}

th {
  background: linear-gradient(45deg, #42b883, #3498db);
  color: white;
  font-weight: 700;
  font-size: 1.1em;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

td {
  color: #495057;
  font-weight: 500;
}

tr:nth-child(even) {
  background-color: #f8f9fa;
}

tr:hover {
  background-color: #e9ecef;
  transition: background-color 0.3s ease;
}
</style>
.symbol-link {
  color: #42b883;
  text-decoration: none;
  font-weight: bold;
}

.symbol-link:hover {
  text-decoration: underline;
}
td.negative {
  color: #dc3545;
}

td.neutral {
  color: #6c757d;
}