import { useEffect, useRef, useState } from "react";

import { FaTools } from "react-icons/fa";
import { FaUsers } from "react-icons/fa";
import { FaUserCheck } from "react-icons/fa";
import { FaList } from "react-icons/fa";

// eslint-disable-next-line no-unused-vars
function StatItem({ number, label, Icon }) {
  const ref = useRef(null);
  const [count, setCount] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );

    if (ref.current) {
      observer.observe(ref.current);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    let duration = 2000;
    let startTime = null;

    function animate(timestamp) {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const current = Math.min(
        Math.floor((progress / duration) * number),
        number,
      );
      setCount(current);
      if (progress < duration) {
        requestAnimationFrame(animate);
      }
    }
    requestAnimationFrame(animate);
  }, [visible, number]);

  return (
    <div className="stat-card" ref={ref}>
      <div className="stat-icon">
        <Icon />
      </div>
      <h2>{count.toLocaleString()}+</h2>
      <p>{label}</p>
    </div>
  );
}

export default function Stats() {
  return (
    <section className="stats" data-aos="fade-up">
      <div className="container stats-grid">
        <StatItem number={10000} label="Services Completed" Icon={FaTools} />
        <StatItem number={5000} label="Happy Customers" Icon={FaUsers} />
        <StatItem
          number={250}
          label="Verified Professionals"
          Icon={FaUserCheck}
        />
        <StatItem number={15} label="Service Categories" Icon={FaList} />
      </div>
    </section>
  );
}

// import CountUp from "react-countup"

// export default function Stats(){

//   return(
//     <section className="stats">
//       <div className="container stats-grid">
//           <div className="stat-card">
//             <h2><CountUp end={10000} duration={3} separator="," />+</h2>
//             <p>Services Completed</p>
//           </div>
//           <div className="stat-card">
//             <h2><CountUp end={5000} duration={3} separator="," />+</h2>
//               <p>Happy Customers</p>
//           </div>
//           <div className="stat-card">
//             <h2><CountUp end={250} duration={3} />+</h2>
//             <p>Verified Professionals</p>
//           </div>
//           <div className="stat-card">
//             <h2><CountUp end={15} duration={3} />+</h2>
//           <p>Service Categories</p>
//         </div>
//       </div>
//     </section>
//   )
// }
