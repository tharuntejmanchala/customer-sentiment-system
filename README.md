
# CUSTOMER ENGAGEMENT SENTIMENT TRACKING SYSTEM (CESTS) 

The **Customer Engagement Sentiment Tracking System (CESTS)** is designed to track, analyze, and visualize customer sentiments across various engagement channels. It utilizes sentiment analysis techniques to classify customer feedback and interactions into predefined categories, allowing businesses to better understand customer emotions and improve decision-making processes.

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Installation Instructions](#installation-instructions)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

## Project Overview

The CESTS aims to help businesses track the sentiments of customer interactions and engagement data. It leverages sentiment analysis algorithms and provides a user-friendly interface to view and analyze the sentiment trends. The project also includes audio transcription features using OpenAI's Whisper model.

## Features

- **Sentiment Analysis**: Automatically classify customer feedback into categories such as Positive, Negative, Neutral, etc., using an LSTM-based model built with TensorFlow.
- **Audio Transcription**: Transcribe audio feedback into text using the Whisper ASR model.
- **Engagement Tracking**: Monitor and track customer engagement data in real-time.
- **Visualizations**: View sentiment trends over time with graphs and charts.
- **Real-time Updates**: Continuously track customer feedback and engagement.

## Technologies Used

### Backend:
- **FastAPI**: A modern, high-performance Python web framework used to build the API endpoints (`/health`, `/analyze`, `/transcribe`, `/train`, `/upload`, `/audio`, `/save-recording`, `/recordings`, `/recordings/{id}`, `/audio-file/{id}`).
- **Uvicorn**: An ASGI server used to run the FastAPI application.
- **SQLite**: Embedded database used to persist recording metadata and history locally.
- **TensorFlow**: A deep learning framework for building, training, and deploying machine learning models, specifically for sentiment analysis.
- **Whisper**: An open-source automatic speech recognition (ASR) model developed by OpenAI, used to transcribe audio files to text.
- **NLTK (Natural Language Toolkit)**: A Python library for natural language processing, specifically used for sentiment analysis with the VADER sentiment analysis tool.
- **Pickle**: Used to serialize and save the tokenizer object.
- **python-multipart**: Enables multipart form data and file upload support in FastAPI.
- **aiofiles**: Async file I/O for FastAPI endpoints handling file uploads.
- **dotenv**: A Python library used to load environment variables from a `.env` file.

### Frontend:
- **React**: A JavaScript library for building user interfaces, used for creating the frontend of the application.
- **Axios**: A promise-based HTTP client for the browser and Node.js, used to make API requests to the backend.
- **Bootstrap**: A front-end framework for developing responsive and mobile-first websites, used to style the frontend application.
- **React Router**: A routing library for React, used to navigate between different components in the frontend.
- **CORS Middleware**: FastAPI's built-in CORSMiddleware handles Cross-Origin Resource Sharing, enabling the backend API to be accessed from different origins.

### Cloud/Infrastructure:
- **FFmpeg**: A multimedia framework used for audio and video file processing, included in the environment to support Whisper transcription.

### Libraries/Tools:
- **TensorFlow Keras**: Used to create, train, and evaluate a deep learning model (LSTM with embedding layers) for sentiment analysis.
- **Python's logging module**: Used for logging messages for debugging and monitoring purposes.
- **Python's OS and tempfile modules**: Used for handling file management, such as saving temporary files for audio uploads.

## Installation Instructions

1. Clone the repository to your local machine:

   ```bash
   git clone https://github.com/ManchalaSrinithin/CUSTOMER-ENGAGEMENT-SENTIMENT-TRACKING-SYSTEM-CESTS.git
   ```

2. Navigate to the project directory:

   ```bash
   cd CESTS
   ```

3. Install dependencies for the backend:

   ```bash
   pip install -r backend/requirements.txt
   ```

4. Install **FFmpeg** for audio processing. On most systems, you can install FFmpeg using the following commands:
   - **Ubuntu**:

     ```bash
     sudo apt install ffmpeg
     ```

   - **Mac** (via Homebrew):

     ```bash
     brew install ffmpeg
     ```

5. Install dependencies for the frontend (if using React):

   Navigate to the frontend directory and run:

   ```bash
   npm install
   ```

6. Set up the environment variables:
   - Create a `.env` file and add any necessary environment variables (e.g., API keys or model paths).

7. Run the backend server:

   ```bash
   python backend/app.py
   ```
   Or with auto-reload during development:
   ```bash
   python -m uvicorn app:app --host 0.0.0.0 --port 5000 --reload
   ```
   Interactive API docs will be available at: `http://127.0.0.1:5000/docs`

### Frontend:

1. Navigate to the root directory:
   ```bash
   cd path/to/your
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Run the frontend server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:3000`.


## Usage

Once the application is running, you can interact with the system through the following endpoints:

- **GET  /health**: Health check endpoint – confirms the API is running.
- **POST /analyze**: Analyses the sentiment of customer feedback (text).
- **POST /transcribe**: Transcribes audio feedback into text (and optionally analyses sentiment).
- **POST /train**: Trains the sentiment analysis model with new data.
- **POST /audio**: Full pipeline – transcribes audio and analyses sentiment in one call.
- **POST /upload**: Simple file upload endpoint.
- **POST /save-recording**: Saves a recording (audio file + metadata) to SQLite + disk.
- **GET  /recordings**: Returns all saved recording metadata ordered by timestamp.
- **GET  /recordings/{id}**: Returns metadata for a specific recording.
- **GET  /audio-file/{id}**: Streams the audio binary for a stored recording.

Interactive API documentation (Swagger UI) is automatically available at `http://127.0.0.1:5000/docs`.

## Contributing

We welcome contributions to the CESTS project! To contribute:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes.
4. Submit a pull request with a detailed description of your changes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Acknowledgements

- **TensorFlow**: For building and training the deep learning model for sentiment analysis.
- **Whisper**: For audio transcription.
- **NLTK**: For sentiment analysis with the VADER sentiment analysis tool.
- **FFmpeg**: For processing audio and video files.

