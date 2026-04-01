import React, { useState, useEffect, useMemo } from "react";
import {
  FaBook,
  FaRupeeSign,
  FaUserCheck,
  FaChartLine,
  FaTrophy,
  FaUserPlus,
  FaArrowUp,
  FaArrowDown,
  FaUsers,
  FaChartPie,
  FaMedal,
  FaDownload,
  FaUserTie,
} from "react-icons/fa";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "../utils/formatters";

const AnimatedNumber = ({ value, formatter }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime = null;
    let animationFrameId;
    const duration = 800; // Animation duration in ms
    const targetValue = Number(value) || 0; // Safely convert to number

    const animation = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const progressRatio = Math.min(progress / duration, 1);

      // Non-linear progress for a smoother start and end
      const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
      const easedProgress = easeOutCubic(progressRatio);

      const currentValue = Math.floor(targetValue * easedProgress);

      setDisplayValue(currentValue);

      if (progress < duration) {
        animationFrameId = requestAnimationFrame(animation);
      } else {
        setDisplayValue(targetValue); // Ensure final value is accurate
      }
    };

    animationFrameId = requestAnimationFrame(animation);

    // Cleanup the frame request to prevent memory leaks and infinite loops
    return () => cancelAnimationFrame(animationFrameId);
  }, [value]);

  return <span>{formatter ? formatter(displayValue) : displayValue}</span>;
};

const StatChange = ({ value }) => {
  if (value === 0 || !isFinite(value)) {
    return (
      <span className="stat-change neutral" title="vs. previous 7 days">
        ~ 0%
      </span>
    );
  }

  const isPositive = value > 0;
  const displayValue = isFinite(value) ? Math.abs(value) : "∞";

  if (!isFinite(value)) {
    return (
      <span className="stat-change positive" title="Previous week was zero">
        <FaArrowUp /> {displayValue}%
      </span>
    );
  }

  return (
    <span
      className={`stat-change ${isPositive ? "positive" : "negative"}`}
      title="vs. previous 7 days"
    >
      {isPositive ? <FaArrowUp /> : <FaArrowDown />} {displayValue}%
    </span>
  );
};

const PIE_COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#ffc658",
  "#d0ed57",
  "#a4de6c",
];
export default function AdminStatistics({ statistics, bookings = [], users = [] }) {
  // Process chart data from bookings
  const chartData = useMemo(() => {
    if (!bookings || bookings.length === 0) {
      return {
        overTime: [],
        weekly: [],
        peakTime: [],
        serviceWise: [],
        userRetention: [],
      };
    }

    // --- Pre-computation for User Retention ---
    const userFirstBooking = {};
    bookings.forEach((b) => {
      if (!b.user_id || !b.booking_date) return;
      const d = new Date(b.booking_date);
      if (isNaN(d.getTime())) return;
      if (!userFirstBooking[b.user_id] || d < userFirstBooking[b.user_id]) {
        userFirstBooking[b.user_id] = d;
      }
    });

    // --- Single Loop for all chart data ---
    const overTimeMap = {};
    const weeklyMap = {
      Sun: 0,
      Mon: 0,
      Tue: 0,
      Wed: 0,
      Thu: 0,
      Fri: 0,
      Sat: 0,
    };
    const peakTimeMap = {};
    for (let i = 0; i < 24; i++) {
      const ampm = i >= 12 ? "PM" : "AM";
      const hour = i % 12 === 0 ? 12 : i % 12;
      peakTimeMap[`${hour} ${ampm}`] = 0;
    }
    const serviceWiseMap = {};
    const monthlyUserSets = {};

    bookings.forEach((b) => {
      if (!b.booking_date) return;
      const d = new Date(b.booking_date);
      if (isNaN(d.getTime())) return; // Crucial: Prevents NaN crashes in Recharts

      // 1. Over Time
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0",
      )}-${String(d.getDate()).padStart(2, "0")}`;
      overTimeMap[dateStr] = (overTimeMap[dateStr] || 0) + 1;

      // 2. Weekly Trends
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      weeklyMap[days[d.getDay()]] += 1;

      // 3. Peak Time
      const peakTimeHour = d.getHours();
      const ampm = peakTimeHour >= 12 ? "PM" : "AM";
      const hour = peakTimeHour % 12 === 0 ? 12 : peakTimeHour % 12;
      peakTimeMap[`${hour} ${ampm}`] += 1;

      // 4. Service Wise
      const sName = b.service_name || "Unknown";
      serviceWiseMap[sName] = (serviceWiseMap[sName] || 0) + 1;

      // 5. User Retention
      if (b.user_id) {
        const monthKey = `${d.getFullYear()}-${String(
          d.getMonth() + 1,
        ).padStart(2, "0")}`;
        if (!monthlyUserSets[monthKey]) {
          monthlyUserSets[monthKey] = {
            newUsers: new Set(),
            repeatUsers: new Set(),
          };
        }
        const firstBookingDate = userFirstBooking[b.user_id];
        if (firstBookingDate) {
          if (
            d.getFullYear() === firstBookingDate.getFullYear() &&
            d.getMonth() === firstBookingDate.getMonth()
          ) {
            monthlyUserSets[monthKey].newUsers.add(b.user_id);
          } else if (d > firstBookingDate) {
            monthlyUserSets[monthKey].repeatUsers.add(b.user_id);
          }
        }
      }
    });

    const userRetentionData = Object.keys(monthlyUserSets)
      .sort()
      .map((monthKey) => {
        const newUsersCount = monthlyUserSets[monthKey].newUsers.size;
        const repeatUsersCount = monthlyUserSets[monthKey].repeatUsers.size;
        const total = newUsersCount + repeatUsersCount;
        return {
          month: monthKey,
          "New Users": newUsersCount,
          "Repeat Users": repeatUsersCount,
          "New %": total > 0 ? Math.round((newUsersCount / total) * 100) : 0,
          "Repeat %":
            total > 0 ? Math.round((repeatUsersCount / total) * 100) : 0,
        };
      });

    return {
      overTime: Object.keys(overTimeMap)
        .sort()
        .map((k) => ({ date: k, Bookings: overTimeMap[k] })),
      weekly: Object.keys(weeklyMap).map((k) => ({
        day: k,
        Bookings: weeklyMap[k],
      })),
      peakTime: Object.keys(peakTimeMap).map((k) => ({
        time: k,
        Bookings: peakTimeMap[k],
      })),
      serviceWise: Object.keys(serviceWiseMap).map((k, index) => ({
        name: k,
        value: serviceWiseMap[k],
        fill: PIE_COLORS[index % PIE_COLORS.length],
      })),
      userRetention: userRetentionData,
    };
  }, [bookings]);

  const mostBookedService = useMemo(() => {
    if (!chartData.serviceWise || chartData.serviceWise.length === 0) {
      return "N/A";
    }
    // Find the service with the highest booking count
    const topService = chartData.serviceWise.reduce(
      (max, service) => (service.value > max.value ? service : max),
      chartData.serviceWise[0],
    );
    return topService.name;
  }, [chartData.serviceWise]);

  const activeUserStats = useMemo(() => {
    if (!users || users.length === 0) {
      return {
        activeThisWeek: 0,
        activeChange: 0,
      };
    }

    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    const sevenDaysAgo = new Date(now.getTime() - 7 * oneDay);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * oneDay);

    const activeThisWeek = new Set();
    const activeLastWeek = new Set();

    users.forEach((user) => {
      if (!user.last_login) return;
      const lastLoginDate = new Date(user.last_login);
      if (isNaN(lastLoginDate.getTime())) return;

      if (lastLoginDate >= sevenDaysAgo) {
        activeThisWeek.add(user.id);
      } else if (
        lastLoginDate >= fourteenDaysAgo &&
        lastLoginDate < sevenDaysAgo
      ) {
        activeLastWeek.add(user.id);
      }
    });

    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? Infinity : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      activeThisWeek: activeThisWeek.size,
      activeChange: calculateChange(activeThisWeek.size, activeLastWeek.size),
    };
  }, [users]);

  // Process weekly comparative stats from bookings
  const weeklyComparativeStats = useMemo(() => {
    if (!bookings || bookings.length === 0) {
      return {
        revenueThisWeek: 0,
        revenueChange: 0,
        bookingsThisWeek: 0,
        bookingsChange: 0,
        newCustomersThisWeek: 0,
        newCustomersChange: 0,
      };
    }

    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    const sevenDaysAgo = new Date(now.getTime() - 7 * oneDay);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * oneDay);

    let revenueThisWeek = 0;
    let revenueLastWeek = 0;
    let bookingsThisWeek = 0;
    let bookingsLastWeek = 0;

    // Find first booking date for each user
    const userFirstBooking = {};
    const sortedBookings = [...bookings].sort(
      (a, b) => new Date(a.booking_date) - new Date(b.booking_date),
    );
    sortedBookings.forEach((b) => {
      if (b.user_id && !userFirstBooking[b.user_id]) {
        userFirstBooking[b.user_id] = new Date(b.booking_date);
      }
    });

    const newCustomersThisWeek = new Set();
    const newCustomersLastWeek = new Set();

    bookings.forEach((b) => {
      if (!b.booking_date) return;
      const bookingDate = new Date(b.booking_date);
      const price = (b.price || 0) * (b.quantity || 1);

      if (bookingDate >= sevenDaysAgo) {
        revenueThisWeek += price;
        bookingsThisWeek++;
        const firstBooking = userFirstBooking[b.user_id];
        if (firstBooking && firstBooking >= sevenDaysAgo) {
          newCustomersThisWeek.add(b.user_id);
        }
      } else if (bookingDate >= fourteenDaysAgo && bookingDate < sevenDaysAgo) {
        revenueLastWeek += price;
        bookingsLastWeek++;
        const firstBooking = userFirstBooking[b.user_id];
        if (
          firstBooking &&
          firstBooking >= fourteenDaysAgo &&
          firstBooking < sevenDaysAgo
        ) {
          newCustomersLastWeek.add(b.user_id);
        }
      }
    });

    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? Infinity : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      revenueThisWeek,
      revenueChange: calculateChange(revenueThisWeek, revenueLastWeek),
      bookingsThisWeek,
      bookingsChange: calculateChange(bookingsThisWeek, bookingsLastWeek),
      newCustomersThisWeek: newCustomersThisWeek.size,
      newCustomersChange: calculateChange(
        newCustomersThisWeek.size,
        newCustomersLastWeek.size,
      ),
    };
  }, [bookings]);

  // Process customer analytics from bookings
  const customerAnalytics = useMemo(() => {
    if (!bookings || bookings.length === 0) {
      return {
        totalUniqueCustomers: 0,
        newCustomers: 0,
        returningCustomers: 0,
        retentionRate: 0,
        topUser: "N/A",
      };
    }

    const userBookingCounts = {};
    const userNames = {};

    // Group bookings by user
    bookings.forEach((b) => {
      if (!b.user_id) return;
      userBookingCounts[b.user_id] = (userBookingCounts[b.user_id] || 0) + 1;
      if (b.user_name) {
        userNames[b.user_id] = b.user_name;
      }
    });

    let newCustomers = 0;
    let returningCustomers = 0;
    let topUserId = null;
    let topUserBookings = 0;

    Object.entries(userBookingCounts).forEach(([userId, count]) => {
      if (count === 1) {
        newCustomers++; // exactly 1 booking
      } else if (count > 1) {
        returningCustomers++; // more than 1 booking
      }

      if (count > topUserBookings) {
        topUserBookings = count;
        topUserId = userId;
      }
    });

    const totalUniqueCustomers = newCustomers + returningCustomers;
    const retentionRate =
      totalUniqueCustomers > 0
        ? Math.round((returningCustomers / totalUniqueCustomers) * 100)
        : 0;

    let topUserDisplay = "N/A";
    if (topUserId && topUserBookings > 0) {
      const name = userNames[topUserId] || `User ${topUserId}`;
      topUserDisplay = `${name} (${topUserBookings})`;
    }

    return {
      totalUniqueCustomers,
      newCustomers,
      returningCustomers,
      retentionRate,
      topUser: topUserDisplay,
    };
  }, [bookings]);

  const statsCards = [
    {
      title: "Revenue (Last 7d)",
      value: weeklyComparativeStats.revenueThisWeek,
      change: weeklyComparativeStats.revenueChange,
      formatter: formatCurrency,
      icon: <FaRupeeSign />,
      color: "#28a745",
      isNumeric: true,
    },
    {
      title: "Bookings (Last 7d)",
      value: weeklyComparativeStats.bookingsThisWeek,
      change: weeklyComparativeStats.bookingsChange,
      formatter: null,
      icon: <FaBook />,
      color: "#17a2b8",
      isNumeric: true,
    },
    {
      title: "Active Users (Last 7d)",
      value: activeUserStats.activeThisWeek,
      change: activeUserStats.activeChange,
      formatter: null,
      icon: <FaUserCheck />,
      color: "#ffc107",
      isNumeric: true,
    },
    {
      title: "Avg. Order Value (All-Time)",
      value: statistics?.averageOrderValue || 0,
      formatter: formatCurrency,
      icon: <FaChartLine />,
      color: "#dc3545",
      isNumeric: true,
    },
    {
      title: "Most Booked Service (All-Time)",
      value: mostBookedService,
      formatter: null,
      icon: <FaTrophy />,
      color: "#6f42c1",
      isNumeric: false,
    },
    {
      title: "Active Providers",
      value: statistics?.totalProviders || 0,
      formatter: null,
      icon: <FaUserTie />,
      color: "#fd7e14",
      isNumeric: true,
    },
  ];

  const customerStatsCards = [
    {
      title: "New Customers (Last 7d)",
      value: weeklyComparativeStats.newCustomersThisWeek,
      change: weeklyComparativeStats.newCustomersChange,
      formatter: null,
      icon: <FaUserPlus />,
      color: "#17a2b8",
      isNumeric: true,
    },
    {
      title: "Returning Customers",
      value: customerAnalytics.returningCustomers, // Lifetime
      formatter: null,
      icon: <FaUsers />,
      color: "#20c997",
      isNumeric: true,
    },
    {
      title: "Retention Rate (Lifetime)",
      value: customerAnalytics.retentionRate, // Lifetime
      formatter: (val) => `${val}%`,
      icon: <FaChartPie />,
      color: "#fd7e14",
      isNumeric: true,
    },
    {
      title: "Top Customer (Lifetime)",
      value: customerAnalytics.topUser, // Lifetime
      formatter: null,
      icon: <FaMedal />,
      color: "#e83e8c",
      isNumeric: false,
    },
  ];

  return (
    <>
      <div className="admin-table-header">
        <h2 className="admin-header" style={{ marginBottom: 0 }}>
          Overview
        </h2>
        <div className="admin-table-controls" style={{ justifyContent: "flex-end" }}>
          <div className="admin-table-actions">
            <button
              className="admin-btn-primary download-pdf-btn"
              style={{
                backgroundColor: "#dc3545",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
              onClick={() => window.print()}
            >
              <FaDownload /> Download PDF
            </button>
          </div>
        </div>
      </div>
      <div className="admin-stats-grid">
        {statsCards.map((card, index) => (
          <div className="admin-stat-card" key={index}>
            <div
              className="stat-card-icon"
              style={{ backgroundColor: card.color }}
            >
              {card.icon}
            </div>
            <div className="stat-card-info">
              <div className="stat-card-header">
                <p className="stat-card-title">{card.title}</p>
                {card.change !== undefined && (
                  <StatChange value={card.change} />
                )}
              </div>
              <h3 className="stat-card-value">
                {statistics ? (
                  card.isNumeric ? (
                    <AnimatedNumber
                      value={Number(card.value) || 0}
                      formatter={card.formatter}
                    />
                  ) : (
                    <span
                      title={card.value}
                      style={{ fontSize: "16px", lineHeight: "1.2" }}
                    >
                      {String(card.value).length > 20
                        ? `${String(card.value).substring(0, 20)}...`
                        : card.value}
                    </span>
                  )
                ) : (
                  "Loading..."
                )}
              </h3>
            </div>
          </div>
        ))}
      </div>

      <h2 className="admin-header" style={{ marginTop: "40px" }}>
        Customer Analytics
      </h2>
      <div className="admin-stats-grid">
        {customerStatsCards.map((card, index) => (
          <div className="admin-stat-card" key={index}>
            <div
              className="stat-card-icon"
              style={{ backgroundColor: card.color }}
            >
              {card.icon}
            </div>
            <div className="stat-card-info">
              <div className="stat-card-header">
                <p className="stat-card-title">{card.title}</p>
                {card.change !== undefined && (
                  <StatChange value={card.change} />
                )}
              </div>
              <h3 className="stat-card-value">
                {card.isNumeric ? (
                  <AnimatedNumber
                    value={Number(card.value) || 0}
                    formatter={card.formatter}
                  />
                ) : (
                  <span
                    title={card.value}
                    style={{ fontSize: "16px", lineHeight: "1.2" }}
                  >
                    {String(card.value).length > 20
                      ? `${String(card.value).substring(0, 20)}...`
                      : card.value}
                  </span>
                )}
              </h3>
            </div>
          </div>
        ))}
      </div>

      <h2 className="admin-header" style={{ marginTop: "40px" }}>
        Booking Analytics
      </h2>
      <div className="charts-grid">
        {/* Bookings Over Time - Line Chart */}
        <div className="chart-card">
          <h3>Bookings Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.overTime}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="Bookings"
                stroke="#0088FE"
                strokeWidth={3}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Trends - Bar Chart */}
        <div className="chart-card">
          <h3>Weekly Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.weekly}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip cursor={{ fill: "transparent" }} />
              <Bar dataKey="Bookings" fill="#00C49F" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Peak Booking Time - Line Chart */}
        <div className="chart-card">
          <h3>Peak Booking Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.peakTime}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="Bookings"
                stroke="#FFBB28"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Service-wise Bookings - Pie Chart */}
        <div className="chart-card">
          <h3>Service-wise Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.serviceWise}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label
              />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="charts-grid">
        {/* ... existing charts ... */}

        {/* New vs. Repeat Users - Stacked Bar Chart */}
        <div className="chart-card">
          <h3>New vs. Repeat Users (Monthly)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.userRetention}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12 }}
                label={{
                  value: "Unique Users",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip
                formatter={(value, name, props) => [
                  `${value} (${props.payload[`${name.split(" ")[0]} %`]}%)`,
                  name,
                ]}
              />
              <Legend />
              <Bar dataKey="New Users" stackId="a" fill="#8884d8" />
              <Bar dataKey="Repeat Users" stackId="a" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <style>{`
        .admin-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
        }
        .admin-stat-card {
          background-color: #fff;
          border-radius: 8px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 20px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          border: 1px solid #e9ecef;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .admin-stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
        }
        .stat-card-icon {
          font-size: 24px;
          color: #fff;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .stat-card-info {
          display: flex;
          flex-direction: column;
        }
        .stat-card-title {
          margin: 0;
          font-size: 14px;
          color: #6c757d;
          font-weight: 500;
        }
        .stat-card-value {
          margin: 5px 0 0;
          font-size: 24px;
          font-weight: 700;
          color: #343a40;
        }
        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 20px;
          margin-top: 30px;
        }
        .chart-card {
          background-color: #fff;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          border: 1px solid #e9ecef;
        }
        .chart-card h3 {
          margin-top: 0;
          margin-bottom: 20px;
          font-size: 16px;
          color: #343a40;
          font-weight: 600;
          text-align: center;
        }
        .stat-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }
        .stat-change {
          font-size: 12px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .stat-change.positive {
          color: #28a745;
          background-color: #e9f7ef;
        }
        .stat-change.negative {
          color: #dc3545;
          background-color: #fbebed;
        }
        .stat-change.neutral {
          color: #6c757d;
          background-color: #f8f9fa;
        }
        
        /* Print styles for Clean PDF Export */
        @media print {
          .navbar,
          .admin-sidebar,
          .admin-sidebar-overlay,
          .download-pdf-btn {
            display: none !important;
          }
          .admin-layout {
            display: block !important;
          }
          .admin-main-content {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          .chart-card {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}</style>
    </>
  );
}
