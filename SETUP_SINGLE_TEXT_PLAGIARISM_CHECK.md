# Single Text Plagiarism Check Feature - Setup Guide

This guide covers the complete implementation of the **Single Text Plagiarism Check** feature, which performs sentence-level plagiarism detection using a hybrid system (FAISS + Wikipedia).

---

## 📋 Overview

The feature allows users to:
1. Paste a large paragraph/essay into a textarea
2. Click "Check Plagiarism"
3. Get sentence-level plagiarism analysis showing:
   - Overall plagiarism percentage
   - Sentence-level similarity scores
   - Matched sources (Local FAISS DB or Wikipedia)
   - Visual highlighting (red for plagiarized, green for original)

---

## 🚀 Installation & Setup

### Backend Setup

#### 1. Install New Dependencies

```bash
cd "/home/fardeen-akmal/Downloads/Plagiarism Detector/Plagiarism Detector"

# Install all requirements
pip install -r requirements.txt

# Or, if you prefer to install only new packages:
pip install faiss-cpu==1.7.4 nltk==3.8.1 requests==2.31.0 sentence-transformers==3.1.1 torch==2.4.1
```

**Note**: If `faiss-cpu` installation fails, try:
```bash
pip install faiss-cpu --no-cache-dir
# Or use faiss-gpu if you have CUDA available
```

#### 2. NLTK Data (Optional but Recommended)

The sentence splitter in `text_plagiarism_check.py` uses regex-based splitting, but if you want NLTK punkt tokenizer:

```bash
python -c "import nltk; nltk.download('punkt')"
```

### Frontend Setup

The frontend is already updated. No additional npm packages needed since we use existing dependencies (React, Framer Motion, Tailwind CSS).

---

## 📁 File Structure

### Backend Files Created/Modified

```
backend/
├── services/
│   ├── faiss_index.py                    [NEW] FAISS index management
│   ├── text_plagiarism_check.py         [NEW] Sentence-level plagiarism checker
│   └── ...
├── models/
│   └── schemas.py                        [MODIFIED] Added new schemas
├── api/
│   └── routes.py                         [MODIFIED] Added /check-plagiarism-text endpoint
└── ...
```

### Frontend Files Created/Modified

```
frontend/src/
├── pages/
│   ├── SingleTextCheckPage.jsx           [NEW] Main page component
│   └── ...
├── components/
│   ├── SingleTextResultDisplay.jsx       [NEW] Result display component
│   └── ...
├── lib/
│   └── api.js                            [MODIFIED] Added checkPlagiarismText function
└── App.jsx                               [MODIFIED] Added /check route
```

---

## 🔧 Backend Implementation Details

### 1. **FAISS Index Service** (`backend/services/faiss_index.py`)

**Key Features**:
- Manages FAISS IndexFlatIP (Inner Product similarity)
- Auto-creates demo index with 5 sample documents if none exists
- Loads/saves index from disk (`backend/storage/faiss_index/`)
- Supports adding new documents dynamically

**Usage**:
```python
from backend.services.faiss_index import get_faiss_index

index = get_faiss_index()
# Search for similar embeddings
results = index.search(query_embedding, top_k=5)
# Results: [(doc_id, similarity_score, title), ...]

# Add new document
index.add_document(
    doc_id="new_doc",
    title="Document Title",
    text="Document text...",
    embedding=embedding_vector,
    source="Custom Source"
)
```

**Similarity Threshold**:
- Plagiarized: > 0.75
- Suspicious: > 0.65

---

### 2. **Text Plagiarism Checker** (`backend/services/text_plagiarism_check.py`)

**Key Features**:
- Splits text into sentences using regex
- Generates embeddings using `sentence-transformers` (all-MiniLM-L6-v2 model)
- Searches FAISS index for similar sentences
- Queries Wikipedia API for real-time matches
- Returns detailed sentence-level results

**Method Breakdown**:

```python
checker = get_text_plagiarism_checker()

# Check entire text
result = checker.check_text(
    text="Your text here",
    skip_wikipedia=False  # Set True for faster processing
)

# Result structure:
{
    'plagiarism_percentage': float,
    'classification': 'Original' | 'Suspicious' | 'Plagiarized',
    'total_sentences': int,
    'plagiarized_sentences': int,
    'sentences': [
        {
            'text': str,
            'similarity': float,
            'is_plagiarized': bool,
            'sources': [
                {
                    'title': str,
                    'similarity': float,
                    'source': 'Wikipedia' | 'Local Database'
                },
                ...
            ],
            'source_types': ['Wikipedia', 'Local Database']
        },
        ...
    ]
}
```

---

### 3. **New API Endpoint** (`backend/api/routes.py`)

**Endpoint**: `POST /api/v1/check-plagiarism-text`

**Request Body**:
```json
{
    "text": "Your paragraph or essay here (50-50000 characters)",
    "skip_wikipedia": false
}
```

**Response**:
```json
{
    "plagiarism_percentage": 25.5,
    "classification": "Original",
    "total_sentences": 10,
    "plagiarized_sentences": 2,
    "sentences": [
        {
            "text": "This is the first sentence.",
            "similarity": 0.82,
            "is_plagiarized": true,
            "sources": [
                {
                    "title": "Wikipedia Article",
                    "similarity": 0.82,
                    "source": "Wikipedia"
                }
            ],
            "source_types": ["Wikipedia"]
        },
        ...
    ]
}
```

---

## 🎨 Frontend Implementation Details

### 1. **SingleTextCheckPage** (`frontend/src/pages/SingleTextCheckPage.jsx`)

**Features**:
- Large textarea for user input
- Option to skip Wikipedia for faster processing
- Character counter (50-50000 limit)
- Real-time error handling
- Responsive design with Tailwind CSS
- Framer Motion animations

**Props**: None (standalone page)

### 2. **SingleTextResultDisplay** (`frontend/src/components/SingleTextResultDisplay.jsx`)

**Features**:
- Summary card with plagiarism percentage and classification
- Statistics grid (total, plagiarized, original sentences)
- Expandable sentence cards showing sources
- Color-coded sentences:
  - **Red**: Plagiarized (>75% similarity)
  - **Green**: Original (<65% similarity)
- Source information display
- Recommendations based on plagiarism level
- Smooth animations using Framer Motion

**Props**:
```javascript
{
    result: {
        plagiarism_percentage: number,
        classification: string,
        total_sentences: number,
        plagiarized_sentences: number,
        sentences: array
    },
    originalText: string
}
```

### 3. **Updated Routes** (`frontend/src/App.jsx`)

**New Route**: `/check` - Single text plagiarism check page

**Navigation Link**: Added "Quick Check" in header navbar

---

## 🔌 API Integration

### Frontend to Backend Flow

```
User Input (textarea)
        ↓
    handleSubmit()
        ↓
    checkPlagiarismText(payload)  [API call]
        ↓
    POST /api/v1/check-plagiarism-text
        ↓
    Backend processing:
        1. Split sentences
        2. Generate embeddings
        3. Search FAISS
        4. Query Wikipedia
        5. Compile results
        ↓
    Return TextPlagiarismCheckResponse
        ↓
    setResult(response)
        ↓
    SingleTextResultDisplay
        ↓
    User sees results
```

---

## 🎯 Key Algorithms

### Sentence Splitting
```
Regex Pattern: r'(?<=[.!?])\s+(?=[A-Z])|[\n\r]+'
Split on:
- Period/Question/Exclamation followed by space and capital letter
- Newlines/carriage returns
```

### Similarity Calculation
- **FAISS**: Inner Product (IP) similarity on normalized embeddings
- **Embedding Model**: `all-MiniLM-L6-v2` (384-dimensional vectors)
- **Wikipedia**: Keyword matching + snippet analysis

### Classification Logic
```
Plagiarism % > 50%  → "Plagiarized"
Plagiarism % > 25%  → "Suspicious"
Plagiarism % ≤ 25%  → "Original"
```

---

## 📊 Performance Optimization

### 1. **Batch Embeddings**
Embeddings are generated once per sentence using efficient batch processing in sentence-transformers.

### 2. **FAISS Optimization**
- IndexFlatIP for fast similarity search
- Top-k results limited to 3 per sentence
- Normalized embeddings for better performance

### 3. **Wikipedia Rate Limiting**
- Only query Wikipedia for sentences with >3 words
- Max 2 Wikipedia results per sentence
- Timeout: 5 seconds per query

### 4. **Caching** (Optional Future Enhancement)
```python
# Could add Redis caching for repeated queries
@cached(cache=TTLCache(maxsize=1000, ttl=3600))
def check_sentence_plagiarism(sentence):
    ...
```

---

## 🧪 Testing the Feature

### 1. Start Backend

```bash
cd "/home/fardeen-akmal/Downloads/Plagiarism Detector/Plagiarism Detector"
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Start Frontend

```bash
cd frontend
npm install  # if not done
npm run dev
```

### 3. Test the Endpoint

**cURL Example**:
```bash
curl -X POST http://localhost:8000/api/v1/check-plagiarism-text \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Machine learning is a subset of artificial intelligence that enables computers to learn from data without being explicitly programmed. Deep learning is a method based on learning representations of data with multiple levels of abstraction.",
    "skip_wikipedia": false
  }'
```

**Postman**:
1. Create POST request to `http://localhost:8000/api/v1/check-plagiarism-text`
2. Headers: `Content-Type: application/json`
3. Body:
```json
{
  "text": "Your test text here...",
  "skip_wikipedia": false
}
```

### 4. Frontend Test Flow

1. Navigate to `http://localhost:5173/check`
2. Paste sample text (50+ characters)
3. Click "Check for Plagiarism"
4. View results with sentence highlighting
5. Click on plagiarized sentences to expand and see sources

---

## ⚙️ Configuration

### Environment Variables (Optional)

Create `.env` file in backend directory:
```
API_PREFIX=/api/v1
SIMILARITY_THRESHOLD_PLAGIARIZED=0.75
SIMILARITY_THRESHOLD_SUSPICIOUS=0.65
WIKIPEDIA_API_TIMEOUT=5
FAISS_INDEX_PATH=./backend/storage/faiss_index
```

### Adjusting Thresholds

Edit `backend/services/text_plagiarism_check.py`:
```python
class TextPlagiarismChecker:
    PLAGIARISM_THRESHOLD = 0.75      # Adjust as needed
    SUSPICIOUS_THRESHOLD = 0.65      # Adjust as needed
```

---

## 🐛 Troubleshooting

### Issue: FAISS not found
```
ImportError: No module named 'faiss'
```
**Solution**:
```bash
pip install faiss-cpu==1.7.4 --no-cache-dir
```

### Issue: Sentence Transformers download fails
```
Connection timeout downloading model
```
**Solution**:
Download model manually:
```bash
python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"
```

### Issue: API returns 400 error
Check request body:
- `text` field must be 50-50000 characters
- `skip_wikipedia` must be boolean (true/false)

### Issue: Wikipedia results not showing
- Check internet connection
- Verify Wikipedia API is accessible
- Check 5-second timeout isn't being exceeded

---

## 📈 Future Enhancements

1. **Custom FAISS Index Loading**
   - Support loading pre-trained indexes from PAN datasets
   - Batch index building from document collections

2. **Advanced Caching**
   - Redis cache for embedding results
   - TTL-based cache invalidation

3. **Batch Processing**
   - Support for multiple documents
   - Background processing with job queue

4. **Export Features**
   - PDF report generation
   - JSON export with detailed metadata

5. **Machine Learning Integration**
   - Fine-tuned embedding models
   - Confidence scoring improvements

6. **More Data Sources**
   - Google Scholar integration
   - ResearchGate API
   - ArXiv integration

---

## 📚 Code Quality & Standards

### Backend
- ✅ Type hints for all functions
- ✅ Comprehensive logging
- ✅ Error handling with meaningful messages
- ✅ Modular service architecture
- ✅ Dependency injection pattern

### Frontend
- ✅ React hooks (useState, useEffect)
- ✅ Component composition
- ✅ Framer Motion animations
- ✅ Tailwind CSS styling
- ✅ Responsive design (mobile-first)

---

## 📝 API Documentation

### Health Check
```
GET /api/v1/health
Response: {"status": "ok"}
```

### Single Text Plagiarism Check
```
POST /api/v1/check-plagiarism-text

Request:
{
  "text": "string (50-50000 chars)",
  "skip_wikipedia": "boolean"
}

Response:
{
  "plagiarism_percentage": "float",
  "classification": "string",
  "total_sentences": "int",
  "plagiarized_sentences": "int",
  "sentences": [...]
}
```

---

## 🚢 Deployment

### Docker Deployment

Backend service already has Dockerfile. For the new feature:

1. Ensure `requirements.txt` includes new packages (already done)
2. Build image:
```bash
docker build -f backend/Dockerfile -t plagiarism-detector-backend .
```

3. Run container:
```bash
docker run -p 8000:8000 plagiarism-detector-backend
```

### Docker Compose

Update `docker-compose.yml` if needed (should work as-is).

---

## 📞 Support & Contact

For issues or questions:
1. Check logs in `backend.log` and `app.log`
2. Review error messages in frontend console (F12)
3. Test with cURL before debugging frontend
4. Verify API endpoint matches version (v1)

---

**Happy Plagiarism Checking!** ✓
