# 🎓 MiniProfessorAI
**The Academic Integrity Engine & 24/7 AI Teaching Assistant Platform**

## 📖 The Vision & Problem Statement
Generative AI forms a massive crisis in modern education: it replaces critical thinking with automated answers. Standard LLMs (like ChatGPT or Claude) and personal utilities (like Google's NotebookLM) are "student-controlled." This means a student can easily upload a lecture PDF and simply ask, *"Write my assignment for me based on this,"* and the AI will cheerfully comply. Professors are overwhelmed attempting to police plagiarism, while students lack authentic, late-night academic support.

**The Solution:** MiniProfessorAI flips the power dynamic. It is a B2B Academic Platform where **the Professor controls the AI**. Professors upload their curriculum, define strict teaching philosophies, set rigid boundaries (e.g., "NEVER write code for the student; use the Socratic method"), and deploy a 24/7 AI Teaching Assistant that enforces academic integrity while safely guiding the student.

---

## 🚀 Core Features & Capabilities

### 1. Instructor Persona & Boundary Enforcement (Few-Shot Inference)
- Professors define their specific teaching philosophy, tone, and strict rules via a dedicated Professor Dashboard.
- The system stores these as dynamic "System Prompt Directives" and utilizes Few-Shot In-Context Learning.
- If a student asks the AI to solve an assignment, the AI mathematically evaluates the Professor's rules and refuses to give the answer, instead shifting to a "Socratic Tutor" mode to guide the student conceptually.

### 2. Deep Context Retrieval Logging (Advanced Course RAG)
- Students do not chat with a raw LLM. They chat with an open-book intelligence that has ingested all course PDFs and materials.
- When answering questions, MiniProfessorAI uses true Semantic Search to synthesize vast concepts across multiple lectures.
- Most importantly, it actively provides exact **File Name and Page Number Citations**, proving its work and pushing students to open their lecture slides rather than blindly trusting the AI.

### 3. Voice Cloning (Parasocial Student Connection)
- The platform features Professor Voice Cloning utilizing the ElevenLabs API.
- The AI can deliver answers in the literal, natural voice of the specific professor teaching the course, greatly increasing the emotional connection and approachability of the platform for distance-learning or large-auditorium students.

### 4. The "Assignment Helper" (Anti-Plagiarism Flow)
- A dedicated workspace engineered solely to prevent cheating.
- When a student pastes a massive project prompt, the AI does *not* give them the architecture, the code, or the essay.
- Instead, it returns a structured breakdown:
  - **Suggested Framework:** A step-by-step unblocking guide.
  - **Key Concepts:** Exactly which PDF slides to review.
  - **Common Traps:** Warnings about common pitfalls (e.g., The CAP Theorem in Distributed Databases).
  - **Hints:** Gentle nudges mapping to the syllabus.

### 5. Automated Flashcards & Quizzes
- Automatically extracts entities and concepts from the Professor's uploaded PDFs and generates interactive flashcards and 5-question quizzes for immediate student retrieval practice.

### 6. Real-Time Professor Analytics
- Because the platform is multi-player, the AI tracks the aggregated conceptual struggles of the entire classroom. 
- It provides a dashboard to the Professor showing exactly which topics (e.g., "Zombie Processes" or "Data Mining") the class is asking the AI about the most, allowing the professor to pivot their next physical lecture accordingly.

---

## 🛠️ The Tech Stack Architecture

**Frontend:**
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Strict institutional design system mapping UWindsor Brand Colors: Cerulean Blue `#005596` & Gold `#FFCE00`)
- **State Management:** Zustand (SessionStorage implementation for multi-account concurrent operations)
- **UI/UX Engineering:** Premium "Bento Box" layouts, interactive micro-animations (`animate-float`), custom SVG generation, responsive grids.

**Backend & AI Pipeline:**
- **Framework:** FastAPI (Python)
- **Vector Database:** Qdrant (Used for high-speed semantic similarity searches on massive document embeddings)
- **Intelligence Orchestration:** Advanced Retrieval-Augmented Generation (RAG) pipeline
- **APIs:** ElevenLabs (for real-time emotional Voice Cloning and natural TTS streams)
- **Document Processing:** Automated chunking and embedding pipelines for massive PDF lecture ingestion.

---

## 🎯 The Ultimate Pitch
*"To put it simply: Generic LLMs are what students use when they want to cheat faster. MiniProfessorAI is what Universities use to stop them, while simultaneously giving every student a brilliant, 24/7 personalized tutor that literally speaks in their professor's voice."*
