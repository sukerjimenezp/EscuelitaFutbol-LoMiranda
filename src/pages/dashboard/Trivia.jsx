import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../data/AuthContext';
import { supabase } from '../../lib/supabase';
import { 
  Trophy, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  Zap, 
  AlertTriangle,
  History,
  Timer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfWeek } from 'date-fns';
import './Trivia.css';

const Trivia = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [sessionsPlayed, setSessionsPlayed] = useState(0);
  const [gameState, setGameState] = useState('loading'); // loading, idle, playing, result, finished
  const [score, setScore] = useState(0);
  const [lastReward, setLastReward] = useState(null);
  const [riskyMode, setRiskyMode] = useState(false);

  const fetchTriviaData = useCallback(async () => {
    if (!user) return;

    // 1. Check sessions this week
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const { count } = await supabase
      .from('trivia_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('week_start', weekStart);
    
    setSessionsPlayed(count || 0);

    if (count >= 2) {
      setGameState('finished');
      return;
    }

    // 2. Fetch questions for age category
    // Based on category_id we estimate age for simplicity or look it up
    // Sub-6: 4-6, Sub-10: 9-10, etc.
    const { data: qData } = await supabase
      .from('trivia_questions')
      .select('*');
      // Filter logic in JS for better control or via SQL
    
    setQuestions(qData?.sort(() => Math.random() - 0.5).slice(0, 5) || []);
    setGameState('idle');
  }, [user]);

  useEffect(() => {
    fetchTriviaData();
  }, [fetchTriviaData]);

  const handleStart = () => {
    setGameState('playing');
    setCurrentQuestionIdx(0);
    setScore(0);
    setRiskyMode(false);
  };

  const handleAnswer = async (index) => {
    const isCorrect = index === questions[currentQuestionIdx].correct_index;
    let pointsEarned = isCorrect ? questions[currentQuestionIdx].reward_points : 0;

    if (riskyMode) {
      if (isCorrect) pointsEarned *= 2;
      else {
        // Lose points logic for Sub-12+
        const olderCategories = ['sub12', 'sub14', 'sub16', 'adultos'];
        if (olderCategories.includes(user.category_id)) {
          pointsEarned = -20; // Lose 20 points
        } else {
          pointsEarned = 0; // Just lose the bonus for little ones
        }
      }
    }

    setScore(prev => prev + pointsEarned);
    
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
      setRiskyMode(false); // Reset risky mode for next question
    } else {
      await finalizeTrivia(score + pointsEarned);
    }
  };

  const finalizeTrivia = async (finalScore) => {
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    
    // 1. Save session
    await supabase.from('trivia_sessions').insert({
      user_id: user.id,
      week_start: weekStart
    });

    // 2. Update user points
    const { data: profile } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', user.id)
      .single();
    
    const newTotal = (profile?.points || 0) + finalScore;
    
    await supabase
      .from('profiles')
      .update({ points: Math.max(0, newTotal) })
      .eq('id', user.id);

    setLastReward(finalScore);
    setGameState('result');
  };

  if (gameState === 'loading') return <div className="trivia-loading glass">Cargando desafío...</div>;

  return (
    <div className="trivia-page">
      <div className="page-header">
        <div className="header-info">
          <h1 className="dash-title">Desafío <span className="text-sky">Trivia</span></h1>
          <p className="dash-subtitle">Pon a prueba tu conocimiento y gana puntos para tu colección.</p>
        </div>
        <div className="trivia-status glass">
          <History size={18} className="text-sky" />
          <span>Intentos esta semana: <strong>{sessionsPlayed}/2</strong></span>
        </div>
      </div>

      <div className="trivia-container glass">
        <AnimatePresence mode="wait">
          {gameState === 'idle' && (
            <motion.div 
              key="idle"
              className="trivia-start-view"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              <Trophy size={64} className="text-yellow bounce" />
              <h2>¿Listo para el desafío?</h2>
              <p>Responde 5 preguntas sobre fútbol y la escuela para ganar puntos.</p>
              <div className="trivia-rules">
                <div className="rule"><CheckCircle2 size={16} /> +20 pts por respuesta correcta</div>
                <div className="rule"><Zap size={16} /> Modo "Duplicar o Muerte" disponible</div>
                {['sub12', 'sub14', 'sub16', 'adultos'].includes(user?.category_id) && (
                  <div className="rule danger"><AlertTriangle size={16} /> Perderás puntos si fallas en modo Riesgo</div>
                )}
              </div>
              <button className="btn-primary start-btn" onClick={handleStart}>
                ¡Comenzar Desafío!
              </button>
            </motion.div>
          )}

          {gameState === 'playing' && questions.length > 0 && (
            <motion.div 
              key="playing"
              className="trivia-question-view"
              initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
            >
              <div className="question-header">
                <span className="question-count">Pregunta {currentQuestionIdx + 1} de 5</span>
                <span className="current-score">Puntos ganados: {score}</span>
              </div>

              <h2 className="question-text">{questions[currentQuestionIdx].question}</h2>

              <div className="options-grid">
                {questions[currentQuestionIdx].options.map((option, i) => (
                  <button key={i} className="option-btn" onClick={() => handleAnswer(i)}>
                    {option}
                  </button>
                ))}
              </div>

              <div className={`risky-toggle-box ${riskyMode ? 'active' : ''}`}>
                <div className="risky-info">
                  <Zap size={20} />
                  <div>
                    <strong>Modo Duplicar o Muerte</strong>
                    <p>{riskyMode ? '¡Ojo! Puntos x2 si aciertas, pero riesgo total si fallas.' : '¿Te sientes con suerte?'}</p>
                  </div>
                </div>
                <button 
                  className={`risky-btn ${riskyMode ? 'active' : ''}`}
                  onClick={() => setRiskyMode(!riskyMode)}
                >
                  {riskyMode ? 'DESACTIVAR RIESGO' : 'ACTIVAR RIESGO X2'}
                </button>
              </div>
            </motion.div>
          )}

          {gameState === 'result' && (
            <motion.div 
              key="result"
              className="trivia-result-view"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            >
              <CheckCircle2 size={80} className="text-green" />
              <h2>¡Desafío Completado!</h2>
              <div className="final-reward">
                <span className="reward-label">Has ganado:</span>
                <span className="reward-value">+{lastReward} PUNTOS</span>
              </div>
              <button className="btn-primary" onClick={() => window.location.reload()}>
                Volver al Panel
              </button>
            </motion.div>
          )}

          {gameState === 'finished' && (
            <motion.div 
              key="finished"
              className="trivia-finished-view"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            >
              <Timer size={64} className="text-muted" />
              <h2>Vuelve el próximo Lunes</h2>
              <p>Ya has agotado tus 2 intentos de esta semana. Entrena duro para estar listo para el próximo desafío.</p>
              <button className="btn-secondary" onClick={() => window.location.href = '/dashboard'}>
                Volver al Dashboard
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Trivia;
