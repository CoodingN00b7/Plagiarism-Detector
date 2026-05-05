# Single Text Plagiarism Check - Quick Start Guide

## 🎯 30-Second Setup

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Start backend
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

# 3. Start frontend (in another terminal)
cd frontend
npm install
npm run dev

# 4. Visit http://localhost:5173/check
```

---

## 💻 Quick API Test

**Using cURL**:
```bash
curl -X POST http://localhost:8000/api/v1/check-plagiarism-text \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Machine learning is a subset of artificial intelligence. It enables systems to learn and improve from experience without being explicitly programmed.",
    "skip_wikipedia": false
  }'
```

**Response Example**:
```json
{
  "plagiarism_percentage": 45.5,
  "classification": "Suspicious",
  "total_sentences": 2,
  "plagiarized_sentences": 1,
  "sentences": [
    {
      "text": "Machine learning is a subset of artificial intelligence.",
      "similarity": 0.82,
      "is_plagiarized": true,
      "sources": [
        {
          "title": "Introduction to Machine Learning",
          "similarity": 0.82,
          "source": "Local Database"
        }
      ],
      "source_types": ["Local Database"]
    },
    {
      "text": "It enables systems to learn and improve from experience without being explicitly programmed.",
      "similarity": 0.52,
      "is_plagiarized": false,
      "sources": [],
      "source_types": []
    }
  ]
}
```

---

## 🗂️ File Reference

| File | Purpose |
|------|---------|
| `backend/services/faiss_index.py` | FAISS index management |
| `backend/services/text_plagiarism_check.py` | Plagiarism detection logic |
| `backend/api/routes.py` | FastAPI endpoint |
| `backend/models/schemas.py` | Request/response schemas |
| `frontend/src/pages/SingleTextCheckPage.jsx` | Main page UI |
| `frontend/src/components/SingleTextResultDisplay.jsx` | Results display |
| `frontend/src/lib/api.js` | API client function |
| `frontend/src/App.jsx` | Router configuration |

---

## 🔑 Key Features Implemented

✅ **Sentence-level plagiarism detection**
✅ **FAISS local database search**
✅ **Wikipedia API integration**
✅ **Real-time similarity scoring**
✅ **Visual highlighting (red/green)**
✅ **Expandable source information**
✅ **Responsive mobile UI**
✅ **Classification (Original/Suspicious/Plagiarized)**

---

## 📦 New Dependencies Added

- `faiss-cpu==1.7.4` - Vector similarity search
- `sentence-transformers==3.1.1` - Embedding generation
- `nltk==3.8.1` - Text processing
- `requests==2.31.0` - Wikipedia API calls
- `torch==2.4.1` - Deep learning backend

---

## 🎨 UI Colors & Styling

- **Plagiarized** (>75%): Red background `bg-red-950/20`
- **Suspicious** (25-75%): Yellow background `bg-yellow-950/20`
- **Original** (<25%): Green background `bg-green-950/20`
- **Highlights**: Green checkmark ✓ for original, Red circle ● for plagiarized

---

## 📊 Data Flow

```
User Input Text
    ↓
[Sentence Splitting] - Regex based
    ↓
[Embedding Generation] - sentence-transformers
    ↓
[FAISS Search] - Top 3 similar documents
    ↓
[Wikipedia Search] - Real-time API queries
    ↓
[Similarity Scoring] - Cosine similarity
    ↓
[Classification] - Plagiarized/Suspicious/Original
    ↓
Display Results with Highlighting
```

---

## 🚨 Error Handling

**Validation Rules**:
- Text minimum: 50 characters
- Text maximum: 50,000 characters
- Wikipedia timeout: 5 seconds per query
- FAISS similarity threshold: 0.75 (plagiarized)

**Common Errors**:
| Error | Cause | Fix |
|-------|-------|-----|
| `400 Bad Request` | Text too short/long | Use 50-50000 chars |
| `500 Server Error` | FAISS not initialized | Run: `pip install faiss-cpu` |
| `Wikipedia timeout` | Slow internet | Set `skip_wikipedia: true` |
| `Import Error` | Missing dependency | Run: `pip install -r requirements.txt` |

---

## 🔧 Configuration Options

**In `text_plagiarism_check.py`**:
```python
class TextPlagiarismChecker:
    PLAGIARISM_THRESHOLD = 0.75      # Can adjust
    SUSPICIOUS_THRESHOLD = 0.65      # Can adjust
    
    def search_wikipedia(self, query: str, max_results: int = 3):
        # Can adjust max_results
        ...
```

**In API endpoint**:
```python
# Skip Wikipedia for faster results
result = checker.check_text(
    text=request.text,
    skip_wikipedia=True  # Faster but less comprehensive
)
```

---

## 🧪 Testing Samples

**Test Case 1 - Plagiarized Text**:
```
"Machine learning is a subset of artificial intelligence that enables computers to learn from data."
```

**Test Case 2 - Original Text**:
```
"The quick brown fox jumps over the lazy dog and runs through the forest."
```

**Test Case 3 - Mixed Content**:
```
"Artificial intelligence is fascinating. Deep learning uses neural networks. The weather is nice today."
```

---

## 📱 Responsive Design Features

- ✅ Mobile-first design
- ✅ Touch-friendly buttons
- ✅ Responsive grid layouts
- ✅ Readable text sizes
- ✅ Scrollable result areas
- ✅ Expandable sections

---

## 🚀 Performance Tips

1. **Use `skip_wikipedia: true`** for faster results (local DB only)
2. **Keep sentences < 100 words** for optimal processing
3. **Batch process** multiple documents if needed
4. **Cache results** using Redis (future enhancement)

---

## 📚 API Endpoints Summary

```
POST   /api/v1/check-plagiarism-text     [NEW] Single text check
POST   /api/v1/check                     [EXISTING] Document comparison
GET    /api/v1/report/{id}               [EXISTING] Get report
GET    /api/v1/health                    [EXISTING] Health check
```

---

## 🔗 Frontend Routes

```
/                   Home page
/check             Single Text Check [NEW]
/result/:reportId  Results page
/dashboard         Dashboard
```

---

## ✨ UI Components

**New Components**:
- `SingleTextCheckPage` - Main input page
- `SingleTextResultDisplay` - Results visualization

**Used Components**:
- Tailwind CSS for styling
- Framer Motion for animations
- React Router for navigation

---

## 🎯 Next Steps

1. ✅ Install dependencies
2. ✅ Start backend server
3. ✅ Start frontend dev server
4. ✅ Navigate to `/check` page
5. ✅ Test with sample text
6. ✅ Review results
7. ✅ Customize thresholds if needed
8. ✅ Deploy to production

---

**Ready to use!** 🎉

For detailed setup instructions, see `SETUP_SINGLE_TEXT_PLAGIARISM_CHECK.md`
