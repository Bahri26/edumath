import React, { useState, useEffect, useRef } from 'react';

const FadeIn = ({ children, delay = 0, direction = 'up', className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        // Görünür olduğunda tetikle ve gözlemlemeyi bırak
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      });
    });

    const currentRef = domRef.current;
    if (currentRef) observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, []);

  // Yöne göre başlangıç animasyon sınıfını belirle
  const getTranslateClass = () => {
    if (!isVisible) {
      if (direction === 'up') return 'translate-y-20 opacity-0';
      if (direction === 'left') return '-translate-x-20 opacity-0';
      if (direction === 'right') return 'translate-x-20 opacity-0';
      if (direction === 'none') return 'opacity-0';
    }
    return 'translate-x-0 translate-y-0 opacity-100';
  };

  return (
    <div
      ref={domRef}
      className={`transition-all duration-1000 ease-out transform ${getTranslateClass()} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export default FadeIn;