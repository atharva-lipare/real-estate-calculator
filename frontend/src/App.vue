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
        <input v-model.number="form.annual_rent_increase" type="range" min="0" max="20" step="0.5" />
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
  padding: 24px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--kite-bg-primary);
  color: var(--kite-text-primary);
  min-height: 100vh;
}

h1 {
  text-align: center;
  color: var(--kite-text-primary);
  margin-bottom: 32px;
  font-size: 1.8em;
  font-weight: 600;
  letter-spacing: -0.5px;
}

.tabs {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
  background: var(--kite-bg-secondary);
  border-radius: 8px;
  padding: 4px;
  border: 1px solid var(--kite-border);
}

.tabs button {
  padding: 10px 20px;
  margin: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--kite-text-muted);
  font-size: 0.9em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  max-width: 120px;
}

.tabs button.active {
  background: var(--kite-blue-primary);
  color: var(--kite-text-primary);
  box-shadow: 0 2px 4px rgba(56, 126, 209, 0.2);
}

.tabs button:hover:not(.active) {
  color: var(--kite-text-secondary);
  background: var(--kite-bg-tertiary);
}

.form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
  background: var(--kite-bg-secondary);
  padding: 28px;
  border-radius: 8px;
  border: 1px solid var(--kite-border);
  box-shadow: 0 2px 8px var(--kite-shadow);
}

.form-group {
  display: flex;
  flex-direction: column;
  position: relative;
  margin-bottom: 8px;
}

.form-group label {
  font-weight: 500;
  color: var(--kite-text-secondary);
  margin-bottom: 8px;
  font-size: 0.8em;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1.2;
}

.amount-display {
  position: absolute;
  right: 14px;
  top: 42px;
  font-size: 0.7em;
  color: var(--kite-text-muted);
  background: var(--kite-bg-secondary);
  padding: 2px 8px;
  pointer-events: none;
  z-index: 1;
  border-radius: 3px;
}

input, select {
  padding: 12px 14px;
  border: 1px solid var(--kite-border);
  border-radius: 6px;
  font-size: 0.9em;
  background: var(--kite-bg-tertiary);
  color: var(--kite-text-primary);
  transition: all 0.2s ease;
  width: 100%;
  line-height: 1.4;
}

input:focus, select:focus {
  outline: none;
  border-color: var(--kite-blue-primary);
  box-shadow: 0 0 0 2px rgba(56, 126, 209, 0.1);
}

.form button {
  padding: 12px 20px;
  background: var(--kite-blue-primary);
  color: var(--kite-text-primary);
  border: none;
  border-radius: 6px;
  font-size: 0.9em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  grid-column: span 2;
  margin-top: 16px;
  box-shadow: 0 2px 4px rgba(56, 126, 209, 0.2);
}

.form button:hover:not(:disabled) {
  background: var(--kite-blue-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(56, 126, 209, 0.3);
}

.form button:disabled {
  background: var(--kite-bg-tertiary);
  color: var(--kite-text-muted);
  cursor: not-allowed;
  opacity: 0.6;
  box-shadow: none;
  transform: none;
}

.chart-container {
  height: 320px;
  margin: 24px 0;
  background: var(--kite-bg-secondary);
  padding: 20px;
  border-radius: 8px;
  border: 1px solid var(--kite-border);
  box-shadow: 0 2px 8px var(--kite-shadow);
}

.chart-container h3 {
  margin: 0 0 16px 0;
  color: var(--kite-text-primary);
  font-size: 1.1em;
  font-weight: 600;
}

.results {
  margin-top: 32px;
  background: var(--kite-bg-secondary);
  padding: 24px;
  border-radius: 8px;
  border: 1px solid var(--kite-border);
  box-shadow: 0 2px 8px var(--kite-shadow);
}

.results h2 {
  margin: 0 0 20px 0;
  color: var(--kite-text-primary);
  font-size: 1.3em;
  font-weight: 600;
  text-align: center;
}

.summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.summary p {
  margin: 0;
  font-size: 0.9em;
  color: var(--kite-text-secondary);
  text-align: center;
}

.result-card {
  background: var(--kite-bg-tertiary);
  padding: 16px;
  margin: 12px 0;
  border-radius: 6px;
  border: 1px solid var(--kite-border);
  border-left: 3px solid var(--kite-blue-primary);
}

.result-card h3 {
  margin: 0 0 12px 0;
  color: var(--kite-text-primary);
  font-size: 1em;
  font-weight: 600;
}

.result-card p {
  margin: 0 0 4px 0;
  font-size: 0.9em;
  color: var(--kite-text-secondary);
}

.loading {
  text-align: center;
  margin: 40px 0;
  font-size: 1.1em;
  color: var(--kite-green);
}

.error {
  background: rgba(231, 76, 60, 0.1);
  color: var(--kite-red);
  padding: 16px;
  border-radius: 6px;
  border: 1px solid rgba(231, 76, 60, 0.3);
  font-size: 0.9em;
  margin: 16px 0;
}

@media (max-width: 600px) {
  .app {
    padding: 16px;
  }

  .form {
    grid-template-columns: 1fr;
    padding: 20px;
  }

  .form button {
    grid-column: span 1;
  }

  .summary {
    grid-template-columns: 1fr;
  }

  .tabs {
    flex-direction: column;
    gap: 4px;
  }

  .tabs button {
    max-width: none;
  }
}
</style>
