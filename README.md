# SDG-Shram

SDG-Shram is a collaborative social networking platform designed to unite businesses, NGOs, institutions, and individuals to drive real-world impact on the United Nations’ Sustainable Development Goals (SDGs).

## 🚀 Projects Features

- **Multi-Stakeholder Authentication**: Dedicated signup flows for Individuals, NGOs, Businesses, and Institutions.
- **Social Login**: Integrated (Simulated) Google and X (Twitter) login.
- **Dynamic Dashboard**: Personalized user views with access to Connect, Projects, Goals, and Services.
- **Connection Management**: Send, accept, and reject connection requests to build your SDG network.
- **Community Building**: Create and join communities ("Clusters") focused on specific goals.
- **Service Requests**: Request professional services like Impact Assessment, NGO Verification, and CSR Partnerships.

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT (JSON Web Tokens)

## 📦 Installation & Setup

Follow these steps to set up the project locally.

### 1. Clone the Repository

```bash
git clone https://github.com/shubhamJ109/SDG_full.git
cd SDG_full
```

### 2. Backend Setup

Navigate to the server directory and install dependencies:

```bash
cd server
npm install
```

### 3. Environment Configuration

Create a `.env` file in the `server` directory with the following variables:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d
NODE_ENV=development
```

### 4. Run the Application

Start the development server:

```bash
# In the server directory
npm run dev
```

The server will start on `http://localhost:5000`.
- **Frontend Access**: Open `http://localhost:5000/dashboard.html` in your browser.
- **API Health Check**: `http://localhost:5000/api/health`

## 📂 Project Structure

- `server/`: Contains the Node.js backend source code.
  - `src/controllers/`: Logic for handling API requests.
  - `src/models/`: Mongoose database schemas.
  - `src/routes/`: API route definitions.
- `SDG-Shram/`: Contains the frontend static files (HTML, CSS, JS, Assets).

## 🤝 Contributing

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/YourFeature`).
3. Commit your changes (`git commit -m 'Add some feature'`).
4. Push to the branch (`git push origin feature/YourFeature`).
5. Open a Pull Request.