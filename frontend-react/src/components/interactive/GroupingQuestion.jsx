import React from 'react';

export default function GroupingQuestion({ groups = [], items = [], readOnly = true }) {
  return (
    <div className="iq-grouping" style={{display:'flex',gap:'16px',flexWrap:'wrap'}}>
      {groups.map(g => (
        <div key={g.id} className="iq-group" style={{flex:'1 1 200px',background:'#f9fafb',border:'2px solid #e5e7eb',borderRadius:'12px',padding:'8px'}}>
          <div style={{fontWeight:700, marginBottom:'6px'}}>{g.name}</div>
          <div className="iq-bucket" style={{minHeight:'40px',fontSize:'0.85rem',opacity:0.7}}>
            {items.filter(i => i.groupId === g.id).map(i => (
              <div key={i.id} className="iq-chip" style={{display:'inline-block',background:'#eef2ff',padding:'4px 8px',borderRadius:'8px',margin:'2px'}}>{i.label}</div>
            ))}
          </div>
        </div>
      ))}
      {readOnly && (
        <div style={{ width: '100%', fontSize: '0.7rem', opacity: 0.6 }}>
          Önizleme. Öğrenci sürükleyip doğru gruplara yerleştirecek.
        </div>
      )}
    </div>
  );
}
