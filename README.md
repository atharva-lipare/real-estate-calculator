# Real Estate Investment Return Calculator

A comprehensive web application to calculate and compare returns from real estate investments with Fixed Deposits (FD) and Equity Market investments. Includes scenario modeling, interactive charts, and support for different loan types including overdraft options.

## Features

- **Comprehensive Input Options**:
  - Loan Amount (with Lakhs/Cr display)
  - Interest Rate
  - Tenure (Years)
  - Loan Types: Normal EMI or Overdraft
  - Property Value
  - Annual Property Appreciation
  - Monthly Rent & Annual Rent Increase
  - Annual Maintenance Costs
  - FD Rate & Equity Return Rate
  - Overdraft-specific: Initial Deposit & Annual Deposit Increase

- **Advanced Calculations**:
  - EMI calculation using standard formula
  - Property appreciation compounding
  - Rent income with annual increases
  - Loan interest (normal or overdraft with surplus)
  - SIP calculations for FD/Equity comparisons
  - Cash flow analysis over time

- **Visualizations**:
  - Bar chart comparing total returns
  - Line chart for yearly cash flows
  - Responsive design with mobile support

- **Technical Features**:
  - Flask backend with CORS support
  - Vue.js 3 frontend with Vite
  - Chart.js for data visualization
  - Systematic Investment Plan (SIP) formulas
  - Error handling and loading states

## Tech Stack

### Backend
- **Python 3.8+**
- **Flask** - Web framework
- **Flask-CORS** - Cross-origin support
- **SQLAlchemy** - Database ORM (future use)

### Frontend
- **Vue.js 3** - Reactive framework
- **Vite** - Build tool
- **Chart.js** - Data visualization
- **Axios** - HTTP client

## Installation & Setup

### Prerequisites
- Python 3.8 or higher
- Node.js 18+ (for Vite 4 compatibility)
- Git

### Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/atharva-lipare/real-estate-calculator.git
   cd real-estate-calculator
   ```

2. **Install dependencies**:
   ```bash
   make install
   # or manually:
   # cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt
   # cd ../frontend && npm install
   ```

3. **Run the application**:
   ```bash
   make run
   # or ./run.sh
   ```

4. **Access the app**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Manual Setup

**Backend Setup:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

**Frontend Setup:**
```bash
cd frontend
npm install
npm run build
cd dist
python3 -m http.server 3000
```

## Usage

1. **Input Parameters**: Fill in loan details, property metrics, and investment rates
2. **Select Loan Type**: Choose between Normal EMI or Overdraft
3. **Adjust Scenarios**: Use sliders for appreciation and rent increase rates
4. **Calculate**: Click calculate to see results
5. **View Results**:
   - Bar chart comparing total returns
   - Cash flow line chart
   - Detailed breakdowns with Indian Rupee formatting

## API Endpoints

### POST /calculate
Calculates investment returns based on input parameters.

**Request Body:**
```json
{
  "loan_amount": 8000000,
  "interest_rate": 8.0,
  "tenure_years": 20,
  "loan_type": "normal",
  "property_value": 10000000,
  "annual_appreciation": 7.5,
  "monthly_rent": 30000,
  "annual_rent_increase": 10,
  "annual_maintenance": 35000,
  "fd_rate": 7.9,
  "equity_rate": 12,
  "initial_deposit": 1000000,
  "annual_deposit_increase": 20
}
```

**Response:**
```json
{
  "property": {
    "total_return": 20775000,
    "total_investment": 18662006,
    "total_interest_paid": 866206,
    "cash_flows": [...]
  },
  "fd": {
    "return": 12345678,
    "investment": 24000000
  },
  "equity": {
    "return": 34567890,
    "investment": 24000000
  },
  "emi": 69260,
  "down_payment": 2000000
}
```

## Key Formulas

### EMI Calculation
```
EMI = P * r * (1+r)^n / ((1+r)^n - 1)
```
Where P = Principal, r = monthly rate, n = months

### SIP (FD/Equity Returns)
```
FV = P * [((1+r)^n - 1) / r]
```
Where P = monthly investment, r = monthly rate, n = months

### Property Appreciation
```
Final Value = Initial Value * (1 + Rate)^Years
```

### Overdraft Interest
```
Interest = max(0, (Remaining Loan - OD Surplus) * Rate / 100)
```

## Development

### Project Structure
```
calculator-project/
├── backend/
│   ├── app.py              # Flask application
│   ├── requirements.txt    # Python dependencies
│   └── venv/               # Virtual environment
├── frontend/
│   ├── src/
│   │   ├── App.vue         # Main Vue component
│   │   └── components/     # Vue components
│   ├── dist/               # Built files
│   └── package.json        # Node dependencies
├── run.sh                  # Quick start script
├── Makefile                # Build automation
└── README.md
```

### Building for Production

**Frontend:**
```bash
cd frontend
npm run build
```

**Backend:**
Use Gunicorn or similar for production:
```bash
gunicorn -w 4 app:app
```

## Deployment

### Online Deployment
1. **Frontend**: Deploy `frontend/dist` to Netlify/Vercel
2. **Backend**: Deploy to Railway/Render/Heroku
3. **Update API URLs**: Change localhost to deployed backend URL

### Local Deployment
- Use Docker for containerized deployment
- Nginx for frontend serving
- Gunicorn for backend

## Mobile/Android Support

The app is responsive and works on mobile browsers. For local Android development:

1. Install Termux
2. Install Python and Node.js in Termux
3. Clone repo and run `make install && make run`
4. Access via browser at `localhost:3000`

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Create Pull Request

## Future Enhancements

- User authentication and saved calculations
- Real-time API integrations for rates
- Advanced risk analysis and Monte Carlo simulations
- PDF report generation
- Multi-currency support
- Comparative analysis with other investments

## License

MIT License - see LICENSE file for details

## Support

For issues or questions, please open a GitHub issue or contact the maintainers.