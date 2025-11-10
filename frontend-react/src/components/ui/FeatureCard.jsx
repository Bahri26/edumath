import React from 'react';
import './FeatureCard.css';

/* Props:
 * icon: React node or emoji
 * title: string
 * description: string
 * accent: optional color token name
 */
export default function FeatureCard({ icon, title, description, accent='primary' }) {
  return (
    <div className={`featureCardKids accent-${accent}`}> 
      <div className="featureIconKids">{icon}</div>
      <div className="featureBodyKids">
        <h5>{title}</h5>
        <p>{description}</p>
      </div>
    </div>
  );
}
