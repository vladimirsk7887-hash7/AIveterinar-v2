import React from 'react';
import ReactDOM from 'react-dom/client';
import AdminApp from './AdminApp.jsx';
import './admin.css';

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return React.createElement('div', { style: { padding: 40, color: '#FF5252', fontFamily: 'monospace', fontSize: 14 } },
        React.createElement('h2', null, 'React Error'),
        React.createElement('pre', { style: { whiteSpace: 'pre-wrap', marginTop: 16 } }, this.state.error.toString()),
        React.createElement('button', { onClick: () => { localStorage.clear(); location.reload(); }, style: { marginTop: 16, padding: '8px 16px', background: '#7C4DFF', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' } }, 'Очистить и перезагрузить')
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <AdminApp />
  </ErrorBoundary>
);
