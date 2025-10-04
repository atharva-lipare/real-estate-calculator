.PHONY: run build-frontend run-backend install

install:
	@echo "Setting up backend..."
	@cd backend && python3 -m venv venv
	@bash -c "cd backend && source venv/bin/activate && pip install -r requirements.txt"
	@echo "Setting up frontend..."
	@cd frontend && npm install

run: build-frontend
	@echo "Starting Real Estate Investment Calculator..."
	@bash -c "cd backend && source venv/bin/activate && python app.py" &
	@sleep 2
	@bash -c "cd frontend && python3 -m http.server 3000" &
	@echo "App is running!"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend: http://localhost:5000"

build-frontend:
	@cd frontend && if [ ! -d "dist" ]; then npm run build; fi

run-backend:
	@cd backend && source venv/bin/activate && python app.py

run-frontend: build-frontend
	@cd frontend/dist && python3 -m http.server 3000