import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'

const SAMPLE_QUESTIONS = [
  { id: 1, stem: 'Bir sayının iki katı 14 ise sayı kaçtır?', type: 'multiple_choice', choices: ['6','7','8','9'], estimated_time_ms:20000 },
  { id: 2, stem: 'Aşağıdaki şekillerden hangisi simetrik değildir?', type: 'multiple_choice', choices: ['A','B','C','D'], estimated_time_ms:30000 },
  { id: 3, stem: '2,4,8,? bir sonraki sayı nedir?', type: 'open', estimated_time_ms:45000 }
]

export default function PreTest({ onFinish }) {
  const [questions, setQuestions] = useState([])
  const [index, setIndex] = useState(0)
  const [sessionId, setSessionId] = useState(null)
  const [anonId] = useState(uuidv4())
  const startTs = useRef(null)

  useEffect(() => {
    // try fetch questions from backend; fallback to sample
    axios.get('/api/v1/questions').then(r => {
      const rows = (r.data && r.data.rows) ? r.data.rows : r.data;
      if (Array.isArray(rows) && rows.length) {
        setQuestions(rows.map((q, i) => ({ id: q.id || i+1, stem: q.stem || q.question || 'Soru', type: q.type || 'multiple_choice', choices: q.choices || [] , estimated_time_ms: q.estimated_time_ms || 30000 })));
      } else setQuestions(SAMPLE_QUESTIONS);
    }).catch(() => setQuestions(SAMPLE_QUESTIONS));

    // create a session on backend
    axios.post('/api/sessions', { student_anon_id: anonId, session_type: 'pre' }).then(r => {
      const id = r.data && (r.data.id || r.data.insertId || r.data[0]);
      setSessionId(id || null);
    }).catch(() => setSessionId(null));
  }, [anonId])

  useEffect(() => { if (questions.length) startTs.current = Date.now(); }, [questions])

  if (!questions.length) return <div className="question-card">Soru yükleniyor...</div>

  const q = questions[index]

  function submitAnswer(answer) {
    const now = Date.now()
    const elapsed = startTs.current ? now - startTs.current : 0
    // prepare payload
    const payload = { question_id: q.id, response: String(answer || ''), response_time_ms: elapsed }
    // send to backend if session exists
    if (sessionId) {
      axios.post(`/api/sessions/${sessionId}/response`, payload).catch(err => console.warn('response send failed', err.message))
    } else {
      // try send without session
      axios.post('/api/responses', Object.assign({ session_id: null }, payload)).catch(()=>{})
    }
    // advance
    setIndex(i => i+1)
    startTs.current = Date.now()
    if (index + 1 >= questions.length) {
      if (onFinish) onFinish()
    }
  }

  return (
    <div className="question-card">
      <div className="meta">Soru {index+1} / {questions.length} — <span className="timer">Tahmini süre: {Math.round((q.estimated_time_ms||30000)/1000)}s</span></div>
      <div className="stem">{q.stem}</div>
      {q.type === 'multiple_choice' && (
        <div className="choices">
          {(q.choices || []).map((c, i) => (
            <button key={i} onClick={() => submitAnswer(c)}>{c}</button>
          ))}
        </div>
      )}
      {q.type === 'open' && (
        <OpenAnswer onSubmit={submitAnswer} />
      )}
    </div>
  )
}

function OpenAnswer({ onSubmit }) {
  const [v, setV] = useState('')
  return (
    <div style={{marginTop:12}}>
      <textarea value={v} onChange={e=>setV(e.target.value)} rows={4} style={{width:'100%'}} />
      <div style={{marginTop:8}}>
        <button onClick={() => onSubmit(v)}>Gönder</button>
      </div>
    </div>
  )
}
