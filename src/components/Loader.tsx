import React from 'react';

interface LoaderProps {
  className?: string;
}

const Loader: React.FC<LoaderProps> = ({ className = '' }) => {
  return (
    <section className={`loader ${className}`}>
      <div>
        <div>
          <span className="one h6"></span>
          <span className="two h3"></span>
        </div>
      </div>

      <div>
        <div>
          <span className="one h1"></span>
        </div>
      </div>

      <div>
        <div>
          <span className="two h2"></span>
        </div>
      </div>
      <div>
        <div>
          <span className="one h4"></span>
        </div>
      </div>
    </section>
  );
};

export default Loader;