import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import './Toast.css';

// ── Contexto global para lanzar toasts desde cualquier componente ──
let toastDispatch = () => {};

export const showToast = (message, type = 'success', duration = 3500) => {
  toastDispatch(message, type, duration);
};

export const showConfirm = (message, onConfirm, onCancel) => {
  toastDispatch(message, 'confirm', 0, onConfirm, onCancel);
};

const ICONS = {
  success: <CheckCircle size={28} />,
  error:   <XCircle size={28} />,
  warning: <AlertTriangle size={28} />,
  info:    <Info size={28} />,
  confirm: <AlertTriangle size={28} />,
};

const Toast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3500, onConfirm = null, onCancel = null) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration, onConfirm, onCancel }]);

    if (type !== 'confirm' && duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  useEffect(() => {
    toastDispatch = addToast;
  }, [addToast]);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleConfirm = (toast) => {
    if (toast.onConfirm) toast.onConfirm();
    removeToast(toast.id);
  };

  const handleCancel = (toast) => {
    if (toast.onCancel) toast.onCancel();
    removeToast(toast.id);
  };

  return (
    <>
      {/* Overlay oscuro para confirms */}
      <AnimatePresence>
        {toasts.some(t => t.type === 'confirm') && (
          <motion.div
            className="toast-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      {/* Toasts normales (esquina superior derecha) */}
      <div className="toast-container">
        <AnimatePresence>
          {toasts.filter(t => t.type !== 'confirm').map(toast => (
            <motion.div
              key={toast.id}
              className={`toast-item toast-${toast.type}`}
              initial={{ opacity: 0, x: 80, scale: 0.85 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            >
              <div className="toast-icon">{ICONS[toast.type]}</div>
              <div className="toast-content">
                <p className="toast-message">{toast.message}</p>
              </div>
              <button className="toast-close" onClick={() => removeToast(toast.id)}>
                <X size={16} />
              </button>
              <motion.div
                className="toast-progress"
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: toast.duration / 1000, ease: 'linear' }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Confirm dialog (centrado tipo SweetAlert) */}
      <AnimatePresence>
        {toasts.filter(t => t.type === 'confirm').map(toast => (
          <motion.div
            key={toast.id}
            className="toast-confirm-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="toast-confirm-dialog"
              initial={{ opacity: 0, scale: 0.7, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.7, y: 30 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            >
              <div className="confirm-icon-wrapper">
                <div className="confirm-icon-circle">
                  <AlertTriangle size={36} />
                </div>
              </div>
              <h3 className="confirm-title">¿Estás seguro?</h3>
              <p className="confirm-message">{toast.message}</p>
              <div className="confirm-actions">
                <button className="confirm-btn confirm-btn-cancel" onClick={() => handleCancel(toast)}>
                  Cancelar
                </button>
                <button className="confirm-btn confirm-btn-ok" onClick={() => handleConfirm(toast)}>
                  Sí, confirmar
                </button>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
    </>
  );
};

export default Toast;
