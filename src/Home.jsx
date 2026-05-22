import './App.css';

const Home = () => {

  return (
    <div className="home-container">
      <div className="card">
        {/* Logo Container - Responsive Width */}
        <div className="logo-wrapper">
          <img 
            src="/logo.png" 
            alt="Annapurna Plastocorp & Paperware" 
            className="logo-img"
          />
        </div>

        <h1 className="brand-title">Annapurna Plastocorp & Paperware</h1>
        <p className="brand-subtitle">Greener Choices, Better Tomorrow</p>
           
        {/* Action Buttons */}
        <div className="button-group">
          <button onClick={() => window.location.href = '/register'} className="btn-sakhi">
            <span className="icon">📝</span> Register
          </button>
          <button onClick={() => window.location.href = '/login'} className="btn-sakhi">
            <span className="icon">🔐</span> Login
          </button>
        </div>
        
        <footer className="card-footer">
          <p>Secure phone verification • OTP Protected</p>
        </footer>
      </div>
    </div>
  );
};

export default Home;