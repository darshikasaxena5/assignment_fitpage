# Ratings & Reviews System

This project contains a simple ratings and reviews web application. The backend is built with **Node.js** and **Express** using a **PostgreSQL** database, while the frontend is a small HTML/JavaScript interface.

## Contents

- `backend/` – Express server that exposes REST endpoints for managing products, users and reviews.
- `frontend/` – HTML, CSS and JS files for a minimal user interface that consumes the API.

## Running the backend

1. Navigate to the `backend` folder:

   ```bash
   cd backend
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Set up the following environment variables (for example in a `.env` file) so the server can connect to your PostgreSQL instance:

   - `PGHOST`
   - `PGUSER`
   - `PGPASSWORD`
   - `PGDATABASE`
   - `PGPORT`

4. Start the server with:

   ```bash
   node index.js
   ```

   The API will be available on `http://localhost:5001` by default.

## Running the frontend

Open `frontend/index.html` in a browser. The JavaScript connects to the backend API. Edit `frontend/script.js` if you need to change the `API_BASE` URL.

## Available API endpoints

- `GET /products` – list products
- `POST /products` – create a product
- `GET /users` – list users
- `POST /users` – create a user
- `GET /reviews` – list reviews (`product_id` and `user_id` query parameters supported)
- `POST /reviews` – create a review (supports photo uploads)

## License

This code is provided for educational purposes.
