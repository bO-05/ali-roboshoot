# Ali Roboshoot - Backend Service

A high-score tracking API service for the Ali Roboshoot (Alibaba Robot Shooter) game. This backend provides endpoints to save and retrieve player scores.

## Features

- Store player scores with initials
- Retrieve top-scoring players
- Deployed as a serverless function

## Prerequisites

- Node.js 14.x or higher
- MySQL database

## Installation

1. Clone the repository
2. Install dependencies:

```bash
cd ali-bot-shooter-backend
npm install
```

## Environment Configuration

Create a `.env` file in the root directory with the following variables:

```
DB_HOST=your_db_host
DB_USER=your_db_username
DB_PASSWORD=your_db_password
DB_DATABASE=your_database_name
DB_PORT=3306
API_PORT=3000
```

## Database Setup

The service requires a MySQL database with the following schema:

```sql
CREATE TABLE high_scores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  player_initials VARCHAR(3) NOT NULL,
  score INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### GET /scores

Retrieves the top scores from the database.

**Query Parameters:**
- `limit` (optional): Number of scores to return (default: 10)

**Response Example:**
```json
[
  {
    "player_initials": "ABC",
    "score": 9000
  },
  {
    "player_initials": "XYZ",
    "score": 8500
  }
]
```

### POST /scores

Adds a new score to the database.

**Request Body:**
```json
{
  "initials": "ABC",
  "score": 9000
}
```

**Response Example:**
```json
{
  "id": 1,
  "player_initials": "ABC",
  "score": 9000
}
```

## Maintenance Scripts

### Reset Scores

To reset all high scores in the database:

```bash
node reset_scores.js
```

## Dependencies

- cors: ^2.8.5
- dotenv: ^16.0.3
- express: ^4.18.2
- mysql2: ^3.2.0
- serverless-http: ^3.2.0 