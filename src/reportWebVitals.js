const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import("web-vitals").then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
      onCLS(onPerfEntry);
      onINP(onPerfEntry);
      onFCP(onPerfEntry);
      onLCP(onPerfEntry);
      onTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;

// LCP - Largest Content Paint
// measures the time take to load the largest component or content element to visible on the visualViewport
// INP - Interaction to Next Paint
// assesses a page's overall responsiveness to user interactions
// CLS - Cumulative Layout Shift
// measures amount of unexpected layout shift that occurs during page loading
