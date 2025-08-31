import { useEffect } from "react";

export default function AdminNew() {
  useEffect(() => {
    // Force immediate render
    console.log("AdminNew component mounted");
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb'
    }}>
      {/* CRITICAL NAVIGATION - FORCED VISIBILITY */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        backgroundColor: '#ff0000',
        color: 'white',
        padding: '30px',
        textAlign: 'center',
        fontSize: '24px',
        fontWeight: 'bold',
        border: '5px solid #ffffff',
        boxShadow: '0 0 20px rgba(255,0,0,0.8)',
        width: '100%',
        display: 'block'
      }}>
        🚨 ADMIN SYSTEM NAVIGATION - CLICK LINKS BELOW 🚨
      </div>
      <div style={{
        position: 'fixed',
        top: '100px',
        left: 0,
        right: 0,
        zIndex: 99998,
        backgroundColor: '#0000ff',
        color: 'white',
        padding: '20px',
        display: 'flex',
        gap: '15px',
        justifyContent: 'center',
        flexWrap: 'wrap',
        border: '3px solid #ffffff',
        width: '100%'
      }}>
        <button 
          onClick={() => window.location.href = '/dashboard'} 
          style={{
            color: 'white', 
            backgroundColor: '#1d4ed8', 
            border: 'none', 
            padding: '15px 20px', 
            borderRadius: '8px', 
            fontSize: '16px', 
            cursor: 'pointer', 
            fontWeight: 'bold'
          }}
        >
          Dashboard
        </button>
        <button 
          onClick={() => window.location.href = '/tutorial'} 
          style={{
            color: 'white', 
            backgroundColor: '#1d4ed8', 
            border: 'none', 
            padding: '15px 20px', 
            borderRadius: '8px', 
            fontSize: '16px', 
            cursor: 'pointer', 
            fontWeight: 'bold'
          }}
        >
          Tutorial
        </button>
        <button 
          onClick={() => window.location.href = '/houses'} 
          style={{
            color: 'white', 
            backgroundColor: '#1d4ed8', 
            border: 'none', 
            padding: '15px 20px', 
            borderRadius: '8px', 
            fontSize: '16px', 
            cursor: 'pointer', 
            fontWeight: 'bold'
          }}
        >
          Houses
        </button>
        <button 
          onClick={() => window.location.href = '/pbis'} 
          style={{
            color: 'white', 
            backgroundColor: '#1d4ed8', 
            border: 'none', 
            padding: '15px 20px', 
            borderRadius: '8px', 
            fontSize: '16px', 
            cursor: 'pointer', 
            fontWeight: 'bold'
          }}
        >
          PBIS
        </button>
        <button 
          onClick={() => window.location.href = '/monthly-pbis'} 
          style={{
            color: 'white', 
            backgroundColor: '#1d4ed8', 
            border: 'none', 
            padding: '15px 20px', 
            borderRadius: '8px', 
            fontSize: '16px', 
            cursor: 'pointer', 
            fontWeight: 'bold'
          }}
        >
          Monthly Tracking
        </button>
        <button 
          onClick={() => window.location.href = '/pledge'} 
          style={{
            color: 'white', 
            backgroundColor: '#1d4ed8', 
            border: 'none', 
            padding: '15px 20px', 
            borderRadius: '8px', 
            fontSize: '16px', 
            cursor: 'pointer', 
            fontWeight: 'bold'
          }}
        >
          House Pledge
        </button>
        <button 
          onClick={() => window.location.href = '/parent-letter'} 
          style={{
            color: 'white', 
            backgroundColor: '#1d4ed8', 
            border: 'none', 
            padding: '15px 20px', 
            borderRadius: '8px', 
            fontSize: '16px', 
            cursor: 'pointer', 
            fontWeight: 'bold'
          }}
        >
          Parent Letter
        </button>
        <button 
          onClick={() => window.location.href = '/house-sorting'} 
          style={{
            color: 'white', 
            backgroundColor: '#1d4ed8', 
            border: 'none', 
            padding: '15px 20px', 
            borderRadius: '8px', 
            fontSize: '16px', 
            cursor: 'pointer', 
            fontWeight: 'bold'
          }}
        >
          House Sorting
        </button>
      </div>
      
      <div style={{marginTop: '200px', padding: '20px'}}>
        <h1>Administrator Dashboard</h1>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginTop: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{margin: '0 0 10px 0', color: '#1f2937'}}>Quick Actions</h3>
            <p style={{margin: '0 0 15px 0', color: '#6b7280'}}>Access main system functions</p>
            <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
              <button onClick={() => window.location.href = '/houses'} style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}>Manage Houses</button>
              <button onClick={() => window.location.href = '/pbis'} style={{
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}>PBIS System</button>
            </div>
          </div>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{margin: '0 0 10px 0', color: '#1f2937'}}>Navigation Working</h3>
            <p style={{margin: '0', color: '#059669'}}>✓ Navigation system is now operational</p>
            <p style={{margin: '5px 0 0 0', color: '#6b7280', fontSize: '14px'}}>
              Use the red navigation bar above to access all main system tabs
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}