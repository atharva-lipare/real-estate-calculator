from flask import Flask, request, jsonify, session
from flask_cors import CORS
import math
import os
from kiteconnect import KiteConnect
from dotenv import load_dotenv

app = Flask(__name__)
CORS(app, supports_credentials=True)
app.secret_key = 'your_secret_key_here'  # Change to a random secret in production

load_dotenv()

# Kite Connect Configuration
KITE_API_KEY = os.getenv('KITE_API_KEY')
KITE_API_SECRET = os.getenv('KITE_API_SECRET')
kite = KiteConnect(api_key=KITE_API_KEY)

def calculate_emi(principal, rate, tenure_years):
    monthly_rate = rate / 12 / 100
    num_payments = tenure_years * 12
    emi = principal * monthly_rate * (1 + monthly_rate) ** num_payments / ((1 + monthly_rate) ** num_payments - 1)
    return emi

def calculate_sip(monthly_investment, initial_investment, annual_rate, months):
    monthly_rate = annual_rate / 12 / 100
    sip_value = monthly_investment * ((1 + monthly_rate) ** months - 1) / monthly_rate if monthly_rate > 0 else monthly_investment * months
    initial_value = initial_investment * (1 + monthly_rate) ** months if monthly_rate > 0 else initial_investment
    total_value = sip_value + initial_value
    total_invested = initial_investment + monthly_investment * months
    return total_value - total_invested

def calculate_property_returns(data, early_sell_years=None):
    loan_amount = data.get('loan_amount', 0)
    interest_rate = data.get('interest_rate', 0)
    tenure = data.get('tenure_years', 10)
    loan_type = data.get('loan_type', 'normal')  # normal or overdraft
    property_value = data.get('property_value', loan_amount)
    annual_appreciation = data.get('annual_appreciation', 5) / 100
    monthly_rent = data.get('monthly_rent', 0)
    annual_rent_increase = data.get('annual_rent_increase', 2) / 100
    annual_maintenance = data.get('annual_maintenance', 0)

    years = tenure
    effective_years = early_sell_years if early_sell_years and early_sell_years < years else years
    cash_flows = []
    total_rent_income = 0
    total_maintenance = 0
    total_loan_payment = 0
    total_paid = 0

    remaining_loan = loan_amount
    current_rent = monthly_rent
    surplus = data.get('initial_deposit', 0) if loan_type == 'overdraft' else 0
    deposit_increase = data.get('annual_deposit_increase', 0) / 100
    total_surplus = surplus if loan_type == 'overdraft' else 0

    for year in range(1, effective_years + 1):
        # Rent income
        annual_rent = current_rent * 12
        total_rent_income += annual_rent

        # Maintenance
        maint = annual_maintenance
        total_maintenance += maint

        # Loan payment
        emi = calculate_emi(loan_amount, interest_rate, tenure)
        annual_loan_full = emi * 12
        if loan_type == 'normal':
            annual_loan = annual_loan_full
            remaining_loan -= annual_loan
        else:  # overdraft: interest only on net amount
            annual_loan = max(0, (remaining_loan - surplus) * (interest_rate / 100))
            remaining_loan -= annual_loan_full

        total_loan_payment += annual_loan
        total_paid += annual_loan_full

        # Check if early sell this year
        if year == effective_years and effective_years < years:
            sell_price = property_value * (1 + annual_appreciation) ** year
            net_sell = sell_price - max(0, remaining_loan)
            net_cash_flow = annual_rent - annual_loan - maint + net_sell
        else:
            net_cash_flow = annual_rent - annual_loan - maint

        cash_flows.append(net_cash_flow)

        current_rent *= (1 + annual_rent_increase)
        if loan_type == 'overdraft':
            total_surplus += surplus
            surplus *= (1 + deposit_increase)

    if effective_years == years:
        final_property_value = property_value * (1 + annual_appreciation) ** years
        appreciation = final_property_value - property_value
        net_property_value = final_property_value - max(0, remaining_loan)
    else:
        final_property_value = sell_price
        appreciation = sell_price - property_value
        net_property_value = net_sell

    down_payment = data.get('property_value', 0) - data.get('loan_amount', 0)
    total_rent = total_rent_income
    total_maint = total_maintenance
    total_investment = down_payment + total_paid
    total_principal_paid = data.get('loan_amount', 0)
    total_interest_paid = total_loan_payment - total_principal_paid if loan_type == 'normal' else total_loan_payment
    total_return = appreciation + total_rent - total_maint - down_payment

    return {
        'total_return': total_return,
        'total_investment': total_investment,
        'total_interest_paid': total_interest_paid,
        'final_property_value': final_property_value,
        'total_rent_income': total_rent_income,
        'total_maintenance': total_maintenance,
        'total_loan_payment': total_loan_payment,
        'cash_flows': cash_flows,
        'total_surplus': total_surplus
    }

@app.route('/calculate', methods=['POST'])
def calculate():
    data = request.json
    try:
        early_sell_years = data.get('early_sell_years')
        if early_sell_years and early_sell_years <= 0:
            early_sell_years = None
        years = data.get('tenure_years', 10)
        if early_sell_years and early_sell_years > years:
            early_sell_years = years
        effective_years = early_sell_years if early_sell_years else years

        property_result = calculate_property_returns(data, early_sell_years)
        # Investment amount for FD/equity is the down payment
        down_payment = data.get('property_value', 0) - data.get('loan_amount', 0)
        fd_rate = data.get('fd_rate', 6) / 100
        equity_rate = data.get('equity_rate', 10) / 100

        # Calculate EMI
        loan_type = data.get('loan_type', 'normal')
        emi = calculate_emi(data.get('loan_amount', 0), data.get('interest_rate', 0), years)

        # For FD/equity, invest down payment (+ OD deposits for overdraft) + monthly EMI as SIP for effective_years
        months = effective_years * 12
        initial_invest = down_payment + (data.get('initial_deposit', 0) if loan_type == 'overdraft' else 0)
        total_od_invest = property_result.get('total_surplus', 0) if loan_type == 'overdraft' else 0
        fd_return = calculate_sip(emi, initial_invest, fd_rate * 100, months)
        equity_return = calculate_sip(emi, initial_invest, equity_rate * 100, months)

        result = {
            'property': property_result,
            'fd': {'return': fd_return, 'investment': down_payment + emi * months + total_od_invest},
            'equity': {'return': equity_return, 'investment': down_payment + emi * months + total_od_invest},
            'emi': emi,
            'down_payment': down_payment
        }
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/kite/login_url', methods=['GET'])
def get_login_url():
    login_url = kite.login_url()
    return jsonify({'login_url': login_url})

@app.route('/kite/generate_session', methods=['POST'])
def generate_session():
    request_token = request.json.get('request_token')
    if not request_token:
        return jsonify({'error': 'request_token required'}), 400
    try:
        data = kite.generate_session(request_token, api_secret=KITE_API_SECRET)
        session['access_token'] = data['access_token']
        kite.set_access_token(data['access_token'])
        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/kite/holdings', methods=['GET'])
def get_holdings():
    if 'access_token' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    kite.set_access_token(session['access_token'])
    try:
        holdings = kite.holdings()
        return jsonify(holdings)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True)