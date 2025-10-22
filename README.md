# Translayze - Intelligent Content Processing & Translation Platform

Translayze is a comprehensive microservices-based platform designed to crawl, process, analyze, and translate content from various sources with intelligent AI-powered capabilities. The system specializes in handling Chinese content from platforms like Bilibili and provides automated translation, content analysis, and OCR processing.

## 🏗️ Architecture Overview

The platform consists of 5 microservices orchestrated via Docker Compose:

- **Backend Service** (Next.js) - Main dashboard and API gateway
- **Crawler Service** (Express.js) - Web scraping and content extraction
- **Data Persistence Service** (Express.js + MongoDB) - Database operations
- **DS Services** (Express.js + DeepSeek AI) - AI/ML processing and translation
- **Image OCR Service** (Flask + PaddleOCR) - Optical Character Recognition

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.8+ (for OCR service)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd translayze
```

2. **Start all services**
```bash
docker-compose up -d
```

3. **Access the application**
- Main Dashboard: http://localhost:3001
- Crawler Service: http://localhost:8003
- Data Persistence: http://localhost:8004
- DS Services: http://localhost:8002
- Image OCR: http://localhost:8001

## 📋 Microservices Documentation

### 1. Backend Service (Port 3001)

**Technology Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, BullMQ, Redis

**Purpose:** Main dashboard interface and API gateway that orchestrates all other services.

#### Key Features:
- **Modern React Dashboard**: Clean, responsive UI built with Next.js and Tailwind CSS
- **Job Queue Management**: Redis-based job queues using BullMQ for asynchronous processing
- **Content Search Interface**: Keyword-based article discovery and processing
- **Real-time Processing**: Live job status monitoring and progress tracking

#### API Endpoints:
- `POST /api/search` - Trigger content crawling and processing
- `POST /api/content-crawl/queue` - Queue content for crawling
- `POST /api/content-process/queue` - Queue content for processing
- `POST /api/content-translate/queue` - Queue content for translation
- `GET /api/queues/[name]` - Monitor job queue status

#### Core Components:
- **Home Page**: Search interface with keyword input and page limit selection
- **Article List**: Browse crawled and processed articles
- **Queue Monitoring**: Real-time job status and progress tracking
- **Article Viewer**: Display processed articles with translation options

#### Queue Workers:
- **Content Crawling Queue**: Processes URLs for content extraction
- **Content Processing Queue**: Handles OCR, cleaning, and analysis
- **Content Translation Queue**: Manages AI-powered translation

### 2. Crawler Service (Port 8003)

**Technology Stack:** Express.js, TypeScript, Puppeteer, Cheerio, Axios

**Purpose:** Specialized web scraping service for extracting content from various platforms.

#### Key Features:
- **Bilibili Integration**: Comprehensive support for Bilibili articles, user profiles, and search
- **Smart Content Extraction**: Handles complex HTML structures and media content
- **Image Proxy**: Secure image serving with proper headers and CORS handling
- **URL Conversion**: Converts Bilibili read URLs to opus URLs for better content access

#### Supported Platforms:
- **Bilibili Articles**: Full article content extraction with metadata
- **Bilibili Search**: Keyword-based article discovery
- **Bilibili User Profiles**: User article collections

#### API Endpoints:
- `GET /bilibili/crawl/article` - Extract individual article content
- `GET /bilibili/crawl/search` - Search articles by keyword
- `GET /bilibili/crawl/user-articles` - Extract user's article collection
- `GET /bilibili/convert-url` - Convert read URLs to opus URLs
- `GET /bilibili/proxy-image` - Proxy images with proper headers

#### Content Extraction Features:
- **Metadata Extraction**: Title, author, publication date, engagement metrics
- **Rich Content**: HTML content with images, formatting, and structure preservation
- **Engagement Metrics**: Likes, coins, favorites, forwards, comments
- **Image Processing**: Automatic image URL normalization and proxy setup

### 3. Data Persistence Service (Port 8004)

**Technology Stack:** Express.js, TypeScript, MongoDB, Mongoose

**Purpose:** Centralized database service managing all content, processing results, and translations.

#### Database Models:

**Content Model:**
```typescript
{
  title: string,
  author: string,
  url: string (unique),
  content: string,
  source: string,
  language: string,
  metadata: {
    crawledType: "manual" | "profile_auto" | "search_auto",
    crawledAt: Date,
    wordCount: number,
    hasImages: boolean,
    originalPubTime: Date,
    engagement: {
      likes: number,
      coins: number,
      favorites: number,
      forwards: number,
      comments: number
    }
  }
}
```

**ProcessedContent Model:**
```typescript
{
  originalContentId: ObjectId,
  title: string,
  author: string,
  url: string,
  summary: string,
  content: string (processed),
  language: string,
  source: string,
  status: "pending" | "completed" | "failed",
  metadata: {
    qualityScore: number,
    topic: string,
    crawledType: string,
    processedAt: Date,
    wordCount: number,
    processingVersion: number
  }
}
```

**Translation Model:**
```typescript
{
  processedContentId: ObjectId,
  targetLanguage: string,
  title: string,
  author: string,
  url: string,
  summary: string,
  content: string (translated),
  status: "pending" | "completed" | "failed",
  metadata: {
    qualityScore: number,
    crawledType: string,
    topic: string,
    wordCount: number,
    translatedAt: Date,
    translationProvider: string
  }
}
```

#### API Endpoints:
- `POST /api/content` - Create new content
- `GET /api/content/:id` - Get content by ID
- `GET /api/content/by-url` - Check content existence by URL
- `GET /api/content` - List content with pagination and filtering
- `POST /api/processed-content/:id` - Create processed content
- `GET /api/processed-content/:id` - Get processed content
- `POST /api/translation/:id` - Create translation
- `GET /api/translation/:id/:language` - Get translation by language
- `GET /api/topic/names` - Get available topic names

### 4. DS Services (Port 8002)

**Technology Stack:** Express.js, TypeScript, DeepSeek AI API, Cheerio

**Purpose:** AI-powered content processing, analysis, and translation service.

#### AI Capabilities:

**Content Processing:**
- **OCR Transformation**: Convert OCR results to structured HTML
- **Content Cleaning**: Remove inline styles and normalize HTML structure
- **Content Merging**: Combine OCR results with original content
- **Content Polishing**: Enhance content quality and readability

**Content Analysis:**
- **Summarization**: Generate concise summaries of articles
- **Topic Classification**: Categorize content into predefined topics
- **Quality Scoring**: Assess content quality and relevance
- **Content Analysis**: Deep analysis of content structure and meaning

**Translation Services:**
- **HTML Translation**: Preserve structure while translating content
- **Multi-language Support**: Translate to various target languages
- **Context Preservation**: Maintain formatting and structure during translation
- **Batch Processing**: Handle multiple translation requests efficiently

#### API Endpoints:
- `POST /api/transform-ocr` - Transform OCR data to HTML
- `POST /api/combine-ocr-html` - Combine multiple OCR results
- `POST /api/merge-ocr-html` - Merge OCR with original content
- `POST /api/translate-html` - Translate HTML content
- `POST /api/summarize` - Generate content summary
- `POST /api/analyze` - Analyze content quality and topics
- `POST /api/polish` - Polish and enhance content
- `POST /api/remove-styling` - Clean HTML styling

#### AI Prompts:
The service uses sophisticated prompts for:
- **Translation**: Structure-preserving HTML translation
- **Summarization**: Concise and accurate content summaries
- **Analysis**: Quality scoring and topic classification
- **OCR Processing**: Text extraction and formatting

### 5. Image OCR Service (Port 8001)

**Technology Stack:** Flask, Python, PaddleOCR, OpenCV, Pillow

**Purpose:** Optical Character Recognition service for extracting text from images.

#### OCR Capabilities:
- **Multi-language OCR**: Support for Chinese, English, and other languages
- **Image Processing**: Automatic image preprocessing and enhancement
- **Text Extraction**: Accurate text recognition with positioning data
- **Batch Processing**: Handle multiple images efficiently

#### Features:
- **PaddleOCR Integration**: Advanced OCR engine with high accuracy
- **Image Proxy**: Secure image serving with proper headers
- **Text Positioning**: Extract text with bounding box coordinates
- **Format Support**: Handle various image formats (JPEG, PNG, WebP)

#### API Endpoints:
- `POST /api/ocr` - Process OCR for article images
- `GET /api/proxy-image` - Proxy images with proper headers

#### OCR Processing Pipeline:
1. **Image Download**: Fetch images from URLs with proper headers
2. **Preprocessing**: Enhance image quality for better OCR results
3. **Text Detection**: Identify text regions in images
4. **Text Recognition**: Extract actual text content
5. **Result Formatting**: Structure results with positioning data

## 🔄 Processing Pipeline

### 1. Content Discovery
- User enters keywords in the dashboard
- System searches Bilibili for relevant articles
- Results are queued for processing

### 2. Content Crawling
- Crawler service extracts article content
- Metadata (title, author, engagement) is collected
- Content is stored in the database

### 3. Content Processing
- Images are extracted and sent to OCR service
- OCR results are transformed to HTML
- Original content is cleaned and normalized
- OCR and original content are merged
- Content is polished and enhanced

### 4. Content Analysis
- AI generates summaries
- Content is analyzed for quality and topics
- Processed content is stored with metadata

### 5. Translation
- Users can request translations to various languages
- AI translates content while preserving structure
- Translations are stored with source references

## 🛠️ Development

### Local Development Setup

1. **Backend Service**
```bash
cd backend
npm install
npm run dev
```

2. **Crawler Service**
```bash
cd crawler
npm install
npm run dev
```

3. **Data Persistence Service**
```bash
cd data-persistence
npm install
npm run dev
```

4. **DS Services**
```bash
cd ds-services
npm install
npm run dev
```

5. **Image OCR Service**
```bash
cd image-ocr
pip install -r requirements.txt
python app/main.py
```

### Environment Variables

**Backend Service:**
- `NEXT_PUBLIC_CRAWLER_URL` - Crawler service URL
- `NEXT_PUBLIC_DATA_PERSISTENCE_URL` - Data persistence service URL
- `NEXT_PUBLIC_OCR_URL` - OCR service URL
- `NEXT_PUBLIC_DS_URL` - DS services URL
- `REDIS_HOST` - Redis host
- `REDIS_PORT` - Redis port

**DS Services:**
- `DEEPSEEK_API_KEY` - DeepSeek AI API key

**Data Persistence:**
- `MONGODB_URI` - MongoDB connection string

## 📊 Monitoring & Observability

### Queue Monitoring
- Real-time job status tracking
- Progress monitoring for long-running tasks
- Error handling and retry mechanisms
- Job statistics and performance metrics

### Health Checks
- Service health endpoints
- Database connection monitoring
- External service availability checks

### Logging
- Structured logging across all services
- Error tracking and debugging information
- Performance metrics and timing data

## 🔧 Configuration

### Docker Compose Services
- **Redis**: Job queue and caching
- **MongoDB**: Primary database (cloud-hosted)
- **All Services**: Containerized with proper networking

### Service Dependencies
- Backend depends on all other services
- Services communicate via HTTP APIs
- Redis provides job queue coordination
- MongoDB stores all persistent data

## 🚀 Deployment

### Production Deployment
1. Set up environment variables
2. Configure MongoDB connection
3. Set up DeepSeek API key
4. Deploy with Docker Compose
5. Configure reverse proxy (optional)

### Scaling Considerations
- Horizontal scaling of worker services
- Redis clustering for high availability
- MongoDB replica sets for data redundancy
- Load balancing for API services

## 📈 Performance Features

- **Asynchronous Processing**: Non-blocking job queues
- **Parallel Processing**: Concurrent image OCR and content processing
- **Caching**: Redis-based caching for improved performance
- **Optimized Queries**: Efficient database queries with proper indexing
- **Resource Management**: Proper memory and CPU usage optimization

## 🔒 Security Features

- **Image Proxy**: Secure image serving with proper headers
- **CORS Configuration**: Proper cross-origin resource sharing
- **Input Validation**: Comprehensive input sanitization
- **Error Handling**: Secure error messages without sensitive data
- **API Rate Limiting**: Protection against abuse

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For issues and questions:
1. Check the documentation
2. Review existing issues
3. Create a new issue with detailed information
4. Contact the development team

---

**Translayze** - Intelligent content processing and translation platform powered by modern microservices architecture and AI technologies.
