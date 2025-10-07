<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { Bar, Line } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, LineElement, PointElement } from 'chart.js'
import Portfolio from './components/Portfolio.vue'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, LineElement, PointElement)

const form = ref({
  loan_amount: 8000000,
  interest_rate: 8,
  tenure_years: 20,
  loan_type: 'normal',
  property_value: 10000000,
  annual_appreciation: 7.5,
  monthly_rent: 30000,
  annual_rent_increase: 10,
  annual_maintenance: 35000,
  fd_rate: 7.9,
  equity_rate: 12,
  initial_deposit: 1000000,
  annual_deposit_increase: 20,
  early_sell_years: null
})

const formatAmount = (value) => {
  if (value >= 10000000) {
    const crores = value / 10000000;
    return ` (${crores.toFixed(2)} Cr)`;
  } else if (value >= 100000) {
    const lakhs = value / 100000;
    return ` (${lakhs.toFixed(2)} Lakhs)`;
  }
  return '';
}

const result = ref(null)
const chartData = ref(null)
const cashflowData = ref(null)
const loading = ref(false)
const activeTab = ref('calculator')

const calculate = async () => {
  loading.value = true
  try {
    const response = await axios.post('http://localhost:5000/calculate', form.value)
    result.value = response.data
    chartData.value = {
      labels: ['Property', 'Fixed Deposit', 'Equity'],
      datasets: [{
        label: 'Total Returns',
        data: [
          response.data.property.total_return,
          response.data.fd.return,
          response.data.equity.return
        ],
        backgroundColor: ['#42b883', '#646cff', '#ff6b6b']
      }]
    }
    cashflowData.value = {
      labels: response.data.property.cash_flows.map((_, i) => `Year ${i + 1}`),
      datasets: [{
        label: 'Yearly Cash Flow (₹)',
        data: response.data.property.cash_flows,
        borderColor: '#42b883',
        backgroundColor: 'rgba(66, 184, 131, 0.2)',
        fill: true
      }]
    }
    result.value = response.data
  } catch (error) {
    result.value = { error: error.response?.data?.error || error.message || 'Calculation failed' }
    chartData.value = null
    cashflowData.value = null
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="app">
    <h1>Investment Tools</h1>
    <div class="tabs">
      <button @click="activeTab = 'calculator'" :class="{ active: activeTab === 'calculator' }">Calculator</button>
      <button @click="activeTab = 'portfolio'" :class="{ active: activeTab === 'portfolio' }">Portfolio</button>
    </div>
    <div v-if="activeTab === 'calculator'">
      <form @submit.prevent="calculate" class="form">
      <div class="form-group">
        <label>Loan Amount:</label>
        <input v-model.number="form.loan_amount" type="number" />
        <span class="amount-display">{{ formatAmount(form.loan_amount) }}</span>
      </div>
      <div class="form-group">
        <label>Interest Rate (%):</label>
        <input v-model.number="form.interest_rate" type="number" step="0.1" />
      </div>
      <div class="form-group">
        <label>Tenure (Years):</label>
        <input v-model.number="form.tenure_years" type="number" />
      </div>
      <div class="form-group">
        <label>Early Sell Years (optional):</label>
        <input v-model.number="form.early_sell_years" type="number" :max="form.tenure_years" placeholder="Leave empty for full tenure" />
      </div>
      <div class="form-group">
        <label>Loan Type:</label>
        <select v-model="form.loan_type">
          <option value="normal">Normal (EMI)</option>
          <option value="overdraft">Overdraft (Interest Only)</option>
        </select>
      </div>
      <div v-if="form.loan_type === 'overdraft'" class="form-group">
        <label>Initial Deposit in OD Account:</label>
        <input v-model.number="form.initial_deposit" type="number" />
        <span class="amount-display">{{ formatAmount(form.initial_deposit) }}</span>
      </div>
      <div v-if="form.loan_type === 'overdraft'" class="form-group">
        <label>Annual Increase in Deposit (%):</label>
        <input v-model.number="form.annual_deposit_increase" type="number" step="0.1" />
      </div>
      <div class="form-group">
        <label>Property Value:</label>
        <input v-model.number="form.property_value" type="number" />
        <span class="amount-display">{{ formatAmount(form.property_value) }}</span>
      </div>
      <div class="form-group">
        <label>Annual Property Appreciation (%):</label>
        <input v-model.number="form.annual_appreciation" type="range" min="0" max="20" step="0.5" />
        <span>{{ form.annual_appreciation }}%</span>
      </div>
      <div class="form-group">
        <label>Monthly Rent:</label>
        <input v-model.number="form.monthly_rent" type="number" />
      </div>
      <div class="form-group">
        <label>Annual Rent Increase (%):</label>
        <input v-model.number="form.annual_rent_increase" type="range" min="0" max="10" step="0.5" />
        <span>{{ form.annual_rent_increase }}%</span>
      </div>
      <div class="form-group">
        <label>Annual Maintenance Costs:</label>
        <input v-model.number="form.annual_maintenance" type="number" />
      </div>
      <div class="form-group">
        <label>FD Rate (%):</label>
        <input v-model.number="form.fd_rate" type="number" step="0.1" />
      </div>
      <div class="form-group">
        <label>Equity Return (%):</label>
        <input v-model.number="form.equity_rate" type="number" step="0.1" />
      </div>
      <button type="submit" :disabled="loading">Calculate</button>
    </form>
    <div v-if="loading" class="loading">Calculating...</div>
    <div v-if="chartData" class="chart-container">
      <h3>Comparison of Total Returns</h3>
      <Bar :data="chartData" :options="{ responsive: true, maintainAspectRatio: false }" />
    </div>
    <div v-if="cashflowData" class="chart-container">
      <h3>Property Yearly Cash Flow</h3>
      <Line :data="cashflowData" :options="{ responsive: true, maintainAspectRatio: false }" />
    </div>
    <div v-if="result" class="results">
      <h2>Results</h2>
      <div v-if="result.error" class="error">
        <p>Error: {{ result.error }}</p>
      </div>
      <div v-else>
        <div class="summary">
          <p><strong>Down Payment:</strong> ₹{{ result.down_payment.toLocaleString('en-IN') }}</p>
          <p v-if="result.emi"><strong>Monthly EMI:</strong> ₹{{ result.emi.toLocaleString('en-IN', {maximumFractionDigits: 2}) }}</p>
        </div>
        <div class="result-card">
          <h3>Property Investment</h3>
          <p>Total Investment: ₹{{ result.property.total_investment.toLocaleString('en-IN') }} {{ formatAmount(result.property.total_investment) }}</p>
          <p>Total Interest Paid: ₹{{ result.property.total_interest_paid.toLocaleString('en-IN', {maximumFractionDigits: 2}) }} {{ formatAmount(result.property.total_interest_paid) }}</p>
          <p>Final Property Value: ₹{{ result.property.final_property_value.toLocaleString('en-IN') }} {{ formatAmount(result.property.final_property_value) }}</p>
          <p>Total Return: ₹{{ result.property.total_return.toLocaleString('en-IN', {maximumFractionDigits: 2}) }} {{ formatAmount(result.property.total_return) }}</p>
        </div>
        <div class="result-card">
          <h3>Fixed Deposit (SIP)</h3>
          <p>Investment: ₹{{ result.fd.investment.toLocaleString('en-IN') }} {{ formatAmount(result.fd.investment) }}</p>
          <p>Total Return: ₹{{ result.fd.return.toLocaleString('en-IN', {maximumFractionDigits: 2}) }} {{ formatAmount(result.fd.return) }}</p>
        </div>
        <div class="result-card">
          <h3>Equity Market (SIP)</h3>
          <p>Investment: ₹{{ result.equity.investment.toLocaleString('en-IN') }} {{ formatAmount(result.equity.investment) }}</p>
          <p>Total Return: ₹{{ result.equity.return.toLocaleString('en-IN', {maximumFractionDigits: 2}) }} {{ formatAmount(result.equity.return) }}</p>
        </div>
      </div>
    </div>
   </div>
   <div v-else-if="activeTab === 'portfolio'">
     <Portfolio />
   </div>
  </div>
</template>

<style scoped>
.app {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #0a0a0a;
  color: #ffffff;
  min-height: 100vh;
}

h1 {
  text-align: center;
  color: #ffffff;
  margin-bottom: 24px;
  font-size: 1.8em;
  font-weight: 600;
  letter-spacing: -0.5px;
}

.tabs {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.tabs button {
  padding: 8px 16px;
  margin: 0 4px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #888;
  font-size: 0.9em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.tabs button.active {
  background: #2563eb;
  color: #ffffff;
  border-color: #2563eb;
}

.tabs button:hover {
  color: #ffffff;
  background: #1e40af;
}

.form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
  background: #1a1a1a;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #333;
}

.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 15px;
  position: relative;
}

.amount-display {
  position: absolute;
  right: 8px;
  top: 30px;
  font-size: 0.8em;
  color: #999;
  background: #1a1a1a;
  padding: 0 4px;
  pointer-events: none;
}

label {
  font-weight: 500;
  color: #ccc;
  margin-bottom: 4px;
  font-size: 0.9em;
}

input, select {
  padding: 8px 12px;
  border: 1px solid #444;
  border-radius: 4px;
  font-size: 0.9em;
  background: #2a2a2a;
  color: #ffffff;
  transition: border-color 0.2s ease;
  width: 100%;
}

input:focus, select:focus {
  outline: none;
  border-color: #2563eb;
}

button {
  padding: 10px 16px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.9em;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  grid-column: span 2;
  margin-top: 12px;
}

button:hover {
  background: #1d4ed8;
}

button:disabled {
  background: #374151;
  cursor: not-allowed;
  opacity: 0.6;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.chart-container {
  height: 320px;
  margin: 20px 0;
  background: #1a1a1a;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #333;
}

.results {
  margin-top: 24px;
  background: #1a1a1a;
  padding: 20px;
  border-radius: 6px;
  border: 1px solid #333;
}

.result-card {
  background: #2a2a2a;
  padding: 12px;
  margin: 8px 0;
  border-radius: 4px;
  border-left: 3px solid #2563eb;
}

.result-card h3 {
  margin: 0 0 8px 0;
  color: #ffffff;
  font-size: 1em;
}

.result-card p {
  margin: 0;
  font-size: 0.9em;
  color: #ccc;
}

.loading {
  text-align: center;
  margin: 30px 0;
  font-size: 1.2em;
  color: #42b883;
}

.error {
  background: #2a1a1a;
  color: #ef4444;
  padding: 12px;
  border-radius: 4px;
  border: 1px solid #dc2626;
  font-size: 0.9em;
}

@media (max-width: 600px) {
  .form {
    grid-template-columns: 1fr;
  }
  button {
    grid-column: span 1;
  }
}
</style>
