import React, { forwardRef, useEffect, useState } from 'react';

// Small search input with debounce. Exposes focus via ref.
const SidebarSearch = forwardRef(function SidebarSearch({ onSearch }, ref) {
  const [value, setValue] = useState('');

  useEffect(() => {
    const id = setTimeout(() => {
      onSearch(value.trim());
    }, 150);
    return () => clearTimeout(id);
  }, [value, onSearch]);

  return (
    <div className="sidebar-search">
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ara veya Ctrl/Cmd+K"
        aria-label="Menüde ara"
      />
      {value && (
        <button className="sidebar-search-clear" onClick={() => setValue('')} aria-label="Temizle">✕</button>
      )}
    </div>
  );
});

export default SidebarSearch;
